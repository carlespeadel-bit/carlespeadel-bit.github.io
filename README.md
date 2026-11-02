# ValorCarta

Web estática que calcula **cuánto vale una colección de cartas Pokémon** con precios reales de Cardmarket
(vía la API pública de TCGdex). 8.554 cartas con precio, 100 sets, catálogo completo en español.
Sin base de datos, sin backend, sin cookies, sin dependencias de npm.

- Portada + buscador
- `/valorar/` — calculadora: busca, añade cantidades, total y variación de 30 días. Guarda en el navegador y comparte por enlace.
- `/carta/<slug>/` — 8.554 fichas: precio, media 30 días, mínimo, tabla por versión (normal/reversa/holo), gráfica y CTA de afiliado.
- `/set/<id>/` — 100 listados por set con valor total.
- `/premium/` + `/gracias/` — planes y entrega post-compra.
- `sitemap.xml` con 8.660 URLs, `robots.txt`, `_headers`, 404.

## Arrancar

```bash
npm run dev          # build + http://localhost:4321
npm run fetch        # refresca catálogo y precios (2-3 min, reanudable)
npm run daily        # fetch + build + foto de precios + aviso Telegram
```

## Lo único que no puedo hacer yo (3 cosas)

1. **Dominio y hosting**: compra `valorcarta.es` (~10 €/año) y mételo en Cloudflare Pages (gratis).
   `npm run deploy` (crea el proyecto antes con `npx wrangler pages project create valorcarta`).
   Netlify también vale: `netlify.toml` ya está puesto.
2. **Etiqueta de Amazon**: date de alta en [afiliados.amazon.es](https://afiliados.amazon.es) y pega tu tag
   en `config.json` → `amazonTag`. Necesitas 3 ventas en 180 días para que te aprueben.
3. **Cobro**: crea el producto en Lemon Squeezy (5 % + 0,50 por venta, ellos liquidan el IVA de la UE) y pega
   la URL de checkout en `config.json` → `premiumUrl`. Pon también el enlace de invitación del canal privado
   en `telegramInvite` y tu NIF en `titular`/`nif` (aparece en el aviso legal).

Con eso la web funciona sola. El resto es contenido.

## Dónde está el dinero (en orden)

| Fuente | Cuándo | Cuánto |
|---|---|---|
| Afiliado Amazon 7 % (juguetes) | desde el día 1 | ~3,50 € por ETB de 50 € |
| Suscripción 4,99 €/mes | con ~1.000 usuarios activos | ~85 € netos por cada 1.000 activos (2 % de conversión, hipótesis) |
| Singles (eBay, tickets altos) | mes 2-3 | pendiente de alta |

La suscripción no se sostiene sin tráfico: con 0 visitas da 0 €. El orden real es **contenido → tráfico → cobro**.

## Automatización

`.github/workflows/daily.yml` corre a las 06:10 UTC: descarga precios, reconstruye la web, guarda la foto
del día en `data/history/`, publica el resumen en Telegram y despliega. Secretos necesarios:
`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

## Límites, dichos a la cara

- El precio es **referencia de mercado**, no tasación: no distingue Near Mint de jugada. Una carta en mal estado vale mucho menos.
- Los precios vienen de Cardmarket a través de TCGdex. Si TCGdex cambia o corta, la web se queda con la última foto.
- Las imágenes se enlazan desde `assets.tcgdex.net` (no se copian). Si abusan del hotlink habría que moverlas.
- El acceso Premium es un enlace de invitación a Telegram: vale para empezar, no es autenticación. Con ~100 suscriptores hay que pasar a login real.
- Las páginas legales llevan placeholders (`NOMBRE Y APELLIDOS`, `00000000X`): hay que rellenarlos antes de publicar.

## Estructura

```
config.json          marca, tag de Amazon, checkout, NIF, precios
scripts/fetch.mjs    API TCGdex -> data/cards.json (cache en data/cache)
scripts/build.mjs    data/*.json -> dist/ (8.660 páginas)
scripts/snapshot.mjs foto diaria + movimientos > 3% -> out/digest.txt
scripts/telegram.mjs publica el resumen
scripts/serve.mjs    servidor local con URLs limpias
site/                plantillas, CSS y JS (sin framework)
```
