#!/usr/bin/env node
// Genera mapa.html: un fichero AUTOCONTENIDO y PRIVADO con el estado de la empresa.
// Se abre desde el disco, no se publica en ninguna web.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname);
const leer = async (f) => (await readFile(path.join(ROOT, f), 'utf8').catch(() => ''));
const j = async (f) => JSON.parse((await leer(f)) || '{}');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const backlog = await leer('BACKLOG.md');
const cadena = await leer('CADENA.md');
const plan = await leer('PLAN-90D.md');
const organigrama = await leer('ORGANIGRAMA.md');
const exig = await j('EXIGENCIA.json');
const empresa = await j('EMPRESA.json');
const objetivo = await leer('OBJETIVO.md');
const visitas = (objetivo.match(/\|\s*(\d+)\s*\|/) || [])[1] ?? '—';
const ultimaFila = [...objetivo.matchAll(/^\|.*\|$/gm)].pop()?.[0] ?? '';

const hitos = [...plan.matchAll(/\|\s*(M\d)\s*\|\s*([\d-]+)\s*\|\s*([^|]+)\|\s*([^|]+)\|/g)]
  .map((m) => ({ id: m[1], fecha: m[2].trim(), hito: m[3].trim(), estado: m[4].trim() }));
const hip = [...cadena.matchAll(/\|\s*(H[\d-]+)\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*\*{0,2}([^|*]+)\*{0,2}\s*\|/g)]
  .map((m) => ({ id: m[1], h: m[2].trim(), a: m[3].trim(), r: m[4].trim(), v: m[5].trim() }));
const cerradas = [...backlog.matchAll(/^- \[x\] \*\*(\w+)\*\* — ([^\n]{0,150})/gm)].map((m) => `${m[1]} — ${m[2]}`);
const abiertas = [...backlog.matchAll(/^- \[ \] \*\*(\w+)\*\* — ([^\n]{0,150})/gm)].map((m) => `${m[1]} — ${m[2]}`);
const equipo = empresa.empleados ?? [];

// --- medidor del objetivo -------------------------------------------------
// Supuestos declarados (HIPÓTESIS, no datos): comisión 7 %, venta media 40 €,
// conversión clic→compra 3 %, clic por visita 2 %.
const SUP = { comision: 0.07, ventaMedia: 40, conversion: 0.03, ctr: 0.02 };
const OBJETIVO_MES = 1000;
const panel = JSON.parse((await leer('../valorcarta/data/panel.json').catch(() => '{}')) || '{}');
const visitasTotales = panel.total ?? 0;

// clics reales con etiqueta (evento amazon-click en GoatCounter)
let clics = 0;
try {
  const token = (await leer('../valorcarta/.env')).match(/GOATCOUNTER_TOKEN=([^\s]+)/)?.[1] || process.env.GOATCOUNTER_TOKEN;
  if (token) {
    const r = await fetch('https://valorcarta.goatcounter.com/api/v0/stats/hits?limit=200', { headers: { authorization: `Bearer ${token}` } });
    const d = await r.json();
    clics = d.hits?.find((h) => h.path === 'amazon-click')?.count ?? 0;
  }
} catch {}

