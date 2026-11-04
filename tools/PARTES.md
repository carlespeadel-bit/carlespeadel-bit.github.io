# Partes de trabajo

Un parte por dueño y día. Lo que no está aquí no se ha pedido.

- **Datos** (04-11): limpiar movimientos >1000 % en changes.json y excluir el tráfico de automatización de GoatCounter. Plazo: 05-11.
- **Datos** (04-11, 21:00): limpiar `changes.json` de movimientos >1000 % y filtrar el tráfico propio de las métricas. Plazo: **05-11 09:00**.
- **Soporte** (04-11, 21:00): el 404 de `/en/card/30th-G-mew/` era retraso de propagación de Pages, no un fallo del sitio. Auditoría corregida con reintento a 40 s para no repetir el falso positivo.
- **Contenido** (04-11 22:00): filtrar los movimientos absurdos en `video2.py` e `informe-tiendas.mjs` antes de generar nada. Plazo: **05-11 09:00**.
- **Distribución** (04-11 22:00): comentario fijado con la URL en el Short publicado + pedir la verificación del canal. Plazo: **11-11**.

## Cola de reserva (absorbida de `RESERVA.md`)

Cuando no hay faena urgente **no se inventa trabajo**: se tira de esta cola, que es finita y contada.

| Tarea | Tope | Dueño |
|---|---|---|
| Fichas de competencia (13 campos) | 100 webs | Inteligencia |
| ASINs verificados por set | 30 sets | Afiliados |
| Limpiar datos sucios (saltos >1000 %, duplicados) | hasta 0 | Datos |
| Guías con tabla y FAQ | 12 guías | Contenido |
| Traducciones EN de sets | 144 | Contenido |

Reglas: finita (al tope se para) · verificable (URL, cifra o commit) · si en 30 días no produce efecto, se borra · **la faena real adelanta siempre**. Si aun así no hay nada: se escribe **"sin faena"** y se cierra el turno.
