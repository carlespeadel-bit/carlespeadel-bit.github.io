#!/usr/bin/env node
// Auditor total: ¿se ha roto algo? ¿ha dejado rastro cada turno del día?
import { readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname);
const plan = JSON.parse(await readFile(path.join(ROOT, 'TURNOS-ESPERADOS.json'), 'utf8'));
const ahora = new Date();
const hoy = ahora.toISOString().slice(0, 10);

const mtime = async (f) => {
  try { return (await stat(path.join(ROOT, f))).mtime; } catch { return null; }
};

const filas = [];
for (const t of plan.turnos) {
  const [hh, mm] = t.hora.split(':').map(Number);
  const previsto = new Date(ahora);
  previsto.setHours(hh, mm, 0, 0);
  const yaTocaba = ahora >= previsto;
  let ultima = null;
  for (const e of t.evidencia) {
    const m = await mtime(e);
    if (m && (!ultima || m > ultima)) ultima = m;
  }
  const hoyModificado = ultima && ultima.toISOString().slice(0, 10) === hoy;
  const estado = !yaTocaba ? 'aún no toca' : hoyModificado ? 'con rastro' : 'SIN RASTRO';
  filas.push({ turno: t.turno, previsto: t.hora, estado, ultima: ultima ? ultima.toISOString().slice(0, 16).replace('T', ' ') : '—' });
}

const sinRastro = filas.filter((f) => f.estado === 'SIN RASTRO');
const md = `# Auditoría de turnos — ${ahora.toISOString().slice(0, 16).replace('T', ' ')}

**Turnos del día:** ${filas.length} · **sin rastro:** ${sinRastro.length}

| Turno | Previsto | Estado | Último rastro |
|---|---|---|---|
${filas.map((f) => `| ${f.turno} | ${f.previsto} | ${f.estado} | ${f.ultima} |`).join('\n')}

${sinRastro.length ? `## Turnos que debían haber dejado rastro y no lo hicieron\n${sinRastro.map((f) => `- **${f.turno}** (${f.previsto})`).join('\n')}` : '## Todos los turnos que ya tocaban han dejado rastro.'}
`;
await writeFile(path.join(ROOT, 'TURNOS-AUDIT.md'), md);
console.log(`turnos: ${filas.length} · sin rastro: ${sinRastro.length}`);
if (sinRastro.length) console.log(sinRastro.map((f) => ' · ' + f.turno).join('\n'));
