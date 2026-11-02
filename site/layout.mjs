import config from '../config.json' with { type: 'json' };

export const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const eur = (n) =>
  n == null || !isFinite(n)
    ? '—'
    : new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

const money = (n) => (n == null ? '—' : Number(n).toFixed(2).replace('.', ',') + ' €');

export function slugify(s = '') {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const cardSlug = (c) => `${c.id}-${slugify(c.name)}`;

export function layout({ title, description, url, body, jsonld, image, noindex }) {
  const canonical = config.site.replace(/\/$/, '') + url;
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
${noindex ? '<meta name="robots" content="noindex,follow">' : ''}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(config.brand)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
${image ? `<meta property="og:image" content="${esc(image)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="/assets/style.css">
<link rel="icon" href="/assets/icon.svg" type="image/svg+xml">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
</head>
<body>
<header class="top">
  <a class="brand" href="/"><span class="dot"></span>${esc(config.brand)}</a>
  <nav>
    <a href="/valorar/">Valorar colección</a>
    <a href="/cartas/">Cartas</a>
    <a href="/premium/" class="cta-mini">Alertas</a>
  </nav>
</header>
<main>${body}</main>
<footer>
  <p class="disclosure">En calidad de Afiliado de Amazon, obtengo ingresos por las compras adscritas que cumplen los requisitos aplicables.</p>
  <p class="foot-links">
    <a href="/valorar/">Valorar colección</a> · <a href="/guias/">Guías</a> · <a href="/premium/">Alertas de precio</a> ·
    <a href="/aviso-legal/">Aviso legal</a> · <a href="/privacidad/">Privacidad</a>
  </p>
  <p class="muted">Precios de referencia de Cardmarket, actualizados a diario. No es una tasación: el estado de la carta manda. © ${new Date().getFullYear()} ${esc(config.brand)}</p>
</footer>
<script src="/assets/app.js" defer></script>
</body>
</html>`;
}

export function priceTable(card) {
  if (!card.variants?.length) return '<p class="muted">Sin datos de precio para esta carta todavía.</p>';
  const rows = card.variants
    .filter((v) => v.avg || v.trend || v.holoAvg)
    .map((v) => {
      const base = v.trend ?? v.avg;
      const cap = (t = 'normal') => t.charAt(0).toUpperCase() + t.slice(1);
      const label = cap(v.type || 'normal') + (v.subtype && v.subtype !== 'estándar' ? ` · ${v.subtype}` : '');
      return `<tr>
        <td>${esc(label)}</td>
        <td class="num">${money(base)}</td>
        <td class="num muted">${money(v.avg30)}</td>
        <td class="num muted">${money(v.low)}</td>
      </tr>`;
    })
    .join('');
  if (!rows) return '<p class="muted">Sin datos de precio para esta carta todavía.</p>';
  return `<table class="prices">
    <thead><tr><th>Versión</th><th class="num">Precio</th><th class="num">Media 30 d</th><th class="num">Mínimo</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

export const bestVariant = (card) =>
  (card.variants ?? [])
    .filter((v) => (v.trend ?? v.avg) != null)
    .sort((a, b) => (b.trend ?? b.avg) - (a.trend ?? a.avg))[0] ?? null;

export function trendLine(card) {
  const v = bestVariant(card);
  if (!v || (v.avg30 == null && v.avg == null)) return '';
  const pts = [v.avg30, v.avg7 ?? v.avg30, v.avg1 ?? v.avg7 ?? v.avg30, v.avg];
  const max = Math.max(...pts);
  const min = Math.min(...pts);
  const span = max - min || 1;
  const w = 220;
  const h = 48;
  const path = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${((i / (pts.length - 1)) * w).toFixed(1)},${(h - ((p - min) / span) * (h - 6) - 3).toFixed(1)}`)
    .join(' ');
  const delta = pts[3] - pts[0];
  const pct = pts[0] ? (delta / pts[0]) * 100 : 0;
  return `<div class="trend">
    <svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><path d="${path}" fill="none" stroke="${delta >= 0 ? '#35d07f' : '#ff5c5c'}" stroke-width="2"/></svg>
    <span class="muted">30 días: <b class="${delta >= 0 ? 'up' : 'down'}">${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%</b></span>
  </div>`;
}

export const amazonLink = (query) =>
  `https://www.amazon.es/s?k=${encodeURIComponent(query)}&tag=${encodeURIComponent(config.amazonTag)}`;
