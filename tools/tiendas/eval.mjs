#!/usr/bin/env node
// Evalúa JS en una pestaña concreta del Chrome de trabajo.
// Uso: node tools/tiendas/eval.mjs --p=youtube 'expresion'
//      node tools/tiendas/eval.mjs --p=youtube --nav=<url> 'expresion'
const PORT = 9222;
const argv = process.argv.slice(2);
const opt = (k) => { const a = argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const expr = argv.filter((x) => !x.startsWith('--')).join(' ');
const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const pages = list.filter((t) => t.type === 'page' && /^https?:/.test(t.url));
const filt = opt('p');
const page = (filt ? pages.find((t) => t.url.includes(filt)) : null) ?? pages[pages.length - 1];
if (!page) { console.error('sin pestaña http'); process.exit(1); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pend = new Map();
const send = (m, p = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); } };
await new Promise((r) => (ws.onopen = r));
await send('Page.enable'); await send('Runtime.enable');
const nav = opt('nav');
if (nav) { await send('Page.navigate', { url: nav }); await new Promise((r) => setTimeout(r, 6000)); }
const r = await send('Runtime.evaluate', { expression: `(()=>{try{return ${expr}}catch(e){return 'ERR '+e.message}})()`, returnByValue: true, awaitPromise: true });
if (r.exceptionDetails) console.log('EXC', r.exceptionDetails.text);
else console.log(typeof r.result?.value === 'string' ? r.result.value : JSON.stringify(r.result?.value, null, 1));
process.exit(0);
