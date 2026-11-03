#!/usr/bin/env node
// Catalogo Magic con precios EUR desde el volcado oficial de Scryfall (JSONL).
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createGunzip } from 'node:zlib';
import { Readable } from 'node:stream';
const ROOT = path.resolve(import.meta.dirname, '..');

const meta = await (await fetch('https://api.scryfall.com/bulk-data', { headers: { 'user-agent': 'ValorCarta/1.0' } })).json();
const bulk = meta.data.find((d) => d.type === 'oracle_cards');
const url = bulk.jsonl_download_uri;
console.log('descargando', url, (bulk.compressed_size / 1e6).toFixed(0) + ' MB');

const out = [];
const r = await fetch(url, { headers: { 'user-agent': 'ValorCarta/1.0' } });
if (!r.ok) throw new Error('HTTP ' + r.status);

const dec = new TextDecoder();
let buffer = '';
const stream = Readable.fromWeb(r.body).pipe(createGunzip());
for await (const chunk of stream) {
  buffer += dec.decode(chunk, { stream: true });
  let i;
  while ((i = buffer.indexOf('\n')) >= 0) {
    const linea = buffer.slice(0, i).trim();
    buffer = buffer.slice(i + 1);
    if (!linea) continue;
    let c;
    try { c = JSON.parse(linea); } catch { continue; }
    const eur = parseFloat(c.prices?.eur);
    if (!isFinite(eur) || eur <= 0) continue;
    out.push({
      id: c.id, name: c.name, type: c.type_line ?? '', set: c.set_name ?? '', rarity: c.rarity ?? '',
      image: c.image_uris?.normal ?? c.card_faces?.[0]?.image_uris?.normal ?? null,
      small: c.image_uris?.small ?? c.card_faces?.[0]?.image_uris?.small ?? null,
      price: Math.round(eur * 100) / 100,
      usd: parseFloat(c.prices?.usd) || null,
    });
  }
  process.stdout.write(`  ${out.length}\r`);
}

out.sort((a, b) => b.price - a.price);
await mkdir(path.join(ROOT, 'data'), { recursive: true });
await writeFile(path.join(ROOT, 'data', 'cards.json'), JSON.stringify(out));
console.log(`\nOK ${out.length} cartas con precio · top: ${out[0]?.name} ${out[0]?.price}`);
