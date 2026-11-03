#!/usr/bin/env node
// Trae estadisticas de GoatCounter y las guarda para /panel/.
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const TOKEN = process.env.GOATCOUNTER_TOKEN;
const SITE = 'https://valorcarta.goatcounter.com';
const desde = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
const hasta = new Date().toISOString().slice(0, 10);

if (!TOKEN) { console.log('sin GOATCOUNTER_TOKEN'); process.exit(0); }

const api = async (p) => {
  const r = await fetch(`${SITE}/api/v0/${p}`, { headers: { authorization: `Bearer ${TOKEN}` } });
  if (!r.ok) throw new Error(`${p}: HTTP ${r.status}`);
  return r.json();
};

// sin filtro de fechas: el filtro por rango de la API devuelve datos incompletos
const [total, hits, refs] = await Promise.all([
  api('stats/total'),
  api('stats/hits?limit=200'),
  api('stats/toprefs'),
]);

const porDia = (total.stats ?? []).map((s) => ({
  dia: s.day,
  visitas: (s.hourly ?? []).reduce((a, b) => a + b, 0),
}));

const datos = {
  actualizado: new Date().toISOString(),
  desde, hasta,
  total: total.total ?? 0,
  porDia,
  paginas: (hits.hits ?? []).sort((a, b) => b.count - a.count).slice(0, 10).map((h) => ({ ruta: h.path, visitas: h.count })),
  referidores: (refs.stats ?? []).slice(0, 10).map((r) => ({ ref: r.name || 'directo', visitas: r.count })),
};
await mkdir(path.join(ROOT, 'data'), { recursive: true });
await writeFile(path.join(ROOT, 'data', 'panel.json'), JSON.stringify(datos, null, 1));
console.log(`panel: ${datos.total} visitas · ${datos.porDia.length} dias · ${datos.paginas.length} paginas`);
