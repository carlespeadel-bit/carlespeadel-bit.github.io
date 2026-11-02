#!/usr/bin/env node
// Avisa a Bing/Yandex (IndexNow) de que las URLs existen. Sin cuenta ni login.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const HOST = (process.env.SITE_HOST || 'carlespeadel-bit.github.io').replace(/^https?:\/\//, '').replace(/\/$/, '');
const KEY = (await readFile(path.join(ROOT, 'data', 'indexnow-key.txt'), 'utf8')).trim();

let urls = [];
try {
  const sm = await readFile(path.join(ROOT, 'dist', 'sitemap.xml'), 'utf8');
  urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
} catch {
  console.error('no hay dist/sitemap.xml: ejecuta antes scripts/build.mjs');
  process.exit(1);
}
if (!urls.length) process.exit(0);

const lote = urls.slice(0, 10000);
const cuerpo = { host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: lote };

const r = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify(cuerpo),
});
console.log(`IndexNow ${r.status} ${r.statusText} · ${lote.length} URLs a ${HOST}`);
console.log(`clave en https://${HOST}/${KEY}.txt`);
