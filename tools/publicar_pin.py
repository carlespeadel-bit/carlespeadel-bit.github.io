#!/usr/bin/env python3
"""Publica el siguiente pin de la cola en Pinterest, desde el Chrome de trabajo.

Uso:
    python3 tools/publicar_pin.py            # publica 1 y lo marca
    python3 tools/publicar_pin.py --dry      # enseña cuál saldría, sin tocar nada
    python3 tools/publicar_pin.py --n 3      # publica hasta 3 seguidos
    python3 tools/publicar_pin.py --tipo lista   # la siguiente pieza de ese formato

La cola vive en dinero/cola-pines.json. Un pin solo se marca 'publicado' si se
verifica en el perfil, no por la pantalla de confirmación.
"""
import json, re, os, sys, time, datetime, urllib.request
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pieza import compone_b
from diseno import PLANTILLAS

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COLA = os.path.join(ROOT, "..", "dinero", "cola-pines.json")
CACHE = "/tmp/pines_cola"
PERFIL = "https://es.pinterest.com/bellaciaoverda/"
DRY = "--dry" in sys.argv
# segundo plano: primero el Chrome invisible (9333), si no está, el visible (9222)
def cdp_url():
    """Navegador visible por defecto: el invisible solo si se autoriza con VC_ALLOW_HEADLESS=1.

    Regla del 05-11: nada de Chrome invisible por la noche.
    """
    import os, urllib.request

    def vivo(port):
        try:
            urllib.request.urlopen(f"http://127.0.0.1:{port}/json/version", timeout=2)
            return True
        except Exception:
            return False

    if os.environ.get("VC_ALLOW_HEADLESS") != "1":
        return "http://127.0.0.1:9222"
    for port in (9333, 9222):
        if vivo(port):
            return f"http://127.0.0.1:{port}"
    return "http://127.0.0.1:9222"
N = int(sys.argv[sys.argv.index("--n") + 1]) if "--n" in sys.argv else 1
# --tipo deja elegir el formato del día: lista, producto, carta, guia
TIPO = sys.argv[sys.argv.index("--tipo") + 1] if "--tipo" in sys.argv else None


REQUERIDOS = ("titulo", "descripcion", "enlace", "estado")
# tope de piezas por ventana móvil de 24 h. Se puede subir con VC_TOPE_24H para
# experimentar, pero nunca por encima de 8: por encima, el riesgo de sanción no
# está medido y la cuenta es nueva (05-11).
TOPE_24H = min(int(os.environ.get("VC_TOPE_24H", "5")), 8)


def publicadas_24h(cola):
    """Cuenta las publicadas en las últimas 24 h. La ventana es móvil, no el día natural:
    a las 00:06 y a las 00:29 se publicaron 10 porque el corte era la fecha."""
    from datetime import datetime, timedelta
    desde = datetime.now() - timedelta(hours=24)
    n = 0
    for p in cola:
        if p.get("estado") != "publicado":
            continue
        f = p.get("fecha") or ""
        if not f:
            n += 1          # sin fecha no se puede demostrar que sea vieja: cuenta como reciente
            continue
        try:
            if datetime.strptime(f, "%Y-%m-%d %H:%M") >= desde:
                n += 1
        except Exception:
            continue
    return n


def carga():
    cola = json.load(open(COLA))
    # barrido: cualquier pieza sin estado es una pieza mal escrita por otra sesión
    rotas = [p for p in cola if "estado" not in p]
    if rotas:
        for p in rotas:
            p["estado"] = "invalida"
            p["motivo"] = "sin campo estado (esquema viejo)"
        json.dump(cola, open(COLA, "w"), ensure_ascii=False, indent=1)
        print(f"AVISO: {len(rotas)} piezas sin esquema marcadas como invalida")
    # preferencia por cartas con escaneo en español: las de sets antiguos salen en inglés
    pendientes = [i for i, p in enumerate(cola) if p.get("estado") == "pendiente"]
    if TIPO:
        del_tipo = [i for i in pendientes if (cola[i].get("tipo") or "carta") == TIPO]
        if not del_tipo:
            return cola, None
        return cola, del_tipo[0]
    preferidas = [i for i in pendientes if cola[i].get("idioma_estimado") == "es"]
    if preferidas:
        i = preferidas[0]
        p = cola[i]
        faltan = [k for k in REQUERIDOS if not p.get(k)]
        if not faltan:
            return cola, i
    for i, p in enumerate(cola):
        if p.get("estado") != "pendiente":
            continue
        faltan = [k for k in REQUERIDOS if not p.get(k)]
        if faltan:
            # no se publica a ciegas: se marca y se avisa
            p["estado"] = "invalida"
            p["motivo"] = "faltan campos: " + ", ".join(faltan)
            json.dump(cola, open(COLA, "w"), ensure_ascii=False, indent=1)
            print(f"INVALIDA en posición {i} ({p.get('id')}): faltan {faltan}")
            return carga()
        return cola, i
    return cola, None


