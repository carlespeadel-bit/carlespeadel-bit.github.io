// Bloque "Dónde comprar" de la ficha de carta.
//
// Reglas que cumple este módulo (y que se pueden comprobar leyendo la salida):
// - Solo enlaces a producto (/dp/<ASIN>), nunca a búsqueda (/s?k=). Comisión 7 % vs 2 %.
// - Un ASIN solo se pinta si está en data/asins.json. Aquí no se inventa ninguno.
// - El precio que se muestra es el de referencia de la carta (Cardmarket, campo
//   `price` de data/cards.json). Nunca un precio de Amazon: no lo tenemos y cambia.
// - El aviso de afiliado aparece SOLO si el bloque lleva un enlace de afiliado.
//   Antes se pintaba también bajo enlaces internos, que no dan comisión.
// - Nada de "en stock", "últimas unidades" ni "al mejor precio". No lo sabemos.
import { esc, eur } from './layout.mjs';

const dp = (asin, tag) => `https://www.amazon.es/dp/${asin}?tag=${encodeURIComponent(tag)}`;

// Aviso de afiliado: mismo texto en todo el sitio, sin promesas.
export const AVISO_AFILIADO =
  'Enlace de afiliado: si compras desde aquí, ValorCarta recibe una comisión de Amazon que no cambia lo que pagas.';

export const AVISO_PRECIO =
  'El precio y la disponibilidad del producto los pone Amazon y cambian: míralos en el enlace antes de comprar.';

/**
 * HTML del bloque "Dónde comprar" de una ficha de carta.
 * @param {object} carta  item de data/cards.json (necesita setId, setName, price)
 * @param {object} asins  contenido de data/asins.json
 * @param {object} cfg    config.json (amazonTag)
 */
export function bloqueComprar(carta, asins, cfg) {
  const tag = cfg.amazonTag;
  const productos = Array.isArray(asins?.[carta.setId]) ? asins[carta.setId] : [];
  const primero = productos[0] ?? null;
  const resto = productos.slice(1);
  const precioCarta = carta.price ? `${eur(carta.price)} (referencia Cardmarket)` : null;

  // Con producto sellado del set: se dice que NO es la carta, y se ofrece aparte
  // la guía de protección para quien ya la tiene.
  if (primero) {
    return `<section class="comprar-box">
  <h2>Dónde comprar</h2>
  <p>En Amazon se vende el <b>producto sellado de ${esc(carta.setName)}</b>, no esta carta suelta: comprar el producto no garantiza que salga.</p>
  <p><a class="btn" href="${dp(primero.asin, tag)}" rel="sponsored nofollow noopener" target="_blank">Ver ${esc(primero.nombre)} en Amazon</a></p>
  ${resto.length ? `<p class="nota small">También de este set: ${resto.map((p) => `<a href="${dp(p.asin, tag)}" rel="sponsored nofollow noopener" target="_blank">${esc(p.nombre)}</a>`).join(' · ')}</p>` : ''}
  ${precioCarta ? `<p class="nota small">Esta carta, suelta, tiene un precio de referencia de ${esc(precioCarta)}.</p>` : ''}
  <p class="nota small">${esc(AVISO_PRECIO)}</p>
  <p class="nota small"><a href="/guardar-cartas/">¿Ya la tienes? Fundas y toploader →</a></p>
  <p class="nota small">${esc(AVISO_AFILIADO)}</p>
</section>`;
  }

  // Sin producto sellado del set: se dice tal cual y se ofrece lo único que de
  // verdad se puede comprar en Amazon para una carta que ya vale dinero: protegerla.
  return `<section class="comprar-box">
  <h2>Dónde comprar</h2>
  <p>En nuestro catálogo de Amazon no hay producto sellado de ${esc(carta.setName)}. Esta carta se compra
  suelta: a un particular, en una tienda de segunda mano o en una feria.</p>
  ${
    carta.price
      ? `<p><a class="btn" href="/guardar-cartas/">Fundas y toploader para una carta de ${eur(carta.price)} →</a></p>`
      : `<p><a class="btn" href="/guardar-cartas/">Fundas y toploader para esta carta →</a></p>`
  }
  <p class="nota small">La guía de fundas enlaza a productos de Amazon con nuestra etiqueta de afiliado.
  El precio lo pone Amazon; no lo copiamos aquí porque se quedaría viejo.</p>
  <p class="nota small"><a href="/comprar/">Qué formatos hay y cuál sale mejor por sobre →</a></p>
</section>`;
}
