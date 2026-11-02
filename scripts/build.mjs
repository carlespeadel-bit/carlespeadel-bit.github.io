#!/usr/bin/env node
// Genera la web estatica en dist/ a partir de data/cards.json.
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import config from '../config.json' with { type: 'json' };
import {
  layout, esc, eur, cardSlug, slugify, priceTable, trendLine, amazonLink, bestVariant,
} from '../site/layout.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');
const OUT = (p) => path.join(DIST, p);
const put = async (p, data) => {
  const full = path.isAbsolute(p) ? p : OUT(p);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
};

const cards = JSON.parse(await readFile(path.join(ROOT, 'data', 'cards.json'), 'utf8'))
  .map((c) => ({ ...c, serie: c.serie ?? c.serious ?? null }));
const sets = JSON.parse(await readFile(path.join(ROOT, 'data', 'sets.json'), 'utf8'));
const setsById = new Map(sets.map((s) => [s.id, s]));

const priced = cards.filter((c) => c.price > 0);
const bySet = new Map();
for (const c of cards) {
  if (!bySet.has(c.setId)) bySet.set(c.setId, []);
  bySet.get(c.setId).push(c);
}
for (const list of bySet.values()) list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));

const año = (d) => (d ? String(d).slice(0, 4) : null);
// top de portada: solo cartas cuya imagen existe de verdad
async function imgOk(url) {
  try {
    const r = await fetch(url, { method: 'HEAD' });
    return r.ok;
  } catch {
    return false;
  }
}
const candidatas = priced.filter((c) => c.image).slice(0, 64);
const checks = await Promise.all(candidatas.map((c) => imgOk(`${c.image}/low.webp`)));
const top = candidatas.filter((_, i) => checks[i]).slice(0, 24);
const totalValor = priced.reduce((s, c) => s + c.price, 0);

await rm(DIST, { recursive: true, force: true });
await mkdir(OUT('assets'), { recursive: true });
await mkdir(OUT('data'), { recursive: true });

// cabeceras de hosting (Cloudflare Pages / Netlify)
await put('_headers', await readFile(path.join(ROOT, 'site', '_headers')));

// assets estaticos
for (const f of ['style.css', 'app.js']) {
  await put(OUT(`assets/${f}`), await readFile(path.join(ROOT, 'site', f)));
}
await put(
  OUT('assets/icon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#0a0a0b"/><circle cx="16" cy="16" r="7" fill="#ffcb05"/><path d="M16 9a7 7 0 0 0 0 14z" fill="#f5f5f7"/></svg>`,
);

// ---------- home ----------
const homeBody = `
<section class="hero">
  <p class="kicker">${priced.length.toLocaleString('es-ES')} cartas con precio actualizado hoy</p>
  <h1>¿Cuánto vale tu colección de cartas?</h1>
  <p class="lede">Añade tus cartas y te decimos cuánto valen hoy, según el precio medio real de Cardmarket.
  Sin registro, sin cookies, sin humo.</p>
  <div id="buscador" class="buscador">
    <input id="q" type="search" placeholder="Busca una carta: Charizard, Pikachu, Mew…" autocomplete="off" aria-label="Buscar carta">
    <div id="resultados" class="resultados"></div>
  </div>
  <div class="acciones">
    <a class="btn" href="/valorar/">Valorar mi colección</a>
    <a class="btn ghost" href="/cartas/">Ver todas las cartas</a>
  </div>
</section>

<section class="bloque">
  <h2>Las cartas más caras ahora mismo</h2>
  <div class="grid">
    ${top.map(cardTile).join('\n')}
  </div>
</section>

<section class="bloque dos-col">
  <div>
    <h2>Precio de mercado, no de catálogo</h2>
    <p>Los precios salen de las ventas reales de Cardmarket: media, tendencia y mínimo de los últimos 30 días.
    Se actualizan a diario. Una carta sin movimiento no sube porque un catálogo lo diga.</p>
  </div>
  <div>
    <h2>Cómo se usa</h2>
    <ol class="pasos">
      <li>Busca tus cartas y añádelas a la colección.</li>
      <li>Mira el total, cuánto subió en 30 días y cuáles son tus cartas que más valen.</li>
      <li>Guarda el enlace y vuelve cuando quieras: el valor se recalcula solo.</li>
    </ol>
  </div>
</section>`;

await put(
  OUT('index.html'),
  layout({
    title: `${config.brand} — ¿Cuánto valen tus cartas Pokémon? Precios de hoy`,
    description: `Calcula el valor de tu colección de cartas Pokémon con precios reales de Cardmarket actualizados a diario. ${priced.length.toLocaleString('es-ES')} cartas, gratis y sin registro.`,
    url: '/',
    body: homeBody,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: config.brand,
      url: config.site,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${config.site}/cartas/?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  }),
);

// ---------- indice de cartas ----------
const setsConPrecio = [...bySet.entries()]
  .map(([id, list]) => ({
    id,
    name: setsById.get(id)?.name ?? list[0].setName,
    n: list.length,
    total: list.reduce((s, c) => s + (c.price ?? 0), 0),
    fecha: setsById.get(id)?.releaseDate ?? null,
  }))
  .sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''));

