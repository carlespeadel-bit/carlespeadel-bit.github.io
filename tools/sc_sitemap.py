#!/usr/bin/env python3
"""Envía sitemap.xml a Search Console con el Chrome que ya tiene sesión."""
from playwright.sync_api import sync_playwright

RES = "https%3A%2F%2Fvalorcarta.github.io%2F"
URL = f"https://search.google.com/search-console/sitemaps?resource_id={RES}"

with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
    page = b.contexts[0].pages[0]
    page.goto(URL, wait_until="domcontentloaded")
    page.wait_for_timeout(5000)

    campo = page.query_selector('input[placeholder*="sitemap" i]')
    if not campo:
        candidatos = [i for i in page.query_selector_all("input") if i.bounding_box()]
        campo = candidatos[-1] if candidatos else None
    if not campo:
        print("sin campo de sitemap"); raise SystemExit(1)

    campo.click()
    campo.fill("")
    campo.type("sitemap.xml", delay=45)
    page.wait_for_timeout(600)
    print("valor:", campo.input_value())

    from playwright.sync_api import TimeoutError as PWTimeout
    try:
        page.get_by_text("ENVIAR", exact=True).first.click(timeout=5000)
        print("clic ENVIAR")
    except PWTimeout:
        campo.press("Enter"); print("Enter")

    page.wait_for_timeout(7000)
    t = page.inner_text("body").replace("\n", " ")
    i = t.find("Sitemaps enviados")
    print(t[i:i+260] if i >= 0 else t[:260])
