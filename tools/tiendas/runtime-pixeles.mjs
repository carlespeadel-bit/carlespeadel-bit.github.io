#!/usr/bin/env node
// Detector de píxeles EN EJECUCIÓN: abre la web en el Chrome de depuración (9222),
// captura las peticiones de red reales y el estado de window.fbq/ttq/gtag.
// Uso: node runtime-pixeles.mjs dominio [dominio...]
const PORT = 9222;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36';

const HOSTS = [
  ['Meta', /facebook\.(com|net)/i],
  ['TikTok', /tiktok\.com|tiktokcdn/i],
  ['GoogleAds', /googleadservices|doubleclick\.net|googlesyndication|google\.com\/pagead/i],
  ['GTM/GA', /googletagmanager\.com|google-analytics\.com|analytics\.google\.com/i],
  ['Pinterest', /pinterest\.com|pinimg\.com\/ct/i],
  ['LinkedIn', /licdn\.com|linkedin\.com\/px/i],
  ['Hotjar', /hotjar\.com|hotjar\.io/i],
  ['Klaviyo', /klaviyo\.com/i],
  ['Mailchimp', /list-manage\.com|mailchimp\.com|chimpstatic/i],
  ['Tawk', /tawk\.to/i],
  ['Crisp', /crisp\.chat/i],
  ['Snap', /sc-static\.net|snapchat\.com/i],
  ['X/Twitter', /ads-twitter\.com|twitter\.com\/i\/adsct|t\.co\/i/i],
  ['Bing/Microsoft', /bat\.bing\.com|clarity\.ms/i],
  ['Trustpilot', /trustpilot\.com|trustpilot\.net/i],
  ['TikTok Pixel JS', /analytics\.tiktok\.com/i],
];

const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json().catch(() => null);
if (!list) { console.error('Chrome 9222 apagado'); process.exit(1); }
const page = list.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pend = new Map();
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); } };
const eventos = [];
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.method) eventos.push(m); });
await new Promise((r) => (ws.onopen = r));
await send('Page.enable'); await send('Network.enable'); await send('Runtime.enable');

for (const dom of process.argv.slice(2)) {
  eventos.length = 0;
  await send('Page.navigate', { url: `https://${dom}/` });
  await new Promise((r) => setTimeout(r, 9000));
  const urls = [];
  for (const e of eventos) {
    if (e.method === 'Network.requestWillBeSent') urls.push(e.params.request.url);
    if (e.method === 'Network.responseReceived') urls.push(e.params.response.url);
  }
  const uniq = [...new Set(urls)];
  const hits = {};
  for (const [k, re] of HOSTS) {
    const m = uniq.filter((u) => re.test(u));
    if (m.length) hits[k] = [...new Set(m.map((u) => new URL(u).hostname))].slice(0, 5);
  }
  const evalr = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    return r.result?.value ?? null;
  };
  const globals = await evalr(`JSON.stringify({
    fbq: typeof window.fbq, ttq: typeof window.ttq, gtag: typeof window.gtag,
    pintrk: typeof window.pintrk, snaptr: typeof window.snaptr, twq: typeof window.twq,
    hj: typeof window.hj, _learnq: typeof window._learnq, dataLayer: Array.isArray(window.dataLayer)?window.dataLayer.length:null,
    Tawk_API: typeof window.Tawk_API, $crisp: typeof window.$crisp,
    title: document.title.slice(0,60)
  })`);
  console.log(`${dom}\n  red=${JSON.stringify(hits)}\n  globals=${globals}`);
}
process.exit(0);
