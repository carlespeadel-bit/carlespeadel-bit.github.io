#!/usr/bin/env python3
"""Solicita indexación de URLs en Search Console (UI, sesión ya abierta).

Uso: python3 tools/sc_inspect.py URL [URL ...]
"""
import sys
from playwright.sync_api import sync_playwright

HOME = "https://search.google.com/search-console?resource_id=https%3A%2F%2Fvalorcarta.github.io%2F"
urls = sys.argv[1:] or ["https://valorcarta.github.io/"]

with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
    page = b.contexts[0].pages[0]
    for u in urls:
        page.goto(HOME, wait_until="domcontentloaded")
        page.wait_for_timeout(6000)
        c = page.query_selector('input[aria-label^="Inspeccionar cualquier URL"]')
        if not c:
            print(f"{u} -> sin caja de inspección"); continue
        c.click(); c.type(u, delay=20); c.press("Enter")
        page.wait_for_timeout(14000)
        t = page.inner_text("body").replace("\n", " ")
        if "La URL está en Google" in t:
            estado = "indexada"
        elif "La URL no está en Google" in t:
            estado = "NO indexada"
        else:
            estado = "sin dato"
        box = page.evaluate("""() => {
          const els=[...document.querySelectorAll('button,div[role=button],span')]
            .filter(e=>/solicitar indexaci[oó]n/i.test(e.textContent) && e.children.length<=1);
          for (const e of els) { const r=e.getBoundingClientRect(); if (r.width>30 && r.height>12 && !e.disabled) return {x:r.x+r.width/2,y:r.y+r.height/2}; }
          return null;
        }""")
        if box:
            page.mouse.click(box["x"], box["y"])
            page.wait_for_timeout(6000)
            t2 = page.inner_text("body").replace("\n", " ").lower()
            ok = "solicitud de indexación" in t2 or "se ha solicitado" in t2 or "cola de" in t2
            print(f"{u} -> {estado} | solicitud {'ENVIADA' if ok else 'pulsada'}")
        else:
            print(f"{u} -> {estado} | sin botón")
