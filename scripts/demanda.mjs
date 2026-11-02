#!/usr/bin/env node
// Mina la demanda real: sugerencias de Google en español (autocompletado).
// No da volúmenes, da algo mejor para decidir: lo que la gente escribe de verdad.
// Uso: node scripts/demanda.mjs
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SUG = 'https://suggestqueries.google.com/complete/search?client=firefox&hl=es&gl=es&q=';

const SEMILLAS = [
  'cuanto vale mi carta',
  'cuanto vale mi coleccion',
  'cartas pokemon',
  'cartas pokemon precio',
  'cartas pokemon mas caras',
  'comprar cartas pokemon',
  'vender cartas pokemon',
  'donde vender cartas pokemon',
  'sobres pokemon',
  'cajas pokemon',
  'cartas pokemon originales',
  'cartas pokemon falsas',
  'cartas one piece',
  'cartas magic',
  'cartas yugioh',
  'valorar coleccion de cartas',
  'tasacion cartas',
  'invertir en cartas',
  'cartas pokemon segunda mano',
  'mercadillo cartas',
  'wallapop cartas pokemon',
  'vinted cartas pokemon',
];

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function sugiere(q) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(SUG + encodeURIComponent(q), {
        headers: { 'user-agent': 'Mozilla/5.0' },
      });
      if (!r.ok) throw new Error(String(r.status));
      const [, lista] = await r.json();
      return lista ?? [];
    } catch {
      await dormir(300 * (i + 1));
    }
  }
  return [];
}

function intencion(q) {
  const t = q.toLowerCase();
  if (/cuanto vale|cuánto vale|valor|tasaci|precio de mi/.test(t)) return 'valorar';
  if (/vender|vendo|donde vender/.test(t)) return 'vender';
  if (/comprar|donde comprar|tienda|sobres|cajas|mercadillo|wallapop|vinted/.test(t)) return 'comprar';
  if (/mejores|mas caras|más caras|invertir|revaloriza/.test(t)) return 'ranking';
  if (/falsas|originales|autentic/.test(t)) return 'autenticidad';
  return 'otro';
}

const filas = [];
const vistos = new Set();
for (const semilla of SEMILLAS) {
  const lista = await sugiere(semilla);
  lista.forEach((q, i) => {
    const clave = q.toLowerCase().trim();
    if (vistos.has(clave)) return;
    vistos.add(clave);
    filas.push({ q, semilla, pos: i + 1, intencion: intencion(q) });
  });
  await dormir(120);
}

const porIntencion = filas.reduce((acc, f) => ((acc[f.intencion] = (acc[f.intencion] ?? 0) + 1), acc), {});

await mkdir(path.join(ROOT, 'data'), { recursive: true });
await writeFile(path.join(ROOT, 'data', 'demanda.json'), JSON.stringify({ generado: new Date().toISOString(), filas }, null, 1));

const TIENDAS = /carrefour|el corte ingles|el corte inglés|amazon|fnac|alcampo|game|toy planet|juguettos|pccomponentes|miarma/i;
const retail = filas.filter((f) => TIENDAS.test(f.q));

console.log(`${filas.length} consultas reales de ${SEMILLAS.length} semillas (autocompletado de Google ES)`);
console.log('por intención:', JSON.stringify(porIntencion));
console.log(`\nCon nombre de tienda dentro (intención de compra inmediata): ${retail.length}`);
for (const f of retail.slice(0, 12)) console.log(`  · ${f.q}`);
for (const intent of ['comprar', 'valorar', 'vender', 'ranking', 'autenticidad']) {
  console.log(`\n[${intent}]`);
  for (const f of filas.filter((x) => x.intencion === intent).slice(0, 10)) console.log(`  · ${f.q}`);
}
