#!/usr/bin/env node
// Guardia: impide avanzar si hay un veto vivo o si la hipótesis no es verificable.
// Se ejecuta antes de cada commit (hook) y en la supervisión diaria.
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname);
const leer = async (f) => (await readFile(path.join(ROOT, f), 'utf8').catch(() => ''));
const vetos = await leer('VETOS.md');
const cadena = await leer('CADENA.md');
const hoy = new Date();

const errores = [];

// 1) vetos vivos
const filas = [...vetos.matchAll(/^\|\s*([\d-]{10})\s*\|([^|]+)\|([^|]+)\|([^|]+)\|\s*([^|]+)\|/gm)];
for (const f of filas) {
  const [_, fecha, avance, prueba, caducidad, estado] = f;
  if (/cerrado|levantado|ca[ií]do|resuelto/i.test(estado)) continue;
  const limite = new Date(caducidad.trim().slice(0, 10));
  if (!isNaN(limite) && limite >= hoy) {
    errores.push(`VETO VIVO sobre «${avance.trim()}» · falta: ${prueba.trim()} · caduca ${caducidad.trim()}`);
  }
}

// 2) cada hipótesis nueva debe citar una acción verificable
const abiertas = [...cadena.matchAll(/^## (H[\w-]+)[^\n]*\n\*\*Acción[^\n]*/gm)];
for (const a of abiertas) {
  const bloque = a[0];
  const verificable = /https?:\/\/|`[^`]+`|node |python3 |curl /.test(bloque);
  if (!verificable) errores.push(`La hipótesis ${a[1]} no cita comando, URL ni fichero comprobable`);
}

if (errores.length) {
  console.error('\nGUARDIA: no puedes avanzar.\n');
  for (const e of errores) console.error(' · ' + e);
  console.error('\nResuelve la prueba pendiente o marca el veto como cerrado en VETOS.md.\n');
  process.exit(1);
}
console.log('GUARDIA: sin vetos vivos ni hipótesis sin verificar. Adelante.');
