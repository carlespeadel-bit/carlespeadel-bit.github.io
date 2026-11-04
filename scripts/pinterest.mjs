#!/usr/bin/env node
// Genera un CSV de pines para Pinterest (cuenta de empresa -> crear pines en lote).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
import config from '../config.json' with { type: 'json' };
const SITE = config.site.replace(/\/$/, '');
const cards = JSON.parse(await readFile(path.join(ROOT, 'data', 'cards.json'), 'utf8'));
const eur = (n) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

// fuera las cartas con variantes a precios incomparables (458 € vs 3.843 €): la pieza mentiría
const limpia = (c) => {
  const v = (c.variants || []).map((x) => x.trend || x.avg).filter(Boolean);
  return !(v.length > 1 && Math.max(...v) > Math.min(...v) * 3);
};

// imagen que exista de verdad: /high.png → /high.webp → la base tal cual
const ok = async (u) => {
  try { const r = await fetch(u, { method: "HEAD" }); return r.ok; } catch { return false; }
};
const imagen = async (c) => {
  for (const suf of ["/high.png", "/high.webp"]) if (await ok(c.image + suf)) return c.image + suf;
  return null;
};

const candidatas = cards
  .filter((c) => c.price >= 15 && c.image && limpia(c))
  .sort((a, b) => b.price - a.price)
  .slice(0, 460);

const elegidas = [];
for (const c of candidatas) {
  if (elegidas.length >= 400) break;
  const img = await imagen(c);
  if (img) elegidas.push({ ...c, img });
}

const slug = (c) => `${c.id}-${c.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

const filas = elegidas.map((c) => {
  const titulo = `¿Cuánto vale ${c.name}? ${eur(c.price)} · ${c.setName}`;
  const desc = `${c.name} de ${c.setName}: precio de referencia de Cardmarket hoy, ${eur(c.price)}. ` +
    `Ficha con histórico, variantes y enlace de compra, actualizada a diario. Enlace de afiliado de Amazon.`;
  return [titulo.slice(0, 100), desc.slice(0, 500), `${SITE}/carta/${slug(c)}/`, c.img, 'Cartas Pokémon', 'pokemon, precio carta, cuánto vale, cardmarket, ' + String(c.setName).toLowerCase()];
});

const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
const csv = ['Title,Description,Link,Image URL,Board,Keywords', ...filas.map((f) => f.map(esc).join(','))].join('\n');

await mkdir(path.join(ROOT, 'out'), { recursive: true });
await writeFile(path.join(ROOT, 'out', 'pinterest.csv'), csv);
console.log(`${filas.length} pines -> out/pinterest.csv`);
