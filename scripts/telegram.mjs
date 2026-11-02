#!/usr/bin/env node
// Publica el resumen diario en Telegram.
// Necesita TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID en el entorno.
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const token = process.env.TELEGRAM_BOT_TOKEN;
const chat = process.env.TELEGRAM_CHAT_ID;

if (!token || !chat) {
  console.log('Sin TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID: no se envía nada (modo seco).');
  process.exit(0);
}

let texto;
try {
  texto = await readFile(path.join(ROOT, 'out', 'digest.txt'), 'utf8');
} catch {
  console.error('No existe out/digest.txt: ejecuta antes scripts/snapshot.mjs');
  process.exit(1);
}

// Telegram corta a 4096 caracteres
const trozos = [];
let actual = '';
for (const linea of texto.split('\n')) {
  if ((actual + linea).length > 3800) {
    trozos.push(actual);
    actual = '';
  }
  actual += linea + '\n';
}
if (actual.trim()) trozos.push(actual);

for (const t of trozos) {
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: chat,
      text: t,
      disable_web_page_preview: true,
    }),
  });
  const j = await r.json();
  console.log(j.ok ? `enviado (${t.length} chars)` : `error: ${JSON.stringify(j)}`);
  if (!j.ok) process.exit(1);
}
