#!/usr/bin/env node
// Publica una nota en Nostr con enlace a ValorCarta. Sin cuentas, sin teléfono.
import { schnorr } from '@noble/curves/secp256k1.js';
import { createHash, randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const KEYS = new URL('./keys.json', import.meta.url);
let keys;
try { keys = JSON.parse(await readFile(KEYS, 'utf8')); }
catch {
  const sk = Buffer.from(randomBytes(32)).toString('hex');
  keys = { sk, pk: Buffer.from(schnorr.getPublicKey(new Uint8Array(Buffer.from(sk,'hex')))).toString('hex') };
  await writeFile(KEYS, JSON.stringify(keys));
}

const content = process.argv[2] ?? 'Precios de cartas coleccionables actualizados a diario: Pokémon, Yu-Gi-Oh y Magic. 50.000 cartas con histórico.\nhttps://valorcarta.github.io';
const event = {
  pubkey: keys.pk,
  created_at: Math.floor(Date.now() / 1000),
  kind: 1,
  tags: [['t', 'pokemon'], ['t', 'tcg'], ['r', 'https://valorcarta.github.io']],
  content,
};
const serialised = JSON.stringify([0, event.pubkey, event.created_at, event.kind, event.tags, event.content]);
event.id = createHash('sha256').update(serialised).digest('hex');
const skBytes = new Uint8Array(Buffer.from(keys.sk, 'hex'));
event.sig = Buffer.from(schnorr.sign(new Uint8Array(Buffer.from(event.id,'hex')), skBytes)).toString('hex');

const relays = ['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.nostr.band', 'wss://nostr.mom'];
let ok = 0;
await Promise.all(relays.map((url) => new Promise((resolve) => {
  const ws = new WebSocket(url);
  const t = setTimeout(() => { try { ws.close(); } catch {} resolve(); }, 8000);
  ws.onopen = () => ws.send(JSON.stringify(['EVENT', event]));
  ws.onmessage = (m) => {
    try {
      const [tipo, , aceptado, msg] = JSON.parse(m.data);
      if (tipo === 'OK') { if (aceptado) ok++; else console.log(url, 'rechazado:', msg); clearTimeout(t); ws.close(); resolve(); }
    } catch {}
  };
  ws.onerror = () => { clearTimeout(t); resolve(); };
})));
console.log(`publicado en ${ok}/${relays.length} relays · id ${event.id.slice(0, 12)} · npub pendiente`);
console.log('ver:', `https://njump.me/${event.id}`);
