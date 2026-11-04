#!/usr/bin/env node
// Extrae la línea de dirección postal (CIF/CP) de las páginas de contacto y aviso legal.
import { readFile, writeFile } from 'node:fs/promises';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0 Safari/537.36';
const entradas = JSON.parse(await readFile(process.argv[2], 'utf8'));
const PAGS = ['/aviso-legal/', '/aviso-legal', '/contacto/', '/contacto', '/pages/aviso-legal', '/pages/contacto', '/contact', '/pages/contact'];
async function get(u) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), 14000);
  try { const r = await fetch(u, { headers: { 'user-agent': UA, 'accept-language': 'es-ES,es;q=0.9' }, signal: c.signal, redirect: 'follow' });
    return { s: r.status, h: await r.text() }; } catch { return { s: 0, h: '' }; } finally { clearTimeout(t); }
}
const vis = (h) => h.replace(/<(script|style|noscript|template)[\s\S]*?<\/\1>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const res = []; let n = 0;
async function w() {
  while (n < entradas.length) {
    const e = entradas[n++];
    let dir = '', url = '', cif = '';
    for (const p of PAGS) {
      const r = await get('https://' + e.dominio + p);
      if (r.s !== 200) continue;
      const v = vis(r.h);
      const mCif = v.match(/(?:C\.?I\.?F\.?|N\.?I\.?F\.?)[:.\s]*([A-Z]\s?-?\s?\d{7,8}\s?[A-Z]?)/i);
      if (mCif && !cif) cif = mCif[1];
      // frase con código postal de 5 dígitos
      for (const m of v.matchAll(/.{0,110}\b(0[1-9]\d{3}|[1-5]\d{4})\b.{0,70}/g)) {
        const s = m[0].replace(/\s+/g, ' ').trim();
        if (/España|Spain/i.test(s) || /Calle|C\/|Carrer|Av|Paseo|Pol/i.test(s)) { if (!dir || !url) { dir = s; url = 'https://' + e.dominio + p; } break; }
      }
      if (dir && url) break;
    }
    res.push({ ...e, dir: dir.slice(0, 190), url, cif });
    process.stderr.write(`${n}/${entradas.length} ${e.name} :: ${dir.slice(0, 70)}\n`);
  }
}
await Promise.all(Array.from({ length: 6 }, w));
await writeFile(process.argv[3], JSON.stringify(res, null, 1));
console.log('ok', res.length);
