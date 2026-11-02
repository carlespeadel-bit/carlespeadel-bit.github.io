#!/usr/bin/env node
// Guarda la foto diaria de precios y calcula los movimientos.
// Uso: node scripts/snapshot.mjs [--min=3] [--top=12]
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const HIST = path.join(ROOT, 'data', 'history');
const OUT = path.join(ROOT, 'out');
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v = 'true'] = a.replace(/^--/, '').split('=');
    return [k, v];
  }),
);
const MIN = Number(args.min ?? 3);
const TOP = Number(args.top ?? 12);

const cards = JSON.parse(await readFile(path.join(ROOT, 'data', 'cards.json'), 'utf8'));
const hoy = new Date().toISOString().slice(0, 10);
const eur = (n) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

const foto = {};
for (const c of cards) if (c.price > 0) foto[c.id] = c.price;

await mkdir(HIST, { recursive: true });
await mkdir(OUT, { recursive: true });
await writeFile(path.join(HIST, `${hoy}.json`), JSON.stringify(foto));

const previos = (await readdir(HIST))
  .filter((f) => f.endsWith('.json') && f !== `${hoy}.json`)
  .sort();
const ayer = previos.at(-1)?.replace('.json', '') ?? null;

if (!ayer) {
  console.log(`primera foto (${Object.keys(foto).length} cartas). Sin histórico previo todavía.`);
  await writeFile(path.join(OUT, 'digest.txt'), 'Primer día de medición. Mañana empiezan los avisos.');
  await writeFile(
    path.join(ROOT, 'data', 'changes.json'),
    JSON.stringify({ fecha: hoy, contra: null, suben: [], bajan: [] }, null, 1),
  );
  process.exit(0);
}

const prev = JSON.parse(await readFile(path.join(HIST, `${ayer}.json`), 'utf8'));
const mov = [];
for (const [id, p] of Object.entries(foto)) {
  const antes = prev[id];
  if (!antes || antes <= 0 || p <= 0) continue;
  if (antes < MIN && p < MIN) continue; // ruido de cartas de céntimos
  const d = p - antes;
  const pct = (d / antes) * 100;
  if (Math.abs(pct) < 3) continue; // menos de 3% es ruido diario
  mov.push({ id, de: antes, a: p, d, pct });
}

const nombre = new Map(cards.map((c) => [c.id, `${c.name} (${c.setName})`]));
const slug = (c) => `/carta/${c.id}-`;
const suben = mov.filter((m) => m.d > 0).sort((a, b) => b.pct - a.pct).slice(0, TOP);
const bajan = mov.filter((m) => m.d < 0).sort((a, b) => a.pct - b.pct).slice(0, TOP);

await writeFile(
  path.join(ROOT, 'data', 'changes.json'),
  JSON.stringify({ fecha: hoy, contra: ayer, suben, bajan }, null, 1),
);

const linea = (m, flecha) =>
  `${flecha} ${nombre.get(m.id)}: ${eur(m.de)} → ${eur(m.a)} (${m.pct >= 0 ? '+' : ''}${m.pct.toFixed(1)}%)`;

const texto = [
  `Precios ${hoy} frente a ${ayer} — ${mov.length} cartas se han movido más de un 3%`,
  '',
  bajan.length ? `BAJADAS (oportunidad de compra)\n${bajan.map((m) => linea(m, '↓')).join('\n')}` : '',
  '',
  suben.length ? `SUBIDAS (si las tienes, buena noticia)\n${suben.map((m) => linea(m, '↑')).join('\n')}` : '',
  '',
  `Todas las cartas, con su histórico: https://valorcarta.es`,
].join('\n');

await writeFile(path.join(OUT, 'digest.txt'), texto);
await writeFile(
  path.join(OUT, 'digest.html'),
  `<h2>Movimientos de precio — ${hoy}</h2>
<p>Comparado con ${ayer}: ${mov.length} cartas se han movido más de un 3%.</p>
${bajan.length ? `<h3>Bajadas</h3><ul>${bajan.map((m) => `<li>${nombre.get(m.id)}: <b>${eur(m.a)}</b> (${m.pct.toFixed(1)}%)</li>`).join('')}</ul>` : ''}
${suben.length ? `<h3>Subidas</h3><ul>${suben.map((m) => `<li>${nombre.get(m.id)}: <b>${eur(m.a)}</b> (+${m.pct.toFixed(1)}%)</li>`).join('')}</ul>` : ''}
<p><a href="https://valorcarta.es/valorar/">Ver el valor de mi colección</a></p>`,
);

console.log(`foto ${hoy}: ${Object.keys(foto).length} cartas · ${mov.length} movimientos > 3% · contra ${ayer}`);
console.log(`  ${bajan.length} bajadas, ${suben.length} subidas -> out/digest.txt`);
