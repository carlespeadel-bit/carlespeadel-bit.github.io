#!/usr/bin/env node
// Catalogo Yu-Gi-Oh con precios (YGOPRODeck, gratis, sin clave).
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
const ROOT = path.resolve(import.meta.dirname, '..');

const r = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes');
if (!r.ok) throw new Error('HTTP ' + r.status);
const { data } = await r.json();
console.log('cartas recibidas:', data.length);

const num = (v) => { const n = parseFloat(v); return isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null; };
const cards = data.map((c) => {
  const p = c.card_prices?.[0] ?? {};
  return {
    id: String(c.id),
    name: c.name,
    type: c.type,
    frameType: c.frameType,
    desc: (c.desc ?? '').slice(0, 400),
    race: c.race ?? null,
    attribute: c.attribute ?? null,
    level: c.level ?? null,
    atk: c.atk ?? null,
    def: c.def ?? null,
    archetype: c.archetype ?? null,
    image: c.card_images?.[0]?.image_url ?? null,
    imageSmall: c.card_images?.[0]?.image_url_small ?? null,
    sets: (c.card_sets ?? []).length,
    price: num(p.cardmarket_price) ?? num(p.tcgplayer_price),
    priceCm: num(p.cardmarket_price),
    priceTcg: num(p.tcgplayer_price),
    priceEbay: num(p.ebay_price),
  };
}).filter((c) => c.name);

cards.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
await mkdir(path.join(ROOT, 'data'), { recursive: true });
await writeFile(path.join(ROOT, 'data', 'cards.json'), JSON.stringify(cards));
const con = cards.filter((c) => c.price).length;
console.log(`guardadas ${cards.length} · con precio ${con} · top: ${cards[0]?.name} ${cards[0]?.price}`);
