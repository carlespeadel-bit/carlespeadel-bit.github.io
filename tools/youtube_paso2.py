#!/usr/bin/env python3
"""Completa los pasos restantes de la subida: elementos, comprobaciones y visibilidad pública."""
from playwright.sync_api import sync_playwright

def js_click(page, patron, exacto=False):
    return page.evaluate("""([pat, ex]) => {
      const els = [...document.querySelectorAll('button, ytcp-button, div[role=button], tp-yt-paper-radio-button, *')]
        .filter(e => {
          const t = (e.textContent || '').trim();
          const ok = ex ? t === pat : new RegExp(pat, 'i').test(t);
          const r = e.getBoundingClientRect();
          return ok && r.width > 10 && r.height > 10 && e.children.length <= 3;
        });
      if (!els.length) return 'no: ' + pat;
      els[0].click();
      return 'clic: ' + els[0].textContent.trim().slice(0, 40);
    }""", [patron, exacto])

with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
    page = b.contexts[0].pages[0]

    # paso 1 -> 2 (elementos del vídeo)
    print(js_click(page, "Siguiente", True)); page.wait_for_timeout(4000)
    # pregunta de audiencia infantil
    print(js_click(page, "No, no es contenido para niños")); page.wait_for_timeout(2500)
    page.screenshot(path="/tmp/yt_paso2.png")
    # paso 3 (comprobaciones)
    print(js_click(page, "Siguiente", True)); page.wait_for_timeout(5000)
    # paso 4 (visibilidad)
    print(js_click(page, "Siguiente", True)); page.wait_for_timeout(5000)
    page.screenshot(path="/tmp/yt_vis.png")
    print("url:", page.url)
