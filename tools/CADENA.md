# La cadena de hipótesis

Cada eslabón: **hipótesis → acción ejecutada → medición → hipótesis siguiente**. Nada se escribe sin haber ejecutado. Nada se ejecuta sin criterio de muerte.

| # | Hipótesis | Acción ejecutada | Resultado medido | Veredicto | Siguiente |
|---|---|---|---|---|---|
| H1 | El sitemap falla por una entrada en caché del envío original | Crear y enviar `/sitemap-google.xml` con 472 URLs | Google lo marcó "no se ha podido obtener" al instante | **MUERTA** | H2 |
| H2 | El problema es el host `github.io` | Buscar sitios github.io indexados en Google | Google indexa otros `github.io` (p. ej. inakicalvo.github.io) | **MUERTA** | H3 |
| H3 | El bloqueo es de autoridad: con 3 enlaces externos Google leerá el sitemap | Perfil, topics, release, homepage del repo, 2 snapshots en Wayback y 1 comentario técnico: **8 URLs, todas 200** | Los 8 enlaces son **rel=nofollow** (comprobado en el HTML): sirven para descubrimiento, **no transmiten autoridad** | **MUERTA (parcial)**: sin dofollow no hay autoridad; el descubrimiento sigue vivo | H4 |
| H4 | (la escribe el resultado de H3) | | | | |

## Regla
- Si el resultado no se puede medir, la hipótesis no se cierra: se instrumenta primero.
- Una hipótesis muerta se queda escrita con su porqué. No se vuelve a proponer.
- La cadena no se salta eslabones: no se abre H5 sin cerrar H4.

## Objetivos que ha destapado la acción

Cada acción ejecutada no solo cierra un eslabón: abre objetivos nuevos. Se ordenan por impacto sobre `ingresos_mes` y se pasan a `BACKLOG.md` con dueño.

| Objetivo descubierto | Por qué acción salió | Impacto estimado | Dueño |
|---|---|---|---|
| Publicar el sitemap en un host distinto para aislar si Google bloquea el archivo o la propiedad | H1 (el fichero no es el problema) | Alto: decide si el SEO es viable | SEO |
| Conectar un dominio propio con redirección desde `valorcarta.github.io` | H2 + H3 (autoridad y host sanos, el problema es la confianza) | Alto | Dirección |
| Conseguir un cuarto y quinto enlace externo (foros, datasets, directorios de datos) | H3 (3 enlaces aún no han producido rastreo) | Medio-alto | Distribución |
| Duplicar el catálogo en inglés (mismas cartas, precios en USD/GBP) para abrir otro mercado | H3 (el límite es la audiencia hispanohablante) | Medio | Contenido |
| Indexar el dataset en Google Dataset Search con la página `/datos/` ya publicada | H3 (los datos abiertos son el único activo con enlaces) | Medio | Datos |
| Automatizar la publicación del radar en un canal propio en cuanto exista | H3 (sin canal no hay demanda que no dependa de Google) | Alto si hay canal | Distribución |

## H4 (abierta)
**Hipótesis:** si ningún enlace sin cuenta transmite autoridad, entonces lo único que puede mover visitas es **audiencia propia** (Nostr y canales directos) o **tráfico de pago**.
**Acción:** publicar a diario en Nostr y medir visitas con referidor `njump.me` / `nostr`.
**Criterio de muerte (14 días, 18-11):** si en 7 días no entra **ninguna** visita con referidor de Nostr, el canal es decorativo y el objetivo solo se mueve con dominio propio o dinero.
