#!/usr/bin/env node
// Analiza una URL: monetización, estructura, schema, captura de email.
// Uso: node scripts/analiza.mjs <url> [url2 ...]
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36';

const sig = {
  adsense: /adsbygoogle|pagead2\.googlesyndication/i,
  gpt: /securepubads|googletag\.cmd|doubleclick/i,
  amazon: /tag=[a-z0-9\-]+-21|amzn\.to|amazon-adsystem|ws-eu\.amazon/i,
  awin: /awin1\.com|zenaps|tradedoubler|impact\.com|prf\.hn/i,
  ebay: /ebay\.com| rover\.ebay|ebayinc/i,
  adsTxt: /criteo|taboola|outbrain|ezoic|mediavine|raptive|adsensecustom/i,
  klaviyo: /klaviyo/i,
  mailchimp: /mailchimp|list-manage/i,
  brevo: /brevo|sendinblue/i,
  shopify: /cdn\.shopify\.com|Shopify\.theme/i,
  woocommerce: /woocommerce/i,
  gtm: /googletagmanager|gtag\(/i,
  analytics4: /G-[A-Z0-9]{8,}/,
  hotjar: /hotjar|clarity\.ms/i,
  cookiebanner: /cookiebot|onetrust|complianz|iubenda|cookieyes/i,
  youtube: /youtube\.com\/(embed|watch)|youtu\.be/i,
  app: /apps\.apple\.com|play\.google\.com/i,
};

async function one(url) {
  const t0 = Date.now();
  let r, html = '';
  try {
    r = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'es-ES,es;q=0.9' }, redirect: 'follow' });
    html = await r.text();
  } catch (e) {
    console.log(`\n### ${url}\nERROR ${e.message}`);
    return;
  }
  const ms = Date.now() - t0;
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').replace(/\s+/g, ' ').trim();
  const desc = (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i)?.[1] ?? '').replace(/\s+/g, ' ').trim();
  const jsonld = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  const ldTypes = new Set();
  for (const j of jsonld) for (const m of j.matchAll(/"@type"\s*:\s*"([^"]+)"/g)) ldTypes.add(m[1]);
  const hits = Object.entries(sig).filter(([, re]) => re.test(html)).map(([k]) => k);
  const h1 = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()).slice(0, 3);
  const h2 = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 14);
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  // enlaces externos por dominio
  const hosts = {};
  for (const m of html.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)) {
    try { const h = new URL(m[1]).hostname.replace(/^www\./, ''); hosts[h] = (hosts[h] ?? 0) + 1; } catch {}
  }
  const ext = Object.entries(hosts).filter(([h]) => !url.includes(h)).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const internalLinks = Object.keys(hosts).length ? null : null;
  console.log(`\n### ${url}  [HTTP ${r.status}] ${ms}ms  ${html.length}b`);
  console.log('TITLE:', title);
  console.log('DESC:', desc.slice(0, 200));
  console.log('H1:', h1.join(' || '));
  console.log('H2:', h2.join(' | ').slice(0, 600));
  console.log('WORDS~', text.split(/\s+/).length);
  console.log('SIG:', hits.join(', '));
  console.log('LD:', [...ldTypes].join(', '));
  console.log('EXT:', ext.map(([h, n]) => `${h}(${n})`).join(' '));
  const emails = [...new Set((text.match(/[\w.+-]+@[\w-]+\.[\w.]{2,}/g) ?? []))].slice(0, 4);
  if (emails.length) console.log('EMAILS:', emails.join(' '));
}

for (const u of process.argv.slice(2)) await one(u);
