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
    default: return { valor: null, meta: 1, unidad: '-', medido: false };
  }
};

const R = empresa.reglas;
const lineas = [];
let masaSalarial = 0;

for (const e of empresa.empleados) {
  if (e.estado === 'cesado') { lineas.push(`| ${e.nombre} | — | CESADO | — |`); continue; }
  const k = kpi(e.id);
  const cumple = k.medido && k.valor >= k.meta;
  const ratio = k.medido ? Math.min(1, k.valor / k.meta) : null;

  if (k.medido && !cumple) {
    e.fallos = (e.fallos || 0) + 1;
    if (e.fallos >= R.fallos_para_cese) {
      const suplente = e.suplente;
      e.estado = 'cesado';
      e.motivo = `Cesado tras ${e.fallos} evaluaciones sin cumplir (${k.valor}/${k.meta} ${k.unidad})`;
      lineas.push(`| ${e.nombre} | ${k.valor}/${k.meta} ${k.unidad} | **CESADO** → entra ${suplente} | 0 € |`);
      continue;
    }
    if (e.fallos >= R.fallos_para_suspension) e.estado = 'suspendido';
    else if (e.fallos >= R.fallos_para_degradacion) e.nivel = 'C';
    else if (e.fallos >= R.fallos_para_bajada_sueldo) e.sueldo = Math.round(e.sueldo * (1 - R.descuento_por_fallo));
  } else if (cumple) {
    e.fallos = 0;
    if (e.estado === 'suspendido') e.estado = 'activo';
  }

  const pago = e.estado === 'activo' ? e.sueldo : e.estado === 'suspendido' ? 0 : 0;
  masaSalarial += pago;
  const kpiTxt = k.medido ? `${k.valor}/${k.meta} ${k.unidad}${cumple ? ' ✅' : ' ❌'}` : 'NO MEDIDO';
  lineas.push(`| ${e.nombre} | ${kpiTxt} | ${e.estado}${e.fallos ? ` (fallos: ${e.fallos})` : ''} | ${pago} € |`);
}

empresa.historial.push({ fecha: hoy, visitas, tareasHechas: hechas, tareasPendientes: pendientes, masaSalarial });
await writeFile(EMPRESA, JSON.stringify(empresa, null, 2));

const informe = `# Consejo de administración — ${hoy}

**Visitas totales:** ${visitas ?? 'no medido'} · **Tareas cerradas:** ${hechas} · **Pendientes:** ${pendientes}

| Empleado | KPI | Estado | Sueldo virtual |
|---|---|---|---|
${lineas.join('\n')}

**Masa salarial virtual:** ${masaSalarial} €/mes · **Ingresos reales:** 0 €/mes
**Déficit:** ${masaSalarial} €/mes. La empresa lleva 3 días sin ingresos y 18 visitas.

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

await writeFile(path.join(ROOT, 'PREGUNTAS.md'), `# Autointerrogación — ${hoy}\n\n${preguntas}`);
await writeFile(path.join(ROOT, 'CONSEJO.md'), informe);
console.log(informe);