def baja_imagen(url, destino):
    """Descarga y normaliza a PNG: Pinterest rechaza webp aunque se llame .png."""
    if os.path.exists(destino):
        return destino
    from PIL import Image
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    crudo = destino + ".orig"
    for intento in range(4):
        try:
            urllib.request.urlretrieve(url, crudo)
            break
        except Exception:
            if intento == 3:
                raise
            time.sleep(3 * (intento + 1))
    try:
        im = Image.open(crudo)
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGBA")
        im.save(destino, "PNG")
    finally:
        if os.path.exists(crudo):
            os.remove(crudo)
    return destino


def cierra_overlays(pg):
    for _ in range(3):
        try:
            pg.keyboard.press("Escape")
        except Exception:
            pass
        pg.wait_for_timeout(200)
    for txt in ("Entendido", "Ahora no"):
        try:
            btn = pg.get_by_role("button", name=txt)
            if btn.count() and btn.first.is_visible():
                btn.first.click(timeout=1200)
                pg.wait_for_timeout(400)
        except Exception:
            pass


MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]


def compone_pieza(pin, idx):
    """Compone la pieza. Si es de producto, usa la imagen de la caja y la plantilla T5."""
    if pin.get("diseno") == "carta_sola":
        # variante C (05-11): carta dominante y etiqueta con el precio, como el feed del nicho
        from plantilla import pieza_carta_sola
        ruta = baja_imagen(pin["imagen"], os.path.join(CACHE, f"{pin.get('id','c')}-sola.png"))
        return pieza_carta_sola(ruta, pin.get("nombre", ""), pin.get("set", ""),
                                f"{pin['precio']:,.2f} €".replace(",", "X").replace(".", ",").replace("X", "."),
                                salida=os.path.join(CACHE, f"{idx}-carta-sola.png"))
    if pin.get("tipo") == "lista":
        from plantilla import pieza_top10
        filas = []
        for c in pin["cartas"]:
            ruta = baja_imagen(c["imagen"], os.path.join(CACHE, f"lista-{c['id']}.png"))
            filas.append((ruta, c["nombre"], c["precio"]))
        return pieza_top10(filas, pin["gancho"], pin.get("sub") or "",
                           salida=os.path.join(CACHE, f"{idx}-lista.png"))
    if pin.get("tipo") == "guia":
        # una guía no se lee a 200 px con tres productos: héroe único y el dato en el sello
        from plantilla import pieza_producto
        heroe = os.path.join(ROOT, "..", "dinero", pin["imagenes"][0])
        return pieza_producto(heroe, pin.get("gancho") or "¿Qué regalar?",
                              pin.get("sub") or "Guía por presupuesto",
                              pin.get("precio") or 52.99,
                              salida=os.path.join(CACHE, f"{idx}-guia.png"))
    if pin.get("tipo") == "producto" and pin.get("imagen_local"):
        from plantilla import pieza_producto
        return pieza_producto(os.path.join(ROOT, "..", "dinero", pin["imagen_local"]),
                              pin.get("nombre_corto") or pin.get("nombre") or "Sellado",
                              pin.get("badge") or "Sellado Pokémon",
                              pin["precio"], salida=os.path.join(CACHE, f"{idx}-prod.png"))
    hoy = datetime.date.today()
    card = {"id": pin["id"], "name": pin["nombre"], "setName": pin["set"],
            "image": pin["imagen"].replace("/high.png", "").rstrip("/")}
    fecha_txt = f"hoy, {hoy.day} de {MESES[hoy.month-1]}"
    # plantilla v2 (sistema medido 05-11): campo oscuro, cifra en peso 900, rejilla fija
    from plantilla import pieza as pieza_v2
    ruta_carta = baja_imagen(pin["imagen"], os.path.join(CACHE, f"carta-{idx}.png"))
    var = None
    if pin.get("antes") and pin["antes"] > 0:
        d = 100 * (pin["precio"] - pin["antes"]) / pin["antes"]
        var = f"{d:+.1f} %".replace(".", ",")
    destino = pieza_v2(ruta_carta, pin["nombre"], pin.get("set") or "", pin["precio"],
                       var, salida=os.path.join(CACHE, f"{idx}-v2.png"))
    return destino


