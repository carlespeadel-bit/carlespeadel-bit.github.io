#!/usr/bin/env node
// Publica el radar del dia en el canal de Telegram (o en el chat configurado).
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT = process.env.TELEGRAM_CHANNEL_ID || process.env.TELEGRAM_CHAT_ID;
if (!TOKEN || !CHAT) { console.log('sin TELEGRAM_BOT_TOKEN / TELEGRAM_CHANNEL_ID'); process.exit(0); }

const cards = JSON.parse(await readFile(path.join(ROOT, 'data', 'cards.json'), 'utf8'));
const eur = (n) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
import config from '../config.json' with { type: 'json' };
const SITE = config.site.replace(/\/$/, '');

const con = cards
  .map((c) => {
    const v = (c.variants ?? []).find((x) => x.avg30 && x.avg7 && x.avg30 >= 10 && x.avg7 > 0);
    if (!v) return null;
    const pct = ((v.avg7 - v.avg30) / v.avg30) * 100;
    if (pct <= -60 || pct >= 60) return null;
    return { ...c, pct };
  })
  .filter(Boolean)
  .filter((c, i, a) => a.findIndex((x) => x.name === c.name && x.setId === c.setId) === i);

const suben = [...con].sort((a, b) => b.pct - a.pct).slice(0, 5);
const bajan = [...con].sort((a, b) => a.pct - b.pct).slice(0, 5);
const slug = (c) => `${c.id}-${c.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

const texto = [
  `📊 Radar de cartas · ${new Date().toLocaleDateString('es-ES')}`,
  '',
  'SUBIENDO (7 d)',
  ...suben.map((c) => `↑ ${c.name} — ${eur(c.price)} (${c.pct > 0 ? '+' : ''}${c.pct.toFixed(1)}%)`),
  '',
  'BAJANDO (7 d)',
  ...bajan.map((c) => `↓ ${c.name} — ${eur(c.price)} (${c.pct.toFixed(1)}%)`),
  '',
  `Todas con su ficha y su histórico: ${SITE}/mercado/`,
].join('\n');

const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ chat_id: CHAT, text: texto, disable_web_page_preview: true }),
});
const j = await r.json();
console.log(j.ok ? 'publicado en el canal' : 'error: ' + JSON.stringify(j));
