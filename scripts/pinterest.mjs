#!/usr/bin/env node
// Genera un CSV de pines para Pinterest (cuenta de empresa -> crear pines en lote).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SITE = 'https://carlespeadel-bit.github.io';
const cards = JSON.parse(await readFile(path.join(ROOT, 'data', 'cards.json'), 'utf8'));
const eur = (n) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

const elegidas = cards
  .filter((c) => c.price >= 15 && c.image)
  .sort((a, b) => b.price - a.price)
  .slice(0, 60);

const slug = (c) => `${c.id}-${c.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

const filas = elegidas.map((c) => {
  const titulo = `${c.name} — ${c.setName}: ${eur(c.price)}`;
  const desc = `${c.name} de ${c.setName}. Precio de mercado hoy: ${eur(c.price)}. Mira el precio actualizado y cuánto vale tu colección.`;
  return [titulo.slice(0, 100), desc.slice(0, 500), `${SITE}/carta/${slug(c)}/`, `${c.image}/high.webp`, 'Cartas Pokémon', 'cartas pokemon, coleccionismo, pokemon tcg'];
});

const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
const csv = ['Title,Description,Link,Image URL,Board,Keywords', ...filas.map((f) => f.map(esc).join(','))].join('\n');

await mkdir(path.join(ROOT, 'out'), { recursive: true });
await writeFile(path.join(ROOT, 'out', 'pinterest.csv'), csv);
console.log(`${filas.length} pines -> out/pinterest.csv`);
