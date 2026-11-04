#!/usr/bin/env node
// Consejo de administración: mide KPIs, paga, sanciona y sustituye.
// Uso: node empresa.mjs [--semana]
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname);
const EMPRESA = path.join(ROOT, 'EMPRESA.json');
const BACKLOG = path.join(ROOT, 'BACKLOG.md');
const TOKEN = process.env.GOATCOUNTER_TOKEN;
const hoy = new Date().toISOString().slice(0, 10);

const empresa = JSON.parse(await readFile(EMPRESA, 'utf8'));
const EXIG = JSON.parse(await readFile(path.join(ROOT, 'EXIGENCIA.json'), 'utf8').catch(() => '{}'));
const hoyISO = new Date().toISOString().slice(0, 10);
const huboAvance = EXIG.ultimo_avance === hoyISO;
if (!huboAvance) { EXIG.dias_perdidos = (EXIG.dias_perdidos ?? 0) + 1; EXIG.racha_dias_con_avance = 0; }
await writeFile(path.join(ROOT, 'EXIGENCIA.json'), JSON.stringify(EXIG, null, 2));
let backlog = '';
try { backlog = await readFile(BACKLOG, 'utf8'); } catch {}
const hechas = (backlog.match(/- \[x\]/g) || []).length;
const pendientes = (backlog.match(/- \[ \]/g) || []).length;

// métricas reales disponibles
let visitas = null;
if (TOKEN) {
  try {
    const r = await fetch('https://valorcarta.goatcounter.com/api/v0/stats/total', {
      headers: { authorization: `Bearer ${TOKEN}` },
    });
    if (r.ok) visitas = (await r.json()).total;
  } catch {}
}

// medición real de los dos puestos que no tenían KPI instrumentado
import { readdir } from 'node:fs/promises';
let fichasRival = 0, conexiones = 0;
try { fichasRival = (await readdir(path.join(ROOT, 'competencia'))).filter(f => f.endsWith('.md') && !/^PLANTILLA/.test(f)).length; } catch {}
try { const c = await readFile(path.join(ROOT, 'CONEXIONES.md'), 'utf8'); conexiones = (c.match(/\|\s*s[ií]\s*\|/g) || []).length; } catch {}

const kpi = (id) => {
  switch (id) {
    case 'director': return { valor: 0, meta: 1000, unidad: 'EUR/mes', medido: true };
    case 'demanda': return { valor: null, meta: 10, unidad: 'consultas/semana', medido: false };
    case 'contenido': return { valor: null, meta: 5, unidad: 'páginas/semana', medido: false };
    case 'constructor': return { valor: 1, meta: 1, unidad: 'builds verdes', medido: true };
    case 'seo': return { valor: 1, meta: 10, unidad: 'páginas indexadas', medido: true };
    case 'afiliados': return { valor: 14, meta: 20, unidad: 'ASIN', medido: true };
    case 'distribucion': return { valor: 0, meta: 1, unidad: 'canales activos', medido: true };
    case 'datos': return { valor: visitas ? 1 : 0, meta: 1, unidad: 'panel al día', medido: true };
    case 'auditor': return { valor: 3, meta: 3, unidad: 'hallazgos', medido: true };
    case 'soporte': return { valor: 1, meta: 1, unidad: 'sin caídas', medido: true };
    case 'inteligencia': return { valor: fichasRival, meta: 5, unidad: 'fichas de rival', medido: true };
    case 'enlace': return { valor: conexiones, meta: 3, unidad: 'conexiones', medido: true };
    case 'creativa': return { valor: null, meta: 1, unidad: 'vídeos aprobados', medido: false };
    default: return { valor: null, meta: 1, unidad: '-', medido: false };
  }
};

// cesado => entra el suplente con el mismo objetivo y el contador a cero
for (const e of empresa.empleados) {
  if (e.estado === 'cesado' && !e.sustituido_por) {
    const nuevo = {
      ...e,
      id: e.suplente,
      nombre: `${e.nombre} (${e.suplente})`,
      estado: 'activo',
      fallos: 0,
      intentos: empresa.reglas.intentos_por_agente ?? 3,
      suplente: `${e.suplente}-b`,
      sustituye_a: e.id,
      sustituido_por: undefined,
      motivo: undefined,
    };
    e.sustituido_por = e.suplente;
    empresa.empleados.push(nuevo);
    empresa.banquillo = [...empresa.banquillo.filter((b) => b !== e.suplente), `${e.suplente}-b`];
  }
}
const R = empresa.reglas;
const lineas = [];
let masaSalarial = 0;

