#!/usr/bin/env node
// Verificación estricta: el email debe estar en TEXTO VISIBLE o en un mailto de la página.
// Extrae además dirección/ciudad, señales de venta online y de Pokémon.
import { readFile, writeFile } from 'node:fs/promises';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0 Safari/537.36';
const entradas = JSON.parse(await readFile(process.argv[2], 'utf8')); // [{name, dominio, email, url}]
const SALIDA = process.argv[3];

const PAGINAS = ['/', '/contacto', '/contact', '/contacte', '/pages/contacto', '/pages/contact', '/contacto/',
  '/aviso-legal', '/aviso-legal/', '/pages/aviso-legal', '/politica-de-privacidad', '/legal', '/quienes-somos'];

async function get(url, ms = 15000) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'es-ES,es;q=0.9' }, signal: ctl.signal, redirect: 'follow' });
    return { status: r.status, html: await r.text(), url: r.url };
  } catch (e) { return { status: 0, html: '', url, err: String(e.name || e) }; }
  finally { clearTimeout(t); }
}

// HTML a texto visible: fuera script/style/noscript y etiquetas
function visible(html) {
  return html.replace(/<(script|style|noscript|template)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim();
}
function mailtos(html) {
  return [...html.matchAll(/mailto:([^"'?>\s]+)/gi)].map((m) => decodeURIComponent(m[1]).toLowerCase());
}
function jsonld(html, campo) {
  const out = [];
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const j = JSON.parse(m[1].replace(/&quot;/g, '"'));
      const walk = (o) => { if (!o || typeof o !== 'object') return; for (const [k, v] of Object.entries(o)) {
        if (k === campo && typeof v === 'string') out.push(v);
        else if (typeof v === 'object') walk(v); } };
      walk(j);
    } catch {}
  }
  return out;
}

const res = []; let n = 0;
async function worker() {
  while (n < entradas.length) {
    const e = entradas[n++];
    const base = 'https://' + e.dominio;
    const hitos = [];
    let ciudad = '', direccion = '', pokemon = false, carrito = false, titulo = '';
    for (const p of PAGINAS) {
      const r = await get(base + p);
      if (r.status !== 200) continue;
      const vis = visible(r.html);
      if (!titulo) titulo = (r.html.match(/<title[^>]*>([^<]+)/i) || [, ''])[1].trim().slice(0, 90);
      if (!ciudad) ciudad = jsonld(r.html, 'addressLocality')[0] || '';
      if (!direccion) direccion = jsonld(r.html, 'streetAddress')[0] || '';
      if (/pok[eé]mon/i.test(r.html) && /\b(sobre|booster|caja|etb|display|carta|singles?)\b/i.test(vis)) pokemon = true;
      if (/addtocart|add-to-cart|añadir al carrito|carrito|cart-drawer|action\/cart/i.test(r.html)) carrito = true;
      const mt = mailtos(r.html);
      for (const em of new Set(mt)) {
        if (em.includes(e.email.toLowerCase())) hitos.push({ tipo: 'mailto', url: r.url, email: em, ctx: vis.slice(0, 0) });
      }
      const idx = vis.toLowerCase().indexOf(e.email.toLowerCase());
      if (idx >= 0) hitos.push({ tipo: 'texto-visible', url: r.url,
        ctx: vis.slice(Math.max(0, idx - 130), idx + e.email.length + 130) });
    }
    // una sola entrada por URL, prefiriendo texto visible
    const uniq = [];
    for (const h of hitos) if (!uniq.some((u) => u.url === h.url)) uniq.push(h);
    const visibleHit = uniq.find((h) => h.tipo === 'texto-visible');
    res.push({ name: e.name, dominio: e.dominio, email: e.email, titulo, ciudad, direccion, pokemon, carrito,
      clase: visibleHit ? 'visible' : uniq.length ? 'solo-mailto' : 'NO VERIFICADO',
      evidencia: visibleHit || uniq[0] || null, urls: uniq });
    process.stderr.write(`${res.length}/${entradas.length} ${e.name} -> ${res.at(-1).clase}\n`);
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
await writeFile(SALIDA, JSON.stringify(res, null, 1));
console.log('verificados visibles:', res.filter((r) => r.clase === 'visible').length, 'de', res.length);
