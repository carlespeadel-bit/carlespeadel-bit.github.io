# Guía: qué está hecho, qué falta y por qué

Última revisión: 2026-11-02. Todo lo que dice "hecho" está verificado en la web publicada.

## 1. Lo que ya está montado

| Pieza | Estado | Qué hace |
|---|---|---|
| Web publicada | ✅ `https://carlespeadel-bit.github.io` | 8.674 URLs, 8.554 cartas con precio |
| Precios diarios | ✅ | Cada día a las 06:10 UTC baja catálogo y precios y reconstruye |
| Fichas de carta | ✅ | 8.554 páginas con precio, media 30 d, ataques, PS, debilidad, legalidad |
| Valorador | ✅ `/valorar/` | Suma tu colección, la guarda en el navegador y da enlace para compartir |
| Radar de mercado | ✅ `/mercado/` | 996 cartas con liquidez, lo que sube y baja en 7 días |
| Alertas | ✅ `/alertas/` | Precio objetivo por carta, se ve si ya se cumplió |
| Guías | ✅ `/guias/` | 9 guías escritas por agentes, sin cifras inventadas |
| Página de compra | ✅ `/comprar/` | 8 formatos con enlace a Amazon |
| Enlaces de afiliado | ⚠️ montados con etiqueta falsa | `valorcarta-21` no es tuya: **hoy no cobra nada** |
| IndexNow | ✅ | Avisa a Bing y Yandex en cada despliegue |
| Despliegue | ✅ | Cada push publica solo; no hay que tocar nada |

## 2. Lo que falta, por orden de importancia

### 2.1 Etiqueta de Amazon (bloquea TODO el dinero)

**Por qué**: los enlaces ya existen, pero llevan una etiqueta inventada. Amazon paga al titular de la etiqueta; si no es la tuya, el dinero va a nadie.

**Cómo**: alta en `afiliados.amazon.es` → te dan algo como `tunombre-21` → me lo pasas → lo pongo en `config.json` y se despliega.
**Requisito**: 3 ventas en 180 días o retiran la solicitud. **Necesita**: NIF e IBAN.

### 2.2 Search Console (bloquea todo el tráfico)

**Por qué**: Google no sabe que existimos. Sin indexación no hay visitas, y sin visitas no hay ni clics ni suscriptores.

**Cómo**: `search.google.com/search-console` → propiedad `carlespeadel-bit.github.io` → verificación por etiqueta HTML → me pasas el código → lo pongo y envío el sitemap.

### 2.3 Lemon Squeezy (bloquea la suscripción)

**Por qué**: el botón de "Activar avisos" apunta a una URL que no existe (`REEMPLAZAR`). Sin pasarela no se puede cobrar 2,99 €/mes.

**Cómo**: cuenta en `lemonsqueezy.com` → producto suscripción 2,99 €/mes → me pasas la URL de checkout.
**Nota**: es merchant of record, así que liquida él el IVA de la UE.

### 2.4 Envío de email (bloquea la promesa de las alertas)

**Por qué**: hoy el aviso se ve en la web, pero no llega a nadie. La suscripción promete "te aviso por email cuando baje".

**Cómo**: cuenta en `resend.com` o `buttondown.com` (gratis hasta unos cientos de envíos) → clave de API.
**Sin esto**: se puede cobrar igual, pero estarías cobrando por algo que no entregas. No lo hagas.

### 2.5 Datos legales (bloquea la aprobación de Amazon)

**Por qué**: el aviso legal dice `NOMBRE Y APELLIDOS` y `00000000X`, y el email de contacto `hola@valorcarta.es` no existe. Amazon revisa el sitio antes de aprobar y eso es motivo de rechazo.

**Cómo**: nombre, NIF y un email real → los pongo en `config.json`.

## 3. Por qué este orden y no otro

- **Amazon primero**: es lo único que puede cobrar sin que nadie se suscriba y sin gastar un euro.
- **Search Console segundo**: sin indexación, todo lo demás multiplica cero.
- **Suscripción tercera**: 2,99 €/mes solo tiene sentido cuando hay alguien a quien avisar.
- **Email después del checkout**: cobrar sin poder entregar el aviso es la forma más rápida de tener que devolver dinero.

## 4. Lo que cuesta

0 €. Hosting gratis (GitHub Pages), datos gratis (TCGdex). Solo se paga el dominio si algún día se compra, y ninguna de las cinco cosas de arriba lo necesita.

## 5. Cómo saber si funciona (a los 7 días)

| Métrica | Dónde | Umbral |
|---|---|---|
| Páginas indexadas | Search Console | > 100 |
| Visitas | Search Console / analítica | > 100 |
| Clics a Amazon | Informe de Amazon Afiliados | > 3 |
| Suscripciones | Lemon Squeezy | > 0 |

Si a los 7 días de tener Search Console no hay 100 páginas indexadas, el problema es técnico y lo arreglo yo. Si hay indexación y no hay visitas, el problema es el contenido o la competencia, y eso se ataca con las guías y el radar, no con más código.