const pedidosMes = 0;                       // del informe de Amazon
const comisionMes = 0;                      // del informe de Amazon
const pedidosParaObjetivo = Math.ceil(OBJETIVO_MES / (SUP.ventaMedia * SUP.comision));
const clicsParaObjetivo = Math.ceil(pedidosParaObjetivo / SUP.conversion);
const visitasParaObjetivo = Math.ceil(clicsParaObjetivo / SUP.ctr);
const visitasParaPrimerEuro = Math.ceil(1 / (SUP.conversion * SUP.ctr));
const pct = (a, b) => Math.max(0, Math.min(100, (a / b) * 100));
const barra = (etiqueta, actual, meta, unidad, extra = '') => {
  const p = pct(actual, meta);
  return `<div class="medidor">
  <div class="medidor-cab"><b>${etiqueta}</b><span>${actual.toLocaleString('es-ES')} ${unidad} de ${meta.toLocaleString('es-ES')} · <b>${p.toFixed(p < 1 ? 2 : 0)} %</b>${extra}</span></div>
  <div class="medidor-barra"><i style="width:${p}%"></i></div>
</div>`;
};

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Mapa privado del negocio</title>
<style>
:root{--bg:#0a0a0b;--surface:#14141a;--line:#26262e;--fg:#f5f5f7;--muted:#9a9aa5;--accent:#ffcb05;--ok:#3fb950;--warn:#d29922;--bad:#f85149}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:28px 20px 60px}
.wrap{max-width:1080px;margin:0 auto}
h1{font-size:1.6rem;margin:0 0 4px}h2{font-size:1.15rem;margin:30px 0 10px;border-bottom:1px solid var(--line);padding-bottom:6px}
.muted{color:var(--muted)}.small{font-size:.85rem}
.medidor{margin:0 0 14px}
.medidor-cab{display:flex;justify-content:space-between;gap:10px;font-size:.9rem;margin-bottom:5px;flex-wrap:wrap}
.medidor-barra{background:#14141a;border:1px solid #26262e;border-radius:999px;height:14px;overflow:hidden}
.medidor-barra i{display:block;height:100%;background:linear-gradient(90deg,#ffcb05,#ff8a00);border-radius:999px;min-width:2px}
.cifras{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin:18px 0}
.cifra{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:14px}
.cifra span{display:block;font-size:1.6rem;font-weight:700;color:var(--accent)}.cifra b{font-weight:500;color:var(--muted);font-size:.85rem}
.barra{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0}
input{flex:1 1 240px;background:var(--surface);border:1px solid var(--line);color:var(--fg);border-radius:10px;padding:9px 12px}
button{background:var(--surface);border:1px solid var(--line);color:var(--muted);border-radius:999px;padding:7px 14px;cursor:pointer}
button.activo{background:var(--accent);border-color:var(--accent);color:#0a0a0b;font-weight:700}
section[hidden]{display:none}
ol,ul{list-style:none;padding:0;margin:0}
li{padding:7px 0 7px 20px;position:relative;border-bottom:1px solid var(--line)}
.hecho li::before{content:"✓";position:absolute;left:0;color:var(--ok)}
.pend li::before{content:"○";position:absolute;left:0;color:var(--warn)}
.cad li::before{content:"▸";position:absolute;left:0;color:var(--muted)}
.et{font-size:.72rem;padding:2px 8px;border-radius:999px;margin-left:6px}
.m{background:#4b1d1d;color:#ff9d9d}.v{background:#143a1c;color:#7ee787}.n{background:#2b2b33;color:#c9c9d1}
table{width:100%;border-collapse:collapse;font-size:.9rem}th,td{text-align:left;padding:7px 8px;border-bottom:1px solid var(--line)}
th{color:var(--muted);font-weight:500}
</style></head><body><div class="wrap">
<h1>Mapa privado del negocio</h1>
<p class="muted small">Generado el ${new Date().toISOString().slice(0, 16).replace('T', ' ')} · no se publica en ninguna web</p>
<h2>Cuánto queda para el objetivo</h2>
${barra('Comisión del mes', comisionMes, OBJETIVO_MES, '€')}
${barra('Pedidos', pedidosMes, pedidosParaObjetivo, 'pedidos')}
${barra('Clics con etiqueta', clics, clicsParaObjetivo, 'clics')}
${barra('Visitas totales', visitasTotales, visitasParaObjetivo, 'visitas')}
<p class="muted small">Supuestos (HIPÓTESIS, no datos): comisión 7 %, venta media 40 €, conversión 3 %, clic por visita 2 %. Para el <b>primer euro</b> hacen falta ~${visitasParaPrimerEuro.toLocaleString('es-ES')} visitas cualificadas y hoy hay ${visitasTotales.toLocaleString('es-ES')}.</p>
<p class="muted small"><b>Fecha estimada a este ritmo:</b> ${visitasTotales < visitasParaPrimerEuro ? 'no calculable — no hay visitas externas todavía' : 'ver nota del director en CONSEJO.md'}</p>

<div class="cifras">
  <div class="cifra"><span>${esc(visitas)}</span><b>visitas</b></div>
  <div class="cifra"><span>0,00 €</span><b>ingresos del mes</b></div>
  <div class="cifra"><span>${exig.racha_dias_con_avance ?? 0}</span><b>días con avance</b></div>
  <div class="cifra"><span>${hip.length}</span><b>hipótesis probadas</b></div>
  <div class="cifra"><span>${equipo.length}</span><b>agentes</b></div>
</div>
<div class="barra">
  <input id="q" placeholder="Buscar (carta, set, agente, hipótesis)" aria-label="Buscar">
  <button data-f="todo" class="activo">Todo</button>
  <button data-f="abierto">Abierto</button>
  <button data-f="cerrado">Cerrado</button>
  <button data-f="cadena">Hipótesis</button>
  <button data-f="equipo">Equipo</button>
</div>
<section data-s="hitos"><h2>Plan a 90 días</h2><ol class="pend" id="hitos">
${hitos.map((h) => `<li data-t>${esc(h.id)} · ${esc(h.hito)} <span class="muted small">${esc(h.fecha)} · ${esc(h.estado)}</span></li>`).join('')}
</ol></section>
<section data-s="cadena"><h2>Cadena de hipótesis</h2><ol class="cad" id="cadena">
${hip.map((h) => `<li data-t><b>${esc(h.id)}</b> ${esc(h.h)}<div class="small muted">Acción: ${esc(h.a)}</div><div class="small">${esc(h.r)}</div><span class="et ${/muerta/i.test(h.v) ? 'm' : /viva|curso/i.test(h.v) ? 'v' : 'n'}">${esc(h.v)}</span></li>`).join('')}
</ol></section>
<section data-s="cerrado"><h2>Cerrado (${cerradas.length})</h2><ol class="hecho" id="cerradas">
${cerradas.map((t) => `<li data-t>${esc(t)}</li>`).join('')}
</ol></section>
<section data-s="abierto"><h2>Abierto (${abiertas.length})</h2><ol class="pend" id="abiertas">
${abiertas.map((t) => `<li data-t>${esc(t)}</li>`).join('')}
</ol></section>
<section data-s="equipo"><h2>Quién responde de qué</h2>
<table><thead><tr><th>Agente</th><th>Objetivo</th><th>Estado</th><th>Intentos</th><th>Fallos</th></tr></thead><tbody id="equipo">
${equipo.map((e) => `<tr data-t><td>${esc(e.nombre)}</td><td class="small">${esc(e.objetivo)}</td><td>${esc(e.estado)}</td><td>${e.intentos ?? '—'}</td><td>${e.fallos ?? 0}</td></tr>`).join('')}
</tbody></table></section>
<p class="muted small" id="cuenta">—</p>
<p class="muted small">Última fila de OBJETIVO.md: ${esc(ultimaFila.replace(/\|/g, ' · ').slice(0, 160))}</p>
</div>
<script>
const S=[...document.querySelectorAll('[data-s]')],T=[...document.querySelectorAll('[data-t]')],B=[...document.querySelectorAll('[data-f]')],q=document.getElementById('q');
function pintar(f,txt){const s=(txt||'').toLowerCase().trim();S.forEach(x=>{const k=x.dataset.s;x.hidden=!(f==='todo'||k===f)});T.forEach(x=>{x.style.display=!s||x.textContent.toLowerCase().includes(s)?'':'none'});document.getElementById('cuenta').textContent=T.filter(x=>x.style.display!=='none').length+' elementos visibles'}
B.forEach(b=>b.onclick=()=>{B.forEach(x=>x.classList.toggle('activo',x===b));pintar(b.dataset.f,q.value)});
q.oninput=()=>pintar((B.find(x=>x.classList.contains('activo'))||{}).dataset?.f||'todo',q.value);
pintar('todo','');
</script></body></html>`;

await writeFile(path.join(ROOT, 'mapa.html'), html);
console.log('mapa.html generado · ' + html.length + ' bytes · ' + cerradas.length + ' cerradas, ' + abiertas.length + ' abiertas, ' + hip.length + ' hipótesis');
