#!/usr/bin/env python3
"""Comprueba el precio actual de los productos en Amazon y lo compara con el catalogado.

Amazon exige que el precio mostrado esté al día: si cambia, la pieza publicada miente.
Uso: python3 tools/precios_amazon.py
"""
import json, os, re, sys
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
prod = json.load(open(os.path.join(ROOT, "data", "productos.json")))

with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    pg = b.contexts[0].new_page()
    cambios = []
    for it in prod:
        try:
            pg.goto(f"https://www.amazon.es/dp/{it['asin']}", wait_until="domcontentloaded", timeout=35000)
            pg.wait_for_timeout(1500)
            # el precio del producto, no el primero que aparezca en la página
            raw = pg.evaluate("""() => {
                const sel = ['#corePrice_feature_div .a-offscreen','#corePriceDisplay_desktop_feature_div .a-offscreen',
                             '#priceblock_ourprice','.a-price .a-offscreen'];
                for (const s of sel) { const e=document.querySelector(s); if (e && e.textContent.trim()) return e.textContent.trim(); }
                return '';
            }""")
            m = re.search(r"(\d+[.,]\d{2})", (raw or "").replace(".", "").replace(",", ".")) if raw else None
            actual = float(m.group(1)) if m else None
        except Exception as e:
            print("fallo", it["asin"], str(e)[:40]); continue
        antes = it.get("precio")
        if actual and antes and abs(actual - antes) > 0.01:
            cambios.append((it["asin"], it["nombre"][:38], antes, actual))
            it["precio_anterior"] = antes
            it["precio"] = actual
    pg.close()

json.dump(prod, open(os.path.join(ROOT, "data", "productos.json"), "w"), ensure_ascii=False, indent=2)
# qué piezas ya publicadas se han quedado con el precio viejo
cola = json.load(open(os.path.join(ROOT, "..", "dinero", "cola-pines.json")))
pub = {p.get("asin"): p for p in cola if p.get("tipo") == "producto" and p.get("estado") == "publicado"}
refrescar = []
for a, n, x, y in cambios:
    if a in pub:
        impreso = pub[a].get("precio_publicado") or x
        if abs(impreso - y) > 0.01:
            refrescar.append((pub[a].get("url", "?"), n, impreso, y))

print(f"productos revisados: {len(prod)} · con cambio de precio: {len(cambios)} · piezas a refrescar: {len(refrescar)}")
for url, n, x, y in refrescar:
    print(f"  REFRESCAR {url} · {n}: {x:.2f} € -> {y:.2f} €")
for a, n, x, y in cambios:
    print(f"  {a} {n}: {x:.2f} € -> {y:.2f} €")
