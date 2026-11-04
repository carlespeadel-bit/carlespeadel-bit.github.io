#!/usr/bin/env python3
"""Sube un vídeo a YouTube Studio con la sesión ya abierta en el Chrome de trabajo."""
import sys, os
from playwright.sync_api import sync_playwright

video = os.path.abspath(sys.argv[1])
titulo = sys.argv[2] if len(sys.argv) > 2 else "Precios de cartas Pokémon"
desc = sys.argv[3] if len(sys.argv) > 3 else "Precios de Cardmarket actualizados a diario.\nhttps://valorcarta.github.io"

with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
    page = b.contexts[0].pages[0]
    page.goto("https://studio.youtube.com/", wait_until="domcontentloaded")
    page.wait_for_timeout(7000)

    # abrir menú Crear y pulsar "Subir vídeos" con click sintético (evita el overlay)
    page.evaluate("""() => {
      const crear = [...document.querySelectorAll('button, ytcp-button, div[role=button]')]
        .find(e => e.textContent.trim() === 'Crear' && e.getBoundingClientRect().width > 0);
      if (crear) crear.click();
    }""")
    page.wait_for_timeout(2500)
    clicked = page.evaluate("""() => {
      const item = [...document.querySelectorAll('*')]
        .filter(e => e.children.length <= 2 && /Subir v[ií]deos/i.test(e.textContent))
        .sort((a,b) => a.getBoundingClientRect().width - b.getBoundingClientRect().width)[0];
      if (!item) return 'no encontrado';
      item.click();
      return 'clic en ' + item.tagName;
    }""")
    print(clicked)
    page.wait_for_timeout(4000)

    inp = page.query_selector('input[type="file"]')
    if not inp:
        ins = page.query_selector_all('input')
        print("inputs totales:", len(ins), "· file:", len(page.query_selector_all('input[type=file]')))
        page.screenshot(path="/tmp/yt_upload_err.png")
        sys.exit(1)

    inp.set_input_files(video)
    print("vídeo enviado:", os.path.basename(video))
    page.wait_for_timeout(30000)

    campos = [e for e in page.query_selector_all('div[contenteditable="true"], textarea') if e.bounding_box()]
    print("campos editables:", len(campos))
    if campos:
        t = campos[0]; t.click()
        page.keyboard.press("Meta+A"); page.keyboard.press("Backspace")
        page.keyboard.type(titulo)
    if len(campos) > 1:
        d = campos[1]; d.click()
        page.keyboard.type(desc)
    page.wait_for_timeout(2000)
    page.screenshot(path="/tmp/yt_upload.png")
    print("captura: /tmp/yt_upload.png")
