#!/usr/bin/env node
// Catalogo Magic con precios EUR (Scryfall, gratis).
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
const ROOT = path.resolve(import.meta.dirname, '..');

let url = 'https://api.scryfall.com/cards/search?q=game%3Apaper+-is%3Adigital&unique=cards&order=name';
const out = [];
for (let page = 0; page < 200 && url; page++) {
  const r = await fetch(url, { headers: { 'user-agent': 'ValorCarta/1.0', accept: 'application/json' } });
  if (!r.ok) { console.error('HTTP', r.status, url); break; }
  const j = await r.json();
  for (const c of j.data ?? []) {
    const eur = parseFloat(c.prices?.eur);
    out.push({
      id: c.id,
      name: c.name,
      type: c.type_line ?? '',
      text: (c.oracle_text ?? '').slice(0, 300),
      set: c.set_name ?? '',
      rarity: c.rarity ?? '',
      image: c.image_uris?.normal ?? c.card_faces?.[0]?.image_uris?.normal ?? null,
      small: c.image_uris?.small ?? c.card_faces?.[0]?.image_uris?.small ?? null,
      price: isFinite(eur) && eur > 0 ? Math.round(eur * 100) / 100 : null,
      usd: parseFloat(c.prices?.usd) || null,
    });
  }
  process.stdout.write(`  ${out.length}\r`);
  url = j.has_more ? j.next_page : null;
  await new Promise((res) => setTimeout(res, 90));
}
const con = out.filter((c) => c.price);
con.sort((a, b) => b.price - a.price);
await mkdir(path.join(ROOT, 'data'), { recursive: true });
await writeFile(path.join(ROOT, 'data', 'cards.json'), JSON.stringify(con));
console.log(`\nOK ${con.length} cartas con precio · top: ${con[0]?.name} ${con[0]?.price}`);
