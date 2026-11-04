#!/usr/bin/env python3
"""Plantillas de pieza de ValorCarta (1000x1500). Tres estilos que no parecen plantilla."""
import os, urllib.request
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1000, 1500
FB = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FR = "/System/Library/Fonts/Supplemental/Arial.ttf"
INK = (11, 11, 13); CREAM = (246, 242, 232); GOLD = (224, 168, 0)
GREEN = (18, 161, 80); RED = (198, 62, 62); WHITE = (255, 255, 255)
F = lambda b, s: ImageFont.truetype(FB if b else FR, s)


def eur(n):
    return f"{n:,.2f} €".replace(",", "X").replace(".", ",").replace("X", ".")


def carta(card, ancho):
    ruta = f"/tmp/dis_{card['id']}.png"
    if not os.path.exists(ruta):
        urllib.request.urlretrieve(card["image"].rstrip("/") + "/high.png", ruta)
    im = Image.open(ruta).convert("RGBA")
    return im.resize((ancho, int(im.height * ancho / im.width)), Image.LANCZOS)


def pega(img, c, xy, angulo=0, sombra=0.38, blur=26):
    c = c.rotate(angulo, expand=True, resample=Image.BICUBIC)
    sh = Image.new("RGBA", (c.width + 100, c.height + 100), (0, 0, 0, 0))
    sh.paste(c, (50, 50), c)
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    img.paste((0, 0, 0), (xy[0] - 50, xy[1] - 50), sh.split()[3].point(lambda p: int(p * sombra)))
    img.paste(c, xy, c)


def marca(d, x, y, color=GOLD, tam=26):
    d.text((x, y), "VALORCARTA", font=F(1, tam), fill=color)


def t1_neon(card, precio, antes=None, fecha=""):
    img = Image.new("RGB", (W, H), (8, 8, 12)); d = ImageDraw.Draw(img)
    # halo detrás de la carta
    halo = Image.new("RGB", (W, H), (8, 8, 12)); hd = ImageDraw.Draw(halo)
    hd.ellipse([60, 180, 940, 1060], fill=(26, 92, 66))
    halo = halo.filter(ImageFilter.GaussianBlur(120))
    img = Image.blend(img, halo, 0.55); d = ImageDraw.Draw(img)

    marca(d, 56, 50)
    c = carta(card, 540)
    pega(img, c, (240, 190), angulo=-7, sombra=0.55)
    d = ImageDraw.Draw(img)

    if antes and antes > 0:
        pct = round((precio - antes) / antes * 100)
        d.rounded_rectangle([690, 120, 950, 220], radius=50, fill=GREEN if pct >= 0 else RED)
        d.text((726, 140), f"{pct:+d} %", font=F(1, 44), fill=WHITE)
        d.text((60, 986), f"antes {eur(antes)}", font=F(0, 34), fill=(178, 178, 186))
    d.text((56, 1060), eur(precio), font=F(1, 132), fill=WHITE)
    d.rectangle([56, 1225, 330, 1233], fill=GOLD)
    d.text((56, 1265), f"{card['name']} · {card['setName']}"[:52], font=F(1, 34), fill=WHITE)
    d.text((56, 1400), "valorcarta.github.io", font=F(1, 32), fill=GOLD)
    return img


def t2_titular(card, precio, antes=None, fecha=""):
    img = Image.new("RGB", (W, H), CREAM); d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 18], fill=GOLD)
    marca(d, 56, 56, INK)
    sube = antes and precio > antes
    verbo = "ha subido" if sube else ("ha bajado" if antes else "vale hoy")
    d.text((56, 150), "Esta carta", font=F(1, 86), fill=INK)
    d.text((56, 246), verbo, font=F(1, 86), fill=INK)
    if antes and antes > 0:
        pct = round((precio - antes) / antes * 100)
        d.text((56, 350), f"{pct:+d} %", font=F(1, 150), fill=GREEN if pct >= 0 else RED)
    d.text((56, 520), eur(precio), font=F(1, 96), fill=INK)
    d.text((56, 640), f"antes {eur(antes)}" if antes else "precio de Cardmarket", font=F(0, 32), fill=(120, 116, 108))
    d.text((56, 760), "¿Cuánto vale la tuya?", font=F(1, 44), fill=(160, 120, 0))
    d.text((56, 820), "Mira la ficha y compárala →", font=F(0, 30), fill=(120, 116, 108))
    c = carta(card, 380)
    pega(img, c, (560, 900), angulo=5, sombra=0.30, blur=20)
    d.text((56, 1330), f"{card['name']} · {card['setName']}"[:50], font=F(1, 32), fill=INK)
    d.text((56, 1400), "valorcarta.github.io", font=F(1, 32), fill=GOLD)
    return img


