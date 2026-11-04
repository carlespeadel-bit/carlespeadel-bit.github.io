#!/usr/bin/env node
// Extrae resultados orgánicos de una SERP de Google en el Chrome de trabajo (9222).
// Uso: node scripts/serp.mjs "consulta" [n]
const [, , q, nRaw] = process.argv;
const N = Number(nRaw ?? 12);
const PORT = 9222;

const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
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

const url = 'https://www.google.com/search?hl=es&gl=es&num=20&q=' + encodeURIComponent(q);
await send('Page.navigate', { url });
await new Promise((r) => setTimeout(r, 4000));

// Aceptar consentimiento si aparece
await evaluate(`(()=>{const b=[...document.querySelectorAll('button,div[role=button]')].find(x=>/Aceptar todo|Accept all|Rechazar todo/i.test(x.innerText||'')); if(b){b.click(); return 'consent clic';} return 'sin consent';})()`);
await new Promise((r) => setTimeout(r, 2500));

const out = await evaluate(`(()=>{
  const res=[];
  const seen=new Set();
  const anchors=[...document.querySelectorAll('a[href^="http"]')];
  for(const a of anchors){
    const h=a.href;
    if(/google\\.|gstatic|youtube\\.com\\/redirect|schema\\.org/.test(h)) continue;
    const h3=a.querySelector('h3');
    if(!h3) continue;
    let u=h;
    try{ const p=new URL(h); if(p.hostname==='www.google.com'&&p.pathname==='/url') u=p.searchParams.get('q')||h; }catch(e){}
    if(seen.has(u)) continue;
    seen.add(u);
    const block=a.closest('div.g, div[data-hveid], div.MjjYud') || a.parentElement;
    const txt=(block?block.innerText:'').replace(/\\s+/g,' ').trim();
    res.push({t:h3.innerText.trim(), u, s:txt.slice(0,260)});
    if(res.length>=${N}) break;
  }
  return {title:document.title, results:res, blocked:/sorry\\/index|unusual traffic|captcha/i.test(location.href+' '+document.body.innerText.slice(0,500))};
})()`);

console.log('QUERY:', q);
console.log('TITLE:', out?.title);
console.log('BLOCKED:', out?.blocked);
for (const [i, r] of (out?.results ?? []).entries()) {
  console.log(`\n#${i + 1} ${r.t}\n   ${r.u}\n   ${r.s}`);
}
ws.close();
