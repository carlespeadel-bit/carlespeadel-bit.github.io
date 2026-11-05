# Infraestructura de ValorCarta — filtrado 05-11-2026

Todo lo que sigue está **comprobado hoy** con una petición HTTP o una lectura de fichero. Lo que no se pudo comprobar se marca como tal.

## 1. Dominio y publicación
| Elemento | Valor real |
|---|---|
| Sitio | `https://valorcarta.github.io` (200) |
| Repositorio | `github.com/valorcarta/valorcarta.github.io` (público) |
| Publicación | rama **`gh-pages`**; Pages sirve desde esa rama |
| CI | `.github/workflows/publicar.yml` (108 líneas), cron `10 6 * * *` + push |
| Motivo del cambio | GitHub Actions se quedó **una hora en cola**; publicar por rama elimina esa dependencia |
| HTTP → HTTPS | 301 correcto |

## 2. Estructura publicada
| Ruta | Estado |
|---|---|
| `/` | 200 · portada con índice de 100 cartas y 144 sets |
| `/valorar/` | 200 · ataca la consulta real «cuánto vale mi carta de Pokémon» |
| `/caras/` · `/mercado/` · `/cartas/` · `/comprar/` | 200 |
| `/comprar/etb-30/` · `/lote-30/` · `/etb-dominio-delta/` · `/regalos/` | 200 · enlazadas desde `/comprar/` |
| `/en/` + 100 fichas | 200 · hreflang ES↔EN, precios en USD/GBP |
| `/ygo/` · `/magic/` | 200 · marcas propias y pipeline independiente |
| `/datos/` | 200 · schema Dataset, CC BY 4.0 |
| `/widget/` + `data/widget.json` | 200 · 500 cartas incrustables |
| `/informe-muestra/` | 200 |
| `/mapa/` | 200 · stub `noindex` (la página interna ya no existe) |
| `/panel/` · `/oauth/` · `/gracias/` | `noindex`, no son públicas |

**Sitemaps:** ES **582** · EN **105** · Yu-Gi-Oh **102** · Magic **102**.

## 3. Datos
| Fichero | Contenido |
|---|---|
| `data/cards.json` | 18.768 cartas · **9.830 con precio** |
| `data/sets.json` | 156 sets |
| `data/asins.json` | **7 sets** con ASIN de producto verificado |
| `data/changes.json` | movimientos del día, **filtrados** en origen (>1.000 % y precio previo <0,50 € fuera) |
| `data/cache/` | 18.768 fichas de caché de la API |
| `data/history/` | 3 instantáneas (permite calcular tendencia) |

**Fuentes:** TCGdex (Pokémon) · YGOPRODeck (Yu-Gi-Oh) · Scryfall bulk gzip (Magic) · Amazon para producto.

## 4. Automatización
| Script | Función |
|---|---|
| `fetch.mjs` | descarga el catálogo con 7 reintentos |
| `fill-en.mjs` + `assemble.mjs` | completa sets sin localizar y ensambla |
| `build.mjs` | genera las 582 URLs del sitio Pokémon |
| `ygo/…` · `magic/…` | sus pipelines propios |
| `snapshot.mjs` | histórico y movimientos diarios |
| `auditoria.mjs` | 8 comprobaciones técnicas con dueño asignado |
| `deploy.sh` | guardia → informe → push a `gh-pages` |
| `indexnow.mjs` | envía las URLs a Bing/Yandex (clave propia en `dist/`) |
| `browser.mjs` + Playwright | control del Chrome de trabajo para operar webs |
| `video2.py` · `pieza.py` · `pinterest.mjs` | generación y publicación de piezas |
| `reauditar.mjs` · `auditor-turnos.mjs` | auditoría doble y control de turnos |

## 5. Servicios externos
| Servicio | Estado |
|---|---|
| **Amazon Afiliados** | etiqueta `valorcarta-21` · **19 clics, 0 pedidos, 0,00 €** |
| **Search Console** | propiedad verificada y sitemap enviado; **1 página indexada** |
| **GoatCounter** | 42 visitas totales, 29 de automatización, 1 Google, 1 Bing, 1 Pinterest |
| **Pinterest** | cuenta ValorCarta · 18 pines vivos · **dominio conectado** · 247 impresiones |
| **YouTube** | 1 Short publicado (4 visitas) · enlace **no clicable** sin verificar canal |
| **Nostr** | clave propia, 4 relays, notas publicadas |
| **GitHub (dataset)** | repo público `precios-cartas-datos`, licencia CC BY 4.0, release |

## 6. Trampas conocidas (esto es lo que ahorra horas)
1. **Pages tarda ~40 s en propagar**: un 404 recién desplegado casi siempre es eso. La auditoría reintenta antes de acusar.
2. **Actions se atasca en cola**: por eso se publica por rama.
3. **`http://` rompe la verificación de Pinterest**: comprueba la URL exacta; http redirige y no encuentra la etiqueta. Hay que escribir `https://`.
4. **Un `->` en la descripción de YouTube deja «Siguiente» deshabilitado**: usar `→`.
5. **Los Shorts no aparecen en «Vídeos»**: mirar la pestaña Shorts y verificar por `oembed`.
6. **GoatCounter cuenta el tráfico de automatización**: 29 de 42 visitas son nuestras.
7. **El token de git de la sesión caduca**: publicar por la web de GitHub o con token nuevo.

## 7. Lo que está roto o pendiente
- **Enlace de YouTube no clicable** (falta verificación con teléfono).
- **19 de 21 pines de producto van directos a Amazon**, sin página intermedia nuestra.
- **Analítica por dominio de Pinterest**: sin confirmar hasta que aparezca en el panel.
- **Magic y Yu-Gi-Oh**: publicados, con 0 visitas.
- **0,00 € de ingresos**: 19 clics y 0 pedidos; hacen falta ~100 clics para juzgar.
