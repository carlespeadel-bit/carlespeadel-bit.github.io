# Qué hace cada puesto y en qué turno

Cada fila: **puesto → qué produce → cuándo trabaja → qué prueba deja**. Si no hay prueba, el turno no cuenta.

| Puesto | Qué hace de verdad | Turno | Prueba que deja |
|---|---|---|---|
| **Ingeniería** | Baja precios, compila y despliega las tres webs | 07:10 diario | build OK y sitio en 200 |
| **Dirección** | Fija la hipótesis del día, decide, sanciona y cierra lo que no funciona | 09:00 diario + domingo 20:00 | fila en `CADENA.md` y `OBJETIVO.md` |
| **Distribución** | Publica en los canales abiertos y persigue enlaces clicables | 09:30 (Nostr) · 18:00 (Pinterest) · cada 3 h (tráfico) | nota publicada, relay aceptado, URL en pie |
| **Analista de demanda** | Encuentra consultas que la gente escribe de verdad | 10:00 diario | 2 consultas con su fuente |
| **Redactor jefe** | Publica una página que responde a una de esas consultas | 10:00 diario | URL nueva en 200 y en el sitemap |
| **Afiliados** | Verifica ASINs y que todo enlace vaya a `/dp/` (7 %) | 11:00 diario | `curl` 200 + nombre del producto |
| **Datos** | Limpia movimientos imposibles y vigila el panel | 11:00 diario | cifra antes/después en `changes.json` |
| **SEO técnico** | Consigue que Google lea el sitemap e indexe | cada 3 h | páginas indexadas en Search Console |
| **Inteligencia competitiva** | Lee el código de 3 webs: píxeles, schema, estructura, oferta | cada 2 h | ficha de 13 campos en `competencia/` |
| **Soporte (vigía)** | Comprueba visitas y disponibilidad; calla si todo está igual | cada 30 min | línea en `VIGIA.json` |
| **Auditoría (Contralor)** | Veta lo que no tiene prueba y verifica lo que se afirma | 21:00 diario | veredicto en `AUDITORIA-INTERNA.md` |
| **Optimizador de turnos** | Detecta turnos sin prueba y los reasigna | **20:00 diario** + 21:00 | sospecha en `TURNOS.md` |
| **Enlace de ideas** | Conecta lo que descubre uno con lo que necesita otro | 22:00 diario | conexión con dueño en `CONEXIONES.md` |
| **Abstraedor** | Convierte lo ejecutado en principios con prueba | 22:00 diario | fila en `PRINCIPIOS.md` |
| **Divergente** | Ataca una premisa del plan con una prueba ejecutable | miércoles 20:00 | ruptura en `RUPTURAS.md` |
| **Estrategia** | Vigila los hitos M1-M6 y rediseña el organigrama | viernes 19:00 | decisión en `REUNION.md` |
| **Fiscal** | Busca huecos y **cierra uno cada día** | **16:00 diario** + domingo (consejo) | hueco cerrado en `PARTES.md` |
| **Dirección creativa** | Genera el vídeo, mira fotogramas, puntúa y solo publica si saca 8/10 | **12:30 diario** + domingo (consejo) | veredicto en `CRITERIOS_VIDEO.md` |
| **Suplentes** (direccion-2, seo-2, afiliados-2, distribucion-2…) | Ocupan el puesto cuando el titular cae por fallos | sin turno hasta que caiga el titular | sustituto activo en `EMPRESA.json` |

## Los turnos, en orden del día
**07:10** Ingeniería · **09:00** Dirección · **09:30** Nostr · **10:00** Contenido y demanda · **11:00** Afiliados y datos · **12:30** Dirección creativa · **16:00** Fiscal · **cada 2 h** Inteligencia · **cada 3 h** SEO y tráfico · **cada 30 min** Vigía · **18:00** Pinterest · **20:00** Optimizador · **21:00** Contralor · **22:00** Enlace y Abstraedor · **miércoles 20:00** Divergente · **viernes 19:00** Estrategia · **domingo 20:00** Consejo.

## Estado
**Los 22 puestos tienen turno propio o compartido.** Ya no hay sillas vacías: Creativo a las 12:30, Fiscal a las 16:00 y Optimizador a las 20:00. **17 turnos diarios** más los semanales.
