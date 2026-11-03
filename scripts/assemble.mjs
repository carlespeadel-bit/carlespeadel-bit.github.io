#!/usr/bin/env node
// Junta data/cache/*.json en data/cards.json (y lo ordena por precio).
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const CACHE = path.join(ROOT, 'data', 'cache');

const files = (await readdir(CACHE)).filter((f) => f.endsWith('.json'));
const cards = [];
for (const f of files) {
  try {
    cards.push(JSON.parse(await readFile(path.join(CACHE, f), 'utf8')));
  } catch {
    /* fichero a medias */
  }
}
cards.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
await writeFile(path.join(ROOT, 'data', 'cards.json'), JSON.stringify(cards));
console.log(`ensambladas ${cards.length} cartas (${cards.filter((c) => c.price > 0).length} con precio)`);
