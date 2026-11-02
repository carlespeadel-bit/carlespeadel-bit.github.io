#!/usr/bin/env node
// Rellena con cartas en inglés los sets sin localización española (Base Set, Jungle, EX...).
// Así entran las cartas vintage, que son las más buscadas.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const CACHE = path.join(ROOT, 'data', 'cache');
const sets = JSON.parse(await readFile(path.join(ROOT, 'data', 'sets.json'), 'utf8'));
const yaHay = new Set((await readdir(CACHE)).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)));
const vacios = sets.filter((s) => ![...yaHay].some((id) => id.startsWith(s.id + '-')));

console.log(`sets sin cartas: ${vacios.length}`);
const num = (v) => (typeof v === 'number' && isFinite(v) ? Math.round(v * 100) / 100 : null);

async function get(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url);
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(r.status);
      return await r.json();
    } catch {
      await new Promise((r) => setTimeout(r, 400 * (i + 1) ** 2));
    }
  }
  return null;
}

function normalizar(full, setMeta) {
  const variants = [];
  for (const v of full.variants_detailed ?? []) {
    const cm = v?.pricing?.cardmarket;
    if (!cm) continue;
    variants.push({
      type: v.type ?? null, subtype: v.size ?? null, productId: cm.idProduct ?? null,
      avg: num(cm.avg), low: num(cm.low), trend: num(cm.trend),
      avg1: num(cm.avg1), avg7: num(cm.avg7), avg30: num(cm.avg30),
      holoAvg: num(cm['avg-holo']), holoTrend: num(cm['trend-holo']), holoLow: num(cm['low-holo']),
      updated: cm.updated ?? null,
    });
  }
  const price = variants.map((v) => v.trend ?? v.avg ?? 0).reduce((a, b) => (b > a ? b : a), 0) || null;
  return {
    id: full.id, localId: full.localId ?? null, name: full.name,
    setId: setMeta.id, setName: setMeta.name, serie: setMeta.serie?.name ?? null,
    releaseDate: setMeta.releaseDate ?? null, rarity: full.rarity ?? null,
    category: full.category ?? null, illustrator: full.illustrator ?? null,
    image: full.image ?? null, hp: full.hp ?? null, types: full.types ?? null,
    stage: full.stage ?? null, evolveFrom: full.evolveFrom ?? null, dexId: full.dexId ?? null,
    regulationMark: full.regulationMark ?? null, legal: full.legal ?? null, retreat: full.retreat ?? null,
    weaknesses: full.weaknesses ?? null,
    abilities: (full.abilities ?? []).map((a) => a?.name).filter(Boolean),
    attacks: (full.attacks ?? []).map((a) => ({ name: a?.name ?? null, cost: a?.cost ?? [], damage: a?.damage ?? null })),
    variants, price, updated: variants.map((v) => v.updated).filter(Boolean).sort().at(-1) ?? null,
    idioma: 'en',
  };
}

let total = 0;
for (const set of vacios) {
  const lista = await get(`https://api.tcgdex.net/v2/en/sets/${set.id}?withCards=true`);
  const cards = lista?.cards ?? [];
  if (!cards.length) { console.log(`  ${set.id}: sin cartas en EN`); continue; }
  const lote = [];
  for (let i = 0; i < cards.length; i += 16) {
    const parte = await Promise.all(
      cards.slice(i, i + 16).map((c) => get(`https://api.tcgdex.net/v2/en/cards/${c.id}`)),
    );
    for (const full of parte) if (full) lote.push(normalizar(full, set));
  }
  for (const c of lote) await writeFile(path.join(CACHE, `${c.id}.json`), JSON.stringify(c));
  total += lote.length;
  console.log(`  ${set.id} ${set.name}: ${lote.length} cartas`);
}
console.log(`total añadidas: ${total}`);
