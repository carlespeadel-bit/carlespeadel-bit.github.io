#!/usr/bin/env node
// Web de precios de Yu-Gi-Oh. Se publica dentro del repo de ValorCarta, bajo /ygo/.
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.resolve(ROOT, '..', 'dist', 'ygo');
const B = '/ygo';
const SITE = 'https://carlespeadel-bit.github.io/ygo';
const TAG = 'valorcarta-21';
const BRAND = 'CartaYGO';

const cards = JSON.parse(await readFile(path.join(ROOT, 'data', 'cards.json'), 'utf8'));
const conPrecio = cards.filter((c) => c.price > 0);
const eur = (n) => (n == null ? '—' : new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n));
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = (c) => `${c.id}-${c.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)}`;
const put = async (p, data) => { const f = path.join(DIST, p); await mkdir(path.dirname(f), { recursive: true }); await writeFile(f, data); };

const layout = ({ title, description, url, body, image }) => `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE}${url}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}">
${image ? `<meta property="og:image" content="${esc(image)}">` : ''}
<link rel="stylesheet" href="${B}/assets/style.css"></head><body>
<header class="top"><a class="brand" href="${B}/"><span class="dot"></span>${BRAND}</a>
<nav><a href="${B}/caras/">Las más caras</a><a href="${B}/">Buscar</a></nav></header>
<main>${body}</main>
<footer><p class="disclosure">En calidad de Afiliado de Amazon, obtengo ingresos por las compras adscritas que cumplen los requisitos aplicables.</p>
<p class="muted">Precios de referencia de Cardmarket y TCGplayer. No es una tasación.</p></footer>${'<script data-goatcounter="https://valorcarta.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>'}</body></html>`;

await rm(DIST, { recursive: true, force: true });
await mkdir(path.join(DIST, 'assets'), { recursive: true });
await writeFile(path.join(DIST, 'assets', 'style.css'), await readFile(path.resolve(ROOT, '..', 'site', 'style.css')));
await writeFile(path.join(DIST, '.nojekyll'), '');
await writeFile(path.join(DIST, 'assets', 'app.js'), await readFile(path.join(ROOT, 'site', 'app.js')));

const tile = (c) => `<a class="tile" href="${B}/carta/${slug(c)}/">
${c.imageSmall ? `<img src="${esc(c.imageSmall)}" alt="${esc(c.name)}" loading="lazy">` : '<div class="tile-ph"></div>'}
<span class="tile-name">${esc(c.name)}</span><span class="tile-price">${eur(c.price)}</span>
<span class="tile-set muted">${esc(c.type ?? '')}</span></a>`;

await put('index.html', layout({
  title: `Precios de cartas Yu-Gi-Oh — ${conPrecio.length.toLocaleString('es-ES')} cartas`,
  description: 'Precio de mercado de más de 14.000 cartas Yu-Gi-Oh, actualizado. Busca tu carta y mira cuánto vale hoy.',
  url: '/',
  body: `<section class="hero"><h1>¿Cuánto vale tu carta de Yu-Gi-Oh?</h1>
<p class="lede">${conPrecio.length.toLocaleString('es-ES')} cartas con precio de Cardmarket y TCGplayer. Sin registro.</p>
<div class="buscador"><input id="q" type="search" placeholder="Busca: Blue-Eyes, Dark Magician…" autocomplete="off"><div id="resultados" class="resultados"></div></div>
<div class="acciones"><a class="btn" href="${B}/caras/">Las 100 más caras</a></div></section>
<script src="${B}/assets/app.js" defer></script>
<section class="bloque"><h2>Las más caras ahora</h2><div class="grid">${cards.slice(0, 12).map(tile).join('')}</div></section>
`,
}));

const idx = cards.slice(0, 12000).map((c) => [slug(c), c.name, c.type ?? '', c.price, c.imageSmall]);
await put('data/cartas.json', JSON.stringify(idx));

await mkdir(path.join(DIST, 'carta'), { recursive: true });
let n = 0;
const lista = conPrecio.slice(0, 6000);
for (let i = 0; i < lista.length; i += 200) {
  await Promise.all(lista.slice(i, i + 200).map(async (c) => {
    const body = `<nav class="migas"><a href="${B}/">Inicio</a> / ${esc(c.name)}</nav>
<div class="carta-layout"><div class="carta-img">${c.image ? `<img src="${esc(c.image)}" alt="${esc(c.name)}" width="480" height="700">` : ''}</div>
<div class="carta-info"><h1>¿Cuánto vale ${esc(c.name)}?</h1>
<p class="precio-grande">${eur(c.price)}</p>
<p class="muted">${esc(c.type ?? '')}${c.attribute ? ` · ${esc(c.attribute)}` : ''}${c.race ? ` · ${esc(c.race)}` : ''}${c.level ? ` · Nivel ${c.level}` : ''}</p>
${c.atk != null ? `<p class="muted">ATK ${c.atk} · DEF ${c.def ?? '?'}</p>` : ''}
<p>${esc(c.desc ?? '')}</p>
<p class="nota">Precio de referencia (Cardmarket ${eur(c.priceCm)} / TCGplayer ${eur(c.priceTcg)}). No es una tasación: el estado manda.</p>
<a class="btn" href="https://www.amazon.es/s?k=${encodeURIComponent('cartas yugioh ' + (c.archetype ?? ''))}&tag=${TAG}" rel="sponsored nofollow noopener" target="_blank">Cartas de Yu-Gi-Oh en Amazon</a>
</div></div>`;
    await put(`carta/${slug(c)}/index.html`, layout({ title: `${c.name} — precio Yu-Gi-Oh`, description: `¿Cuánto vale ${c.name}? Precio de mercado: ${eur(c.price)}.`, url: `/carta/${slug(c)}/`, body, image: c.image }));
    n++;
  }));
  process.stdout.write(`  ${Math.min(i + 200, lista.length)}/${lista.length}\r`);
}

await put('caras/index.html', layout({
  title: 'Las 100 cartas Yu-Gi-Oh más caras', description: 'Ranking por precio de mercado.', url: '/caras/',
  body: `<h1>Las 100 cartas Yu-Gi-Oh más caras</h1><table class="listado"><thead><tr><th>#</th><th>Carta</th><th class="num">Precio</th></tr></thead><tbody>
${cards.slice(0, 100).map((c, i) => `<tr><td class="num muted">${i + 1}</td><td><a href="${B}/carta/${slug(c)}/">${esc(c.name)}</a></td><td class="num">${eur(c.price)}</td></tr>`).join('')}
</tbody></table>`,
}));

const urls = [`${SITE}/`, `${SITE}/caras/`, ...lista.map((c) => `${SITE}/carta/${slug(c)}/`)];
await put('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${u}</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url>`).join('\n')}\n</urlset>`);

console.log(`\nOK ${n} fichas · ${urls.length} URLs · ${DIST}`);
