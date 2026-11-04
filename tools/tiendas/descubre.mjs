#!/usr/bin/env node
// Deriva el dominio de cada tienda del índice StockTCG a partir de sus enlaces de producto.
import { readFile, writeFile } from 'node:fs/promises';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0 Safari/537.36';
const items = JSON.parse(await readFile(new URL('./stocktcg-stores.json', import.meta.url), 'utf8'));

const SKIP = /stocktcg|t\.me|tiktok|instagram|facebook|twitter|x\.com|youtube|whatsapp|cardmarket|amazon|google|trustpilot|reddit|discord|shopify|cloudflare|gstatic|googleapis/i;

async function get(url, ms = 20000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'es-ES,es;q=0.9' }, signal: ctl.signal, redirect: 'follow' });
    return { status: r.status, html: await r.text(), url: r.url };
  } catch (e) { return { status: 0, html: '', err: String(e.name || e) }; }
  finally { clearTimeout(t); }
}

const out = [];
let i = 0;
async function worker() {
  while (i < items.length) {
    const it = items[i++];
    // la ficha de tienda lista sus productos con enlaces salientes a la tienda real
    const r = await get(it.url);
    const hosts = {};
    for (const u of r.html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
      try {
        const h = new URL(u[1]).hostname.replace(/^www\./, '');
        if (SKIP.test(h)) continue;
        hosts[h] = (hosts[h] || 0) + 1;
      } catch {}
    }
    const top = Object.entries(hosts).sort((a, b) => b[1] - a[1]).slice(0, 2);
    out.push({ name: it.name, slug: it.url.split('/').pop(), stocktcg: it.url, status: r.status, hosts: top });
    process.stderr.write(`${out.length}/${items.length} ${it.name} -> ${top.map((x) => x[0]).join(', ')}\n`);
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
await writeFile(new URL('./dominios.json', import.meta.url), JSON.stringify(out, null, 1));
console.log('listo', out.length);
