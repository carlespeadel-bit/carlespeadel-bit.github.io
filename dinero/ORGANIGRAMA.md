# Organigrama — ValorCarta

**Versión 3 · 2026-11-04 22:20.** Fuente única de la plantilla: [`EMPRESA.json`](EMPRESA.json). Si este documento y el JSON discrepan, manda el JSON y se corrige aquí en el mismo turno.

Este documento sustituye a `PUESTO-TURNO.md`, `OBJETIVOS-AGENTES.md` y `EXIGENCIA.md`, archivados en `archivo/`. Si algo no está aquí, no es norma.

## 1. La única meta

`ingresos_mes >= 1.000 €`. Todo lo demás —páginas, enlaces, ASIN, vídeos— son medios.

**Coste fijo de la estructura: 0 €/mes.** No hay sueldos. Si entran ingresos, se reparte el **50 %** por peso entre los puestos que hayan cumplido su KPI. Sin ingresos, cero.

## 2. Estructura

```
Dirección General · KPI: ingresos_mes
├── Demanda            Analista de demanda · Redactor jefe · Distribución
├── Producto           Ingeniería · SEO técnico · Datos
├── Monetización       Afiliados
├── Control            Auditoría · Soporte · Fiscal
└── Estudio            Inteligencia · Enlace · Abstraedor · Divergente · Estrategia · Optimizador · Creativa
Puertas de calidad     Vídeo (CRITERIOS_VIDEO.md) · Prueba por turno (URL, cifra o commit)
```

## 3. Plantilla: 15 puestos (14 con reloj; SEO técnico sin él)

| Puesto | Qué hace | KPI | Turno | Prueba que deja |
|---|---|---|---|---|
| **Dirección** | fija la hipótesis del día y decide | ingresos_mes ≥ 1.000 € | 09:00 diario | fila en `CADENA.md` |
| **Analista de demanda** | consultas con fuente | 10 consultas/semana | 10:00 diario | 2 consultas con fuente |
| **Redactor jefe** | páginas que responden a esas consultas | 5 páginas/semana | 10:00 diario | URL en 200 y en el sitemap |
| **Distribución** | canales sin depender de Google | 1 canal publicando a diario | 09:30 · 18:00 · cada 3 h | nota publicada, relay aceptado |
| **Ingeniería** | precios, build, snapshot y despliegue | 0 builds rojos | 07:10 diario | build OK y sitio en 200 |
| **SEO técnico** | sitemap, canonical, `noindex`, IndexNow | ≥10 páginas indexadas | **sin reloj** | páginas indexadas en Search Console |
| **Datos** | precios limpios y panel sin cifras fantasma | panel al día | 11:00 diario | cifra antes/después en `changes.json` |
| **Afiliados** | `/dp/`, ASIN verificado, etiqueta `valorcarta-21` | ≥20 ASIN | 11:00 diario | `curl` 200 y nombre del producto |
| **Auditoría** | veta lo que no tiene prueba | 3 fallos con evidencia/semana | 21:00 diario | veredicto en `CONEXIONES.md`/`PARTES.md` |
| **Soporte** | caídas, 404 y rutas clave | 0 caídas sin avisar | cada 30 min (vigía) | línea en `VIGIA.json` |
| **Inteligencia** | 3 webs de rivales, ficha de 13 campos | 5 fichas/semana | cada 2 h | ficha en `competencia/` |
| **Enlace** | conecta lo que descubre uno con quien lo necesita | 3 conexiones ejecutadas/semana | 22:00 diario | conexión con dueño en `CONEXIONES.md` |
| **Fiscal** | cierra un hueco real al día | 1 hueco/día | 16:00 diario | hueco cerrado en `PARTES.md` |
| **Optimizador** | detecta turnos sin prueba y los reasigna | valor por turno | 20:00 diario | sospecha en `TURNOS.md` |
| **Dirección creativa** | genera el vídeo y lo puntúa antes de publicar | 8/10 en `CRITERIOS_VIDEO.md` | 12:30 diario | veredicto en `CRITERIOS_VIDEO.md` |

## 4. Estudio: 3 puestos sin turno diario propio

| Puesto | Qué hace | Turno |
|---|---|---|
| **Divergente** | ataca una premisa del plan con una prueba | mié 20:00 (Ruptura) |
| **Abstraedor** | convierte lo ejecutado en principios con prueba | 22:00 (con Enlace) |
| **Estrategia 90 d** | vigila los hitos M1-M6 | vie 19:00 (Comité) |

