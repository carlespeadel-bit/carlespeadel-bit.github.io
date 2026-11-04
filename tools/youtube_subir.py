#!/usr/bin/env python3
"""Sube un vídeo a YouTube Studio y lo publica como público. Versión que funciona.

Probado el 04-11-2026 publicando `out/short-2026-11-04.mp4`:
https://www.youtube.com/shorts/7bzgXfO1vc8

Los tres fallos que tenía la versión anterior (y que hacían creer que YouTube
"descartaba" el vídeo):

1. La descripción se marca `aria-invalid` si contiene `->`. Con el campo
   inválido el botón "Siguiente" queda deshabilitado y el asistente no avanza:
   el vídeo se queda como borrador privado.
2. Hay que esperar al formulario de detalles (`#textbox`), no 30 s a ciegas.
3. Un Short NO aparece en la pestaña "Vídeos" de Studio (sale "No hay contenido
   disponible"); vive en la pestaña "Shorts". Comprobar la publicación ahí o con
   el oembed público, no en la lista de vídeos.

Uso:
    python3 tools/youtube_subir.py out/short-2026-11-04.mp4 "Título" "Descripción"
"""
import sys, os, time, json, urllib.request
from playwright.sync_api import sync_playwright

VIDEO = os.path.abspath(sys.argv[1])
TITULO = sys.argv[2][:100]
DESC = (sys.argv[3] if len(sys.argv) > 3 else "https://valorcarta.github.io").replace("->", "→")


def esperar(page, fn, seg, etiqueta):
    for _ in range(seg):
        v = fn()
        if v:
            return v
        time.sleep(1)
    raise SystemExit(f"timeout esperando {etiqueta}")


with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
    page = [x for x in b.contexts[0].pages if "studio.youtube.com" in x.url][0]
    page.goto("https://studio.youtube.com/upload", wait_until="domcontentloaded")

    inp = esperar(page, lambda: page.query_selector('input[type="file"]'), 30, "input de fichero")
    inp.set_input_files(VIDEO)
    print("vídeo inyectado:", os.path.basename(VIDEO))

    # formulario de detalles
    esperar(page, lambda: page.query_selector("#textbox"), 300, "formulario de detalles")
    print("subida procesada")

    t = page.locator("#textbox").first
    t.click(); page.keyboard.press("Meta+A"); page.keyboard.press("Backspace")
    page.keyboard.insert_text(TITULO); page.wait_for_timeout(800)

    d = page.locator("#description-textarea #textbox").first
    d.click(); page.keyboard.press("Meta+A"); page.keyboard.press("Backspace")
    page.keyboard.insert_text(DESC); page.wait_for_timeout(1200)
    if d.get_attribute("aria-invalid") == "true":
        raise SystemExit("descripción inválida: revisa el texto (el '->' la invalida)")

    page.locator('tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]').first.click()
    page.wait_for_timeout(1200)
    print("título, descripción y audiencia puestos")

    # detalles -> elementos -> comprobaciones -> visibilidad
    for paso in ("Elementos del vídeo", "Comprobaciones", "Visibilidad"):
        btn = page.get_by_role("button", name="Siguiente")
        esperar(page, lambda: btn.is_enabled(), 30, "Siguiente habilitado")
        btn.click()
        esperar(page, lambda: paso in page.inner_text("body"), 30, f"paso {paso}")
    print("en Visibilidad")

    r = page.locator('tp-yt-paper-radio-button[name="PUBLIC"]').first
    r.click()
    esperar(page, lambda: r.get_attribute("aria-checked") == "true", 15, "radio Público marcado")

    enlace = page.evaluate("""() => {
      const a = [...document.querySelectorAll('a')].find(e => /youtube\\.com\\/shorts\\//.test(e.href));
      return a ? a.href : null;
    }""")

    page.get_by_role("button", name="Publicar").click()
    esperar(page, lambda: "Se han guardado todos los cambios" in page.inner_text("body"), 30, "confirmación")
    print("publicado:", enlace)

    # comprobación externa, sin sesión
    vid = enlace.rsplit("/", 1)[-1] if enlace else None
    if vid:
        url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/shorts/{vid}&format=json"
        with urllib.request.urlopen(url, timeout=15) as resp:
            datos = json.load(resp)
        print("oembed OK:", datos.get("title"), "·", datos.get("author_name"))
