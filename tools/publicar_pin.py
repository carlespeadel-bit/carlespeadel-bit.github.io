#!/usr/bin/env python3
"""Publica el siguiente pin de la cola en Pinterest, desde el Chrome de trabajo.

Uso:
    python3 tools/publicar_pin.py            # publica 1 y lo marca
    python3 tools/publicar_pin.py --dry      # enseña cuál saldría, sin tocar nada
    python3 tools/publicar_pin.py --n 3      # publica hasta 3 seguidos

La cola vive en dinero/cola-pines.json. Un pin solo se marca 'publicado' si se
verifica en el perfil, no por la pantalla de confirmación.
"""
import json, os, sys, time, datetime, urllib.request
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
    import urllib.request
    for port in (9333, 9222):
        try:
            urllib.request.urlopen(f"http://127.0.0.1:{port}/json/version", timeout=2)
            return f"http://127.0.0.1:{port}"
        except Exception:
            continue
    return "http://127.0.0.1:9222"
N = int(sys.argv[sys.argv.index("--n") + 1]) if "--n" in sys.argv else 1


REQUERIDOS = ("titulo", "descripcion", "enlace", "estado")
TOPE_24H = 5


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
    if pin.get("tipo") == "guia":
        rutas = [os.path.join(ROOT, "..", "dinero", x) for x in pin["imagenes"]]
        img = PLANTILLAS["T6"](rutas, pin.get("gancho") or "¿Qué regalar?", pin.get("sub") or "")
        destino = os.path.join(CACHE, f"{idx}.png")
        os.makedirs(CACHE, exist_ok=True)
        img.save(destino, "PNG")
        return destino
    if pin.get("tipo") == "producto" and pin.get("imagen_local"):
        img = PLANTILLAS["T5"](os.path.join(ROOT, "..", "dinero", pin["imagen_local"]),
                               pin.get("gancho") or "¿Merece la pena?", pin["precio"],
                               pin.get("badge") or "Sellado Pokémon")
        destino = os.path.join(CACHE, f"{idx}.png")
        os.makedirs(CACHE, exist_ok=True)
        img.save(destino, "PNG")
        return destino
    hoy = datetime.date.today()
    card = {"id": pin["id"], "name": pin["nombre"], "setName": pin["set"],
            "image": pin["imagen"].replace("/high.png", "").rstrip("/")}
    fecha_txt = f"hoy, {hoy.day} de {MESES[hoy.month-1]}"
    # elige plantilla: con variación manda el titular; muy caras, neón; el resto, sangrada
    plantilla = "T4"   # vitrina: la que más apetece y la única que se reconoce como marca
    img = PLANTILLAS[plantilla](card, pin["precio"], pin.get("antes"), fecha_txt)
    destino = os.path.join(CACHE, f"{idx}.png")
    os.makedirs(CACHE, exist_ok=True)
    img.save(destino, "PNG")
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
        ok("tag=valorcarta-21" in enlace, "enlace Amazon sin etiqueta")
        ok("ascsubtag=" in enlace, "enlace Amazon sin ascsubtag")
    else:
        ok("valorcarta.github.io" in enlace, "enlace que no es de la casa")
    ok(pin.get("estado") == "pendiente", "pieza ya usada")
    return max(0, 10 - len(fallos)), fallos


def publica_uno(pin, idx):
    img = compone_pieza(pin, idx)
    nota, fallos = verifica(pin, img)
    if nota < 8:
        print("RECHAZADA", nota, "/10 ·", "; ".join(fallos)[:120])
        return ""
    with sync_playwright() as p:
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


def main():
    cola, i = carga()
    if i is None:
        print("cola vacía: no hay pines pendientes")
        return 0

    if DRY:
        print("saldría:", cola[i]["titulo"][:80])
        print("enlace: ", cola[i]["enlace"])
        return 0

    if not DRY:
        ya = publicadas_24h(cola)
        if ya >= TOPE_24H:
            print(f"TOPE: {ya} piezas en las últimas 24 h (máximo {TOPE_24H}). No se publica.")
            return 0
        N = min(N, TOPE_24H - ya)

    hechos = 0
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
    return 0


if __name__ == "__main__":
    sys.exit(main())
