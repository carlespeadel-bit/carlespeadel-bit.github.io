#!/usr/bin/env node
// Auditoría interna del sitio: busca fallos reales y los reparte por dueño.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SITE = 'https://valorcarta.github.io';
const dist = path.join(ROOT, 'dist');
const leer = async (f) => (await readFile(path.join(ROOT, f), 'utf8').catch(() => ''));
const leerDist = async (f) => (await readFile(path.join(dist, f), 'utf8').catch(() => ''));

const hallazgos = [];
const add = (sev, area, que, prueba, dueño) => hallazgos.push({ sev, area, que, prueba, dueño });

// 1) sitemap: todas las URLs responden 200 y no hay internas
const sitemap = await leerDist('sitemap.xml');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!urls.length) add('alta', 'SEO', 'El sitemap está vacío', 'dist/sitemap.xml sin <loc>', 'Ingeniería');
const prohibidas = urls.filter((u) => /\/(panel|mapa|oauth|gracias)\//.test(u));
if (prohibidas.length) add('alta', 'Privacidad', `${prohibidas.length} páginas internas en el sitemap`, prohibidas.slice(0, 3).join(', '), 'SEO');

const muestra = urls.filter((_, i) => i % 40 === 0).slice(0, 15);
const caidas = [];
const comprobar = async (u) => {
  for (let intento = 0; intento < 2; intento++) {
    try {
      const r = await fetch(u, { method: 'GET', headers: { 'user-agent': 'ValorCartaAudit/1.0' } });
      if (r.ok) return null;
      if (intento === 0) { await new Promise((x) => setTimeout(x, 40000)); continue; } // Pages tarda en propagar
      return `${u} → ${r.status}`;
    } catch (e) {
      if (intento === 0) { await new Promise((x) => setTimeout(x, 20000)); continue; }
      return `${u} → error ${e.message}`;
    }
  }
  return null;
};
for (const u of muestra) {
  const fallo = await comprobar(u);
  if (fallo) caidas.push(fallo);
}
if (caidas.length) add('alta', 'Disponibilidad', `${caidas.length}/${muestra.length} URLs de la muestra no responden`, caidas.slice(0, 3).join(' · '), 'Soporte');

// 2) fichas: aviso de afiliado solo con enlace de producto
const cartaSample = await leerDist('carta/base1-4-charizard/index.html');
if (cartaSample.includes('Enlace de afiliado') && !cartaSample.includes('amazon.es/dp/')) {
  add('alta', 'Afiliados', 'Aviso de afiliado sin enlace de producto', 'carta/base1-4-charizard', 'Afiliados');
}

// 3) titulos y descripciones duplicados
const home = await leerDist('index.html');
const desc = (home.match(/<meta name="description" content="([^"]+)"/) || [])[1] ?? '';
if (!desc || desc.length < 60) add('media', 'SEO', 'Meta description de portada corta o ausente', `${desc.length} caracteres`, 'Contenido');
if (!home.includes('rel="canonical"')) add('alta', 'SEO', 'Portada sin canonical', 'dist/index.html', 'SEO');

// 4) enlaces de busqueda de Amazon (comisión 2 % en vez de 7 %)
const conBusqueda = [...(await leer('dist/index.html')).matchAll(/amazon\.es\/s\?k=/g)].length;
if (conBusqueda) add('alta', 'Afiliados', 'Enlaces a búsqueda de Amazon', `${conBusqueda} en la portada`, 'Afiliados');

// 5) datos: movimientos imposibles
try {
  const ch = JSON.parse(await leer('data/changes.json'));
  const locos = [...(ch.suben ?? []), ...(ch.bajan ?? [])].filter((m) => Math.abs(m.pct) > 1000);
  if (locos.length) add('alta', 'Datos', `${locos.length} movimientos por encima del 1000 % (dato sucio)`, locos.slice(0, 2).map((m) => `${m.id}: ${m.de.toFixed(2)}→${m.a.toFixed(2)}`).join(' · '), 'Datos');
} catch {}

// 6) metricas: visitas propias contadas como reales
const panel = JSON.parse((await leer('data/panel.json')) || '{}');
if (panel.total && panel.total < 50) add('media', 'Datos', 'Tráfico propio sin filtrar: las métricas no distinguen visitante de automatización', `total ${panel.total} visitas`, 'Datos');

// 7) ingles: parejas hreflang
const enIndex = await leerDist('en/index.html');
if (enIndex && !enIndex.includes('hreflang="es"')) add('media', 'SEO', 'Versión EN sin hreflang hacia ES', 'dist/en/index.html', 'SEO');

// 8) ASINs: sin duplicados y con formato válido
try {
  const asins = JSON.parse(await leer('data/asins.json'));
  const todos = Object.values(asins).flat().map((a) => a.asin);
  const malos = todos.filter((a) => !/^B0[A-Z0-9]{8}$/.test(a));
  const dup = todos.filter((a, i) => todos.indexOf(a) !== i);
  if (malos.length) add('media', 'Afiliados', `${malos.length} ASIN con formato inválido`, malos.join(', '), 'Afiliados');
  if (dup.length) add('baja', 'Afiliados', `${dup.length} ASIN repetidos entre sets`, [...new Set(dup)].join(', '), 'Afiliados');
} catch {}

const orden = { alta: 0, media: 1, baja: 2 };
hallazgos.sort((a, b) => orden[a.sev] - orden[b.sev]);
const fecha = new Date().toISOString().slice(0, 16).replace('T', ' ');
const md = `# Auditoría interna — ${fecha}

**Hallazgos:** ${hallazgos.length} · altos: ${hallazgos.filter((h) => h.sev === 'alta').length} · medios: ${hallazgos.filter((h) => h.sev === 'media').length} · bajos: ${hallazgos.filter((h) => h.sev === 'baja').length}

| Severidad | Área | Qué falla | Prueba | Dueño |
|---|---|---|---|---|
${hallazgos.map((h) => `| ${h.sev} | ${h.area} | ${h.que} | ${h.prueba} | ${h.dueño} |`).join('\n') || '| — | — | sin hallazgos | — | — |'}

## Reparto (cada uno sabe qué le toca)
${[...new Set(hallazgos.map((h) => h.dueño))].map((d) => `- **${d}**: ${hallazgos.filter((h) => h.dueño === d).length} hallazgos`).join('\n') || '- nada que repartir'}
`;
await writeFile(path.join(path.resolve(ROOT, '..'), 'dinero', 'AUDITORIA-INTERNA.md'), md);
console.log(md);
