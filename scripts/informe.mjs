#!/usr/bin/env node
// Informe semanal de mercado para tiendas y revendedores (producto B2B).
// Uso: node scripts/informe.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'out');
const cards = JSON.parse(await readFile(path.join(ROOT, 'data', 'cards.json'), 'utf8'));
const eur = (n) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
const pct = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

const hoy = new Date();
const iso = hoy.toISOString().slice(0, 10);
const semana = `${iso}T00:00:00`;

const conPrecio = cards.filter((c) => c.price > 0);
const total = conPrecio.reduce((s, c) => s + c.price, 0);

// variación de 30 días por carta (precio actual frente a media de 30 días)
const mov = conPrecio
  .map((c) => {
    const v = (c.variants ?? []).find((x) => x.avg30 && x.avg7 && x.avg30 > 0 && x.avg7 > 0);
    if (!v) return null;
    // media de 7 días frente a media de 30: más estable que el precio del día
    return { ...c, base30: v.avg30, var30: ((v.avg7 - v.avg30) / v.avg30) * 100 };
  })
  // solo cartas con liquidez suficiente y sin saltos absurdos de datos
  .filter((c) => c && c.base30 >= 10 && c.price >= 10)
  .filter((c) => c.var30 > -60 && c.var30 < 60)
  .filter((c, i, arr) => arr.findIndex((x) => x.name === c.name && x.setId === c.setId) === i);

const suben = [...mov].sort((a, b) => b.var30 - a.var30).slice(0, 10);
const bajan = [...mov].sort((a, b) => a.var30 - b.var30).slice(0, 10);

// sets: variación media de las cartas del set (solo sets con 5+ cartas con datos)
const porSet = new Map();
for (const c of mov) {
  if (!porSet.has(c.setId)) porSet.set(c.setId, { name: c.setName, vars: [], valor: 0, n: 0 });
  const s = porSet.get(c.setId);
  s.vars.push(c.var30);
  s.valor += c.price;
  s.n++;
}
const sets = [...porSet.entries()]
  .filter(([, s]) => s.n >= 5)
  .map(([id, s]) => ({ id, ...s, media: s.vars.reduce((a, b) => a + b, 0) / s.vars.length }))
  .sort((a, b) => b.media - a.media);

const fila = (c, cls) => `<tr>
  <td style="padding:6px 8px;border-bottom:1px solid #eee">${c.name}<br><span style="color:#888;font-size:12px">${c.setName}</span></td>
  <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${eur(c.price)}</td>
  <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;color:${cls}">${pct(c.var30)}</td>
</tr>`;

const html = `<!doctype html><html lang="es"><body style="margin:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111">
<div style="max-width:640px;margin:0 auto;padding:24px">
  <div style="background:#0a0a0b;color:#fff;padding:20px 24px;border-radius:14px 14px 0 0">
    <div style="font-size:13px;color:#ffcb05;letter-spacing:.1em;text-transform:uppercase">Informe semanal · ${iso}</div>
    <h1 style="margin:6px 0 0;font-size:22px">El mercado de cartas esta semana</h1>
  </div>
  <div style="background:#fff;padding:24px;border-radius:0 0 14px 14px">
    <p style="margin:0 0 18px;color:#444">
      ${conPrecio.length.toLocaleString('es-ES')} cartas con precio de mercado, ${mov.length.toLocaleString('es-ES')} con histórico de 30 días.
      Valor total del catálogo: <b>${eur(total)}</b>.
    </p>

    <h2 style="font-size:15px;margin:22px 0 8px;color:#0a0a0b">Lo que más sube (30 días)</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${suben.map((c) => fila(c, '#0a7d3f')).join('')}</table>

    <h2 style="font-size:15px;margin:22px 0 8px;color:#0a0a0b">Lo que más baja (30 días)</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${bajan.map((c) => fila(c, '#b3261e')).join('')}</table>

    <h2 style="font-size:15px;margin:22px 0 8px;color:#0a0a0b">Sets con más movimiento</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      ${sets
        .slice(0, 6)
        .map(
          (s) => `<tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee">${s.name}<br><span style="color:#888;font-size:12px">${s.n} cartas</span></td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${eur(s.valor)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;color:${s.media >= 0 ? '#0a7d3f' : '#b3261e'}">${pct(s.media)}</td>
      </tr>`,
        )
        .join('')}
    </table>

    <p style="margin:26px 0 0;color:#444">¿Quieres esto aplicado a tu stock, con tus cartas y tus precios de compra?
    Responde a este correo y te lo monto.</p>
    <p style="margin:18px 0 0;color:#999;font-size:12px">Fuente: precios de mercado de Cardmarket vía TCGdex. Datos de referencia, no tasación.
    ValorCarta · date de baja respondiendo "baja".</p>
  </div>
</div></body></html>`;

const texto = [
  `INFORME SEMANAL — ${iso}`,
  `${conPrecio.length} cartas con precio · catálogo ${eur(total)}`,
  '',
  'SUBEN (30d):',
  ...suben.map((c) => `  ${c.name} (${c.setName}): ${eur(c.price)} ${pct(c.var30)}`),
  '',
  'BAJAN (30d):',
  ...bajan.map((c) => `  ${c.name} (${c.setName}): ${eur(c.price)} ${pct(c.var30)}`),
  '',
  'SETS:',
  ...sets.slice(0, 6).map((s) => `  ${s.name}: ${eur(s.valor)} ${pct(s.media)}`),
].join('\n');

await mkdir(OUT, { recursive: true });
await writeFile(path.join(OUT, `informe-${iso}.html`), html);
await writeFile(path.join(OUT, `informe-${iso}.txt`), texto);
await writeFile(path.join(OUT, 'informe-ultimo.html'), html);

console.log(`informe ${iso}: ${suben.length} subidas, ${bajan.length} bajadas, ${sets.length} sets`);
console.log(`  out/informe-${iso}.html (${(html.length / 1024).toFixed(0)} KB) + .txt`);
