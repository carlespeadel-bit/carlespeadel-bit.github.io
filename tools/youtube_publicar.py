#!/usr/bin/env python3
"""Responde la audiencia, avanza los pasos y publica el vídeo como público."""
from playwright.sync_api import sync_playwright

def click_texto(page, patron):
    return page.evaluate("""(pat) => {
      const re = new RegExp(pat, 'i');
      const els = [...document.querySelectorAll('tp-yt-paper-radio-button, button, ytcp-button, div[role=button], label, *')]
        .filter(e => {
          const t = (e.textContent || '').trim();
          const r = e.getBoundingClientRect();
          return re.test(t) && r.width > 20 && r.height > 10 && e.children.length <= 4;
        });
      if (!els.length) return 'no: ' + pat;
      els[0].click();
      return 'clic: ' + els[0].textContent.trim().slice(0, 50);
    }""", patron)

with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
    page = b.contexts[0].pages[0]

    print(1, click_texto(page, "No, no est[aá] creado para ni")) ; page.wait_for_timeout(2500)
    print(2, click_texto(page, "^Siguiente$")) ; page.wait_for_timeout(4000)
    print(3, click_texto(page, "^Siguiente$")) ; page.wait_for_timeout(5000)
    print(4, click_texto(page, "^Siguiente$")) ; page.wait_for_timeout(5000)
    page.screenshot(path="/tmp/yt_vis2.png")
    print(5, click_texto(page, "^P[uú]blico$")) ; page.wait_for_timeout(2500)
    page.screenshot(path="/tmp/yt_vis3.png")
    print(6, click_texto(page, "Publicar|Guardar|^Listo$")) ; page.wait_for_timeout(8000)
    page.screenshot(path="/tmp/yt_final.png")
    print("url:", page.url)
