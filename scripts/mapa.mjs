#!/usr/bin/env node
// Foto del estado de la empresa para pintar /mapa/. Lee ../dinero y escribe data/empresa.json
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DINERO = path.join(ROOT, '..', 'dinero');
const leer = async (f) => (await readFile(path.join(DINERO, f), 'utf8').catch(() => ''));
const leerJSON = async (f) => JSON.parse((await leer(f)) || '{}');

const backlog = await leer('BACKLOG.md');
const cadena = await leer('CADENA.md');
const plan = await leer('PLAN-90D.md');
const exig = await leerJSON('EXIGENCIA.json');
const empresa = await leerJSON('EMPRESA.json');

// hitos del plan
const hitos = [...plan.matchAll(/\|\s*(M\d)\s*\|\s*([\d-]+)\s*\|\s*([^|]+)\|\s*([^|]+)\|/g)].map((m) => ({
  id: m[1], fecha: m[2].trim(), hito: m[3].trim(), cumplido: m[4].trim(),
}));

// hipótesis de la cadena
const hipotesis = [...cadena.matchAll(/\|\s*(H[\w-]+)\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*\*{0,2}([^|*]+)\*{0,2}\s*\|/g)]
  .map((m) => ({ id: m[1], hipotesis: m[2].trim().slice(0, 160), accion: m[3].trim().slice(0, 160), resultado: m[4].trim().slice(0, 160), veredicto: m[5].trim() }));

// tareas
const cerradas = [...backlog.matchAll(/^- \[x\] \*\*(\w+)\*\* — ([^\n]{0,140})/gm)].map((m) => ({ id: m[1], texto: m[2] }));
const abiertas = [...backlog.matchAll(/^- \[ \] \*\*(\w+)\*\* — ([^\n]{0,140})/gm)].map((m) => ({ id: m[1], texto: m[2] }));

const equipo = (empresa.empleados ?? []).map((e) => ({
  nombre: e.nombre, kpi: e.kpi, objetivo: e.objetivo, estado: e.estado,
  nivel: e.nivel, intentos: e.intentos, fallos: e.fallos, rol: e.rol ?? '',
}));

const foto = {
  generado: new Date().toISOString().slice(0, 16).replace('T', ' '),
  racha: exig.racha_dias_con_avance ?? 0,
  diasPerdidos: exig.dias_perdidos ?? 0,
  canalesMuertos: (exig.canales_muertos ?? []).length,
  cerradas, abiertas, hitos, hipotesis, equipo,
};
await writeFile(path.join(ROOT, 'data', 'empresa.json'), JSON.stringify(foto, null, 1));
console.log(`mapa: ${cerradas.length} cerradas · ${abiertas.length} abiertas · ${hitos.length} hitos · ${hipotesis.length} hipótesis · ${equipo.length} agentes`);