await put(
  OUT('cartas/index.html'),
  layout({
    title: `Todas las cartas Pokémon con precio — ${config.brand}`,
    description: `Listado completo de ${cards.length.toLocaleString('es-ES')} cartas Pokémon por set, con precio de mercado actualizado.`,
    url: '/cartas/',
    body: `
<h1>Todas las cartas</h1>
<p class="lede">${cards.length.toLocaleString('es-ES')} cartas en el catálogo, ${priced.length.toLocaleString('es-ES')} con precio de mercado hoy.
Valor total del catálogo: <b>${eur(totalValor)}</b>.</p>
<div class="grid sets">
${setsConPrecio
  .map(
    (s) => `<a class="set-card" href="/set/${s.id}/">
    <span class="set-name">${esc(s.name)}</span>
    <span class="muted">${s.n} cartas${s.fecha ? ` · ${año(s.fecha)}` : ''}</span>
    <span class="set-total">${eur(s.total)}</span></a>`,
  )
  .join('\n')}
</div>`,
  }),
);

// ---------- sets ----------
await mkdir(OUT('set'), { recursive: true });
for (const [id, list] of bySet) {
  const meta = setsById.get(id);
  const nombre = meta?.name ?? list[0].setName;
  const total = list.reduce((s, c) => s + (c.price ?? 0), 0);
  const body = `
<nav class="migas"><a href="/cartas/">Cartas</a> / ${esc(nombre)}</nav>
<h1>Cartas de ${esc(nombre)}: lista y precios</h1>
<p class="lede">${list.length} cartas${meta?.releaseDate ? ` · ${año(meta.releaseDate)}` : ''}${meta?.serie ? ` · ${esc(meta.serie.name)}` : ''}.
Valor de mercado del set completo: <b>${eur(total)}</b>.</p>
<table class="listado">
<thead><tr><th>Carta</th><th>Rareza</th><th class="num">Precio</th></tr></thead>
<tbody>
${list
  .map(
    (c) => `<tr>
  <td><a href="/carta/${cardSlug(c)}/">${esc(c.name)} <span class="muted">${esc(c.localId ?? '')}</span></a></td>
  <td class="muted">${esc(c.rarity ?? '—')}</td>
  <td class="num">${c.price ? eur(c.price) : '—'}</td></tr>`,
  )
  .join('\n')}
</tbody></table>`;
  await put(
    OUT(`set/${id}/index.html`),
    layout({
      title: `Cartas de ${nombre} — lista completa y precios | ${config.brand}`,
      description: `Todas las cartas del set ${nombre} (${list.length}) con su precio de mercado actualizado. Valor total del set: ${eur(total)}.`,
      url: `/set/${id}/`,
      body,
    }),
  );
}

