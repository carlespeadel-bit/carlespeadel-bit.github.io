#!/usr/bin/env node
// Avisa a Bing/Yandex (IndexNow) de que las URLs existen. Sin cuenta ni login.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const HOST = (process.env.SITE_HOST || 'carlespeadel-bit.github.io').replace(/^https?:\/\//, '').replace(/\/$/, '');
const KEY = (await readFile(path.join(ROOT, 'data', 'indexnow-key.txt'), 'utf8')).trim();

// se lee el sitemap YA publicado: así las URLs coinciden con el host real
let sm = '';
try {
  const r = await fetch(`https://${HOST}/sitemap.xml`);
  if (r.ok) sm = await r.text();
} catch {}
if (!sm) {
  try {
    sm = await readFile(path.join(ROOT, 'dist', 'sitemap.xml'), 'utf8');
  } catch {
    console.error('no hay sitemap disponible');
    process.exit(1);
  }
}
const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => m[1])
  .filter((u) => u.includes(HOST));
if (!urls.length) process.exit(0);

// el endpoint público rechaza lotes grandes: se manda en tandas de 1.000
const TANDA = 1000;
let ok = 0;
for (let i = 0; i < urls.length; i += TANDA) {
  const lote = urls.slice(i, i + TANDA);
  const r = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList: lote,
    }),
  });
  if (r.status === 200 || r.status === 202) ok += lote.length;
  console.log(`  tanda ${i / TANDA + 1}: ${r.status} (${lote.length} URLs)`);
  await new Promise((res) => setTimeout(res, 400));
}
console.log(`IndexNow: ${ok}/${urls.length} URLs aceptadas · clave en https://${HOST}/${KEY}.txt`);