def verifica(pin, img):
    """Divergente automático: 10 comprobaciones, mínimo 8. Devuelve (nota, fallos)."""
    from PIL import Image
    fallos = []
    def ok(cond, motivo):
        if not cond: fallos.append(motivo)
    t = pin.get("titulo", "")
    d = pin.get("descripcion", "")
    ok(8 <= len(t) <= 100, "título fuera de 8-100")
    # exención documentada: las piezas de prueba A/B llevan el gancho sin cifra a propósito
    if not pin.get("exento_cifra"):
        ok(any(ch.isdigit() for ch in t), "título sin cifra")
    ok(any(k in t.lower() for k in ("vale", "€", "aniversario", "sobres", "caja", "baraja", "álbum", "regalar")), "título sin gancho")
    ok("afiliado" in d.lower(), "descripción sin aviso de afiliado")
    ok(len(d) >= 80, "descripción corta")
    ok(os.path.exists(img), "imagen no generada")
    try:
        im = Image.open(img)
        ok(im.width == 1000 and im.height == 1500, "formato distinto de 1000x1500")
    except Exception:
        fallos.append("imagen ilegible")
    enlace = pin.get("enlace", "")
    ok(enlace.startswith("https://"), "enlace no https")
    if "amazon.es" in enlace:
        ok(re.search(r"[?&]tag=valorcarta", enlace) is not None, "enlace Amazon sin etiqueta")
        ok("ascsubtag=" in enlace, "enlace Amazon sin ascsubtag")
    else:
        ok("valorcarta.github.io" in enlace, "enlace que no es de la casa")
    ok(pin.get("estado") == "pendiente", "pieza ya usada")
    # puerta de diseño: el medidor decide, no el ojo
    try:
        from revisa import mide, veredicto
        m = mide(img)
        if m:
            _, fallos_diseno = veredicto(m)
            for f in fallos_diseno:
                fallos.append("diseño: " + f)
    except Exception as e:
        fallos.append("no se pudo medir el diseño")
    return max(0, 10 - len(fallos)), fallos


def publica_uno(pin, idx):
    img = compone_pieza(pin, idx)
    nota, fallos = verifica(pin, img)
    if nota < 8:
        print("RECHAZADA", nota, "/10 ·", "; ".join(fallos)[:120])
        return ""
    with sync_playwright() as p:
        from navegador import asegura_chrome
        if not asegura_chrome():
            print("SIN NAVEGADOR: Chrome no responde en 9222 y no se pudo abrir")
            return ""
        b = p.chromium.connect_over_cdp(cdp_url())
        pg = b.contexts[0].new_page()
        pg.set_viewport_size({"width": 1440, "height": 950})
        pg.goto("https://es.pinterest.com/pin-builder/", wait_until="domcontentloaded", timeout=35000)
        pg.wait_for_timeout(3200)
        cierra_overlays(pg)
        pg.set_input_files('input[type=file]', img)
        pg.wait_for_timeout(8000)
        cierra_overlays(pg)

        pg.fill('textarea[placeholder="Añade un título"]', pin["titulo"][:100])
        d = pg.locator('div[aria-label="Explica en qué consiste tu Pin"]').first
        d.click()
        pg.keyboard.insert_text(pin["descripcion"][:480])
        pg.fill('textarea[placeholder="Añade un enlace de destino"]', pin["enlace"])
        pg.wait_for_timeout(1000)

        try:
            pg.locator("[role=combobox]").first.click(timeout=4000)
            pg.wait_for_timeout(900)
            op = pg.get_by_text(pin["tablero"], exact=False)
            if op.count():
                op.first.click()
            pg.wait_for_timeout(900)
        except Exception:
            pass

        pg.get_by_role("button", name="Publicar").first.click(timeout=8000)
        pg.wait_for_timeout(6000)

        # verificación: el pin tiene que estar en el perfil, con este título
        url = ""
        v = b.contexts[0].new_page()
        try:
            v.goto(PERFIL, wait_until="domcontentloaded", timeout=30000)
            v.wait_for_timeout(3500)
            hrefs = v.eval_on_selector_all(
                "a", "els=>els.map(e=>e.href).filter(h=>h.includes('/pin/') && !h.includes('/analytics'))")
            cuerpo = v.inner_text("body")
            if hrefs and pin["titulo"][:18] in cuerpo:
                url = hrefs[0].split("?")[0]
        finally:
            v.close()
            pg.close()
    return url


