#!/usr/bin/env python3
"""Genera una pieza (pin 1000x1500) para una carta, con el estilo que pasó el Divergente.

Uso:
    python3 tools/pieza.py <card-id> [--angle sube|baja|caro] [--salida dinero/pines]

Escribe <fecha>-<slug>.png y .json en la carpeta de pines.
La pieza NO se publica desde aquí: publicar es un turno, esto solo compone.
"""
import json, os, sys, datetime, re, unicodedata, urllib.request
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DINERO = os.path.join(ROOT, "..", "dinero")
PINES = os.path.join(DINERO, "pines")
FB = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FR = "/System/Library/Fonts/Supplemental/Arial.ttf"
GOLD = (200, 148, 0); INK = (20, 20, 24); GREY = (105, 105, 115); GREEN = (22, 140, 80); RED = (176, 64, 64)


def f(bold, size):
    return ImageFont.truetype(FB if bold else FR, size)


def slugify(t):
    t = unicodedata.normalize("NFD", t).encode("ascii", "ignore").decode().lower()
    return re.sub(r"^-|-$", "", re.sub(r"[^a-z0-9]+", "-", t))


def eur(n):
    return f"{n:,.2f} €".replace(",", "X").replace(".", ",").replace("X", ".")


def fondo(w, h):
    img = Image.new("RGB", (w, h))
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / h
        d.line([(0, y), (w, y)], fill=tuple(int(a + (b - a) * t) for a, b in zip((252, 250, 245), (233, 230, 222))))
    return img


def traer_carta(card):
    url = (card.get("image") or "").rstrip("/") + "/high.png"
    ruta = f"/tmp/card_{card['id']}.png"
    if not os.path.exists(ruta):
        urllib.request.urlretrieve(url, ruta)
    return Image.open(ruta).convert("RGBA")


def compone_b(card, antes, ahora, fecha_txt):
    """Estilo B: la carta manda y el precio va en pegatina. Es el que mejor lee en móvil."""
    W, H = 1000, 1500
    img = fondo(W, H); d = ImageDraw.Draw(img)
    d.text((50, 46), "VALORCARTA", font=f(1, 28), fill=GOLD)
    d.text((50, 96), "¿Cuánto vale hoy?", font=f(0, 34), fill=GREY)

    carta = traer_carta(card)
    cw = 560; ch = int(carta.height * cw / carta.width)
    carta = carta.resize((cw, ch), Image.LANCZOS).rotate(-4, expand=True, resample=Image.BICUBIC)
    sombra = Image.new("RGBA", (carta.width + 80, carta.height + 80), (0, 0, 0, 0))
    sombra.paste(carta, (40, 40), carta)
    sombra = sombra.filter(ImageFilter.GaussianBlur(22))
    img.paste((0, 0, 0), (220 - 40, 170 - 40), sombra.split()[3].point(lambda p: int(p * 0.32)))
    img.paste(carta, (220, 170), carta)

    d.rounded_rectangle([60, 1010, 940, 1195], radius=26, fill=(18, 18, 22))
    d.text((96, 1030), "AHORA", font=f(1, 28), fill=GOLD)
    d.text((96, 1066), eur(ahora), font=f(1, 88), fill=(255, 255, 255))
    if antes and antes > 0:
        pct = round((ahora - antes) / antes * 100)
        d.rounded_rectangle([750, 1048, 910, 1148], radius=50, fill=GREEN if pct >= 0 else RED)
        d.text((780, 1066), f"{pct:+d} %", font=f(1, 38), fill=(255, 255, 255))

    d.text((60, 1240), f"{card['name'][:28]} · {card['setName'][:24]}", font=f(1, 32), fill=INK)
    if antes and antes > 0:
        d.text((60, 1296), f"Antes {eur(antes)} · precio de Cardmarket de hoy", font=f(0, 28), fill=GREY)
    d.text((60, 1400), "valorcarta.github.io", font=f(1, 34), fill=GOLD)
    return img


