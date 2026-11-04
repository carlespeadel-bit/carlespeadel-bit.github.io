#!/usr/bin/env node
// Test duro: navega, hace scroll, espera 15s y luego mide red + globals.
const PORT = 9222;
const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = list.filter((t) => t.type === 'page' && /^https?:/.test(t.url)).pop();
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const pend = new Map();
const send = (m, p = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const ev = [];
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); } if (m.method) ev.push(m); };
await new Promise((r) => (ws.onopen = r));
await send('Page.enable'); await send('Network.enable'); await send('Runtime.enable');
for (const url of process.argv.slice(2)) {
  ev.length = 0;
  await send('Page.navigate', { url });
  await new Promise((r) => setTimeout(r, 5000));
  for (let i = 0; i < 3; i++) {
    await send('Runtime.evaluate', { expression: 'window.scrollBy(0,900)' });
    await new Promise((r) => setTimeout(r, 1200));
  }
  await new Promise((r) => setTimeout(r, 8000));
  const urls = [...new Set(ev.filter((e) => e.params?.request?.url).map((e) => e.params.request.url))];
  const terceros = urls.filter((u) => /facebook|tiktok|googleads|doubleclick|pinterest|licdn|hotjar|klaviyo|mailchimp|tawk|crisp|snapchat|clarity|trustpilot|klarna|paypal/.test(u))
    .map((u) => { try { return new URL(u).hostname; } catch { return u; } });
  const g = await send('Runtime.evaluate', { returnByValue: true, expression: `JSON.stringify({fbq:typeof fbq,ttq:typeof ttq,gtag:typeof gtag,pintrk:typeof pintrk,learnq:typeof _learnq,forms:document.querySelectorAll('form[action*=newsletter],form[class*=newsletter],input[type=email]').length,popup:(document.body.innerText.match(/[^\\n]{0,60}(10\\s?%|descuento|cupon|cupón)[^\\n]{0,60}/i)||[''])[0]})` });
  console.log(`\n${url}\n  terceros=${[...new Set(terceros)].join(', ')}\n  globals=${g.result?.value}`);
}
process.exit(0);
