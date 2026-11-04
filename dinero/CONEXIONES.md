# Conexiones entre agentes

El Enlace lee todo lo que producen los demás y busca **quién tiene la pieza que otro necesita**. Una conexión solo cuenta cuando acaba en una acción con dueño.

| Fecha | Quién descubre | Qué descubre | Quién lo necesita | Qué acción desbloquea | Estado |
|---|---|---|---|---|---|
| 04-11 | Inteligencia | El nicho vive en TikTok/YouTube, no en anuncios | Distribución | Medir búsquedas en YouTube antes de abrir canal | pendiente |
| 04-11 | Abstraedor | Publicar no es distribuir (dataset: 1 descarga) | Demanda | Llevar el informe a 30 tiendas, no esperar descargas | pendiente |
| 04-11 | Divergente | IndexNow acepta 204 y Bing no tiene ni una URL | SEO | Dejar de tocar sitemaps y no gastar más turnos ahí | hecho |

## La regla del Enlace
- Una conexión sin acción es una opinión con flechas.
- Si dos agentes están trabajando en lo mismo sin saberlo, se dice y se fusiona.
- Si dos agentes se contradicen, se escribe la contradicción con las dos pruebas y la resuelve el dueño del KPI afectado.

## Función añadida: buscar trabajo, no solo conectar
El Enlace también responde de **colocar** a los puestos que el Optimizador marca por trabajo inventado. Para cada uno:
1. Busca una necesidad real sin dueño (de otro agente, de la auditoría o de `RESERVA.md`).
2. La asigna con prueba exigida y plazo de 24 h.
3. Si no existe, escribe **"sin faena"** y el turno se reasigna. No se inventa nada.

## El Enlace informa al Contralor (antes de asignar)
Toda conexión y toda tarea asignada se anota aquí con **visto bueno del Contralor**. Si en 6 h no ha objetado con prueba, se ejecuta.

| Conexión | Contralor avisado | Objeción (6 h) | Ejecutada |
|---|---|---|---|
| YouTube es el canal, no los enlaces | 04-11 20:15 | sin objeción | sí (canal bloqueado por verificación de teléfono) |
| Datos sucios antes de publicar vídeo | 04-11 20:15 | pendiente | no |

**Si el Contralor objeta, el Enlace no puede asignar**: se vuelve a `RESERVA.md` o se escribe "sin faena".

## Ronda 04-11 · 22:00

| Conexión | Quién descubre | Quién lo necesita | Acción con dueño | Plazo |
|---|---|---|---|---|
| El Short está publicado pero el enlace de la descripción no es clicable sin verificación | Distribución | Distribución | Comentario fijado con la URL + verificación del canal | 11-11 |
| Los datos sucios (>1000 %) entran en el vídeo y en el informe | Datos | Contenido | Filtrar `abs(pct) < 60` en `video2.py` e `informe-tiendas.mjs` | 05-11 |
| La auditoría daba 404 falsos por retraso de Pages | Soporte | Auditoría | Reintento a 40 s ya aplicado en `auditoria.mjs` | hecho |
| Studio decía «0 vídeos» mientras el canal público tenía el Short | Distribución | Optimizador | Verificar siempre por `oembed`, nunca por la lista del panel | hecho |

## Contradicción resuelta
**Inteligencia:** *"el nicho no compra anuncios; compra contenido propio"* — prueba: ninguna de las 9 webs enciende píxel de Meta/TikTok; los `AW-` existen y no disparan.
**Dirección:** *"50 € de Ads para probar la conversión"* — prueba: eBay.es, Amazon.es y Catawiki sí aparecen como Patrocinado en YouTube para «cartas pokemon españa».
**Resolución (dueño del KPI: Distribución):** las dos son ciertas y no se contradicen: **las tiendas no compran anuncios, pero los marketplaces sí**, porque venden lo mismo que nosotros. Conclusión: **no competimos con las tiendas por atención, competimos con eBay y Amazon por la misma intención de compra**. Eso refuerza el contenido (donde ellos no están) y deja los anuncios para cuando haya dinero.