def compone(card, antes, ahora, angle, fecha_txt):
    W, H = 1000, 1500
    img = fondo(W, H); d = ImageDraw.Draw(img)

    carta = traer_carta(card)
    cw = 520; ch = int(carta.height * cw / carta.width)
    carta = carta.resize((cw, ch), Image.LANCZOS).rotate(-6, expand=True, resample=Image.BICUBIC)
    sombra = Image.new("RGBA", (carta.width + 60, carta.height + 60), (0, 0, 0, 0))
    sombra.paste(carta, (30, 30), carta)
    sombra = sombra.filter(ImageFilter.GaussianBlur(20))
    img.paste((0, 0, 0), (190 - 30, 520 - 30), sombra.split()[3].point(lambda p: int(p * 0.30)))
    img.paste(carta, (190, 520), carta)

    d.text((60, 58), "VALORCARTA", font=f(1, 30), fill=GOLD)
    d.text((60, 106), "Precio real de tus cartas", font=f(0, 30), fill=GREY)

    if angle == "caro":
        d.text((60, 205), "La más cara", font=f(1, 56), fill=GREY)
        d.text((60, 268), eur(ahora), font=f(1, 96), fill=INK)
        d.text((60, 392), fecha_txt, font=f(0, 34), fill=GREY)
    else:
        d.text((60, 205), f"De {eur(antes)} a", font=f(1, 58), fill=INK)
        d.text((60, 272), eur(ahora), font=f(1, 96), fill=INK)
        d.text((60, 392), fecha_txt, font=f(0, 34), fill=GREY)
        pct = round((ahora - antes) / antes * 100)
        col = GREEN if pct > 0 else RED
        etiqueta = f"{pct:+d} %".replace("+", "+") if pct > 0 else f"{pct} %"
        d.rounded_rectangle([650, 196, 946, 282], radius=43, fill=col)
        d.text((650 + 52, 208), etiqueta, font=f(1, 50), fill=(255, 255, 255))

    d.rounded_rectangle([0, H - 250, W, H], fill=(16, 16, 18))
    d.text((60, H - 208), card["name"][:26], font=f(1, 44), fill=(255, 255, 255))
    d.text((60, H - 152), f"{card['setName'][:30]} · Cardmarket", font=f(0, 26), fill=(170, 170, 178))
    d.text((60, H - 96), "valorcarta.github.io", font=f(1, 34), fill=(224, 168, 0))
    return img


def main():
    cid = sys.argv[1]
    angle = "auto"
    if "--angle" in sys.argv:
        angle = sys.argv[sys.argv.index("--angle") + 1]

    cards = {c["id"]: c for c in json.load(open(os.path.join(ROOT, "data", "cards.json")))}
    cambios = json.load(open(os.path.join(ROOT, "data", "changes.json")))
    card = cards[cid]
    ahora = card["price"]
    antes = None
    for m in cambios.get("suben", []) + cambios.get("bajan", []):
        if m["id"] == cid:
            antes, ahora = m["de"], m["a"]
            break
    if angle == "auto":
        angle = "sube" if (antes and ahora > antes) else "caro"
    if angle != "caro" and not antes:
        angle = "caro"

    # guarda: si la carta tiene variantes con precios muy distintos, la pieza no vale
    vars_ = [v for v in (card.get("variants") or []) if v.get("trend") or v.get("avg")]
    precios = [v.get("trend") or v.get("avg") for v in vars_]
    ambiguo = len(precios) > 1 and max(precios) > min(precios) * 3

    fecha = datetime.date.today()
    fecha_txt = f"hoy, {fecha.day} de {['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][fecha.month-1]}"

    estilo = "B"
    if "--estilo" in sys.argv:
        estilo = sys.argv[sys.argv.index("--estilo") + 1].upper()
    img = compone_b(card, antes, ahora, fecha_txt) if estilo == "B" else compone(card, antes or ahora, ahora, angle, fecha_txt)
    os.makedirs(PINES, exist_ok=True)
    slug = f"{fecha.isoformat()}-{cid}"
    png = os.path.join(PINES, slug + ".png")
    img.save(png)

    enlace = f"https://valorcarta.github.io/carta/{cid}-{slugify(card['name'])}/"
    meta = {
        "id": slug, "imagen": os.path.relpath(png, DINERO),
        "titulo": (f"{card['name']}: {eur(ahora)}" if angle == "caro" else f"{card['name']}: {eur(ahora)} (antes {eur(antes)})"),
        "descripcion": (f"{card['name']} de {card['setName']}. Precio de referencia de Cardmarket, actualizado a diario. "
                        f"Ficha, histórico y enlace de compra: {enlace} · Enlace de afiliado de Amazon."),
        "enlace": enlace, "tablero": "Precios Pokémon",
        "precio": ahora, "antes": antes, "angulo": angle,
        "estado": ("descartada: variantes sin aclarar " + " / ".join(eur(x) for x in precios)) if ambiguo else "listo para publicar",
    }
    json.dump(meta, open(os.path.join(PINES, slug + ".json"), "w"), ensure_ascii=False, indent=2)
    print(png)
    print(json.dumps({k: meta[k] for k in ("titulo", "enlace", "angulo")}, ensure_ascii=False))


if __name__ == "__main__":
    main()
