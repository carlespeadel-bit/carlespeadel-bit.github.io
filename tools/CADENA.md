# La cadena de hipótesis

Cada eslabón: **hipótesis → acción ejecutada → medición → hipótesis siguiente**. Nada se escribe sin haber ejecutado. Nada se ejecuta sin criterio de muerte.

| # | Hipótesis | Acción ejecutada | Resultado medido | Veredicto | Siguiente |
|---|---|---|---|---|---|
| H1 | El sitemap falla por una entrada en caché del envío original | Crear y enviar `/sitemap-google.xml` con 472 URLs | Google lo marcó "no se ha podido obtener" al instante | **MUERTA** | H2 |
| H2 | El problema es el host `github.io` | Buscar sitios github.io indexados en Google | Google indexa otros `github.io` (p. ej. inakicalvo.github.io) | **MUERTA** | H3 |
| H3 | El bloqueo es de autoridad: con 3 enlaces externos Google leerá el sitemap | Perfil, topics, release, homepage del repo, 2 snapshots en Wayback y 1 comentario técnico: **8 URLs, todas 200** | Los 8 enlaces son **rel=nofollow** (comprobado en el HTML): sirven para descubrimiento, **no transmiten autoridad** | **MUERTA (parcial)**: sin dofollow no hay autoridad; el descubrimiento sigue vivo | H4 |


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

## H4 (abierta) — turno 2026-11-04
**Acción ejecutada:** nota publicada en Nostr con el top-3 de cartas más caras y enlace a /caras/. Aceptada en **2 de 4 relays**. Verificable: `https://njump.me/926e480511d23d36fb902c40c8bf92e49a01997e5664bc0198fd4c0af5750fa6`
**Medición (04-11 21:00):** 39 visitas (27 directas de automatización), **1 de Google, 1 de bing.com**. Nostr: **0 visitas atribuibles**. Se mantiene EN CURSO hasta el 18-11, pero el canal que sí ha producido algo es otro.

**Hipótesis:** si ningún enlace sin cuenta transmite autoridad, entonces lo único que puede mover visitas es **audiencia propia** (Nostr y canales directos) o **tráfico de pago**.
**Acción:** publicar a diario en Nostr y medir visitas con referidor `njump.me` / `nostr`.
**Criterio de muerte (14 días, 18-11):** si en 7 días no entra **ninguna** visita con referidor de Nostr, el canal es decorativo y el objetivo solo se mueve con dominio propio o dinero.

## Objetivos destapados por la acción de hoy
| Objetivo | Por qué acción salió | Impacto | Dueño |
|---|---|---|---|
| Limpiar `data/changes.json` de movimientos fantasma (Skarmory 0,02 → 23,67 € = +118.250 %) | Al redactar la nota del radar | Alto: un dato así destruye la credibilidad del radar | Datos |
| Atribuir el tráfico propio: GoatCounter cuenta mis visitas de automatización como visitas reales | 19 visitas "sin referidor" tras navegar con el Chrome de trabajo | Alto: sin esto, cualquier métrica de tráfico miente | Datos |
| Publicar en Nostr a una hora con audiencia y con etiquetas de comunidad (`#pokemon`, `#tcg`) | 2 de 4 relays aceptan; sin followers no hay alcance | Medio | Distribución |


## H5 (abierta) — YouTube Shorts
**Hipótesis:** un Short diario con los movimientos de precio trae visitas desde `youtube.com` en 7 días.
**Acción ejecutada (04-11):** primer Short publicado en el canal (@TimeLineError-V7), 20 s, datos del día y enlace en la descripción. Verificado sin cookies: `https://youtu.be/7bzgXfO1vc8`.
**Medición de partida:** 4 visualizaciones, **0 visitas con referidor de YouTube** en GoatCounter.
**Criterio de muerte (11-11):** si en 7 días no entra **ninguna** visita con referidor `youtube.com`, el canal informa pero no trae tráfico y se replantea el formato (o el enlace).

## Objetivos destapados por la acción de hoy
| Objetivo | Por qué acción salió | Impacto | Dueño |
|---|---|---|---|
| Publicar un Short diario sin fallos: procedimiento escrito en `docs/SUBIR_YOUTUBE.md` | Cuatro intentos fallidos por no mirar el DOM | Alto: es el único canal con audiencia real | Distribución |
| Poner el enlace en el **primer comentario fijado**, no solo en la descripción (YouTube no hace clicables los enlaces sin verificar) | El propio Studio avisó: "para que se pueda hacer clic en los enlaces externos, completa una verificación única" | Alto: sin enlace clicable no hay tráfico | Distribución |
| Medir vistas del Short a diario y cruzar con visitas | Solo tenemos 4 vistas y 0 clics atribuibles | Medio | Datos |

## Rupturas abiertas (absorbidas de `RUPTURAS.md`, 04-11)

| # | Premisa atacada | Prueba ejecutada | Veredicto |
|---|---|---|---|
| R1 | «IndexNow + sitemap resuelven la indexación» | IndexNow aceptó 204/204 URLs; Bing y DuckDuckGo: 0 URLs propias | **MUERTA** la creencia de que acelera; viva la de que alimenta un índice que tarda |
| R2 | «El producto necesita la web para venderse» | Release del dataset: 1 descarga, 0 estrellas, 0 forks | **EN CURSO** hasta 11-11 |

Consecuencias que dejan vivas: el canal hoy **no** es el buscador; el activo existe pero nadie lo coge solo; la única prueba que puede mover el marcador esta semana es **llevar el informe a 30 tiendas**.

## Principios con prueba (absorbidos de `PRINCIPIOS.md`)

| # | Principio | Prueba |
|---|---|---|
| 1 | Aceptar un envío no es conseguir un rastro | IndexNow 204/204 → Bing y DDG 0 resultados |
| 2 | Publicar no es distribuir | Release: 1 descarga, 0 estrellas |
| 3 | El aviso de afiliado debe vivir en la rama que tiene el enlace | 9.830 fichas con aviso, 1.157 con `/dp/` |
| 4 | Un enlace sin cuenta sirve para descubrir, nunca para autoridad | 8 enlaces, todos `rel=nofollow` |
| 5 | El tráfico propio contamina la métrica si no se filtra | 27 de 39 visitas son directas |
| 6 | Copiar estructura funciona; copiar texto no aporta | FAQ+schema en 144 sets tras shinystation |
| 7 | Un panel con retraso no prueba que algo no exista | Studio «0 vídeos» con el Short ya público |
| 8 | El trabajo a medias no se pierde: se busca antes de rehacer | 4 borradores seguían en la cuenta |
| 9 | Un carácter puede bloquear un formulario entero | `->` deshabilitaba «Siguiente»; `→` lo desbloqueó |
| 10 | Verificar desde fuera es la única prueba de que el mundo lo ve | `oembed` y canal público sin cookies |

Un principio sin prueba es una frase bonita: si no se puede señalar el dato, no entra.
