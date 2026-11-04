// Bloque "Dónde comprar" de la ficha de carta (ES y EN).
//
// Reglas que cumple este módulo (y que se pueden comprobar leyendo la salida):
// - Solo enlaces a producto (/dp/<ASIN>), nunca a búsqueda (/s?k=). Comisión 7 % vs 2 %.
// - Un ASIN solo se pinta si está en data/asins.json. Aquí no se inventa ninguno.
// - El precio que se muestra es el de referencia de la carta (Cardmarket, campo
//   `price` de data/cards.json). Nunca un precio de Amazon: no lo tenemos y cambia.
// - El aviso de afiliado va pegado a un enlace de afiliado. En la rama sin ASIN se
//   avisa de que los enlaces están en la guía, no en el botón (antes se pintaba el
//   aviso debajo de un enlace interno, que no da comisión: 9.118 fichas).
// - Nada de "en stock", "últimas unidades", "mejor precio" / "in stock", "best price".
import { esc } from './layout.mjs';

const T = {
  es: {
    h2: 'Dónde comprar',
    sellado: (set) =>
      `En Amazon se vende el <b>producto sellado de ${esc(set)}</b>, no esta carta suelta: comprar el producto no garantiza que salga.`,
    ver: (n) => `Ver ${esc(n)} en Amazon`,
    tambien: 'También de este set:',
    precioCarta: (p) => `Esta carta, suelta, tiene un precio de referencia de ${p} (Cardmarket).`,
    avisoPrecio:
      'El precio y la disponibilidad del producto los pone Amazon y cambian: míralos en el enlace antes de comprar.',
    yaLaTienes: '¿Ya la tienes? Fundas y toploader →',
    sinSellado: (set) =>
      `En nuestro catálogo de Amazon no hay producto sellado de ${esc(set)}. Esta carta se compra suelta: a un particular, en una tienda de segunda mano o en una feria.`,
    fundas: (p) => (p ? `Fundas y toploader para una carta de ${p} →` : 'Fundas y toploader para esta carta →'),
    avisoGuia:
      'La guía de fundas enlaza a productos de Amazon con nuestra etiqueta de afiliado. El precio lo pone Amazon; no lo copiamos aquí porque se quedaría viejo.',
    formatos: 'Qué formatos hay y cuál sale mejor por sobre →',
    afiliado:
      'Enlace de afiliado: si compras desde aquí, ValorCarta recibe una comisión de Amazon que no cambia lo que pagas.',
    cuidado: '/guardar-cartas/',
    comprar: '/comprar/',
  },
  en: {
    h2: 'Where to buy',
    sellado: (set) =>
      `Amazon sells the <b>sealed ${esc(set)} product</b>, not this single card: buying it does not guarantee you pull it.`,
    ver: (n) => `See ${esc(n)} on Amazon`,
    tambien: 'Also from this set:',
    precioCarta: (p) => `This card on its own has a reference price of ${p} (Cardmarket).`,
    avisoPrecio: 'Amazon sets the price and availability and changes them: check them in the link before buying.',
    yaLaTienes: 'Already own it? Card care guide (in Spanish) →',
    sinSellado: (set) =>
      `We have no sealed ${esc(set)} product on Amazon. This card is bought as a single: from a seller, a second-hand shop or a card show.`,
    fundas: (p) => (p ? `Card care guide: sleeves for a ${p} card (in Spanish) →` : 'Card care guide (in Spanish) →'),
    avisoGuia:
      'The card care guide links to Amazon products with our affiliate tag. Amazon sets the price; we do not copy it here because it goes stale.',
    formatos: 'Which formats exist and which is best per pack →',
    afiliado:
      'Affiliate link: if you buy from here, ValorCarta earns a commission from Amazon that does not change what you pay.',
    cuidado: '/guardar-cartas/',
    comprar: '/comprar/',
  },
};

const dp = (asin, tag) => `https://www.amazon.es/dp/${asin}?tag=${encodeURIComponent(tag)}`;

/**
 * HTML del bloque "Dónde comprar" de una ficha de carta.
 * @param {object} carta  item de data/cards.json (necesita setId, setName, price)
 * @param {object} asins  contenido de data/asins.json
 * @param {object} cfg    config.json (amazonTag)
 * @param {{lang?: 'es'|'en', setName?: string}} [opts] setName = nombre del set en el idioma de la página
 */
export function bloqueComprar(carta, asins, cfg, opts = {}) {
  const lang = opts.lang === 'en' ? 'en' : 'es';
  const t = T[lang];
  const tag = cfg.amazonTag;
  const dinero = (n) =>
    new Intl.NumberFormat(lang === 'en' ? 'en-IE' : 'es-ES', { style: 'currency', currency: 'EUR' }).format(n);
  const setName = opts.setName || carta.setName;
  const precioCarta = carta.price ? dinero(carta.price) : null;
  const productos = Array.isArray(asins?.[carta.setId]) ? asins[carta.setId] : [];
  const primero = productos[0] ?? null;
  const resto = productos.slice(1);

  // Con producto sellado del set: se dice que NO es la carta, y se ofrece aparte
  // la guía de protección para quien ya la tiene.
  if (primero) {
    return `<section class="comprar-box">
  <h2>${t.h2}</h2>
  <p>${t.sellado(setName)}</p>
  <p><a class="btn" href="${dp(primero.asin, tag)}" rel="sponsored nofollow noopener" target="_blank">${t.ver(primero.nombre)}</a></p>
  ${resto.length ? `<p class="nota small">${t.tambien} ${resto.map((p) => `<a href="${dp(p.asin, tag)}" rel="sponsored nofollow noopener" target="_blank">${esc(p.nombre)}</a>`).join(' · ')}</p>` : ''}
  ${precioCarta ? `<p class="nota small">${t.precioCarta(precioCarta)}</p>` : ''}
  <p class="nota small">${esc(t.avisoPrecio)}</p>
  <p class="nota small"><a href="${t.cuidado}">${t.yaLaTienes}</a></p>
  <p class="nota small">${esc(t.afiliado)}</p>
</section>`;
  }

  // Sin producto sellado del set: se dice tal cual y se ofrece lo único que de
  // verdad se puede comprar en Amazon para una carta que ya vale dinero: protegerla.
  return `<section class="comprar-box">
  <h2>${t.h2}</h2>
  <p>${t.sinSellado(setName)}</p>
  <p><a class="btn" href="${t.cuidado}">${t.fundas(precioCarta)}</a></p>
  <p class="nota small">${esc(t.avisoGuia)}</p>
  <p class="nota small"><a href="${t.comprar}">${t.formatos}</a></p>
</section>`;
}