**Suplentes** (direccion-2, seo-2, afiliados-2, distribucion-2…): en `banquillo`, sin turno ni ficha duplicada. Solo entran si el titular cesa.

## 5. Dinero

| Concepto | Valor |
|---|---|
| Coste fijo | **0 €/mes** |
| Reparto si hay ingresos | **50 %** de `ingresos_mes`, por peso (34 puntos entre 18 fichas) |
| Pagado hoy | **0 €** |

Quedan muertos los tres números que circulaban: 19.500 € escrito a mano, 41.000 € sumando fichas duplicadas y 0 € pagado. Ya no hay ninguno: el dinero solo se calcula y solo existe si entra.

**Dos KPI sin instrumentar:** Fiscal y Dirección creativa. Su primera tarea es instrumentarlos; hasta entonces no cobran ni se les sanciona.

## 6. Relojes: 80 disparos al día

| Turno | Puesto | Disparos/día |
|---|---|---|
| 07:10 mantenimiento | Ingeniería | 1 |
| 09:00 bucle del director | Dirección | 1 |
| 09:30 nota Nostr | Distribución | 1 |
| 10:00 contenido y demanda | Demanda · Redactor | 1 |
| 11:00 afiliados y datos | Afiliados · Datos | 1 |
| 12:30 vídeo | Dirección creativa | 1 |
| 16:00 caza de huecos | Fiscal | 1 |
| 18:00 Pinterest | Distribución | 1 |
| 20:00 optimizador | Optimizador | 1 |
| 21:00 supervisión | Auditoría | 1 |
| 22:00 enlace y principios | Enlace · Abstraedor | 1 |
| cada 3 h tráfico | Distribución | 8 |
| cada 2 h competencia | Inteligencia | 12 |
| **cada 30 min vigía** | **Soporte** | **48** |
| semanal | Consejo · Comité · Ruptura | ~0,6 |

El vigía se lleva el **60 %** de los disparos. **Un hueco declarado:** SEO técnico no tiene reloj. **Riesgo estructural:** los 17 relojes cuelgan de una sola sesión; si se cierra, se para todo.

## 7. Reglas de personal

1. **Trinquete.** Meta cumplida dos semanas seguidas ⇒ sube un 50 %. Fallada ⇒ se queda y se pierde un intento.
2. **Suelo diario.** Cada día, un avance medible: commit, enlace publicado, URL indexada, hipótesis cerrada con dato. Día sin avance = perdido; 2 seguidos ⇒ sanción; 5 al mes ⇒ fuera.
3. **No es avance** leer, planificar, «dejar preparado» ni refactorizar sin efecto medible.
4. **Muertes.** Limpia (se midió) no cuesta y suma un descubrimiento; sucia (sin medir o repetida) cuesta 2 intentos.
5. **Sanciones.** 1 aviso · 2 nivel C · 3 suspensión · 4 cese (entra el banquillo). Ya no hay descuento de sueldo: no hay sueldo que descontar.
6. **Veto con caducidad.** 48 h para código y contenido, 6 h para canales externos; máximo 3 vivos.
7. **Freno de reglamentación.** Máximo 2 reglas nuevas por semana. Una regla sin turno que la ejecute no se escribe.
8. **Nadie asciende por actividad:** se asciende por KPI cumplido dos semanas seguidas.

## 8. Dónde vive cada cosa

| Documento | Para qué | Se escribe |
|---|---|---|
| `ORGANIGRAMA.md` (este) | quién, qué, KPI, turno, dinero y reglas | a mano |
| [`CADENA.md`](CADENA.md) | qué se prueba: hipótesis → medición → veredicto | a mano |
| [`PARTES.md`](PARTES.md) | encargos con dueño, plazo y prueba · cola de reserva | a mano |
| [`TURNOS.md`](TURNOS.md) | qué hizo cada turno y qué costó · las 4 preguntas | a mano |
| [`CRITERIOS_VIDEO.md`](CRITERIOS_VIDEO.md) | la puerta de calidad del vídeo | Dirección creativa |
| `EMPRESA.json` | plantilla, pesos y estado (fuente única) | `empresa.mjs` |
| `informes/` | CONSEJO, PREGUNTAS, REUNION, CHECKLIST, PLAZOS | scripts |
| `archivo/` | lo absorbido el 04-11; solo historia | nadie |