def t3_sangrada(card, precio, antes=None, fecha=""):
    img = Image.new("RGB", (W, H), (16, 24, 38)); d = ImageDraw.Draw(img)
    d.rectangle([0, 0, 520, H], fill=(232, 226, 212)); d = ImageDraw.Draw(img)
    c = carta(card, 500)
    img.paste(c, (480, 180), c)
    d = ImageDraw.Draw(img)
    marca(d, 48, 48, INK)
    d.text((48, 140), "PRECIO", font=F(1, 30), fill=(120, 114, 104))
    d.text((48, 190), eur(precio), font=F(1, 78), fill=INK)
    if antes and antes > 0:
        pct = round((precio - antes) / antes * 100)
        d.rounded_rectangle([48, 320, 300, 400], radius=40, fill=GREEN if pct >= 0 else RED)
        d.text((78, 334), f"{pct:+d} %", font=F(1, 40), fill=WHITE)
        d.text((48, 425), f"antes {eur(antes)}", font=F(0, 30), fill=(110, 106, 98))
    d.text((48, 900), card["name"][:20], font=F(1, 54), fill=INK)
    d.text((48, 968), card["setName"][:24], font=F(0, 30), fill=(110, 106, 98))
    d.text((48, 1060), "¿Cuánto vale la tuya?", font=F(1, 38), fill=(150, 112, 0))
    d.text((48, 1400), "valorcarta.github.io", font=F(1, 30), fill=INK)
    return img


PLANTILLAS = {"T1": t1_neon, "T2": t2_titular, "T3": t3_sangrada}


def _bokeh(w, h, color=(24, 90, 120), n=26):
    import random
    capa = Image.new("RGB", (w, h), (6, 8, 14))
    d = ImageDraw.Draw(capa)
    random.seed(7)
    for _ in range(n):
        x, y = random.randint(-80, w + 80), random.randint(-80, h + 80)
        r = random.randint(25, 120)
        c = tuple(min(255, int(v * random.uniform(0.35, 0.95))) for v in color)
        d.ellipse([x - r, y - r, x + r, y + r], fill=c)
    return capa.filter(ImageFilter.GaussianBlur(55))