// ---------- cartas ----------
await mkdir(OUT('carta'), { recursive: true });
let n = 0;
const BATCH = 200;
for (let i = 0; i < priced.length; i += BATCH) {
  await Promise.all(
    priced.slice(i, i + BATCH).map(async (c) => {
      const slug = cardSlug(c);
      const meta = setsById.get(c.setId);
      const total = meta?.cardCount?.official ?? meta?.cardCount?.total ?? bySet.get(c.setId)?.length ?? 0;
      const year = año(c.releaseDate);
      const relacionados = (bySet.get(c.setId) ?? [])
        .filter((x) => x.id !== c.id && x.price)
        .slice(0, 6);
      const rar = c.rarity && c.rarity !== 'Ninguno' ? `Carta ${String(c.rarity).toLowerCase()}` : 'Carta';
      const descripcion = `${rar} del set ${c.setName}${year ? ` (${year})` : ''}${
        c.illustrator ? `, ilustrada por ${c.illustrator}` : ''
      }`;

      const body = `
<nav class="migas"><a href="/cartas/">Cartas</a> / <a href="/set/${c.setId}/">${esc(c.setName)}</a> / ${esc(c.name)}</nav>
<div class="carta-layout">
  <div class="carta-img">
    ${c.image ? `<img src="${esc(c.image)}/high.webp" alt="Carta ${esc(c.name)} de ${esc(c.setName)}" width="480" height="670" loading="eager" onerror="this.style.display='none'">` : ''}
  </div>
  <div class="carta-info">
    <h1>¿Cuánto vale ${esc(c.name)}?</h1>
    <p class="precio-grande">${eur(c.price)}<span class="muted"> · referencia ${c.variants?.[0]?.type ?? 'normal'}</span></p>
    ${trendLine(c)}
    <p class="muted">${esc(descripcion)}. Número ${esc(c.localId ?? '—')}/${total}.</p>
    ${priceTable(c)}
    <p class="nota">Precio de referencia de Cardmarket (media de ventas, no tasación). Una carta en estado Near Mint vale más; una con desgaste, bastante menos.</p>
    <a class="btn" href="${amazonLink(`${c.setName} pokemon sobres`)}" rel="sponsored nofollow noopener" target="_blank">Sobres de ${esc(c.setName)} en Amazon</a>
    <p class="nota small">Enlace de afiliado: si compras, nos llevamos una comisión sin coste extra para ti.</p>
    <div class="acciones">
      <button class="btn ghost" data-add="${slug}">Añadir a mi colección</button>
      <a class="btn ghost" href="/valorar/">Valorar la colección entera</a>
    </div>
  </div>
</div>
${relacionados.length ? `<section class="bloque"><h2>Otras cartas de ${esc(c.setName)}</h2><div class="grid">${relacionados.map(cardTile).join('')}</div></section>` : ''}`;

      const html = layout({
        title: `${c.name} ${c.localId ?? ''} — ${c.setName}: precio y valor | ${config.brand}`,
        description: `¿Cuánto vale ${c.name} de ${c.setName}? Precio de mercado hoy: ${eur(c.price)}. Media de 30 días y mínimo, actualizado a diario.`,
        url: `/carta/${slug}/`,
        image: c.image ? `${c.image}/high.webp` : undefined,
        body,
        jsonld: {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: `${c.name} — ${c.setName}`,
          image: c.image ? `${c.image}/high.webp` : undefined,
          description: `${rar} del set ${c.setName}`,
          brand: { '@type': 'Brand', name: 'Pokémon' },
          offers: {
            '@type': 'Offer',
            price: c.price,
            priceCurrency: 'EUR',
            availability: 'https://schema.org/InStock',
            url: `${config.site}/carta/${slug}/`,
          },
        },
      });
      await put(OUT(`carta/${slug}/index.html`), html);
      n++;
    }),
  );
  process.stdout.write(`  cartas ${Math.min(i + BATCH, priced.length)}/${priced.length}\n`);
}

