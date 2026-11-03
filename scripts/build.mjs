#!/usr/bin/env node
// Genera la web estatica en dist/ a partir de data/cards.json.
import { mkdir, writeFile, readFile, rm, readdir } from 'node:fs/promises';
import path from 'node:path';
import config from '../config.json' with { type: 'json' };
import {
  layout, esc, eur, cardSlug, slugify, priceTable, trendLine, amazonLink, bestVariant, SITE,
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
let CAMBIOS = null;
try { CAMBIOS = JSON.parse(await readFile(path.join(ROOT, 'data', 'changes.json'), 'utf8')); } catch {}
let ASINS = {};
try { ASINS = JSON.parse(await readFile(path.join(ROOT, 'data', 'asins.json'), 'utf8')); } catch {}

const priced = cards.filter((c) => c.price > 0);
const porNombre = new Map();
for (const c of priced) {
  const k = c.name.toLowerCase();
  if (!porNombre.has(k)) porNombre.set(k, []);
  porNombre.get(k).push(c);
}
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

// GitHub Pages: sin Jekyll, si no ignora carpetas que empiezan por _
await put('.nojekyll', '');
if (config.googleVerificationFile) {
  await put(config.googleVerificationFile, `google-site-verification: ${config.googleVerificationFile}`);
}
const INDEXNOW_KEY = (await readFile(path.join(ROOT, 'data', 'indexnow-key.txt'), 'utf8')).trim();
await put(`${INDEXNOW_KEY}.txt`, INDEXNOW_KEY);

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

const guiasDir = path.join(ROOT, 'content', 'guias');
const guias = [];
for (const f of (await readdir(guiasDir).catch(() => [])).filter((f) => f.endsWith('.json'))) {
  try {
    guias.push(JSON.parse(await readFile(path.join(guiasDir, f), 'utf8')));
  } catch (e) {
    console.warn(`guia ilegible: ${f}`);
  }
}
guias.sort((a, b) => a.title.localeCompare(b.title, 'es'));

// ---------- home ----------
const homeBody = `
<section class="hero">
  <p class="kicker">${priced.length.toLocaleString('es-ES')} cartas con precio · actualizado el ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</p>
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

<section class="bloque">
  <h2>Guías para no regalar dinero</h2>
  <div class="grid guias-grid">
    ${guias
      .slice(0, 3)
      .map(
        (g) => `<a class="guia-card" href="/guia/${g.slug}/">
      <span class="guia-t">${esc(g.title)}</span>
      <span class="muted small">${esc(g.description)}</span></a>`,
      )
      .join('')}
  </div>
</section>

<section class="bloque">
  <h2>Índice: las 100 cartas más caras</h2>
  <p class="muted small">Enlaces directos a las fichas con más valor de mercado. Se recalcula a diario.</p>
  <div class="indice">
    ${priced.slice(0, 100).map((c) => `<a href="/carta/${cardSlug(c)}/">${esc(c.name)}</a>`).join(' · ')}
  </div>
</section>

<section class="bloque">
  <h2>Todos los sets</h2>
  <div class="indice">
    ${[...bySet.keys()].map((id) => `<a href="/set/${id}/">${esc(setsById.get(id)?.name ?? id)}</a>`).join(' · ')}
  </div>
</section>

${(() => {
  const mov = [...(CAMBIOS?.suben ?? []), ...(CAMBIOS?.bajan ?? [])].slice(0, 6);
  if (!CAMBIOS) return '';
  const nombre = new Map(cards.map((c) => [c.id, c]));
  return `<section class="bloque">
  <h2>Lo que se movió el ${esc(CAMBIOS.fecha)}</h2>
  <p class="muted small">Comparado con el día anterior. Se recalcula en cada actualización, así que cambia cada mañana.</p>
  ${mov.length ? `<ul class="pasos">${mov
    .map((m) => {
      const c = nombre.get(m.id);
      if (!c) return '';
      const signo = m.pct >= 0 ? '+' : '';
      return `<li><a href="/carta/${cardSlug(c)}/">${esc(c.name)}</a> — ${eur(m.a)} (${signo}${m.pct.toFixed(1)} %)</li>`;
    })
    .filter(Boolean)
    .join('')}</ul>` : '<p>Hoy ninguna carta se ha movido más de un 3 %. El mercado está plano.</p>'}
  <p class="muted small">Actualizado: ${esc(CAMBIOS.fecha)} · <a href="/mercado/">ver el radar completo</a></p>
</section>`;
})()}

<section class="bloque">
  <h2>Cómo se calcula lo que vale tu colección</h2>
  <p>Una carta no vale lo que dice un catálogo: vale lo que alguien paga por ella esta semana. Por eso aquí no usamos
  precios de tienda ni recomendaciones, sino la media de ventas reales de Cardmarket de los últimos días, que es la
  referencia que usan los coleccionistas en Europa.</p>
  <p>Para cada carta verás tres cifras: el <b>precio de referencia</b> (la tendencia actual), la <b>media de 30 días</b>
  (para saber si está subiendo o bajando) y el <b>mínimo</b> (lo más barato que se ha vendido). Las tres juntas cuentan
  una historia; una sola engaña.</p>
  <h2>Qué cambia el valor de una carta</h2>
  <ul class="pasos">
    <li><b>El estado.</b> Una carta Near Mint puede valer el doble que la misma carta con desgaste. Si no está perfecta, no vale la cifra que ves.</li>
    <li><b>La versión.</b> Normal, reversa y holo del mismo número son cartas distintas y precios distintos.</li>
    <li><b>El idioma.</b> Español e inglés no cotizan igual; las japonesas, a veces, muy distinto.</li>
    <li><b>La reimpresión.</b> Si el personaje vuelve en otro set, la versión antigua suele bajar.</li>
  </ul>
  <h2>Preguntas frecuentes</h2>
  <h3>¿Los precios son una tasación?</h3>
  <p>No. Son precios de referencia de mercado. Una tasación exige ver la carta; esto te dice cuánto se está pagando por cartas parecidas.</p>
  <h3>¿De dónde salen?</h3>
  <p>De Cardmarket, vía la API pública de TCGdex, y se actualizan a diario. Puedes descargar el volcado completo en nuestros <a href="https://github.com/carlespeadel-bit/precios-cartas-datos">datos abiertos</a>.</p>
  <h3>¿Cuánto cuesta usarlo?</h3>
  <p>Nada. El valorador y las fichas son gratis y no piden registro. Si algún día quieres que te avisemos por email cuando una carta baje, eso sí se paga.</p>
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
      url: SITE,
      mainEntity: [
        { '@type': 'Question', name: '¿Los precios son una tasación?', acceptedAnswer: { '@type': 'Answer', text: 'No. Son precios de referencia de mercado; una tasación exige ver la carta.' } },
        { '@type': 'Question', name: '¿De dónde salen los precios?', acceptedAnswer: { '@type': 'Answer', text: 'De Cardmarket, vía la API pública de TCGdex, actualizados a diario.' } },
        { '@type': 'Question', name: '¿Cuánto cuesta usarlo?', acceptedAnswer: { '@type': 'Answer', text: 'El valorador y las fichas son gratis y no piden registro.' } },
      ],
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE}/cartas/?q={search_term_string}`,
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
  const top10 = list.filter((c) => c.price > 0).slice(0, 10);
  const caras = list.filter((c) => c.price > 0).length;
  const media = caras ? total / caras : 0;
  const body = `
<nav class="migas"><a href="/cartas/">Cartas</a> / ${esc(nombre)}</nav>
<h1>Cartas de ${esc(nombre)}: lista y precios</h1>
<p class="lede">${list.length} cartas${meta?.releaseDate ? ` · ${año(meta.releaseDate)}` : ''}${meta?.serie ? ` · ${esc(meta.serie.name)}` : ''}.
${caras ? `Valor de mercado del set completo: <b>${eur(total)}</b>, con una media de ${eur(media)} por carta.` : 'Sin datos de precio suficientes todavía.'}</p>

${
  top10.length
    ? `<h2>Las más caras del set</h2>
<div class="grid">${top10.map(cardTile).join('')}</div>`
    : ''
}

<p class="acciones">
  ${
    ASINS[id]?.length
      ? `<a class="btn" href="https://www.amazon.es/dp/${ASINS[id][0].asin}?tag=${encodeURIComponent(config.amazonTag)}" rel="sponsored nofollow noopener" target="_blank">${esc(ASINS[id][0].nombre)} en Amazon</a>`
      : `<a class="btn" href="/guardar-cartas/">Fundas y toploaders para estas cartas</a>`
  }
  <a class="btn ghost" href="/valorar/">¿Cuánto vale mi colección?</a>
</p>
<p class="nota small">Enlace de afiliado. El precio lo pone Amazon; la comisión no te cuesta nada.</p>

<h2>Listado completo con precios</h2>
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
      // contexto calculado: ranking en el set, reimpresiones y variación real
      const delSet = (bySet.get(c.setId) ?? []).filter((x) => x.price > 0);
      const posSet = delSet.findIndex((x) => x.id === c.id) + 1;
      const versiones = (porNombre.get(c.name.toLowerCase()) ?? []).filter((x) => x.price > 0);
      const barata = versiones.length > 1 ? Math.min(...versiones.map((x) => x.price)) : null;
      const vBest = bestVariant(c);
      const var30 = vBest?.avg30 && c.price ? ((c.price - vBest.avg30) / vBest.avg30) * 100 : null;
      const contexto = [
        posSet === 1 && delSet.length > 2 ? 'Es la carta más cara de su set.' : posSet > 0 && delSet.length > 2 ? `Es la número ${posSet} de ${delSet.length} en valor dentro de su set.` : '',
        versiones.length > 1 ? `Existen ${versiones.length} versiones de este personaje; la más barata está a ${eur(barata)}.` : '',
        var30 != null ? `Frente a su media de 30 días, está ${var30 >= 0 ? 'un ' + var30.toFixed(0) + ' % por encima' : 'un ' + Math.abs(var30).toFixed(0) + ' % por debajo'}.` : '',
      ].filter(Boolean).join(' ');

      const rar = c.rarity && c.rarity !== 'Ninguno' ? `Carta ${String(c.rarity).toLowerCase()}` : 'Carta';
      const tipo = c.types?.length ? ` de tipo ${c.types.join(' y ')}` : '';
      const ps = c.hp ? `, ${c.hp} PS` : '';
      const fase = c.stage && c.stage !== 'Básica' ? `, fase ${c.stage.toLowerCase()}` : '';
      const descripcion = `${rar}${tipo}${fase}${ps} del set ${c.setName}${year ? ` (${year})` : ''}${
        c.illustrator ? `, ilustrada por ${c.illustrator}` : ''
      }`;

      const datos = [
        ['Tipo', c.types?.join(' / ')],
        ['PS', c.hp],
        ['Fase', c.stage],
        ['Evoluciona de', c.evolveFrom],
        ['Habilidades', c.abilities?.join(', ')],
        ['Debilidad', c.weaknesses?.map((w) => `${w.type} ${w.value}`).join(' · ')],
        ['Coste de retirada', c.retreat ?? null],
        [
          'Legalidad',
          c.legal
            ? c.legal.standard
              ? 'Estándar y Expandido'
              : c.legal.expanded
                ? 'Solo Expandido'
                : 'No legal en torneo'
            : null,
        ],
        ['Marca de regulación', c.regulationMark],
        ['Rareza', c.rarity && c.rarity !== 'Ninguno' ? c.rarity : null],
        ['Ilustrador', c.illustrator],
      ].filter(([, v]) => v !== null && v !== undefined && v !== '');

      const ataques = (c.attacks ?? [])
        .filter((a) => a.name || a.damage)
        .slice(0, 4)
        .map(
          (a) => `<li>${a.name ? `<b>${esc(a.name)}</b> ` : ''}${a.damage ? `<span class="dmg">${esc(a.damage)}</span>` : ''}${
            a.cost?.length ? ` <span class="muted small">(${a.cost.map(esc).join(' · ')})</span>` : ''
          }</li>`,
        )
        .join('');

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
    ${
      ataques
        ? `<h2 class="mini">Ataques</h2><ul class="ataques">${ataques}</ul>`
        : ''
    }
    ${
      datos.length
        ? `<table class="prices datos"><tbody>${datos
            .map(([k, v]) => `<tr><td class="muted">${esc(k)}</td><td>${esc(String(v))}</td></tr>`)
            .join('')}</tbody></table>`
        : ''
    }
    ${contexto ? `<p class="contexto">${esc(contexto)}</p>` : ''}
    <p class="nota">Precio de referencia de Cardmarket (media de ventas, no tasación). Una carta en estado Near Mint vale más; una con desgaste, bastante menos.</p>
    ${
      ASINS[c.setId]?.length
        ? `<a class="btn" href="https://www.amazon.es/dp/${ASINS[c.setId][0].asin}?tag=${encodeURIComponent(config.amazonTag)}" rel="sponsored nofollow noopener" target="_blank">${esc(ASINS[c.setId][0].nombre)} en Amazon</a>`
        : `<a class="btn" href="/guardar-cartas/">Fundas y toploaders para esta carta</a>`
    }
    <p class="nota small">Enlace de afiliado: si compras, nos llevamos una comisión sin coste extra para ti.</p>
    <p class="nota"><a href="/guardar-cartas/">¿Cómo guardar esta carta? →</a> · <a href="/caras/">Las 100 más caras →</a></p>
    <div class="acciones">
      <button class="btn ghost" data-add="${slug}">Añadir a mi colección</button>
      <a class="btn ghost" href="/valorar/">Valorar la colección entera</a>
    </div>
    <div class="alerta-box">
      <span class="muted small">Avísame si baja de</span>
      <input id="umbral" type="number" min="1" step="0.5" placeholder="${Math.max(1, Math.round((c.price ?? 10) * 0.85))}" aria-label="Precio objetivo">
      <span class="muted small">€</span>
      <button class="btn" data-watch="${slug}">Activar aviso</button>
    </div>
  </div>
</div>
${relacionados.length ? `<section class="bloque"><h2>Otras cartas de ${esc(c.setName)}</h2><div class="grid">${relacionados.map(cardTile).join('')}</div></section>` : ''}
${(() => {
  const otras = (porNombre.get(c.name.toLowerCase()) ?? []).filter((x) => x.id !== c.id).slice(0, 6);
  if (!otras.length) return '';
  const min = Math.min(...otras.map((x) => x.price));
  return `<section class="bloque"><h2>Otras versiones de ${esc(c.name)}</h2>
  <p class="muted">La misma carta en otros sets. La más barata desde ${eur(min)}.</p>
  <div class="grid">${otras.map(cardTile).join('')}</div></section>`;
})()}`;

      const html = layout({
        title: `${c.name} ${c.localId ?? ''} — ${c.setName}: precio y valor | ${config.brand}`,
        description: `¿Cuánto vale ${c.name} de ${c.setName}? Precio de mercado hoy: ${eur(c.price)}. Media de 30 días y mínimo, actualizado a diario.`,
        url: `/carta/${slug}/`,
        noindex: (c.price ?? 0) < 1,
        image: c.image ? `${c.image}/high.webp` : undefined,
        body,
        jsonld: [
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE}/` },
              { '@type': 'ListItem', position: 2, name: c.setName, item: `${SITE}/set/${c.setId}/` },
              { '@type': 'ListItem', position: 3, name: c.name, item: `${SITE}/carta/${cardSlug(c)}/` },
            ],
          },
          {
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
            url: `${SITE}/carta/${slug}/`,
          },
        },
        ],
      });
      await put(OUT(`carta/${slug}/index.html`), html);
      n++;
    }),
  );
  process.stdout.write(`  cartas ${Math.min(i + BATCH, priced.length)}/${priced.length}\n`);
}

// ---------- guias ----------

for (const g of guias) {
  await put(
    OUT(`guia/${g.slug}/index.html`),
    layout({
      title: `${g.title} | ${config.brand}`,
      description: g.description,
      url: `/guia/${g.slug}/`,
      body: `<nav class="migas"><a href="/guias/">Guías</a> / ${esc(g.title)}</nav>
<article class="prosa"><h1>${esc(g.title)}</h1>${g.html}</article>
<div class="acciones"><a class="btn" href="/valorar/">Valorar mi colección</a>
<a class="btn ghost" href="/guias/">Más guías</a></div>`,
    }),
  );
}
if (guias.length) {
  await put(
    OUT('guias/index.html'),
    layout({
      title: `Guías de cartas Pokémon — comprar, guardar y vender | ${config.brand}`,
      description:
        'Guías prácticas sobre cartas Pokémon: detectar falsificaciones, conservarlas, comprar sin pagar de más y vender sin perder dinero.',
      url: '/guias/',
      body: `<h1>Guías</h1>
<p class="lede">Lo que aprendes a base de comprar mal. Sin humo y sin promesas de rentabilidad.</p>
<div class="grid guias-grid">
${guias
  .map(
    (g) => `<a class="guia-card" href="/guia/${g.slug}/">
  <span class="guia-t">${esc(g.title)}</span>
  <span class="muted small">${esc(g.description)}</span></a>`,
  )
  .join('\n')}
</div>`,
    }),
  );
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
<div class="modo-frase">
  <label for="frase" class="muted small">O escríbela como la dirías: «2 charizard base y un pikachu de 151»</label>
  <div class="frase-fila">
    <input id="frase" type="text" placeholder="2 charizard base, pikachu 151…" autocomplete="off">
    <button id="interpretar" class="btn">Añadir</button>
  </div>
  <p id="frase-out" class="nota small"></p>
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

// ---------- mercado (radar de tendencia, se recalcula en cada build) ----------
const radar = priced
  .map((c) => {
    const v = bestVariant(c);
    if (!v || !v.avg30 || !v.avg7 || v.avg30 < 10 || v.avg7 <= 0) return null;
    return { ...c, var7: ((v.avg7 - v.avg30) / v.avg30) * 100 };
  })
  .filter((c) => c && c.var7 > -60 && c.var7 < 60)
  .filter((c, i, arr) => arr.findIndex((x) => x.name === c.name && x.setId === c.setId) === i);
const suben = [...radar].sort((a, b) => b.var7 - a.var7).slice(0, 20);
const bajan = [...radar].sort((a, b) => a.var7 - b.var7).slice(0, 20);

const filaRadar = (c, cls) => `<tr>
  <td><a href="/carta/${cardSlug(c)}/">${esc(c.name)}</a> <span class="muted small">${esc(c.setName)}</span></td>
  <td class="num">${eur(c.price)}</td>
  <td class="num ${cls}">${c.var7 >= 0 ? '+' : ''}${c.var7.toFixed(1)}%</td>
</tr>`;

await put(
  OUT('mercado/index.html'),
  layout({
    title: `Qué cartas están subiendo y bajando esta semana | ${config.brand}`,
    description:
      'Radar de precios de cartas Pokémon: qué sube y qué baja en los últimos 7 días frente a la media de 30, recalculado a diario.',
    url: '/mercado/',
    body: `
<h1>Qué se mueve esta semana</h1>
<p class="lede">Comparación de la media de 7 días frente a la de 30, sobre ${radar.length.toLocaleString('es-ES')} cartas con liquidez suficiente.
Se recalcula en cada actualización, así que esto no es un artículo: es el mercado de hoy.</p>

<div class="dos-col">
  <div>
    <h2>Suben</h2>
    <table class="listado"><thead><tr><th>Carta</th><th class="num">Precio</th><th class="num">7 d</th></tr></thead>
    <tbody>${suben.map((c) => filaRadar(c, 'up')).join('')}</tbody></table>
  </div>
  <div>
    <h2>Bajan</h2>
    <table class="listado"><thead><tr><th>Carta</th><th class="num">Precio</th><th class="num">7 d</th></tr></thead>
    <tbody>${bajan.map((c) => filaRadar(c, 'down')).join('')}</tbody></table>
  </div>
</div>

<section class="bloque">
  <h2>Cómo se calcula</h2>
  <p>No usamos el precio del día: una sola venta mueve la aguja. Comparamos la media de los últimos 7 días con la de 30,
  y descartamos cartas por debajo de 10 € y variaciones por encima del 60%, que en cartas con pocas ventas son ruido y no tendencia.</p>
  <p class="muted">Precios de referencia de Cardmarket vía TCGdex. No es una predicción ni una recomendación de compra.</p>
</section>`,
  }),
);

// ---------- oauth callback (recibe el codigo de Pinterest) ----------
await put(
  OUT('oauth/index.html'),
  layout({
    title: 'Conexión con Pinterest',
    description: 'Página de retorno del proceso de autorización.',
    url: '/oauth/',
    noindex: true,
    body: `
<h1>Autorización de Pinterest</h1>
<p class="lede">Pega el código que aparece en la barra de direcciones justo después de <code>code=</code>.</p>
<div class="buscador">
  <input id="code" type="text" placeholder="Aquí el código" aria-label="Código de autorización">
</div>
<p><button class="btn" onclick="navigator.clipboard.writeText(document.getElementById('code').value)">Copiar</button></p>
<p class="nota small">Esta página no envía nada a ningún sitio: solo sirve para que el código quede a mano.</p>
<script>
  const q = new URLSearchParams(location.search);
  const c = q.get('code');
  if (c) document.getElementById('code').value = c;
</script>`,
  }),
);

// ---------- guardar cartas (hub de compra con ASIN reales) ----------
const PRODUCTOS_GUARDAR = [
  {
    tramo: 'Hasta 5 €',
    que: 'Funda blanda (penny sleeve)',
    asin: 'B085DNDLC1',
    nombre: 'Ultra Pro Penny Sleeve, 400 unidades',
    veredicto: 'Para lo que no merece más: evita el roce y el polvo por céntimos la carta.',
    porque: 'Es la primera barrera y la que se cambia si se ensucia. No protege de doblarse.',
    precio: 'desde 6,71 €',
  },
  {
    tramo: '5-50 €',
    que: 'Toploader rígido',
    asin: 'B000Q5ZMM0',
    nombre: 'Ultra Pro Toploader 3x4, pack de 25',
    veredicto: 'La carta va dentro de la funda blanda y luego aquí. Sin esto, la esquina se dobla y la carta pierde la mitad del valor.',
    porque: 'Rígido, entra en cualquier caja de envío y es lo que piden los compradores al recibir.',
    precio: 'desde 8 €',
  },
  {
    tramo: '50-200 €',
    que: 'Toploader por unidad o pack grande',
    asin: 'B0812Z3RPY',
    nombre: 'Ultra Pro Toploader 3x4, 100 unidades',
    veredicto: 'A partir de aquí la carta viaja fuera de casa: se envía en toploader, con funda y entre cartón.',
    porque: 'El pack grande sale mucho mejor por unidad y es lo que se gasta al vender varias.',
    precio: 'desde 20 €',
  },
  {
    tramo: 'La colección entera',
    que: 'Binder con cremallera',
    asin: 'B0D7W2PJR8',
    nombre: 'Card Guardian Binder 720, 9 bolsillos',
    veredicto: 'Para lo que no se vende ni se toca cada día: la colección entera fuera del polvo, del sol y de las anillas metálicas.',
    porque: 'Cierre y páginas cosidas: las anillas clásicas marcan la carta con el tiempo.',
    precio: 'desde 25,98 €',
  },
];

const fechaHoy = new Date().toISOString().slice(0, 10);

await put(
  OUT('guardar-cartas/index.html'),
  layout({
    title: `Cómo guardar cartas Pokémon: qué funda según lo que valen | ${config.brand}`,
    description:
      'Qué funda, toploader o binder usar según el valor de la carta, con productos concretos y el criterio detrás. Sin humo y sin fingir pruebas que no hemos hecho.',
    url: '/guardar-cartas/',
    body: `
<nav class="migas"><a href="/guias/">Guías</a> / Guardar cartas</nav>
<h1>Cómo guardar cartas según lo que valen</h1>
<p class="aviso-afiliado">En calidad de Afiliado de Amazon, obtengo ingresos por las compras adscritas que cumplen los requisitos aplicables. Los precios los pone Amazon. · Revisado: ${fechaHoy}</p>
<p class="lede">No todas las cartas merecen el mismo gasto. La regla es simple: la protección tiene que costar menos que
lo que protege, y en cuanto la carta vale más de lo que cuesta un toploader, no hay discusión.</p>

<table class="listado">
<thead><tr><th>Tramo</th><th>Qué usar</th><th>Por qué</th></tr></thead>
<tbody>
${PRODUCTOS_GUARDAR.map(
  (p) => `<tr><td><b>${esc(p.tramo)}</b></td><td>${esc(p.que)}</td><td class="muted">${esc(p.porque)}</td></tr>`,
).join('')}
</tbody></table>

<section class="bloque">
  <h2>Uno por tramo, con el veredicto delante</h2>
  ${PRODUCTOS_GUARDAR.map(
    (p) => `<div class="reco">
    <p class="reco-tramo">${esc(p.tramo)}</p>
    <p class="reco-veredicto">${esc(p.veredicto)}</p>
    <p class="reco-nombre">${esc(p.nombre)} <span class="muted">· ${esc(p.precio)}</span></p>
    <a class="btn" href="https://www.amazon.es/dp/${p.asin}?tag=${encodeURIComponent(config.amazonTag)}" rel="sponsored nofollow noopener" target="_blank">Ver precio en Amazon</a>
  </div>`,
  ).join('')}
</section>

<section class="bloque">
  <h2>Cómo lo comprobamos (y qué no)</h2>
  <p>El criterio de los tramos sale del precio de mercado de las cartas, no de una prueba de laboratorio: todavía
  <b>no hemos medido</b> cuántas barajadas aguanta cada funda ni cuánto tarda en amarillear. Cuando lo hagamos, lo
  publicaremos con las medidas y la fecha, y si algún producto sale mal, se quita.</p>
  <p class="muted">Lo que sí es dato: el precio de cada carta viene de Cardmarket y se actualiza a diario. Los tramos
  están puestos sobre ese precio, no sobre una estimación.</p>
</section>

<section class="bloque">
  <h2>Lo que no haría</h2>
  <ul class="pasos">
    <li><b>Fundas de PVC</b> y hojas con anillas metálicas: con el tiempo marcan la carta.</li>
    <li><b>Guardar en vertical sin toploader</b>: el peso de las de abajo dobla las esquinas.</li>
    <li><b>Sol directo</b>: el foil se decolora y no vuelve.</li>
    <li><b>Cajas de cartón sin funda</b>: el roce se come el borde impreso.</li>
  </ul>
  <p><a class="btn ghost" href="/valorar/">Ver cuánto vale mi colección</a>
  <a class="btn ghost" href="/guias/guardar-cartas-sin-que-se-curven/">Guía: que no se curven</a></p>
</section>`,
  }),
);

// ---------- panel de visitas ----------
let panel = null;
try {
  panel = JSON.parse(await readFile(path.join(ROOT, 'data', 'panel.json'), 'utf8'));
} catch {}
if (panel) {
  const max = Math.max(1, ...panel.porDia.map((d) => d.visitas));
  await put(
    OUT('panel/index.html'),
    layout({
      title: `Panel de visitas | ${config.brand}`,
      description: 'Visitas de los últimos 30 días.',
      url: '/panel/',
      noindex: true,
      body: `
<h1>Visitas · últimos 30 días</h1>
<p class="lede"><b>${panel.total.toLocaleString('es-ES')}</b> visitas desde ${panel.desde} hasta ${panel.hasta}. Actualizado: ${panel.actualizado.slice(0, 16).replace('T', ' ')}.</p>
<div class="grafico">${panel.porDia
        .map(
          (d) => `<div class="barra" title="${d.dia}: ${d.visitas}" style="height:${Math.max(2, (d.visitas / max) * 100)}%"></div>`,
        )
        .join('')}</div>
<div class="dos-col">
  <div><h2>Páginas</h2><table class="listado"><tbody>${panel.paginas
    .map((p) => `<tr><td>${esc(p.ruta)}</td><td class="num">${p.visitas}</td></tr>`)
    .join('') || '<tr><td class="muted">Sin datos</td></tr>'}</tbody></table></div>
  <div><h2>De dónde vienen</h2><table class="listado"><tbody>${panel.referidores
    .map((r) => `<tr><td>${esc(r.ref)}</td><td class="num">${r.visitas}</td></tr>`)
    .join('') || '<tr><td class="muted">Sin datos</td></tr>'}</tbody></table></div>
</div>`,
    }),
  );
}

// ---------- datos abiertos (Dataset schema para Google Dataset Search) ----------
const fechaDatos = (cards[0]?.updated ?? new Date().toISOString()).slice(0, 10);
await put(
  OUT('datos/index.html'),
  layout({
    title: `Dataset: precios de cartas Pokémon (descarga libre) | ${config.brand}`,
    description:
      'Volcado diario y gratuito con el precio de referencia de 9.830 cartas Pokémon en EUR. Licencia CC BY 4.0, en JSON, listo para analizar.',
    url: '/datos/',
    body: `
<h1>Precios de cartas Pokémon, en abierto</h1>
<p class="lede">Un fichero JSON con el precio de referencia de <b>${priced.length.toLocaleString('es-ES')} cartas</b>, actualizado a diario.
Licencia <b>CC BY 4.0</b>: úsalo, publícalo o mételo en tu modelo, citando la fuente.</p>
<p><a class="btn" href="https://raw.githubusercontent.com/carlespeadel-bit/precios-cartas-datos/master/precios.json" rel="noopener">Descargar JSON</a>
<a class="btn ghost" href="https://github.com/carlespeadel-bit/precios-cartas-datos" rel="noopener">Ver el repositorio</a></p>
<table class="listado"><tbody>
<tr><td class="muted">Última actualización</td><td>${esc(fechaDatos)}</td></tr>
<tr><td class="muted">Cartas con precio</td><td>${priced.length.toLocaleString('es-ES')}</td></tr>
<tr><td class="muted">Formato</td><td>JSON (id, nombre, set, precio en EUR)</td></tr>
<tr><td class="muted">Fuente del precio</td><td>Cardmarket, vía la API pública de TCGdex</td></tr>
<tr><td class="muted">Licencia</td><td>CC BY 4.0</td></tr>
</tbody></table>
<section class="bloque">
  <h2>Qué puedes hacer con esto</h2>
  <ul class="pasos">
    <li>Comparar la evolución de un set entre semanas.</li>
    <li>Detectar cartas cuyo precio se ha movido más de un 20 %.</li>
    <li>Montar tu propio valorador o una hoja de cálculo para tu colección.</li>
  </ul>
  <p class="muted">Los precios son de referencia de mercado y no distinguen estado de conservación. No son una tasación.</p>
</section>`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: 'Precios de cartas Pokémon (volcado diario)',
      description:
        'Precio de referencia en EUR de 9.830 cartas Pokémon, generado a diario desde Cardmarket vía TCGdex.',
      license: 'https://creativecommons.org/licenses/by/4.0/',
      creator: { '@type': 'Organization', name: config.brand, url: SITE },
      url: `${SITE}/datos/`,
      dateModified: fechaDatos,
      distribution: [
        {
          '@type': 'DataDownload',
          contentUrl:
            'https://raw.githubusercontent.com/carlespeadel-bit/precios-cartas-datos/master/precios.json',
          encodingFormat: 'application/json',
        },
      ],
    },
  }),
);

// ---------- ranking de las mas caras ----------
const caras100 = priced.slice(0, 100);
await put(
  OUT('caras/index.html'),
  layout({
    title: `Las 100 cartas Pokémon más caras (precio de hoy) | ${config.brand}`,
    description:
      'Ranking de las 100 cartas Pokémon con mayor precio de mercado, actualizado a diario. Con set, rareza y enlace a su ficha.',
    url: '/caras/',
    body: `
<h1>Las 100 cartas Pokémon más caras</h1>
<p class="lede">Ordenadas por precio de mercado hoy. La lista se recalcula en cada actualización, así que cambia:
una carta que sube entra, una que baja sale.</p>
<p class="nota small">Precios de referencia de Cardmarket. Una carta en mal estado vale mucho menos que esta cifra.</p>
<table class="listado ranking">
<thead><tr><th>#</th><th>Carta</th><th>Set</th><th class="num">Precio</th></tr></thead>
<tbody>
${caras100
  .map(
    (c, i) => `<tr>
  <td class="num muted">${i + 1}</td>
  <td><a href="/carta/${cardSlug(c)}/">${esc(c.name)}</a></td>
  <td class="muted"><a href="/set/${c.setId}/">${esc(c.setName)}</a></td>
  <td class="num">${eur(c.price)}</td>
</tr>`,
  )
  .join('')}
</tbody></table>
<p class="acciones"><a class="btn" href="/valorar/">¿Cuánto vale mi colección?</a>
<a class="btn ghost" href="/mercado/">Qué se mueve esta semana</a></p>`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Las 100 cartas Pokémon más caras',
      itemListElement: caras100.slice(0, 20).map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.name,
        url: `${SITE}/carta/${cardSlug(c)}/`,
      })),
    },
  }),
);

// ---------- guias de compra por formato ----------
const GUIAS_COMPRA = [
  {
    slug: 'sobres', asin: 'B0GMRC58KQ', h1: 'Sobres sueltos: cuándo salen caros',
    entradilla: 'Comprar sobres de uno en uno es la forma más cara de abrir un set. Aquí está la cuenta y cuándo sí merece la pena.',
    puntos: [
      'El precio por sobre en blíster o sobre suelto suele ser más alto que en caja de 36.',
      'Si vas a abrir más de 15 sobres, compara siempre contra el precio de la caja.',
      'Un sobre abierto no se puede devolver: si buscas una carta concreta, sale más barato comprarla suelta.',
    ],
    cta: 'Lata EX con 4 sobres',
  },
  {
    slug: 'caja-36', asin: 'B0BTRN9FT5', h1: 'Caja de 36 sobres: la cuenta que hay que hacer',
    entradilla: 'La caja es el formato con mejor precio por sobre, pero solo si vas a abrirla entera y el set te interesa de verdad.',
    puntos: [
      'Divide el precio de la caja entre 36: ese es tu coste real por sobre.',
      'Compáralo con el precio del sobre suelto antes de comprar; a veces la diferencia es de céntimos y a veces del 40 %.',
      'Ojo con el precinto: una caja abierta pierde valor de reventa.',
    ],
    cta: 'Caja de 36 sobres',
  },
  {
    slug: 'etb', asin: 'B0DM6HQ8X5', h1: 'ETB: qué lleva y cuándo conviene',
    entradilla: 'La caja de élite trae sobres, fundas, dados y una carta promocional. Conviene si vas a usar los accesorios; si no, se paga de más.',
    puntos: [
      'Suma el precio de los sobres y de las fundas por separado: si sale parecido, la ETB es buena compra.',
      'La promo suele ser la razón real para comprarla; mira cuál es antes de pagar.',
      'Suelen reponerse; no pagues sobreprecio por prisa.',
    ],
    cta: 'ETB de Evoluciones Prismáticas',
  },
  {
    slug: 'lata', asin: 'B0GMRC58KQ', h1: 'Latas: promo garantizada, sobres caros',
    entradilla: 'La lata vende una carta promocional concreta. Si esa carta es la que buscas, tiene sentido; si no, estás pagando el envoltorio.',
    puntos: [
      'Mira qué promo trae y su precio suelto: a veces comprar solo la carta sale más barato.',
      'Cuatro sobres por lata es el formato habitual; divide y compara.',
      'Las latas se abollan: si la quieres cerrada, revisa el estado al recibirla.',
    ],
    cta: 'Lata Mega-Charizard',
  },
  {
    slug: 'blister', asin: 'B0H1HDKXGH', h1: 'Blíster de 3: comodidad cara',
    entradilla: 'El blíster existe para regalar y para tienda física. Por sobre es de los formatos más caros.',
    puntos: [
      'Es el formato con peor precio por sobre de todos los habituales.',
      'Útil si necesitas un regalo rápido o comprar en tienda física.',
      'Para abrir en casa, la caja o la ETB salen mejor.',
    ],
    cta: 'Blíster de 3 sobres',
  },
];

for (const g of GUIAS_COMPRA) {
  await put(
    OUT(`comprar/${g.slug}/index.html`),
    layout({
      title: `${g.h1} | ${config.brand}`,
      description: g.entradilla,
      url: `/comprar/${g.slug}/`,
      body: `
<nav class="migas"><a href="/comprar/">Comprar</a> / ${esc(g.cta)}</nav>
<h1>${esc(g.h1)}</h1>
<p class="aviso-afiliado">En calidad de Afiliado de Amazon, obtengo ingresos por las compras adscritas que cumplen los requisitos aplicables. · Revisado: ${new Date().toISOString().slice(0, 10)}</p>
<p class="lede">${esc(g.entradilla)}</p>
<ul class="pasos">${g.puntos.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
<p><a class="btn" href="https://www.amazon.es/dp/${g.asin}?tag=${encodeURIComponent(config.amazonTag)}" rel="sponsored nofollow noopener" target="_blank">${esc(g.cta)} en Amazon</a></p>
<p class="nota small">El precio lo pone Amazon. Antes de comprar, compara el precio por sobre con el resto de formatos en <a href="/comprar/">la tabla de compra</a>.</p>
<p class="nota"><a href="/valorar/">Ver cuánto vale mi colección →</a> · <a href="/mercado/">Qué se mueve esta semana →</a></p>`,
    }),
  );
}

// ---------- comprar (intencion de compra -> afiliado) ----------
const PRODUCTOS = [
  ['Sobres sueltos', null, 'Para probar suerte sin comprometerte. El precio por sobre siempre es peor que en caja.'],
  ['Caja de 36 sobres', 'B0BTRN9FT5', 'El mejor precio por sobre si vas a abrir mucho. Compara antes de comprar.'],
  ['ETB (caja de élite)', 'B0FDGXLR5L', 'Sobres, fundas y dados. Suele salir mejor que comprar las piezas por separado.'],
  ['Lata', 'B0GMRC58KQ', 'Promo garantizada. Revisa qué carta trae antes de pagar de más.'],
  ['Blíster de 3', 'B0H1HDKXGH', 'Cómodo en tienda física, caro por sobre. Útil para regalo.'],
  ['Colección premium', 'B0DSGDJP6Q', 'Producto de nicho: si no la abres, el precinto manda.'],
  ['Fundas', 'B085DNDLC1', 'Lo primero antes de tocar una carta que valga algo.'],
  ['Binder', 'B0D7W2PJR8', 'Para guardar la colección sin que se doblen las esquinas.'],
];

await put(
  OUT('comprar/index.html'),
  layout({
    title: `Dónde comprar cartas y sobres Pokémon sin pagar de más | ${config.brand}`,
    description:
      'Qué formato conviene comprar según lo que busques, cuánto cuesta cada uno por sobre y dónde encontrarlo. Sin humo y sin promesas de revalorización.',
    url: '/comprar/',
    body: `
<h1>Dónde comprar sin pagar de más</h1>
<p class="lede">El formato cambia el precio por sobre más que la tienda. Antes de comprar, mira qué te llevas
y cuánto estás pagando por cada sobre; luego compara.</p>

<table class="listado">
<thead><tr><th>Formato</th><th>Cuándo tiene sentido</th><th class="num">Ver precios</th></tr></thead>
<tbody>
${PRODUCTOS.map(
  ([n, q, d]) => `<tr>
  <td><b>${esc(n)}</b></td>
  <td class="muted">${esc(d)}</td>
  <td class="num">${
    q
      ? `<a href="https://www.amazon.es/dp/${q}?tag=${encodeURIComponent(config.amazonTag)}" rel="sponsored nofollow noopener" target="_blank">Ver producto →</a>`
      : `<a href="/guardar-cartas/">Guía →</a>`
  }</td>
</tr>`,
).join('')}
</tbody></table>

<section class="bloque">
  <h2>Formato por formato</h2>
  <div class="grid guias-grid">
    ${GUIAS_COMPRA.map((g) => `<a class="guia-card" href="/comprar/${g.slug}/"><span class="guia-t">${esc(g.cta)}</span><span class="muted small">${esc(g.h1)}</span></a>`).join('')}
  </div>
</section>

<section class="bloque">
  <h2>Las tres reglas que ahorran dinero</h2>
  <ol class="pasos">
    <li><b>Precio por sobre, no precio del producto.</b> Una caja de 36 y un blíster de 3 no se comparan por lo que cuestan, sino por lo que cuesta cada sobre.</li>
    <li><b>El precinto manda.</b> Si el producto viene abierto o sin retractilar, el valor cae. Revisa el estado al recibir y fotografía el paquete antes de abrirlo.</li>
    <li><b>El sobre no da dinero por abrir.</b> Abrir es azar. Si compras para coleccionar, compra la carta suelta; si compras para abrir, asume que estás pagando la experiencia.</li>
  </ol>
  <p class="nota small">Los enlaces llevan a búsquedas de Amazon con nuestra etiqueta de afiliado: si compras, nos llevamos una comisión sin coste extra para ti. El precio lo pone Amazon, no nosotros.</p>
</section>`,
  }),
);

// ---------- alertas (producto de suscripcion) ----------
await put(
  OUT('alertas/index.html'),
  layout({
    title: `Avisos de precio de cartas Pokémon | ${config.brand}`,
    description:
      'Pon un precio objetivo a tus cartas y recibe un aviso cuando el mercado baje de ahí. Sin registro para probarlo.',
    url: '/alertas/',
    body: `
<h1>Que te avisen, no mirar todos los días</h1>
<p class="lede">Pon el precio al que comprarías y olvídate. Cuando el mercado baje de ahí, te llega el aviso.</p>

<div id="alertas-lista" class="coleccion-lista"><p class="muted">Todavía no tienes avisos. Búscalos desde cualquier ficha de carta.</p></div>

<div class="dos-col coleccion">
  <div>
    <h2>Cómo funciona</h2>
    <ol class="pasos">
      <li>En la ficha de una carta, pon tu precio objetivo y activa el aviso.</li>
      <li>Lo guardamos en tu navegador: no hay registro ni contraseña.</li>
      <li>Con Premium, ese aviso te llega por email el mismo día que se cumple.</li>
    </ol>
  </div>
  <aside class="total-caja">
    <p class="muted">Avisos por email</p>
    <p class="total">${config.precio.mes}<span class="muted small">/mes</span></p>
    <a class="btn" href="${esc(config.premiumUrl)}">Activar avisos</a>
    <p class="nota small">El precio lo comprobamos a diario con los datos de Cardmarket. Si no baja, no te escribimos.</p>
  </aside>
</div>`,
  }),
);

// ---------- tiendas (B2B) ----------
await put(
  OUT('tiendas/index.html'),
  layout({
    title: `Informe semanal de precios para tiendas de cartas | ${config.brand}`,
    description:
      'Cada lunes: qué cartas de tu stock han subido, cuáles han bajado y dónde está el margen. Informe de mercado con precios reales. Primer informe gratis.',
    url: '/tiendas/',
    body: `
<h1>Tu stock, valorado cada semana</h1>
<p class="lede">El informe que llega los lunes: qué cartas se han movido, cuánto valen hoy y dónde tienes margen.
Con precios de mercado, no con intuición.</p>

<div class="grid planes">
  <div class="plan">
    <h2>Informe</h2>
    <p class="precio">29 €<span class="muted">/mes</span></p>
    <ul>
      <li>Top subidas y bajadas de la semana</li>
      <li>Sets con más movimiento y su valor</li>
      <li>Valor del catálogo completo</li>
      <li>Un correo, los lunes. Sin instalar nada</li>
    </ul>
    <a class="btn" href="mailto:${esc(config.emailVentas)}?subject=Quiero%20el%20informe%20de%20prueba">Pedir el primero gratis</a>
  </div>
  <div class="plan destacado">
    <h2>Panel</h2>
    <p class="precio">99 €<span class="muted">/mes</span></p>
    <ul>
      <li>Tu stock valorado a precio de mercado, cada día</li>
      <li>Avisos cuando una carta de tu stock se mueve</li>
      <li>Histórico de precios de las cartas que vendes</li>
      <li>Exportable a CSV para tu inventario</li>
    </ul>
    <a class="btn" href="mailto:${esc(config.emailVentas)}?subject=Quiero%20ver%20el%20panel">Hablar del panel</a>
  </div>
</div>

<section class="bloque">
  <h2>Por qué esto y no una hoja de cálculo</h2>
  <p>Una hoja de cálculo te dice lo que pagaste. Esto te dice lo que vale tu stock esta semana, comparado con
  lo que se está vendiendo de verdad en el mercado. La diferencia es cuándo comprar y cuándo soltar.</p>
  <p class="muted">Precios de referencia de Cardmarket vía TCGdex, actualizados a diario. Sin permanencia: si un mes no te sirve, lo dejas.</p>
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

await put(OUT('robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\nSitemap: ${SITE}/ygo/sitemap.xml\nSitemap: ${SITE}/magic/sitemap.xml\n`);

// sitemap
const urls = ['/', '/cartas/', '/valorar/', '/premium/', '/guias/', '/datos/', '/comprar/', '/comprar/sobres/', '/comprar/caja-36/', '/comprar/etb/', '/comprar/lata/', '/comprar/blister/', '/mercado/', '/caras/', '/alertas/', '/guardar-cartas/', '/tiendas/', '/aviso-legal/', '/privacidad/']
  .map((u) => `${SITE}${u}`)
  .concat([...bySet.keys()].map((id) => `${SITE}/set/${id}/`))
  .concat(priced.filter((c) => c.price >= 1).map((c) => `${SITE}/carta/${cardSlug(c)}/`))
  .concat(guias.map((g) => `${SITE}/guia/${g.slug}/`));
// sitemap por bloques con lastmod diario + indice
const lastmod = (cards[0]?.updated ?? new Date().toISOString()).slice(0, 10);
const TANDA = 2000;
const bloques = [];
for (let i = 0; i < urls.length; i += TANDA) bloques.push(urls.slice(i, i + TANDA));
for (let i = 0; i < bloques.length; i++) {
  await put(
    `sitemap-${i + 1}.xml`,
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${bloques[i]
      .map((u) => `<url><loc>${u}</loc><lastmod>${lastmod}</lastmod><changefreq>daily</changefreq></url>`)
      .join('\n')}\n</urlset>`,
  );
}
await put(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${bloques
    .map((_, i) => `<sitemap><loc>${SITE}/sitemap-${i + 1}.xml</loc><lastmod>${lastmod}</lastmod></sitemap>`)
    .join('\n')}\n</sitemapindex>`,
);

// indice ligero para el buscador del cliente
const idx = priced.map((c) => [
  cardSlug(c),
  c.name,
  c.setName,
  c.price,
  bestVariant(c)?.avg30 ?? null,
  c.image ?? null,
  c.setId,
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
