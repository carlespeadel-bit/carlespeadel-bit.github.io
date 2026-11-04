# Organigrama — ValorCarta

**Versión 2 · 2026-11-04.** Fuente única de la plantilla: [`EMPRESA.json`](EMPRESA.json). Si este documento y el JSON discrepan, manda el JSON y se corrige este fichero en el mismo turno.

## 1. La única meta

`ingresos_mes >= 1.000 €`. Todo lo demás —páginas, enlaces, ASIN, vídeos— son medios. **Ninguna función cobra sin ingresos**: el sueldo es compromiso presupuestado, no gasto.

## 2. Estructura

```
Dirección General (1) · KPI: ingresos_mes
├── Demanda            Analista de demanda · Redactor jefe · Distribución
├── Producto           Ingeniería · SEO técnico · Datos
├── Monetización       Afiliados
├── Control            Auditoría · Soporte · Optimizador de turnos
└── Estudio            Inteligencia competitiva · Enlace · Abstraedor · Divergente · Estrategia 90 d
Puerta de calidad      CRITERIOS_VIDEO.md · 10 preguntas, 3 «no» = no se publica
```

## 3. Plantilla con sueldo y reloj (12)

| Puesto | Qué hace de verdad | KPI | Turno | Sueldo |
|---|---|---|---|---|
| **Dirección** | fija la hipótesis del día y decide dónde se pone el esfuerzo | ingresos_mes ≥ 1.000 € | 09:00 diario | 2.250 € |
| **Analista de demanda** | busca qué escribe la gente, entrega consultas con fuente | 10 consultas/semana | 10:00 diario | 1.800 € |
| **Redactor jefe** | convierte consultas en páginas y las enlaza | 5 páginas/semana | 10:00 diario | 1.800 € |
| **Distribución** | canales sin depender de Google: Nostr, tráfico, Pinterest | 1 canal publicando a diario | 09:30 · cada 3 h · 18:00 | 1.500 € |
| **Ingeniería** | precios, build, snapshot y despliegue | 0 builds rojos | 07:10 diario | 2.200 € |
| **SEO técnico** | sitemap, canonical, `noindex`, Search Console, IndexNow | ≥10 páginas indexadas | **sin reloj** | 1.650 € |
| **Datos** | precios al día y panel sin cifras fantasma | panel al día | 11:00 diario | 1.600 € |
| **Afiliados** | `/dp/` correcto, ASIN verificado, etiqueta `valorcarta-21` | ≥20 ASIN | 11:00 diario | 1.500 € |
| **Auditoría** | duda de todo; escribe hallazgos con prueba | 3 fallos con evidencia/semana | 21:00 diario | 1.700 € |
| **Soporte** | vigila caídas, 404 y rutas clave | 0 caídas sin avisar | cada 30 min | 1.200 € |
| **Inteligencia** | 3 webs de rivales, ficha con lo copiable | 5 fichas/semana | cada 2 h | 2.100 € |
| **Enlace** | conecta lo que descubre un puesto con quien lo necesita | 3 conexiones ejecutadas/semana | 22:00 diario | 2.200 € |

## 4. Estudio y puertas (0 € de sueldo)

| Puesto | Qué hace | Turno |
|---|---|---|
| **Divergente** | ataca el plan vigente con una prueba por semana | mié 20:00 (Ruptura) |
| **Abstraedor** | convierte lo ejecutado en principios con prueba | 22:00 diario (con Enlace) |
| **Optimizador de turnos** | mide valor por turno y recoloca los que no valen | Consejo semanal |
| **Estrategia 90 d** | hitos M1-M3 en fecha | Consejo semanal |
| **Puerta de calidad del vídeo** | 10 criterios; 3 «no» bloquean la publicación. La aplica quien publica, no es un puesto | antes de cada subida |

## 5. Nómina

- **Comprometido: 21.500 €/mes** (12 puestos). Estudio y vacante: 0 €.
- **Pagado hoy: 0 €.** Regla: `sueldo × min(1, ingresos/1.000)`. Sin ingresos, nómina cero.
- Se escribe **un solo número**. Los tres que circulaban (19.500 escrito, 41.000 sumando fichas duplicadas, 0 pagado) quedan muertos.

## 6. Relojes: 76 disparos al día

| Turno | Puesto | Disparos/día |
|---|---|---|
| 07:10 mantenimiento | Ingeniería | 1 |
| 09:00 bucle del director | Dirección | 1 |
| 09:30 nota Nostr | Distribución | 1 |
| 10:00 contenido y demanda | Demanda · Redactor | 1 |
| 11:00 afiliados y datos | Afiliados · Datos | 1 |
| 18:00 Pinterest | Distribución | 1 |
| 21:00 supervisión | Auditoría | 1 |
| 22:00 enlace y principios | Enlace · Abstraedor | 1 |
| cada 3 h tráfico | Distribución | 8 |
| cada 2 h competencia | Inteligencia | 12 |
| cada 30 min vigía | Soporte | **48** |
| semanal | Consejo · Comité · Ruptura | ~0,6 |

El vigía se lleva el **63 %** de los disparos. **Un hueco declarado:** SEO técnico no tiene reloj. La estética del vídeo no es un puesto: es la puerta [`CRITERIOS_VIDEO.md`](CRITERIOS_VIDEO.md). **Riesgo estructural:** los 14 relojes cuelgan de una sola sesión; si se cierra, se para todo.

## 7. Reglas de personal (vinculantes)

1. **Trinquete.** Meta cumplida dos semanas seguidas ⇒ sube un 50 %. Fallada ⇒ se queda y se pierde un intento. Ninguna meta baja por cansancio.
2. **Suelo diario.** Cada día, un avance medible: commit, enlace publicado, URL indexada, hipótesis cerrada con dato. Día sin avance = perdido; 2 seguidos ⇒ sanción; 5 al mes ⇒ fuera.
3. **No es avance** leer, planificar, "dejar preparado" ni refactorizar sin efecto medible.
4. **Muertes.** Limpia (se midió y no funcionó) no cuesta: suma un descubrimiento. Sucia (sin medir o repetir una hipótesis enterrada) cuesta 2 intentos.
5. **Sanciones.** 1 fallo aviso · 2 −25 % · 3 nivel C · 4 suspensión · 5 cese (entra el banquillo, nunca se duplica la ficha).
6. **Veto con caducidad.** 48 h para código y contenido, 6 h para canales externos; máximo 3 vivos. Un veto caducado cuesta un intento al Contralor.
7. **Freno de reglamentación.** Máximo **2 reglas nuevas por semana**. Una regla sin turno que la ejecute no se escribe.
8. **Nadie asciende por actividad.** Se asciende por KPI cumplido dos semanas seguidas.

## 8. Dónde vive cada cosa

| Documento | Para qué | Se escribe |
|---|---|---|
| `ORGANIGRAMA.md` (este) | quién, qué, KPI, sueldo, turno y reglas | a mano |
| [`CADENA.md`](CADENA.md) | qué se está probando: hipótesis → medición → veredicto | a mano |
| [`PARTES.md`](PARTES.md) | encargos abiertos con dueño, plazo y prueba | a mano |
| [`TURNOS.md`](TURNOS.md) | qué hizo cada turno y qué costó | a mano |
| `EMPRESA.json` | plantilla, sueldos y estado (fuente única) | `empresa.mjs` |
| `informes/` | CONSEJO, PREGUNTAS, REUNION, CHECKLIST, PLAZOS | scripts |
| `archivo/` | lo absorbido el 04-11; se lee solo para historia | nadie |