CERROJO = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "dinero", ".pin.lock")


def coge_cerrojo():
    """Evita que dos turnos publiquen a la vez: la noche del 05-11 se publicaron 10
    piezas en 23 minutos porque dos procesos leyeron la cola antes de que el otro
    escribiera la `fecha`. El tope solo vale si la cola se lee y se escribe en orden."""
    import time
    try:
        if os.path.exists(CERROJO):
            if time.time() - os.path.getmtime(CERROJO) < 600:
                return False
    except OSError:
        pass
    with open(CERROJO, "w") as f:
        f.write(time.strftime("%Y-%m-%d %H:%M:%S"))
    return True


def suelta_cerrojo():
    try:
        os.remove(CERROJO)
    except OSError:
        pass


def main():
    cola, i = carga()
    if i is None:
        print("cola vacía: no hay pines pendientes")
        return 0

    # la marca tiene que nombrarse: 15 de los 16 primeros pines salieron sin la
    # palabra Pokémon y en el feed no se sabía ni de qué juego eran
    pin = cola[i]
    texto = ((pin.get("titulo") or "") + " " + (pin.get("descripcion") or "")).lower()
    if "pokemon" not in texto and "pokémon" not in texto:
        pin["descripcion"] = (pin.get("descripcion") or "").rstrip() + " Cartas Pokémon."
        json.dump(cola, open(COLA, "w"), ensure_ascii=False, indent=1)
        print("faltaba la marca: descripción completada con «Cartas Pokémon»")

    if DRY:
        print("saldría:", cola[i]["titulo"][:80])
        print("enlace: ", cola[i]["enlace"])
        return 0

    if not DRY:
        if not coge_cerrojo():
            print("otro turno está publicando ahora mismo: no se toca la cola")
            return 0
        try:
            ya = publicadas_24h(cola)
        except Exception:
            suelta_cerrojo(); raise
        if ya >= TOPE_24H:
            print(f"TOPE: {ya} piezas en las últimas 24 h (máximo {TOPE_24H}). No se publica.")
            suelta_cerrojo()
            return 0
        N = min(N, TOPE_24H - ya)

    hechos = 0
    try:
      while hechos < N:
          cola, i = carga()
          if i is None:
              print("cola agotada")
              break
          pin = cola[i]
          try:
              url = publica_uno(pin, i)
          except Exception as e:
              print("fallo la pieza:", str(e)[:90], "|", pin.get("nombre"))
              pin["estado"] = "sin imagen"
              json.dump(cola, open(COLA, "w"), ensure_ascii=False, indent=1)
              hechos += 1
              continue
          if not url:
              print("NO verificado en el perfil:", pin["titulo"][:60])
              pin["estado"] = "revisar"
              json.dump(cola, open(COLA, "w"), ensure_ascii=False, indent=1)
              return 1
          pin["estado"] = "publicado"
          pin["url"] = url
          pin["precio_publicado"] = pin.get("precio")
          pin["fecha"] = time.strftime("%Y-%m-%d %H:%M")
          json.dump(cola, open(COLA, "w"), ensure_ascii=False, indent=1)
          print("publicado:", url, "|", pin["titulo"][:50])
          hechos += 1
          time.sleep(8)
    finally:
        if not DRY:
            suelta_cerrojo()
    return 0


if __name__ == "__main__":
    sys.exit(main())
