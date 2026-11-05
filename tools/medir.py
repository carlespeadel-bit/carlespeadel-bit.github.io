#!/usr/bin/env python3
"""Mide el día en una pasada: Pinterest por pin (producto vs carta) y Amazon (clics, pedidos).

Uso: python3 tools/medir.py [--apunta]
Con --apunta, escribe la línea del día en dinero/METRICAS.md.
"""
import json, os, re, sys, datetime
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PERFIL = "https://es.pinterest.com/bellaciaoverda/"
CDP = "http://127.0.0.1:9333"
APUNTA = "--apunta" in sys.argv
PRODUCTO = ("Caja de Entrenador", "Lote", "póster", "Baraja", "Álbum", "ETB", "Estadio", "regalar")


def pinterest(pg):
    pg.goto(PERFIL, wait_until="domcontentloaded", timeout=30000)
    pg.wait_for_timeout(4000)
    txt = pg.eval_on_selector_all('div[data-test-id="pin"]', "els=>els.map(e=>(e.innerText||'').replace(/\\s+/g,' '))")
    pines, prod, cart = [], [0, 0], [0, 0]
    for t in txt:
        m = re.match(r"Ver más estadísticas (\d+) (\d+) (\d+) (.*)", t)
        if not m:
            continue
        imp, clic, titulo = int(m.group(1)), int(m.group(3)), m.group(4)
        pines.append((titulo, imp, clic))
        grupo = prod if any(k.lower() in titulo.lower() for k in PRODUCTO) else cart
        grupo[0] += imp; grupo[1] += clic
    return pines, prod, cart


def amazon(pg):
    pg.goto("https://afiliados.amazon.es/home/reports", wait_until="domcontentloaded", timeout=40000)
    pg.wait_for_timeout(6000)
    t = re.sub(r"\s+", " ", pg.inner_text("body"))
    def num(kw):
        m = re.search(kw + r" (\d[\d.,]*)", t)
        return m.group(1) if m else "?"
    com = re.search(r"Total de ingresos ([\d,.]+)€", t)
    upd = re.search(r"Última actualización: ?([\d/]+ [\d:]+)", t)
    return {"clics": num("Número de Clics"), "pedidos": num("Producto Pedidos"),
            "conversion": num("Conversión"), "ingresos": (com.group(1) + " €") if com else "no medido",
            "actualizado": upd.group(1) if upd else "?"}


def main():
    with sync_playwright() as p:
        b = p.chromium.connect_over_cdp(CDP)
        pg = b.contexts[0].new_page()
        pg.set_viewport_size({"width": 1440, "height": 1000})
        pines, prod, cart = pinterest(pg)
        az = amazon(pg)
        pg.close()

    total_i = prod[0] + cart[0]; total_c = prod[1] + cart[1]
    hoy = datetime.date.today().isoformat()
    print(f"PINTEREST · {len(pines)} pines · {total_i} impresiones · {total_c} clics")
    ctr = lambda g: f"{100*g[1]/g[0]:.1f} %" if g[0] else "—"
    print(f"  producto: {prod[0]} impr · {prod[1]} clics ({ctr(prod)}) | cartas: {cart[0]} impr · {cart[1]} clics ({ctr(cart)})")
    print(f"AMAZON · {az['clics']} clics · {az['pedidos']} pedidos · {az['ingresos']} · conversión {az['conversion']} % · informe del {az['actualizado']}")
    top = sorted(pines, key=lambda x: -x[2])[:3]
    print("  top por clic:", " · ".join(f"{t[:32]} ({c})" for t, i, c in top) or "—")

    if APUNTA:
        linea = (f"| {hoy} | {len(pines)} pines | {total_i} impr · {total_c} clics | "
                 f"{az['clics']} clics Amazon | {az['pedidos']} | {az['ingresos']} | "
                 f"producto {prod[1]}/{prod[0]} · cartas {cart[1]}/{cart[0]} |\n")
        with open(os.path.join(ROOT, "..", "dinero", "METRICAS.md"), "a") as fh:
            fh.write(linea)
        print("apuntado en METRICAS.md")


if __name__ == "__main__":
    main()
