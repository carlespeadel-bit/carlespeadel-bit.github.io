# Registro de turnos

Cada turno deja **una línea**: quién, qué hizo, qué produjo y si sirvió. Sin esta línea, el turno no existe para el Optimizador.

| Hora | Puesto | Acción | Prueba | ¿Sirvió? |
|---|---|---|---|---|
| 07:10 | Ingeniería | precios + despliegue | build OK, 3 sitios | sí |
| 09:00 | Dirección | hipótesis + idea | CADENA/IDEAS | sí |
| 09:30 | Distribución | nota en Nostr | 2/4 relays | sí |
| cada 2 h | Inteligencia | 3 webs + ficha | 3 fichas nuevas | sí |
| cada 3 h | Distribución | Search Console / IndexNow | 204/204 IndexNow | sí |
| cada 30 min | Vigía | visitas + 5 rutas | sin cambios | **no** (correcto: silencio) |
| 21:00 | Supervisión | auditoría + sanciones | 2 hallazgos | sí |
| 22:00 | Enlace/Abstraedor | conexiones + principios | 3 conexiones | sí |

## El problema que hay que arreglar
- **18 fichas y 17 turnos.** Solo SEO técnico no tiene reloj; el resto tiene turno propio o compartido.
- **80 disparos al día y el vigía se lleva 48 (60 %).** Casi todos son "sin cambios": valor de alerta, no de producción.
- **Los turnos son secuenciales:** no hay paralelismo salvo cuando se lanzan subagentes.

## Lo que mide el Optimizador
1. **Turnos por puesto y semana** — quién no tiene turno y debería.
2. **Turnos sin prueba** — los que no dejan URL, cifra o commit.
3. **Valor por turno** — qué produjo cada turno que acerque a M1, M2 o M3.
4. **Reasignación** — quitar turnos a lo que no mueve nada y dárselos a lo que sí.

## Cuando no hay faena
1. Se busca en `RESERVA.md` (finita, con tope).
2. Si la reserva está agotada o no aplica, se escribe **"sin faena"** y se cierra.
3. **Prohibido inventar actividad** para justificar el turno: eso es lo que el Optimizador cuenta como turno sin valor.

## Lo que dice el Contralor (aceptado)
*"El 100 % de ocupación es una fantasía de fábrica. Aquí se espera a Google, a las tiendas y a los relays. Un agente que finge trabajar cuesta lo mismo que uno que trabaja y contamina las métricas."*

## Sospechas de trabajo inventado (las escribe el Optimizador)
| Fecha | Puesto | Prueba de la sospecha | Trabajo real asignado por el Enlace | Plazo | Resuelto |
|---|---|---|---|---|---|
| 04-11 | Vigía | 48 turnos/día y casi todos «sin cambios» | Bajado a 30 min; el resto del tiempo no se llena con nada | 05-11 | ✅ |

**El circuito:** el Optimizador sospecha → el Enlace busca trabajo real (RESERVA.md o necesidad de otro agente) → si no hay, se escribe "sin faena" y el turno se reasigna. **Nadie hace dos turnos seguidos de relleno.**

## Mapa real: qué puesto trabaja en qué turno (04-11)
| Turno | Puesto(s) que actúan |
|---|---|
| 07:10 diario | Ingeniería |
| 09:00 diario | Dirección |
| 09:30 diario | Distribución (Nostr) |
| 10:00 diario | **Analista de demanda + Redactor jefe** (nuevo) |
| 11:00 diario | **Afiliados + Datos** (nuevo) |
| cada 2 h | Inteligencia competitiva |
| cada 3 h | SEO técnico + Distribución (tráfico) |
| cada 30 min | Soporte (vigía) |
| 18:00 diario | Distribución (Pinterest) |
| 21:00 diario | Auditoría (Contralor) + Optimizador |
| 22:00 diario | Enlace de ideas + Abstraedor |
| miércoles 20:00 | Divergente |
| viernes 19:00 | Estrategia (comité de organización) |
| domingo 20:00 | Dirección (consejo) + Fiscal + Dirección creativa |

**Puestos sin turno propio:** SEO técnico. Es el único hueco declarado del organigrama.

**La verdad incómoda:** un puesto sin turno no puede cumplir su KPI y sancionarlo es injusto. Por eso los relojes van antes que las metas.

## Las cuatro preguntas de cada turno (absorbidas de `archivo/BUCLE.md`)

1. **¿Qué me falta para cumplir mi KPI?** Numérico: "me faltan 9 páginas de 10", no "voy bien".
2. **Hipótesis más barata** que puedo probar hoy.
3. **Qué hice y qué pasó:** dato, o "no medido" (y entonces no cuenta como avance).
4. **Qué aprendí y qué pregunto ahora**, por escrito.
