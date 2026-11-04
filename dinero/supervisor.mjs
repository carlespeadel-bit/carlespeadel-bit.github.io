#!/usr/bin/env node
// Supervisor: comprueba que cada agente ha respondido su bucle y que la respuesta es coherente.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname);
const hoy = new Date().toISOString().slice(0, 10);
const preguntas = await readFile(path.join(ROOT, 'PREGUNTAS.md'), 'utf8').catch(() => '');
const empresa = JSON.parse(await readFile(path.join(ROOT, 'EMPRESA.json'), 'utf8'));

const secciones = preguntas.split(/^## /m).slice(1).map((s) => {
  const [titulo, ...resto] = s.split('\n');
  return { nombre: titulo.replace(/\s*\(.*$/, '').trim(), cuerpo: resto.join('\n') };
});

const PLACEHOLDER = /la escribe el agente|\(abierta\)|\(dato o/i;
const resultados = [];

for (const e of empresa.empleados.filter((x) => x.estado !== 'cesado')) {
  const sec = secciones.find((s) => s.nombre === e.nombre);
  if (!sec) { resultados.push({ nombre: e.nombre, estado: 'NO RESPONDIDO', motivo: 'sin ficha en PREGUNTAS.md', fallo: true }); continue; }

  const q2 = (sec.cuerpo.match(/2\.[^\n]*\*\*(.*?)\*\*\s*([^\n]*)/) || [])[2] ?? '';
  const q3 = (sec.cuerpo.match(/3\.[^\n]*\*\*(.*?)\*\*\s*([^\n]*)/) || [])[2] ?? '';
  const q4 = (sec.cuerpo.match(/4\.[^\n]*\*\*(.*?)\*\*\s*([^\n]*)/) || [])[2] ?? '';

  const problemas = [];
  if (PLACEHOLDER.test(q2) || q2.trim().length < 10) problemas.push('hipótesis sin escribir');
  if (!/\d/.test(q2)) problemas.push('hipótesis sin número verificable');
  if (PLACEHOLDER.test(q3) || q3.trim().length < 5) problemas.push('resultado sin dato');
  if (PLACEHOLDER.test(q4) || q4.trim().length < 5) problemas.push('sin aprendizaje');

  resultados.push({
    nombre: e.nombre,
    kpi: e.kpi,
    estado: problemas.length ? 'INCOMPLETO' : 'CUMPLE',
    motivo: problemas.join('; ') || 'bucle completo',
    fallo: problemas.length > 0,
  });
}

const fallos = resultados.filter((r) => r.fallo).length;

// la sanción se aplica, no se sugiere
for (const r of resultados.filter((x) => x.fallo)) {
  const emp = empresa.empleados.find((e) => e.nombre === r.nombre);
  if (!emp) continue;
  const cuerpo = (sec?.cuerpo ?? '');
  const midio = /\d/.test(cuerpo) && !/no medido|sin dato/i.test(cuerpo);
  emp.fallos = (emp.fallos || 0) + 1;
  // muerta limpia (midió) no cuesta intento; sucia (no midió) cuesta 2
  emp.intentos = Math.max(0, (emp.intentos ?? 3) - (midio ? 0 : 2));
  emp.descubrimientos = (emp.descubrimientos ?? 0) + (midio ? 1 : 0);
  if (emp.intentos === 0) emp.estado = 'cesado';
}
await writeFile(path.join(ROOT, 'EMPRESA.json'), JSON.stringify(empresa, null, 2));
const informe = `# Supervisión — ${hoy}

**Agentes revisados:** ${resultados.length} · **Con el bucle incompleto:** ${fallos}

| Agente | KPI | Veredicto | Qué falta |
|---|---|---|---|
${resultados.map((r) => `| ${r.nombre} | ${r.kpi} | ${r.estado} | ${r.motivo} |`).join('\n')}

## Lo que exige el director
${fallos === 0
  ? 'Todos han respondido. Ahora se comprueba que lo que dicen sea verdad y que mueva el KPI.'
  : `Nadie actúa hasta responder. ${fallos} agentes tienen el bucle incompleto: su siguiente turno empieza por escribir la hipótesis con un número y el resultado con un dato.`}

**Regla de coherencia:** una hipótesis sin número no es una hipótesis. Un resultado sin dato no es un resultado. Y si la hipótesis no puede mover el KPI del agente, no vale aunque sea interesante.
`;
await writeFile(path.join(ROOT, 'SUPERVISION.md'), informe);
console.log(informe);
