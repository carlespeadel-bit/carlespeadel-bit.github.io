#!/usr/bin/env node
// Helper CDP: navega y devuelve texto y enlaces. Uso: node cdp.mjs <url> [filtro]
import { writeFile } from 'node:fs/promises';

const [, , url, filtro] = process.argv;
const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const page = list.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const pend = new Map();
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); } };
await new Promise((r) => (ws.onopen = r));
await send('Page.enable'); await send('Runtime.enable');
const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;
await send('Page.navigate', { url });
await new Promise((r) => setTimeout(r, 4000));
const text = await ev('document.body?document.body.innerText.replace(/\\s+/g," "):"(sin body)"');
const links = await ev('JSON.stringify([...document.querySelectorAll("a[href]")].map(a=>a.href).filter(h=>/contact|aviso|legal|nosotros|quienes|tienda/i.test(h)).slice(0,25))');
const mail = await ev('JSON.stringify([...new Set((document.body?document.body.innerHTML:"").match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g)||[])])');
console.log('URL:', await ev('location.href'));
console.log('EMAILS:', mail);
console.log('LINKS:', links);
const t = String(text || '');
if (filtro) {
  const i = t.toLowerCase().indexOf(filtro.toLowerCase());
  console.log('CTX:', i >= 0 ? t.slice(Math.max(0, i - 300), i + 400) : '(no)');
} else console.log('TEXTO:', t.slice(0, 700));
await writeFile('/tmp/cdp-last.txt', t);
ws.close();
