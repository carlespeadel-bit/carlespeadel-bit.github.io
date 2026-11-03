#!/usr/bin/env node
// Trae las estadisticas de GoatCounter y las guarda para la pagina /panel/.
// Necesita GOATCOUNTER_TOKEN en .env o en el entorno.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const TOKEN = process.env.GOATCOUNTER_TOKEN;
const SITE = 'https://valorcarta.goatcounter.com';
const desde = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
const hasta = new Date().toISOString().slice(0, 10);

if (!TOKEN) {
  console.log('sin GOATCOUNTER_TOKEN: no se actualiza el panel');
  process.exit(0);
}

const api = async (p) => {
  const r = await fetch(`${SITE}/api/v0/${p}`, {
    headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
  });
  if (!r.ok) throw new Error(`${p}: HTTP ${r.status}`);
  return r.json();
};

const [total, hits, paths, refs] = await Promise.all([
  api(`stats/total?start=${desde}&end=${hasta}`),
  api(`stats/hits?start=${desde}&end=${hasta}`),
  api(`stats/toprefs?start=${desde}&end=${hasta}&limit=10`),
  api(`stats/toprefs?start=${desde}&end=${hasta}&limit=10`),
]);

const datos = {
  actualizado: new Date().toISOString(),
  desde,
  hasta,
  total: total.total ?? 0,
  porDia: (hits.hits ?? []).map((h) => ({ dia: h.day, visitas: h.count })),
  paginas: (paths.toprefs ?? []).slice(0, 10).map((p) => ({ ruta: p.path, visitas: p.count })),
  referidores: (refs.toprefs ?? []).slice(0, 10).map((r) => ({ ref: r.ref || 'directo', visitas: r.count })),
};
await mkdir(path.join(ROOT, 'data'), { recursive: true });
await writeFile(path.join(ROOT, 'data', 'panel.json'), JSON.stringify(datos, null, 1));
console.log(`panel: ${datos.total} visitas en 30 dias`);