def _brillo(w, h, ang=32):
    """Franja de luz diagonal: el reflejo del foil."""
    g = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(g)
    d.polygon([(w * .18, 0), (w * .46, 0), (w * .10, h), (0, h)], fill=90)
    d.polygon([(w * .58, 0), (w * .70, 0), (w * .34, h), (w * .22, h)], fill=55)
    return g.filter(ImageFilter.GaussianBlur(28)).rotate(ang, resample=Image.BICUBIC, center=(w // 2, h // 2))


def t4_slab(card, precio, antes=None, fecha=""):
    """La carta en una vitrina tipo slab, con etiqueta. Lo más 'comestible' que sabemos hacer."""
    img = _bokeh(W, H, color=(20, 96, 128))
    # luz cálida desde arriba
    luz = Image.new("RGB", (W, H), (60, 40, 0))
    m = Image.new("L", (W, H), 0); ImageDraw.Draw(m).ellipse([-200, -820, W + 200, 640], fill=140)
    img = Image.composite(Image.blend(img, luz, 0.35), img, m.filter(ImageFilter.GaussianBlur(160)))
    d = ImageDraw.Draw(img)

    cz = carta(card, 640)
    sw, sh = cz.width + 64, cz.height + 190
    sx, sy = (W - sw) // 2, 150
    # vitrina
    slab = Image.new("RGBA", (sw, sh), (0, 0, 0, 0)); sd = ImageDraw.Draw(slab)
    sd.rounded_rectangle([0, 0, sw, sh], radius=34, fill=(255, 255, 255, 26), outline=(255, 255, 255, 90), width=3)
    sd.rounded_rectangle([12, 12, sw - 12, sh - 12], radius=26, outline=(255, 255, 255, 40), width=1)
    img.paste(slab, (sx, sy), slab)
    img.paste(cz, (sx + 32, sy + 32), cz)

    # etiqueta
    lab = [sx + 24, sy + sh - 140, sx + sw - 24, sy + sh - 24]
    d.rounded_rectangle(lab, radius=18, fill=(250, 248, 242))
    d.text((lab[0] + 22, lab[1] + 14), card["name"][:20], font=F(1, 36), fill=INK)
    d.text((lab[0] + 22, lab[1] + 62), card["setName"][:24], font=F(0, 23), fill=(120, 116, 108))
    d.text((lab[2] - 22 - d.textlength(eur(precio), font=F(1, 54)), lab[1] + 24), eur(precio), font=F(1, 54), fill=(150, 112, 0))
    d.text((lab[2] - 22 - d.textlength("precio de hoy", font=F(0, 20)), lab[1] + 86), "precio de hoy", font=F(0, 20), fill=(120, 116, 108))

    # reflejo del foil sobre la vitrina
    img.paste(Image.new("RGB", (sw, sh), (255, 255, 255)), (sx, sy),
              _brillo(sw, sh).crop((0, 0, sw, sh)).point(lambda p: int(p * 0.8)))

    marca(d, 56, 56, color=(240, 220, 160), tam=26)
    if antes and antes > 0:
        pct = round((precio - antes) / antes * 100)
        d.rounded_rectangle([700, 60, 944, 150], radius=45, fill=GREEN if pct >= 0 else RED)
        d.text((730, 78), f"{pct:+d} %", font=F(1, 40), fill=WHITE)
    d.text((56, 1290), "¿Cuánto vale la tuya?", font=F(1, 46), fill=(255, 255, 255))
    d.text((56, 1350), "9.830 cartas con precio de Cardmarket, gratis", font=F(0, 26), fill=(200, 200, 210))
    d.text((56, 1410), "valorcarta.github.io", font=F(1, 32), fill=GOLD)
    return img

PLANTILLAS["T4"] = t4_slab


def t5_producto(img_producto, gancho, precio, etiqueta_superior="", fecha=""):
    """Pieza de PRODUCTO (caja, lote, baraja): la caja manda, el precio va en pegatina."""
    from PIL import Image as _I
    base = _bokeh(W, H, color=(70, 52, 10))
    d = ImageDraw.Draw(base)
    marca(d, 56, 56, color=(240, 220, 160))

    prod = _I.open(img_producto).convert("RGBA")
    lado = 800
    prod = prod.resize((lado, lado), _I.LANCZOS)
    sombra = _I.new("RGBA", (lado + 120, lado + 120), (0, 0, 0, 0))
    sombra.paste(prod, (60, 60), prod)
    sombra = sombra.filter(ImageFilter.GaussianBlur(30))
    base.paste((0, 0, 0), (100 - 60, 210 - 60), sombra.split()[3].point(lambda p: int(p * 0.55)))
    base.paste(prod, (100, 210), prod)
    d = ImageDraw.Draw(base)

    if etiqueta_superior:
        d.rounded_rectangle([610, 60, 944, 140], radius=40, fill=GOLD)
        d.text((640, 78), etiqueta_superior[:20], font=F(1, 34), fill=(20, 16, 8))

    d.text((56, 1055), gancho[:34], font=F(1, 52), fill=WHITE)
    d.rounded_rectangle([56, 1140, 944, 1300], radius=24, fill=(250, 248, 242))
    d.text((88, 1160), "PRECIO HOY", font=F(1, 24), fill=(120, 116, 108))
    d.text((88, 1192), eur(precio), font=F(1, 80), fill=INK)
    d.text((560, 1200), "en Amazon", font=F(1, 32), fill=(120, 116, 108))
    d.text((560, 1240), fecha or "precio del día", font=F(0, 24), fill=(150, 146, 138))
    d.text((56, 1350), "Precio de hoy en Amazon · enlace de afiliado", font=F(0, 28), fill=(210, 210, 218))
    d.text((56, 1412), "valorcarta.github.io", font=F(1, 32), fill=GOLD)
    return base

PLANTILLAS["T5"] = t5_producto


def t6_guia(img_paths, titulo, subtitulo, fecha=""):
    """Pieza de guía: varias cajas en fila, sin precio único."""
    from PIL import Image as _I
    img = _bokeh(W, H, color=(80, 50, 20))
    d = ImageDraw.Draw(img)
    marca(d, 56, 56, color=(240, 220, 160))
    x = 46
    for ruta in img_paths[:3]:
        try:
            c = _I.open(ruta).convert("RGBA")
        except Exception:
            continue
        lado = 290
        c.thumbnail((lado, lado), _I.LANCZOS)
        sh = _I.new("RGBA", (c.width + 80, c.height + 80), (0, 0, 0, 0))
        sh.paste(c, (40, 40), c)
        sh = sh.filter(ImageFilter.GaussianBlur(16))
        img.paste((0, 0, 0), (x - 30, 470 - 30), sh.split()[3].point(lambda p: int(p * 0.45)))
        img.paste(c, (x, 520), c)
        x += lado + 34
    d = ImageDraw.Draw(img)
    d.text((56, 170), titulo[:20], font=F(1, 62), fill=WHITE)
    d.text((56, 250), subtitulo[:24], font=F(0, 34), fill=(210, 210, 218))
    d.rounded_rectangle([56, 860, 944, 1050], radius=24, fill=(250, 248, 242))
    d.text((88, 886), "POR PRESUPUESTO", font=F(1, 26), fill=(120, 116, 108))
    d.text((88, 926), "3 tramos, 9 regalos", font=F(1, 62), fill=INK)
    d.text((88, 1004), "de 24,99 € a 84,90 €", font=F(0, 30), fill=(120, 116, 108))
    d.text((56, 1110), "El que se usa, el que se guarda y el que se abre", font=F(0, 30), fill=(215, 215, 224))
    d.text((56, 1400), "valorcarta.github.io/comprar/regalos", font=F(1, 30), fill=GOLD)
    return img

PLANTILLAS["T6"] = t6_guia
