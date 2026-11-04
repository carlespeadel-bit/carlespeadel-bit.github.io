#!/usr/bin/env python3
"""Añade una propiedad a Google Search Console usando el Chrome ya abierto.

Se conecta por CDP al Chrome de trabajo (~/.vc-chrome, puerto 9222), que ya tiene
la sesión de Google iniciada, y escribe como lo haría una persona: tecla a tecla.

Uso:
    python3 tools/searchconsole.py https://valorcarta.github.io/
"""
import sys
import time

from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "https://valorcarta.github.io/"
CDP = "http://127.0.0.1:9222"

with sync_playwright() as p:
    browser = p.chromium.connect_over_cdp(CDP)
    ctx = browser.contexts[0]
    page = ctx.pages[0] if ctx.pages else ctx.new_page()

    page.goto("https://search.google.com/search-console/welcome", wait_until="domcontentloaded")
    page.wait_for_timeout(4000)

    if "Añadir sitio web" not in page.inner_text("body"):
        print("No veo el botón 'Añadir sitio web'. ¿Sesión caducada?")
        print(page.inner_text("body")[:200])
        sys.exit(1)

    page.get_by_text("Añadir sitio web", exact=False).first.click()
    page.wait_for_timeout(2500)

    # El campo de "Prefijo de la URL" es el último input visible del diálogo.
    inputs = [i for i in page.query_selector_all("input") if i.bounding_box() and i.bounding_box()["width"] > 40]
    inputs.sort(key=lambda i: i.bounding_box()["x"])
    campo = inputs[-1]
    campo.click()
    page.wait_for_timeout(400)
    campo.type(URL, delay=35)  # tecla a tecla, como un humano
    page.wait_for_timeout(800)
    print("valor escrito:", campo.input_value())

    # Botón CONTINUAR: cualquier elemento clicable con ese texto; si no aparece,
    # se pulsa por coordenadas justo debajo del campo (la tarjeta lo coloca ahí).
    caja = campo.bounding_box()
    candidatos = [
        el for el in page.query_selector_all("button, a, div[role=button], span")
        if "ontinuar" in (el.inner_text() or "").lower() and el.bounding_box()
    ]
    if candidatos:
        candidatos.sort(key=lambda e: e.bounding_box()["x"])
        elegido = [c for c in candidatos if abs(c.bounding_box()["x"] - caja["x"]) < 400]
        (elegido or candidatos)[-1].click()
        print("clic en botón Continuar")
    else:
        page.mouse.click(caja["x"] + caja["width"] / 2, caja["y"] + caja["height"] + 97)
        print("clic por coordenadas debajo del campo")
    page.wait_for_timeout(6000)

    print("url:", page.url)
    texto = page.inner_text("body").replace("\n", " ")[:400]
    print("texto:", texto)
    page.screenshot(path="/tmp/sc_py.png")
    print("captura: /tmp/sc_py.png")
