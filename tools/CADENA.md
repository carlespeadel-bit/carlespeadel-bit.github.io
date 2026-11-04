# La cadena de hipótesis

Cada eslabón: **hipótesis → acción ejecutada → medición → hipótesis siguiente**. Nada se escribe sin haber ejecutado. Nada se ejecuta sin criterio de muerte.

| # | Hipótesis | Acción ejecutada | Resultado medido | Veredicto | Siguiente |
|---|---|---|---|---|---|
| H1 | El sitemap falla por una entrada en caché del envío original | Crear y enviar `/sitemap-google.xml` con 472 URLs | Google lo marcó "no se ha podido obtener" al instante | **MUERTA** | H2 |
| H2 | El problema es el host `github.io` | Buscar sitios github.io indexados en Google | Google indexa otros `github.io` (p. ej. inakicalvo.github.io) | **MUERTA** | H3 |
| H3 | El bloqueo es de autoridad: con 3 enlaces externos Google leerá el sitemap | Perfil `github.com/valorcarta`, topics en el repo del dataset, release `v2026-11-04` | 3 enlaces publicados y verificados (200) | **EN CURSO** (muere el 11-11 si sigue 1 página indexada) | H4 |
| H4 | (la escribe el resultado de H3) | | | | |

## Regla
- Si el resultado no se puede medir, la hipótesis no se cierra: se instrumenta primero.
- Una hipótesis muerta se queda escrita con su porqué. No se vuelve a proponer.
- La cadena no se salta eslabones: no se abre H5 sin cerrar H4.
