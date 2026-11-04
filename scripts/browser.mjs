#!/usr/bin/env node
// Control del Chrome de trabajo (perfil ~/.vc-chrome, puerto 9222).
// Uso:
//   node scripts/browser.mjs open <url>
//   node scripts/browser.mjs text [selector]
//   node scripts/browser.mjs click <selector>
//   node scripts/browser.mjs type <selector> <texto>
//   node scripts/browser.mjs wait <ms>
//   node scripts/browser.mjs shot <fichero.png>
import { writeFile } from 'node:fs/promises';

const [, , cmd, ...args] = process.argv;
const PORT = 9222;

const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json().catch(() => null);
if (!list) { console.error('Chrome de trabajo apagado. Ejecuta: ~/bin/vc-browser'); process.exit(1); }
const page = list.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pend = new Map();
const send = (method, params = {}) =>
  new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); } };
await new Promise((r) => (ws.onopen = r));
await send('Page.enable');
await send('Runtime.enable');

const evaluate = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) return 'ERROR: ' + (r.exceptionDetails.text ?? '');
  return r.result?.value;
};

switch (cmd) {
  case 'open': {
    await send('Page.navigate', { url: args[0] });
    await new Promise((r) => setTimeout(r, 3500));
    console.log(await evaluate('location.href'));
    break;
  }
  case 'text': {
    const sel = args[0] ?? 'body';
    console.log(await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); return e? e.innerText.replace(/\\s+/g,' ').slice(0,1200):'no encontrado';})()`));
    break;
  }
  case 'click': {
    console.log(await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(args[0])}); if(!e) return 'no encontrado'; e.click(); return 'clic en '+${JSON.stringify(args[0])};})()`));
    break;
  }
  case 'type': {
    const [sel, ...rest] = args;
    const texto = rest.join(' ');
    console.log(await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return 'no encontrado';
      const set=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
      set.call(e, ${JSON.stringify(texto)}); e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true}));
      return 'escrito en '+${JSON.stringify(sel)};})()`));
    break;
  }
  case 'wait': {
    await new Promise((r) => setTimeout(r, Number(args[0] ?? 2000)));
    console.log('ok');
    break;
  }
  case 'shot': {
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    await writeFile(args[0], Buffer.from(data, 'base64'));
    console.log('captura en ' + args[0]);
    break;
  }
  default:
    console.log('comandos: open | text | click | type | wait | shot');
}
ws.close();
