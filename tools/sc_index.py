#!/usr/bin/env python3
"""Pide indexación de URLs en Search Console (máx. ~10 al día) usando el Chrome con sesión."""
import sys, urllib.parse
from playwright.sync_api import sync_playwright

RES = "https%3A%2F%2Fvalorcarta.github.io%2F"
urls = sys.argv[1:] or ["https://valorcarta.github.io/"]

with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
    page = b.contexts[0].pages[0]
    for u in urls:
        dest = f"https://search.google.com/search-console/inspect?resource_id={RES}&id={urllib.parse.quote(u, safe='')}"
        page.goto(dest, wait_until="domcontentloaded")
        page.wait_for_timeout(9000)
        t = page.inner_text("body").replace("\n", " ")
        estado = "no indexada" if "no está en Google" in t or "No está en Google" in t else ("indexada" if "está en Google" in t else "sin dato")
        # buscar el botón de solicitar indexación
        box = page.evaluate("""() => {
          const els=[...document.querySelectorAll('button,div[role=button],span,div')]
            .filter(e=>/solicitar indexaci[oó]n/i.test(e.textContent) && e.children.length<=1);
          for (const e of els) { const r=e.getBoundingClientRect(); if (r.width>30 && r.height>10) return {x:r.x+r.width/2,y:r.y+r.height/2,text:e.textContent.trim().slice(0,40)}; }
          return null;
        }""")
        if box:
            page.mouse.click(box["x"], box["y"])
            page.wait_for_timeout(4000)
            # confirmar si aparece diálogo
            try:
                page.get_by_text("Solicitar indexación", exact=False).last.click(timeout=2500)
            except Exception:
                pass
            page.wait_for_timeout(3000)
            print(f"{u} -> {estado} | solicitud enviada")
        else:
            print(f"{u} -> {estado} | sin botón (quizá ya indexada o límite)")
