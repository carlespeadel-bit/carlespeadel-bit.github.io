#!/usr/bin/env node
// Verificación final: el email debe aparecer literalmente en la URL indicada.
import { readFile, writeFile } from 'node:fs/promises';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0 Safari/537.36';
const ents = JSON.parse(await readFile(process.argv[2], 'utf8'));
const vis = (h) => h.replace(/<(script|style|noscript|template)[\s\S]*?<\/\1>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
async function g(u) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), 16000);
  try { const r = await fetch(u, { headers: { 'user-agent': UA, 'accept-language': 'es-ES,es;q=0.9' }, signal: c.signal, redirect: 'follow' });
    return { s: r.status, h: await r.text(), url: r.url }; } catch { return { s: 0, h: '', url: u }; } finally { clearTimeout(t); }
}
const out = [];
for (const e of ents) {
  const r = await g(e.url);
  const em = e.email.toLowerCase();
  const enHtml = r.h.toLowerCase().includes(em);
  const enMailto = new RegExp('mailto:[^"\'?>\\s]*' + em.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(r.h);
  const v = vis(r.h);
  const i = v.toLowerCase().indexOf(em);
  const ctx = i >= 0 ? v.slice(Math.max(0, i - 90), i + em.length + 60) : '';
  // señales de catálogo
  const hp = await g('https://' + e.dominio + '/');
  const hv = vis(hp.h).toLowerCase();
  const suelta = /carta suelta|cartas sueltas|singles?\b|unidad(es)? suelta/.test(hv);
  const poke = /pok[eé]mon/.test(hv);
  out.push({ ...e, status: r.s, enHtml, enMailto, visible: i >= 0, ctx, suelta, poke });
  console.log(`${e.name.padEnd(22)} ${r.s} html=${enHtml ? 1 : 0} mailto=${enMailto ? 1 : 0} vis=${i >= 0 ? 1 : 0} suelta=${suelta ? 1 : 0} pk=${poke ? 1 : 0}`);
}
await writeFile(process.argv[3], JSON.stringify(out, null, 1));
console.log('OK', out.length, '| verificados en html:', out.filter((o) => o.enHtml).length);