// ---------- valorar ----------
await put(
  OUT('valorar/index.html'),
  layout({
    title: `Calculadora de valor de colección Pokémon | ${config.brand}`,
    description:
      'Calcula gratis cuánto vale tu colección de cartas Pokémon con precios de mercado actualizados. Añade cartas, guarda el enlace y sigue el valor con el tiempo.',
    url: '/valorar/',
    body: `
<h1>Valorar mi colección</h1>
<p class="lede">Busca cada carta, pon cuántas tienes y el total se calcula con el precio de mercado de hoy.
Se guarda en tu navegador y puedes compartir el resultado con un enlace.</p>
<div class="buscador grande">
  <input id="q" type="search" placeholder="Busca por nombre: Charizard, Pikachu, Mew ex…" autocomplete="off" aria-label="Buscar carta">
  <div id="resultados" class="resultados"></div>
</div>
<div class="dos-col coleccion">
  <div>
    <h2>Tu colección <span id="n-cartas" class="muted"></span></h2>
    <div id="coleccion" class="coleccion-lista"><p class="muted">Todavía no has añadido cartas.</p></div>
  </div>
  <aside class="total-caja">
    <p class="muted">Valor de mercado hoy</p>
    <p id="total" class="total">0,00 €</p>
    <p id="delta" class="muted"></p>
    <button id="compartir" class="btn">Copiar enlace para compartir</button>
    <button id="csv" class="btn ghost">Descargar CSV</button>
    <button id="vaciar" class="btn ghost">Vaciar</button>
    <p class="nota small">Los precios son de referencia (Cardmarket) y no incluyen estado ni gastos de envío.</p>
    <a class="btn ghost" href="/premium/">Quiero alertas cuando bajen</a>
  </aside>
</div>`,
  }),
);

// ---------- premium ----------
await put(
  OUT('premium/index.html'),
  layout({
    title: `Alertas de precio de cartas Pokémon | ${config.brand} Premium`,
    description:
      'Avisos cuando una carta de tu lista baja de precio, historial completo y seguimiento del valor de tu colección. 4,99 €/mes, sin permanencia.',
    url: '/premium/',
    body: `
<h1>Enterarte antes de que suba</h1>
<p class="lede">El valorador es gratis y lo seguirá siendo. Lo de pago es el aviso: cuando una carta de tu lista
baja de precio, cuando un set se agota y cuando tu colección cambia de valor.</p>
<div class="grid planes">
  <div class="plan">
    <h2>Gratis</h2>
    <p class="precio">0 €</p>
    <ul>
      <li>Valorar la colección sin límite</li>
      <li>Precio y tendencia de 30 días de cada carta</li>
      <li>Enlace para compartir y CSV</li>
      <li>Catálogo completo en español</li>
    </ul>
    <a class="btn ghost" href="/valorar/">Empezar</a>
  </div>
  <div class="plan destacado">
    <h2>Premium</h2>
    <p class="precio">${config.precio.mes}<span class="muted">/mes</span></p>
    <ul>
      <li><b>Alertas</b> cuando una carta de tu lista baja de precio</li>
      <li>Historial completo de precios (no solo 30 días)</li>
      <li>Aviso mensual del valor de tu colección</li>
      <li>Watchlist ilimitada y CSV con historial</li>
    </ul>
    <a class="btn" href="${esc(config.premiumUrl)}">Suscribirme</a>
    <p class="nota small">Cobro con Lemon Squeezy (IVA de la UE incluido). Cancelas cuando quieras, sin llamadas.</p>
  </div>
</div>
<section class="bloque">
  <h2>Qué NO es esto</h2>
  <p>No es una tasación oficial ni una promesa de revalorización. Es el precio al que se están vendiendo
  cartas parecidas esta semana, con la fuente a la vista. Si algo no tiene datos, lo decimos.</p>
</section>`,
  }),
);

// ---------- gracias (post-compra) ----------
await put(
  OUT('gracias/index.html'),
  layout({
    title: `Gracias — ya eres Premium | ${config.brand}`,
    description: 'Acceso a las alertas de precio de ValorCarta.',
    url: '/gracias/',
    noindex: true,
    body: `
<h1>Ya estás dentro</h1>
<p class="lede">Dos cosas y ya está:</p>
<ol class="pasos">
  <li>Entra al canal privado de alertas: <a href="${esc(config.telegramInvite)}"><b>t.me/+…</b></a> (el enlace es de un solo uso por persona; si falla, escríbenos).</li>
  <li>Guarda este correo. Los avisos llegan al canal y el resumen mensual del valor de tu colección, a tu email.</li>
</ol>
<p class="muted">Si quieres cancelar, se hace desde el recibo de Lemon Squeezy, sin llamadas ni formularios.</p>
<p><a class="btn ghost" href="/valorar/">Volver a mi colección</a></p>`,
  }),
);

