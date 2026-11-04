# Auditoría — 04-11-2026

## Infraestructura: funciona
| Comprobación | Resultado |
|---|---|
| 9 páginas clave (portada, valorador, mercado, caras, guardar, datos, YGO, Magic, panel) | **200** todas |
| Sitemaps publicados | 472 + 102 + 102 = **676 URLs** |
| Sitemap con User-Agent de Googlebot | 200, `application/xml` |
| robots.txt | 200, declara los tres sitemaps |
| Dataset abierto | repo 200 y JSON 200 en el dominio nuevo |
| Repositorio | limpio, último commit `e2c1bd4` |
| Base de datos de precios | 9.830 Pokémon + 14.198 Yu-Gi-Oh + 32.736 Magic descargadas |

## Resultados: cero
| Métrica | Valor | Fuente |
|---|---|---|
| Visitas totales | **18** (8-10 propias) | API GoatCounter |
| Clics a Amazon registrados | **1** (mi prueba) | evento `amazon-click` |
| Ingresos Amazon | **0,00 €** | afiliados.amazon.es |
| Páginas en Google | **1** (la portada) | `site:` + Search Console |
| Sitemap leído por Google | **no** ("no se ha podido obtener") | Search Console |

## Los tres fallos reales
1. **Google no ha leído el sitemap.** El envío se hizo justo durante el cambio de dominio; la primera pasada falló y aún no ha reintentado. Mientras no lo lea, las 675 páginas nuevas son invisibles.
2. **Cero enlaces externos.** El único enlace entrante es el del repositorio del dataset. Para Google, un dominio sin enlaces y con 4 días no existe.
3. **El afiliado no puede convertir sin tráfico.** Los enlaces ya van a producto (`/dp/`), el 7 % está bien puesto y la etiqueta es correcta; falta gente.

## Lo que está bien y no hay que tocar
- Arquitectura y despliegue: 3 webs, 0 €/mes, build diario, sitemaps planos, noindex del 98 % del catálogo para concentrar el rastreo.
- Medicación: visitas y clics instrumentados de punta a punta.
- Honestidad de los datos: cero cifras inventadas en todo el proyecto.

## Qué haría un auditor externo
1. **Esperar 48 h** y comprobar si el sitemap pasa a leído. Si no, hay un problema de confianza del dominio que ningún cambio de código arregla.
2. **Dominio propio.** Es la única variable que no se ha probado y la que más explicaría el bloqueo.
3. **No construir nada más** hasta que entre una visita que no sea nuestra.