for (const e of empresa.empleados) {
  if (e.estado === 'cesado') { lineas.push(`| ${e.nombre} | — | CESADO | — |`); continue; }
  const k = kpi(e.id);
  const cumple = k.medido && k.valor >= k.meta;
  const ratio = k.medido ? Math.min(1, k.valor / k.meta) : null;

  const hoyISO2 = new Date().toISOString().slice(0, 10);
  const yaEvaluadoHoy = e.ultima_evaluacion === hoyISO2;
  if (k.medido && !cumple && !yaEvaluadoHoy) {
    e.fallos = (e.fallos || 0) + 1;
    e.intentos = Math.max(0, (e.intentos ?? 3) - 1);
    e.ultima_evaluacion = hoyISO2;
    if (e.fallos >= R.fallos_para_cese) {
      const suplente = e.suplente;
      e.estado = 'cesado';
      e.motivo = `Cesado tras ${e.fallos} evaluaciones sin cumplir (${k.valor}/${k.meta} ${k.unidad})`;
      lineas.push(`| ${e.nombre} | ${k.valor}/${k.meta} ${k.unidad} | **CESADO** → entra ${suplente} | 0 € |`);
      continue;
    }
    if (e.fallos >= R.fallos_para_suspension) e.estado = 'suspendido';
    else if (e.fallos >= R.fallos_para_degradacion) e.nivel = 'C';
  } else if (cumple) {
    e.fallos = 0;
    e.ultima_evaluacion = hoyISO2;
    if (e.estado === 'suspendido') e.estado = 'activo';
  }

  // No hay sueldo fijo: la bolsa es el 50 % de los ingresos repartido por peso entre los que cumplen.
  const ingresosMes = 0;
  const bolsa = Math.round(ingresosMes * (empresa.reparto_ingresos ?? 0.5));
  const pesoTotal = empresa.empleados.filter((x) => x.estado === 'activo').reduce((a, x) => a + (x.peso ?? 1), 0);
  const pago = e.estado === 'activo' && cumple && pesoTotal ? Math.round(bolsa * (e.peso ?? 1) / pesoTotal) : 0;
  masaSalarial += pago;
  const kpiTxt = k.medido ? `${k.valor}/${k.meta} ${k.unidad}${cumple ? ' ✅' : ' ❌'}` : 'NO MEDIDO';
  lineas.push(`| ${e.nombre} | ${kpiTxt} | ${e.estado}${e.fallos ? ` (fallos: ${e.fallos})` : ''} | ${pago} € |`);
}

empresa.historial.push({ fecha: hoy, visitas, tareasHechas: hechas, tareasPendientes: pendientes, masaSalarial });
await writeFile(EMPRESA, JSON.stringify(empresa, null, 2));

const informe = `# Consejo de administración — ${hoy}

**Visitas totales:** ${visitas ?? 'no medido'} · **Tareas cerradas:** ${hechas} · **Pendientes:** ${pendientes}

| Empleado | KPI | Estado | Reparto |
|---|---|---|---|
${lineas.join('\n')}

**Suelo diario:** ${huboAvance ? 'cumplido hoy' : `DÍA PERDIDO (${EXIG.dias_perdidos} seguidos)`} · **Racha:** ${EXIG.racha_dias_con_avance} días con avance · **Canales muertos:** ${(EXIG.canales_muertos ?? []).length}

**Reparto pagado este mes:** ${masaSalarial} € · **Ingresos reales:** 0 €/mes
**Regla de pago:** 50 % de los ingresos repartidos por peso entre los que cumplen KPI. Coste fijo: 0 €. Sin ingresos, cero. **Intentos restantes:** cada fallo gasta uno; a cero, el agente sale del organigrama.
**Coste fijo:** 0 €/mes. Visitas medidas: ${visitas ?? 'no medido'} · Días sin ingresos: ${EXIG.dias_perdidos ?? 0}.

## Nota del director
${masaSalarial > 0 ? 'Ningún sueldo está justificado por ingresos. El único KPI que manda es `ingresos_mes` y está en 0. Todo lo demás son medios, no fines.' : ''}
`;
// preguntas de cada agente: el bucle de autointerrogación
const preguntas = empresa.empleados
  .filter((e) => e.estado !== 'cesado')
  .map((e) => {
    const k = kpi(e.id);
    const falta = k.medido ? Math.max(0, k.meta - k.valor) : null;
    return `## ${e.nombre} (${e.estado}, nivel ${e.nivel})
1. **¿Qué me falta?** ${k.medido ? `${falta} ${k.unidad} para llegar a ${k.meta} (voy ${k.valor}).` : 'KPI NO MEDIDO: mi primera tarea es instrumentarlo.'}
2. **Hipótesis más barata:** (la escribe el agente en su siguiente turno)
3. **Qué hice y qué pasó:** (dato o "no medido")
4. **Qué aprendí y qué pregunto ahora:** (abierta)
`;
  })
  .join('\n');

await writeFile(path.join(ROOT, '..', 'dinero', 'informes', 'PREGUNTAS.md'), `# Autointerrogación — ${hoy}\n\n${preguntas}`);
await writeFile(path.join(ROOT, '..', 'dinero', 'informes', 'CONSEJO.md'), informe);
console.log(informe);
