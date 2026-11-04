#!/usr/bin/env node
// Plazos: cada objetivo tiene fecha de entrega. Lo vencido duele.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname);
const leer = async (f) => (await readFile(path.join(ROOT, f), 'utf8').catch(() => ''));
const hoy = new Date().toISOString().slice(0, 10);
const iso = (f) => {
  if (!f) return null;
  const m = f.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : f;
};
const plan = await leer('PLAN-90D.md');
const backlog = await leer('BACKLOG.md');
const empresa = JSON.parse((await leer('EMPRESA.json')) || '{}');

// hitos M1-M6 con fecha
const hitos = [...plan.matchAll(/\|\s*(M\d)\s*\|\s*([\d-]{10})\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|/g)]
  .map((m) => ({ id: m[1], fecha: iso(m[2]), que: m[3].trim(), condicion: m[4].trim(), dueño: m[5].trim() }));

// objetivos abiertos con fecha límite escrita en el texto (formato dd-mm o ISO)
const abiertos = [...backlog.matchAll(/^- \[ \] \*\*(\w+)\*\* — ([^\n]+)/gm)].map((m) => {
  const texto = m[2];
  const fecha = (texto.match(/(\d{4}-\d{2}-\d{2})/) || texto.match(/(\d{2}-\d{2}-\d{4})/) || [])[1] || null;
  return { id: m[1], texto: texto.slice(0, 120), fecha };
});

const vencidos = [...hitos.filter((h) => h.fecha < hoy), ...abiertos.filter((o) => o.fecha && o.fecha < hoy)];
const sinFecha = abiertos.filter((o) => !o.fecha);

const md = `# Plazos — ${hoy}

## Hitos con fecha de entrega
| Hito | Entrega | Condición | Dueño | Estado |
|---|---|---|---|---|
${hitos.map((h) => `| ${h.id} · ${h.que} | ${h.fecha} | ${h.condicion} | ${h.dueño} | ${h.fecha < hoy ? '**VENCIDO**' : h.fecha === hoy ? 'HOY' : 'en plazo'} |`).join('\n')}

## Objetivos sin fecha (no valen)
${sinFecha.length ? sinFecha.map((o) => `- **${o.id}** ${o.texto} → **asignar fecha hoy**`).join('\n') : '- todos tienen fecha'}

## Vencidos (${vencidos.length})
${vencidos.length ? vencidos.map((v) => `- ${v.id}${v.que ? ' · ' + v.que : ''} — venció ${v.fecha}`).join('\n') : '- nada vencido'}

## Regla
Un objetivo sin fecha no existe. Un objetivo vencido gasta intento al dueño. Y si un hito se aplaza, se escribe la fecha nueva **antes** de que venza la vieja, nunca después.
`;
await writeFile(path.join(ROOT, 'PLAZOS.md'), md);
console.log(md.split('\n').slice(0, 16).join('\n'));
