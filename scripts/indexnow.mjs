#!/usr/bin/env node
// Envia TODAS las URLs (Pokemon + Yu-Gi-Oh + Magic) a Bing/Yandex via IndexNow.
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const HOST = (process.env.SITE_HOST || 'carlespeadel-bit.github.io').replace(/^https?:\/\//, '').replace(/\/$/, '');
const KEY = (await readFile(path.join(ROOT, 'data', 'indexnow-key.txt'), 'utf8')).trim();

// 1) indice de sitemaps de la web principal -> sus bloques
const locs = async (url) => {
  const r = await fetch(url);
  if (!r.ok) return [];
  const t = await r.text();
  return [...t.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
};

const principal = `https://${HOST}/sitemap.xml`;
const hijos = (await locs(principal)).filter((u) => u.includes('/sitemap-'));
const urls = [];
for (const u of hijos) urls.push(...(await locs(u)));
urls.push(...(await locs(`https://${HOST}/ygo/sitemap.xml`)));
urls.push(...(await locs(`https://${HOST}/magic/sitemap.xml`)));

const unicas = [...new Set(urls)].filter((u) => u.includes(HOST));
if (!unicas.length) { console.error('sin URLs'); process.exit(1); }

const TANDA = 1000;
let ok = 0;
for (let i = 0; i < unicas.length; i += TANDA) {
  const lote = unicas.slice(i, i + TANDA);
  for (let intento = 0; intento < 3; intento++) {
    const r = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: lote }),
    });
    if (r.status === 200 || r.status === 202) { ok += lote.length; break; }
    await new Promise((res) => setTimeout(res, 1200 * (intento + 1)));
  }
  process.stdout.write(`  ${Math.min(i + TANDA, unicas.length)}/${unicas.length}\r`);
  await new Promise((res) => setTimeout(res, 350));
}
console.log(`\nIndexNow: ${ok}/${unicas.length} URLs aceptadas a ${HOST}`);
