#!/usr/bin/env node
// Escáner de píxeles/etiquetas en el HTML servido de una tienda.
// Uso: node pixeles.mjs dominio1 dominio2 ...
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36';
const OUT = path.resolve(import.meta.dirname, 'html');

const FIRMAS = {
  'Meta': [/fbq\s*\(/i, /connect\.facebook\.net/i, /facebook\.com\/tr/i, /fbq\s*=\s*function/i],
  'TikTok': [/analytics\.tiktok\.com/i, /ttq\s*\.\s*(load|track|page)/i, /ttq\s*=\s*window/i],
  'Google Ads': [/\bAW-\d{6,}/, /googleads\.g\.doubleclick\.net/i, /googleadservices/i, /\/pagead\/conversion/i],
  'gtag/GTM': [/gtag\s*\(/i, /googletagmanager\.com\/gtm\.js/i, /GTM-[A-Z0-9]{5,}/],
  'GA4': [/\bG-[A-Z0-9]{8,}/, /gtag\s*\(\s*['"]config['"]\s*,\s*['"]G-/i],
  'Pinterest': [/pintrk/i, /ct\.pinterest\.com/i, /pinterest\.com\/ct\//i],
  'LinkedIn': [/snap\.licdn\.com/i, /snap\.licdn/i, /_linkedin_partner_id/i],
  'Hotjar': [/hotjar/i, /static\.hotjar\.com/i, /hj\s*\(/i],
  'Klaviyo': [/klaviyo/i, /static\.klaviyo\.com/i, /_learnq/i],
  'Mailchimp': [/mailchimp/i, /list-manage\.com/i, /chimpstatic/i],
  'Tawk': [/tawk\.to/i, /tawk\s*\(/i],
  'Crisp': [/crisp\.chat/i, /\$crisp/i],
  'Snapchat': [/sc-static\.net\/scevent/i, /snaptr/i, /snap\.sc/i],
  'X/Twitter': [/static\.ads-twitter\.com/i, /twq\s*\(/i, /platform\.twitter\.com\/oct/i],
  'Microsoft Ads': [/bat\.bing\.com/i, /uetq/i, /clarity\.ms/i],
  'Trustpilot': [/trustpilot/i, /widget\.trustpilot/i],
  'Judge.me': [/judge\.me/i, /judgeme/i],
  'Shopify': [/cdn\.shopify\.com/i, /shopify\.theme/i],
  'PrestaShop': [/prestashop/i, /var\s+prestashop/i],
  'WooCommerce': [/woocommerce/i],
};

const REDES = {
  Instagram: /instagram\.com\/([A-Za-z0-9_.]{2,30})/gi,
  TikTok: /tiktok\.com\/@([A-Za-z0-9_.]{2,30})/gi,
  YouTube: /youtube\.com\/(@[A-Za-z0-9_.-]{2,40}|channel\/[A-Za-z0-9_-]+|c\/[A-Za-z0-9_.-]+)/gi,
  Discord: /discord\.(gg|com\/invite)\/([A-Za-z0-9-]{3,30})/gi,
  WhatsApp: /wa\.me\/(\d{6,})|api\.whatsapp\.com\/send\?phone=(\d{6,})|whatsapp\.com\/channel\/([A-Za-z0-9]+)/gi,
  Telegram: /t\.me\/([A-Za-z0-9_]{3,40})/gi,
  Facebook: /facebook\.com\/([A-Za-z0-9_.-]{3,40})/gi,
  Twitch: /twitch\.tv\/([A-Za-z0-9_]{3,30})/gi,
  X: /(?:twitter|x)\.com\/([A-Za-z0-9_]{2,20})/gi,
};

const PISTAS_EMAIL = [/10\s*%\s*(de\s*)?(dcto|descuento|off)/i, /-10\s*%/i, /cup[oó]n/i, /newsletter/i, /suscr[ií]bete/i, /bolet[ií]n/i];

async function trae(url) {
  const r = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'es-ES,es;q=0.9' }, redirect: 'follow', signal: AbortSignal.timeout(30000) });
  return { status: r.status, final: r.url, html: await r.text() };
}

await mkdir(OUT, { recursive: true });
const res = [];
for (const dom of process.argv.slice(2)) {
  const fila = { dom, status: 0, final: '', pix: {}, redes: {}, email: [], pistas: [] };
  try {
    const { status, final, html } = await trae(`https://${dom}/`);
    fila.status = status; fila.final = final;
    await writeFile(path.join(OUT, `${dom}.html`), html);
    for (const [k, rs] of Object.entries(FIRMAS)) {
      const hits = rs.filter((re) => re.test(html));
      if (hits.length) fila.pix[k] = hits.map((h) => (html.match(h) ?? [''])[0].slice(0, 40)).filter(Boolean);
    }
    for (const [k, re] of Object.entries(REDES)) {
      const set = new Set();
      for (const m of html.matchAll(re)) {
        const h = (m[1] ?? m[2] ?? m[3] ?? '').replace(/[/"'<>]+$/, '');
        if (h && !/^(sharer|share|intent|plugins|tr|dialog|v\d|www|p|profile\.php)$/i.test(h)) set.add(h.toLowerCase());
      }
      if (set.size) fila.redes[k] = [...set].slice(0, 8);
    }
    for (const re of PISTAS_EMAIL) {
      const m = html.match(re);
      if (m) fila.pistas.push(m[0].toLowerCase());
    }
    // señales de marketing por email
    fila.email = [...new Set([...(fila.pix.Klaviyo ? ['Klaviyo'] : []), ...(fila.pix.Mailchimp ? ['Mailchimp'] : [])])];
  } catch (e) {
    fila.error = String(e.message ?? e).slice(0, 80);
  }
  res.push(fila);
  console.log(`${dom} [${fila.status}] pix=${Object.keys(fila.pix).join(',') || '-'} redes=${JSON.stringify(fila.redes)} email=${fila.email.join('/') || '-'}`);
}
await writeFile(path.join(import.meta.dirname, 'pixeles.json'), JSON.stringify(res, null, 2));
console.log('\nGuardado en tools/tiendas/pixeles.json');
