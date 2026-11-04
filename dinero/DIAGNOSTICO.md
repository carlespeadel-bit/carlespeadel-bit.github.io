# Diagnóstico — 16 turnos después

## Lo que hay, medido
| Dato | Valor | Fuente |
|---|---|---|
| Visitas totales | 16 (8 propias) | GoatCounter, API |
| Páginas indexadas en Google | **1** (la portada) | `site:` en google.com |
| Páginas rastreadas por Bing | 0 detectadas | `site:` en bing.com |
| Clics con etiqueta Amazon | 0 | afiliados.amazon.es → Informes |
| Ingresos | 0,00 € | ídem |
| URLs publicadas | 28.000 | sitemaps |
| URLs indexables tras el pivote | 676 | sitemaps |

## Lo que se ha hecho (todo verificado)
Enlaces a producto real en vez de búsquedas (2 % → 7 %), 14 ASINs, cinco guías de compra, contexto único por ficha, noindex en todo lo que no aporta, sitemap plano, IndexNow con 27.638 URLs aceptadas, dataset abierto en GitHub, página con schema Dataset, portada con contenido propio y bloque diario, clics salientes instrumentados.

## Lo que no ha funcionado, y por qué
1. **Indexación.** Google conoce el dominio desde hace 3 días: ha rastreado la portada dos veces y no ha seguido los enlaces. Con 28.000 URLs, 4.559 y 676 el resultado es el mismo: **1 página**. No es volumen ni calidad técnica (Googlebot recibe 200, canonical correcto, robots limpio).
2. **Distribución.** Todo canal con audiencia exige una cuenta que solo puede crear el dueño: Telegram (canal), Pinterest (Trial pendiente), Reddit, Bluesky (teléfono), Mastodon (app + confirmación por email + audiencia mínima en el nicho).
3. **Anuncios.** Sin presupuesto.

## El cuello, en una frase
No falta producto: falta **quien lo vea**. Y los tres caminos hacia la demanda —indexación, cuentas, dinero— están cerrados desde aquí.

## Qué desbloquea cada cosa
| Acción | Coste | Efecto esperado |
|---|---|---|
| Dominio propio (`.es`) + redirección 301 | ~10-15 €/año | Quita la sospecha de `github.io`; es la hipótesis más fuerte que queda sin probar |
| Entrar en Search Console y pedir indexación (10/día) | 0 €, 5 min | Único acelerador real de Google |
| Crear el canal de Telegram | 0 €, 30 s | Da un canal de publicación automático |
| Anuncios (Google/Meta) | 50-100 € de prueba | Compra clics hoy, pero al 7 % hay que medir el retorno antes de escalar |

## Decisión
Si en 72 h (turno ~20) Google sigue en 1 página con 676 URLs y sitemap plano, el SEO en `github.io` se declara muerto con evidencia y el objetivo pasa a depender de una de las cuatro acciones de arriba.
