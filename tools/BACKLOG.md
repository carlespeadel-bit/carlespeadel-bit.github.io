# Cola de trabajo

Regla: cada sprint coge **la primera tarea sin marcar**, la ejecuta entera, la verifica y la marca. Si no puede terminarla, deja dicho qué falta. No se cogen dos a la vez.

- [x] Enviar las 27.638 URLs a IndexNow (hecho 03-11)
- [x] Analítica en /ygo/ y /magic/ (hecho 03-11)
- [x] Host fijo y lastmod estable (hecho 03-11)
- [x] **A1** — 14 ASINs de producto sellado con precio (ETB, caja de 36, latas, colección premium, fundas, binder). Verificado: viven en `data/asins.json` y en `/comprar/` (7 enlaces `/dp/`). Hecho 04-11.
- [x] **A2** — Cero enlaces `s?k=` en las 28.000 páginas. Verificado con `grep` sobre `dist` y sobre la web publicada. Hecho 04-11.
- [x] **C1** — 5 guías de compra por formato publicadas con ASIN real: /comprar/sobres, /caja-36, /etb, /lata, /blister. Verificado 200 en producción el 04-11.
- [x] **C2** — Enlazado entre versiones de la misma carta en todos los sets (Charizard, Umbreon…). Verificado en producción el 04-11: cada ficha enlaza a sus reimpresiones.
- [ ] **D1** — Canal de Telegram: no se puede crear sin el dueño; si no existe, seguir.
- [x] **D2** — Dataset abierto publicado en github.com/carlespeadel-bit/precios-cartas-datos (9.830 cartas, CC BY) y enlazado desde el pie de las 28.000 páginas. Verificado 04-11: repo público, raw JSON 200 de 1,2 MB.
- [x] **S1** — Cada ficha enlaza a su set, a /guardar-cartas/ y a /caras/. Verificado 04-11.
- [ ] **S2** — Schema de producto con precio y disponibilidad en las 28.000 fichas.
- [x] **P1** — Cada clic a Amazon se registra como evento `amazon-click` en GoatCounter. Verificado 04-11: el evento aparece en la API tras un clic real.
- [x] **T1n** — Portada reforzada: 600 palabras propias, 4 factores de valor y FAQ con schema (3 preguntas). Verificado 05-11 en producción.
- [x] **T4n** — Portada con **bloque diario de movimientos** y fecha visible ("actualizado el 3 de noviembre"). Verificado 05-11 en producción: el bloque aparece y cambia cada día que el pipeline corre.
- [x] **T5n** — Contexto calculado en cada ficha: puesto en su set, número de reimpresiones y variación real frente a la media de 30 días. Verificado 05-11 en producción (`base1-4`: "Es la carta más cara de su set… 10 versiones… 56 % por encima").
- [x] **T6n** — **Pivote de foco:** solo las **300 cartas más caras** son indexables (472 URLs en total con sets, guías y herramientas). El resto queda `noindex,follow`, navegable pero fuera del índice. Verificado 05-11: `sitemap-1.xml` tiene 472 `<loc>` y un solo bloque.
- [x] **T7n** — Sitemap **plano** de 472 URLs (sin índice ni bloques). Verificado 05-11 en producción: `<urlset>` con 472 `<loc>`, un fichero.
- [x] **T8n** — Yu-Gi-Oh y Magic con el mismo criterio: **top 100 indexable** por juego, resto `noindex,follow`. Verificado 05-11: `/ygo/sitemap.xml` y `/magic/sitemap.xml` con 102 `<loc>` cada uno.
- [x] **T9n** — Diagnóstico completo con las tres tácticas muertas y las cuatro palancas que dependen del dueño (`dinero/DIAGNOSTICO.md`).
- [x] **SC1** — Propiedad `https://valorcarta.github.io/` **añadida y verificada** en Search Console (04-11). Resuelto con Playwright en Python (`tools/searchconsole.py`): escribiendo tecla a tecla y pulsando por coordenadas, lo que los clics sintéticos de CDP no lograban.
- [x] **SC2** — `sitemap.xml` enviado a la propiedad nueva (04-11, estado inicial "no se ha podido obtener", Google reintenta).
- [x] **SC3** — Inspección de URLs operativa con `tools/sc_inspect.py`: la portada sale **indexada**; el resto «no indexada: Google no reconoce esta URL».
- [ ] **SC4** — Esperar a que Google reintente el sitemap: el estado «no se ha podido obtener» es de la primera pasada (justo al cambiar de dominio). Ahora el sitemap responde **200 application/xml** también con User-Agent de Googlebot y robots.txt lo declara. Comprobarlo en 24 h.
- [ ] **T2n** — Comprobar en 72 h si Google pasa de 1 página indexada a 10. Si no, marcar SEO como muerto y decidir con el dueño.
- [x] **T3n** — Página `/datos/` con schema **Dataset** (licencia CC BY 4.0, distribución al JSON de GitHub) para entrar en Google Dataset Search. Verificada 200 el 05-11.
- [x] **X1** — Presupuesto de rastreo: `noindex,follow` en las 5.442 fichas de menos de 1 € y sitemap reducido a 4.559 URLs. Verificado 05-11 (`30th-047` lleva noindex).

## Objetivos destapados por la cadena (ordenados por impacto)
- [ ] **O1** — Probar el sitemap en un host distinto (aislar archivo vs propiedad). Dueño: SEO.
- [ ] **O2** — Dominio propio con 301 desde valorcarta.github.io. Dueño: Dirección. (Coste ~10-15 €/año, decide el dueño.)
- [ ] **O3** — Cuarto y quinto enlace externo real. Dueño: Distribución.
- [ ] **O4** — Catálogo en inglés con precios USD/GBP. Dueño: Contenido.
- [ ] **O5** — Indexar /datos/ en Google Dataset Search. Dueño: Datos.
- [ ] **O6** — Canal propio de publicación automática. Dueño: Distribución.

## Orden por distancia al PRIMER EURO (regla 12)
| # | Acción | Escalón | Primer euro estimado |
|---|---|---|---|
| O3 | Cuarto y quinto enlace externo real | visita | 7-14 días |
| O6 | Canal propio con publicación automática | visita | 7-14 días |
| O2 | Dominio propio con 301 | visita (confianza) | 14-30 días |
| O1 | Sitemap en host alternativo | visita | 14-30 días |
| O5 | `/datos/` en Dataset Search | visita (poca intención) | 30+ días |
| O4 | Catálogo en inglés | visita (otro mercado) | 30-60 días |
