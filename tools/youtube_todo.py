#!/usr/bin/env python3
"""Sube y publica un vídeo de principio a fin en YouTube Studio."""
import sys, os
from playwright.sync_api import sync_playwright

video = os.path.abspath(sys.argv[1])
titulo = sys.argv[2]
desc = sys.argv[3]

with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
    page = b.contexts[0].pages[0]
    page.goto("https://studio.youtube.com/", wait_until="domcontentloaded")
    page.wait_for_timeout(7000)

    page.evaluate("""() => {
      const c = [...document.querySelectorAll('button, ytcp-button, div[role=button]')]
        .find(e => e.textContent.trim() === 'Crear' && e.getBoundingClientRect().width > 0);
      if (c) c.click();
    }""")
    page.wait_for_timeout(2500)
    page.evaluate("""() => {
      const it = [...document.querySelectorAll('*')]
        .filter(e => e.children.length <= 2 && /Subir v[ií]deos/i.test(e.textContent))
        .sort((a,b) => a.getBoundingClientRect().width - b.getBoundingClientRect().width)[0];
      if (it) it.click();
    }""")
    page.wait_for_timeout(4000)

    inp = page.query_selector('input[type="file"]')
    if not inp:
        print("sin input de fichero"); sys.exit(1)
    inp.set_input_files(video)
    print("subiendo…")
    page.wait_for_timeout(30000)

    campos = [e for e in page.query_selector_all('div[contenteditable="true"], textarea') if e.bounding_box()]
    if campos:
        campos[0].click(); page.keyboard.press("Meta+A"); page.keyboard.press("Backspace"); page.keyboard.type(titulo)
    if len(campos) > 1:
        campos[1].click(); page.keyboard.type(desc)
    print("título y descripción puestos")

    # audiencia: no es para niños
    try:
        page.get_by_text("No, no está creado para niños", exact=False).first.click(force=True, timeout=8000)
        print("audiencia: no para niños")
    except Exception as e:
        print("audiencia:", str(e)[:60])
    page.wait_for_timeout(2500)

    # avanzar tres pasos
    for _ in range(3):
        try:
            page.get_by_role("button", name="Siguiente").first.click(timeout=8000)
        except Exception:
            pass
        page.wait_for_timeout(5000)

    page.screenshot(path="/tmp/yt_vis5.png")
    # elegir Público por coordenadas (radio de la opción)
    page.mouse.click(334, 454)
    page.wait_for_timeout(2500)
    page.screenshot(path="/tmp/yt_vis6.png")

    # guardar/publicar
    for nombre in ["Guardar", "Publicar"]:
        try:
            page.get_by_role("button", name=nombre).first.click(timeout=6000)
            print("pulsado:", nombre); break
        except Exception:
            continue
    page.wait_for_timeout(15000)
    page.goto("https://studio.youtube.com/channel/UCdH_yxHpaud1sAhxOsJZR0Q/videos/upload", wait_until="domcontentloaded")
    page.wait_for_timeout(8000)
    txt = page.inner_text("body")
    print("hay contenido:", "No hay contenido disponible" not in txt)
    page.screenshot(path="/tmp/yt_final2.png")