// ---------- legales ----------
const legal = (slug, titulo, cuerpo) =>
  put(
    OUT(`${slug}/index.html`),
    layout({
      title: `${titulo} | ${config.brand}`,
      description: `${titulo} de ${config.brand}.`,
      url: `/${slug}/`,
      body: `<h1>${titulo}</h1>${cuerpo}`,
      noindex: false,
    }),
  );

await legal(
  'aviso-legal',
  'Aviso legal',
  `<p>Titular: ${esc(config.titular)} · NIF ${esc(config.nif)} · ${esc(config.contactEmail)}.</p>
   <p>${esc(config.brand)} es un sitio independiente de información de precios. No está afiliado, patrocinado ni respaldado por Nintendo, Creatures Inc., GAME FREAK ni The Pokémon Company. Las marcas citadas pertenecen a sus titulares.</p>
   <p>Participamos en el Programa de Afiliados de Amazon. Los precios mostrados son de referencia (Cardmarket) y pueden variar; no constituyen una oferta de venta.</p>`,
);
await legal(
  'privacidad',
  'Privacidad',
  `<p>No usamos cookies de seguimiento ni publicidad. Tu colección se guarda en el almacenamiento local de tu navegador y no se envía a ningún servidor.</p>
   <p>Si te suscribes, el pago lo procesa Lemon Squeezy como vendedor (merchant of record) y nosotros solo recibimos tu email para enviarte los avisos. Puedes darte de baja en cualquier momento.</p>
   <p>Contacto: ${esc(config.contactEmail)}.</p>`,
);

// ---------- assets ----------
await put(OUT('404.html'), layout({
  title: `No encontrado | ${config.brand}`,
  description: 'Página no encontrada.',
  url: '/404.html',
  noindex: true,
  body: `<h1>Esa carta no existe</h1><p class="lede">Puede que el enlace esté mal o que la carta ya no tenga datos de precio.</p><p><a class="btn" href="/valorar/">Valorar mi colección</a></p>`,
}));

await put(OUT('robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${config.site}/sitemap.xml\n`);

// sitemap
const urls = ['/', '/cartas/', '/valorar/', '/premium/', '/aviso-legal/', '/privacidad/']
  .map((u) => `${config.site}${u}`)
  .concat([...bySet.keys()].map((id) => `${config.site}/set/${id}/`))
  .concat(priced.map((c) => `${config.site}/carta/${cardSlug(c)}/`));
await put(
  OUT('sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `<url><loc>${u}</loc></url>`)
    .join('\n')}\n</urlset>`,
);

// indice ligero para el buscador del cliente
const idx = priced.map((c) => [
  cardSlug(c),
  c.name,
  c.setName,
  c.price,
  bestVariant(c)?.avg30 ?? null,
  c.image ?? null,
]);
await put(OUT('data/cartas.json'), JSON.stringify(idx));

console.log(`OK ${n} cartas, ${bySet.size} sets, ${urls.length} URLs en sitemap`);
console.log(`   catálogo valorado: ${eur(totalValor)} · índice ${(JSON.stringify(idx).length / 1e6).toFixed(1)} MB`);

function cardTile(c) {
  return `<a class="tile" href="/carta/${cardSlug(c)}/">
  ${c.image ? `<img src="${esc(c.image)}/low.webp" alt="${esc(c.name)}" width="245" height="342" loading="lazy" onerror="this.outerHTML='<div class=tile-ph>'+this.alt+'</div>'">` : `<div class="tile-ph">${esc(c.name)}</div>`}
  <span class="tile-name">${esc(c.name)}</span>
  <span class="tile-price">${c.price ? eur(c.price) : '—'}</span>
  <span class="tile-set muted">${esc(c.setName)}</span>
</a>`;
}
