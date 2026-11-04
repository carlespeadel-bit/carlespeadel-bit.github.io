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
- **20 puestos y ~15 turnos útiles al día:** la mayoría de los roles no recibe turno nunca. Un puesto sin turno no puede cumplir KPI, y sancionarlo es injusto.
- **El vigía es el 90 % de los turnos** (48/día) y casi todos son "sin cambios". Su coste es alto y su valor, de alerta.
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
