#!/usr/bin/env node
// Informe de mercado para tiendas: el producto que se vende a 29 €/mes.
// Se genera con los datos del día y se publica como muestra gratuita.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { layout } from '../site/layout.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = (...p) => path.join(ROOT, 'dist', ...p);
const config = JSON.parse(await readFile(path.join(ROOT, 'config.json'), 'utf8'));
const cards = JSON.parse(await readFile(path.join(ROOT, 'data', 'cards.json'), 'utf8'));
const sets = JSON.parse(await readFile(path.join(ROOT, 'data', 'sets.json'), 'utf8'));
const cambios = JSON.parse(await readFile(path.join(ROOT, 'data', 'changes.json'), 'utf8').catch(() => '{}'));
const eur = (n) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const buenas = cards.filter((c) => c.price > 1);

// 1) movimientos creíbles (fuera los saltos absurdos)
const mov = [...(cambios.suben ?? []), ...(cambios.bajan ?? [])]
  .filter((m) => m.de > 0.5 && Math.abs(m.pct) < 60)
  .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))
  .slice(0, 8);
const porId = new Map(cards.map((c) => [c.id, c]));

// 2) oportunidad: cartas muy por debajo de su media de 30 días
const oportunidad = [];
for (const c of buenas) {
  const v = c.variants?.find((x) => (x.trend ?? x.avg)) ?? null;
  if (!v?.avg30 || v.avg30 < 10) continue;
  const desc = ((v.avg30 - (v.trend ?? v.avg)) / v.avg30) * 100;
  if (desc > 15) oportunidad.push({ c, desc, ref: v.avg30 });
}
oportunidad.sort((a, b) => b.desc - a.desc);

// 3) sets con más valor acumulado
const porSets = new Map();
for (const c of buenas) porSets.set(c.setName, (porSets.get(c.setName) ?? 0) + c.price);
const topSets = [...porSets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

const fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

const body = `
<h1>Informe de mercado Pokémon</h1>
<p class="lede">Semana del ${esc(fecha)} · ${buenas.length.toLocaleString('es-ES')} cartas con precio vigiladas · <b>muestra gratuita</b></p>
<p class="muted">Este es el informe que se genera cada mañana con los datos del día. Una tienda lo usa para decidir qué comprar, qué precio poner y qué mover del escaparate antes de que baje.</p>

<h2>1. Lo que se ha movido esta semana</h2>
${mov.length ? `<table class="listado"><thead><tr><th>Carta</th><th class="num">Antes</th><th class="num">Ahora</th><th class="num">Variación</th></tr></thead><tbody>
${mov.map((m) => {
  const c = porId.get(m.id);
  if (!c) return '';
  return `<tr><td><a href="/carta/${c.id}-${c.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}/">${esc(c.name)}</a> <span class="muted small">${esc(c.setName)}</span></td><td class="num">${eur(m.de)}</td><td class="num">${eur(m.a)}</td><td class="num">${m.pct > 0 ? '+' : ''}${m.pct.toFixed(1)} %</td></tr>`;
}).join('')}
</tbody></table>` : '<p class="muted">Semana plana: ninguna variación por encima del umbral.</p>'}

<h2>2. Cartas por debajo de su media de 30 días</h2>
<p class="muted small">Candidatas a comprar: cotizan más baratas que su media del último mes. El riesgo está en que la media también puede estar equivocada.</p>
${oportunidad.length ? `<table class="listado"><thead><tr><th>Carta</th><th class="num">Ahora</th><th class="num">Media 30 d</th><th class="num">Descuento</th></tr></thead><tbody>
${oportunidad.slice(0, 10).map((o) => `<tr><td>${esc(o.c.name)} <span class="muted small">${esc(o.c.setName)}</span></td><td class="num">${eur(o.c.price)}</td><td class="num">${eur(o.ref)}</td><td class="num">−${o.desc.toFixed(0)} %</td></tr>`).join('')}
</tbody></table>` : '<p class="muted">Sin descuentos relevantes frente a la media hoy.</p>'}

<h2>3. Sets con más valor acumulado</h2>
<table class="listado"><thead><tr><th>Set</th><th class="num">Valor de las cartas vigiladas</th></tr></thead><tbody>
${topSets.map(([n, v]) => `<tr><td>${esc(n)}</td><td class="num">${eur(v)}</td></tr>`).join('')}
</tbody></table>

<h2>Cómo usarlo en tienda</h2>
<ul class="pasos">
  <li><b>Compra:</b> las cartas de la sección 2 son las que un cliente te puede vender por debajo de su media.</li>
  <li><b>Escaparate:</b> lo que sube más del 30 % en un mes conviene venderlo ya, antes del recorte.</li>
  <li><b>Stock muerto:</b> los sets de la sección 3 concentran el valor; el resto no lo mueve nadie.</li>
</ul>

<p class="acciones">
  <a class="btn" href="/tiendas/">Recibir el informe cada mañana · 29 €/mes</a>
  <a class="btn ghost" href="/mercado/">Ver el radar completo</a>
</p>
<p class="nota small">Datos de referencia de Cardmarket vía TCGdex. Este informe es informativo: no es una tasación ni una recomendación de inversión.</p>`;

await mkdir(OUT('informe-muestra'), { recursive: true });
await writeFile(
  OUT('informe-muestra', 'index.html'),
  layout({
    title: `Informe de mercado Pokémon — muestra gratuita | ${config.brand}`,
    description: 'Ejemplo del informe diario de mercado para tiendas de cartas: qué se mueve, qué está por debajo de su media y qué sets concentran el valor.',
    url: '/informe-muestra/',
    body,
  }),
);
console.log(`informe: ${mov.length} movimientos · ${oportunidad.length} descuentos · ${topSets.length} sets`);
