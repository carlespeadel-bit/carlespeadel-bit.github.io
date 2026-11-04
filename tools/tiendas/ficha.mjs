#!/usr/bin/env node
// Saca ciudad/provincia y confirma España para cada tienda ya verificada.
import { readFile, writeFile } from 'node:fs/promises';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0 Safari/537.36';
const entradas = JSON.parse(await readFile(process.argv[2], 'utf8'));
const SALIDA = process.argv[3];

const PROV = ['Álava','Albacete','Alicante','Almería','Asturias','Ávila','Badajoz','Barcelona','Burgos','Cáceres','Cádiz','Cantabria','Castellón','Ciudad Real','Córdoba','Cuenca','Girona','Granada','Guadalajara','Guipúzcoa','Huelva','Huesca','Jaén','La Coruña','La Rioja','Las Palmas','León','Lleida','Lugo','Madrid','Málaga','Murcia','Navarra','Ourense','Palencia','Pontevedra','Salamanca','Santa Cruz de Tenerife','Segovia','Sevilla','Soria','Tarragona','Teruel','Toledo','Valencia','Valladolid','Vizcaya','Zamora','Zaragoza','Baleares','Melilla','Ceuta'];
const PAGINAS = ['/', '/contacto', '/contacto/', '/contact', '/contacte', '/pages/contacto', '/pages/contact',
  '/aviso-legal', '/aviso-legal/', '/pages/aviso-legal', '/quienes-somos', '/tiendas', '/donde-estamos', '/nosotros'];

async function get(url, ms = 15000) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'es-ES,es;q=0.9' }, signal: ctl.signal, redirect: 'follow' });
    return { status: r.status, html: await r.text(), url: r.url };
  } catch { return { status: 0, html: '', url }; }
  finally { clearTimeout(t); }
}
const visible = (h) => h.replace(/<(script|style|noscript|template)[\s\S]*?<\/\1>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

const res = []; let n = 0;
async function worker() {
  while (n < entradas.length) {
    const e = entradas[n++];
    let ciudad = '', provincia = '', cp = '', es = false, tel = '', textos = [];
    for (const p of PAGINAS) {
      const r = await get('https://' + e.dominio + p);
      if (r.status !== 200) continue;
      const v = visible(r.html);
      textos.push(v);
      if (!es && /(España|Spain|ESPAÑA)|\+34\s?\d/.test(r.html)) es = true;
      if (!tel) { const m = r.html.match(/tel:(\+?\d[\d\s.-]{7,})/); if (m) tel = m[1].trim(); }
      // CP + ciudad
      if (!ciudad) {
        const m = v.match(/\b(0[1-9]\d{3}|[1-5]\d{4})\s+([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ' .-]{2,28})/);
        if (m) {
          cp = m[1];
          const cand = m[2].trim().replace(/\s+(España|Spain|Tel|Tfno|C\/|Calle).*$/i, '').trim();
          if (!/^(Calle|Avenida|C\/|Pol|Carrer)/i.test(cand)) ciudad = cand.slice(0, 26);
        }
      }
      if (!provincia) { const pv = PROV.find((x) => new RegExp('\\b' + x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(v)); if (pv) provincia = pv; }
    }
    const todo = textos.join(' ');
    res.push({ name: e.name, dominio: e.dominio, email: e.email, ciudad, cp, provincia, es, tel: tel.slice(0, 20),
      pokemon: /pok[eé]mon/i.test(todo), singles: /(carta suelta|cartas sueltas|singles)/i.test(todo) });
    process.stderr.write(`${res.length}/${entradas.length} ${e.name} ${ciudad} ${provincia} es=${es}\n`);
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
await writeFile(SALIDA, JSON.stringify(res, null, 1));
console.log('listo', res.length);
