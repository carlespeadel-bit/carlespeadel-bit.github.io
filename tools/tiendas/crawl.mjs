#!/usr/bin/env node
// Busca emails PUBLICADOS en la web de cada tienda. Guarda URL exacta y el texto donde aparece.
// Uso: node crawl.mjs dominios.txt salida.json
import { readFile, writeFile } from 'node:fs/promises';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0 Safari/537.36';
const domainas = (await readFile(process.argv[2], 'utf8')).split('\n').map((s) => s.trim()).filter(Boolean);
const SALIDA = process.argv[3] || 'emails.json';

const PATHS = ['/', '/contacto', '/contact', '/contacte', '/contacto/', '/pages/contacto', '/pages/contact',
  '/aviso-legal', '/aviso-legal/', '/pages/aviso-legal', '/legal', '/politica-de-privacidad', '/privacidad',
  '/quienes-somos', '/nosotros', '/sobre-nosotros', '/tiendas', '/donde-estamos', '/faq', '/preguntas-frecuentes'];

const RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const MALOS = /\.(png|jpe?g|gif|webp|svg|css|js|woff2?|ttf)$|sentry|wixpress|example\.com|domain\.com|tudominio|@2x|shopify\.com|cloudflare|@email|@correo|nombre@|usuario@/i;

async function get(url, ms = 15000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'es-ES,es;q=0.9' }, signal: ctl.signal, redirect: 'follow' });
    const html = await r.text();
    return { status: r.status, html, url: r.url };
  } catch (e) { return { status: 0, html: '', url, err: String(e.name || e) }; }
  finally { clearTimeout(t); }
}

// texto plano alrededor del email, para probar que está publicado de verdad
function contexto(html, email) {
  const i = html.toLowerCase().indexOf(email.toLowerCase());
  if (i < 0) return '';
  const trozo = html.slice(Math.max(0, i - 260), i + email.length + 120);
  return trozo.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 240);
}

const res = [];
let n = 0;
async function worker() {
  while (n < domainas.length) {
    const dom = domainas[n++];
    const base = dom.startsWith('http') ? dom : 'https://' + dom;
    const hallados = [];
    const vistos = new Set();
    let estado = 0;
    for (const p of PATHS) {
      const u = base.replace(/\/$/, '') + p;
      const r = await get(u);
      if (!estado && r.status) estado = r.status;
      if (r.status !== 200) continue;
      vistos.add(r.url);
      const html = r.html;
      const set = new Set([...(html.match(RE) || [])]);
      for (const m of html.matchAll(/mailto:([^"'?>\s]+)/gi)) set.add(decodeURIComponent(m[1]));
      for (const e of set) {
        const em = e.replace(/^mailto:/i, '').trim().toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(em) || MALOS.test(em)) continue;
        const host = em.split('@')[1];
        if (host.endsWith('sentry.io') || host.endsWith('wixpress.com')) continue;
        if (hallados.some((h) => h.email === em && h.url === r.url)) continue;
        hallados.push({ email: em, url: r.url, ctx: contexto(html, em) });
      }
    }
    res.push({ dominio: dom, estado, paginas: [...vistos], emails: hallados });
    process.stderr.write(`${res.length}/${domainas.length} ${dom} [${estado}] ${hallados.map((h) => h.email).join(' ')}\n`);
  }
}
await Promise.all(Array.from({ length: 7 }, worker));
await writeFile(SALIDA, JSON.stringify(res, null, 1));
const ok = res.filter((r) => r.emails.length).length;
console.log(`dominios ${res.length} · con email ${ok}`);
