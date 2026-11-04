#!/usr/bin/env python3
"""Organigrama visual de ValorCarta: cómo se encadena cada turno con el siguiente.

Salida: dinero/ORGANIGRAMA-VISUAL.png y .pdf (A3 apaisado, 300 ppp efectivos).
Fuente de los turnos: ~/.dsh/storages/schedule.json (18 tareas) y dinero/ORGANIGRAMA.md.
"""
import os
from PIL import Image, ImageDraw, ImageFont

W, H = 3508, 2480
M = 110
BG = (250, 250, 247)
INK = (24, 24, 27)
GREY = (110, 110, 118)
LINE = (176, 176, 184)
GOLD = (224, 168, 0)
AMARILLO_SUAVE = (255, 246, 219)
WHITE = (255, 255, 255)
AREA = {
    "producto": (31, 122, 107),
    "demanda": (44, 110, 155),
    "monetiza": (46, 125, 50),
    "control": (142, 59, 70),
    "estudio": (91, 75, 138),
    "direccion": (176, 128, 0),
}
F = "/System/Library/Fonts/Supplemental/"
def ff(n, b=False):
    return ImageFont.truetype(F + ("Arial Bold.ttf" if b else "Arial.ttf"), n)

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)


def tw(t, f):
    return d.textlength(t, font=f)


def wrap(t, f, maxw):
    out, cur = [], ""
    for w in t.split():
        p = (cur + " " + w).strip()
        if tw(p, f) <= maxw:
            cur = p
        else:
            if cur:
                out.append(cur)
            cur = w
    if cur:
        out.append(cur)
    return out


def texto(x, y, t, f, color=INK, maxw=None, lead=None):
    lead = lead or int(f.size * 1.32)
    lines = wrap(t, f, maxw) if maxw else [t]
    for i, ln in enumerate(lines):
        d.text((x, y + i * lead), ln, font=f, fill=color)
    return y + len(lines) * lead


def caja(x, y, w, h, color, radio=22, ancho=3, relleno=WHITE):
    d.rounded_rectangle([x, y, x + w, y + h], radius=radio, fill=relleno, outline=color, width=ancho)
    d.rounded_rectangle([x, y, x + w, y + 10], radius=5, fill=color)


def flecha(x1, y1, x2, y2, color=LINE, ancho=4, punta=16):
    d.line([x1, y1, x2, y2], fill=color, width=ancho)
    import math
    a = math.atan2(y2 - y1, x2 - x1)
    for s in (-0.5, 0.5):
        d.line([x2, y2, x2 - punta * math.cos(a + s), y2 - punta * math.sin(a + s)], fill=color, width=ancho)


def codo(puntos, color=LINE, ancho=4):
    for i in range(len(puntos) - 1):
        d.line([puntos[i], puntos[i + 1]], fill=color, width=ancho)
    (x1, y1), (x2, y2) = puntos[-2], puntos[-1]
    import math
    a = math.atan2(y2 - y1, x2 - x1)
    for s in (-0.5, 0.5):
        d.line([x2, y2, x2 - 18 * math.cos(a + s), y2 - 18 * math.sin(a + s)], fill=color, width=ancho)


# ---------------- cabecera ----------------
texto(M, 70, "VALORCARTA", ff(46, True), GOLD)
texto(M, 130, "Cómo se encadena el trabajo", ff(86, True), INK)
y = texto(M, 250, "18 puestos, 17 relojes y una sola regla: lo que no deja prueba no existe. "
                  "Cada caja es un turno; la flecha, lo que entrega al siguiente.",
          ff(34), GREY, maxw=3050)
d.line([M, 400, W - M, 400], fill=GOLD, width=5)

# ---------------- panel 1: el día ----------------
texto(M, 450, "1 · El día, encadenado", ff(52, True), INK)

fila1 = [
    ("07:10", "Ingeniería", "precios y build", "changes.json", "producto"),
    ("09:00", "Dirección", "hipótesis del día", "CADENA.md", "direccion"),
    ("09:30", "Distribución", "nota en Nostr", "relay aceptado", "demanda"),
    ("10:00", "Demanda · Redactor", "consultas y página", "URL en 200", "demanda"),
    ("11:00", "Afiliados · Datos", "ASIN y limpieza", "asins.json", "monetiza"),
    ("12:30", "Creativa", "vídeo puntuado", "CRITERIOS_VIDEO", "estudio"),
]
fila2 = [
    ("16:00", "Fiscal", "caza huecos", "PARTES.md", "control"),
    ("18:00", "Distribución", "Pinterest", "panel", "demanda"),
    ("20:00", "Optimizador", "cuenta turnos", "TURNOS.md", "control"),
    ("21:00", "Auditoría", "supervisa y sanciona", "PARTES.md", "control"),
    ("22:00", "Enlace · Abstraedor", "conecta y destila", "CONEXIONES · CADENA", "estudio"),
]

BW, GAP, BH = 520, 30, 250
y1 = 520
xs1 = [M + i * (BW + GAP) for i in range(6)]
y2 = 1010
xs2 = [W - M - BW - i * (BW + GAP) for i in range(5)]  # de derecha a izquierda

for (h, nom, hace, deja, area), x in zip(fila1, xs1):
    caja(x, y1, BW, BH, AREA[area])
    texto(x + 26, y1 + 30, h, ff(30, True), AREA[area])
    texto(x + 26, y1 + 72, nom, ff(34, True), INK, maxw=BW - 50)
    yy = texto(x + 26, y1 + 130, hace, ff(27), GREY, maxw=BW - 50)
    texto(x + 26, yy + 16, "→ " + deja, ff(26, True), AREA[area], maxw=BW - 50)

for i in range(5):
    flecha(xs1[i] + BW + 4, y1 + BH // 2, xs1[i + 1] - 6, y1 + BH // 2)

for (h, nom, hace, deja, area), x in zip(fila2, xs2):
    caja(x, y2, BW, BH, AREA[area])
    texto(x + 26, y2 + 30, h, ff(30, True), AREA[area])
    texto(x + 26, y2 + 72, nom, ff(34, True), INK, maxw=BW - 50)
    yy = texto(x + 26, y2 + 130, hace, ff(27), GREY, maxw=BW - 50)
    texto(x + 26, yy + 16, "→ " + deja, ff(26, True), AREA[area], maxw=BW - 50)

for i in range(4):
    flecha(xs2[i] - 6, y2 + BH // 2, xs2[i + 1] + BW + 4, y2 + BH // 2)

# 12:30 -> 16:00 (baja por la derecha)
codo([(xs1[5] + BW // 2, y1 + BH + 8), (xs1[5] + BW // 2, (y1 + BH + y2) // 2),
      (xs2[0] + BW // 2, (y1 + BH + y2) // 2), (xs2[0] + BW // 2, y2 - 8)])

# banda de turnos recurrentes
yb = 830
texto(M, yb - 44, "en paralelo, todo el día", ff(26, True), GREY)
rec = [
    ("cada 2 h", "Inteligencia", "3 webs → competencia/", "estudio"),
    ("cada 3 h", "Tráfico", "canales abiertos", "demanda"),
    ("cada 30 min", "Vigía · Auditor", "rutas y turnos → VIGIA.json", "control"),
]
xr = M
for h, nom, deja, area in rec:
    w = tw(h + "  " + nom + "  " + deja, ff(27)) + 70
    d.rounded_rectangle([xr, yb, xr + w, yb + 74], radius=37, fill=AMARILLO_SUAVE, outline=AREA[area], width=3)
    d.text((xr + 26, yb + 10), h, font=ff(24, True), fill=AREA[area])
    d.text((xr + 26, yb + 40), nom + " · " + deja, font=ff(24), fill=INK)
    xr += w + 24
# turnos semanales, alineados a la derecha de la banda
sem = ("semanal", "mié 20:00 Ruptura · vie 19:00 Comité · dom 20:00 Consejo")
ws = tw(sem[0], ff(24, True)) + tw(sem[1], ff(24)) + 60
d.rounded_rectangle([W - M - ws, yb, W - M, yb + 74], radius=37, fill=AMARILLO_SUAVE, outline=(176, 128, 0), width=3)
d.text((W - M - ws + 26, yb + 10), sem[0], font=ff(24, True), fill=(176, 128, 0))
d.text((W - M - ws + 26, yb + 40), sem[1], font=ff(24), fill=INK)

# ---------------- panel 2: la cadena del dato ----------------
yp = 1350
d.line([M, yp - 40, W - M, yp - 40], fill=(226, 226, 224), width=3)
texto(M, yp, "2 · La cadena del dato hasta el céntimo", ff(52, True), INK)

cadena = [
    ("Cardmarket", "vía API de TCGdex", "el precio", (120, 120, 128)),
    ("07:10 build", "9.830 cartas con precio", "578 URLs", AREA["producto"]),
    ("ficha /carta", "la respuesta en 1 segundo", "página en 200", AREA["producto"]),
    ("Short · Nostr", "el aviso a quien mira", "oembed 200", AREA["estudio"]),
    ("enlace /dp/", "etiqueta valorcarta-21", "7 % no 2 %", AREA["monetiza"]),
    ("comisión", "0,00 € hoy", "2,80 € por pedido", AREA["monetiza"]),
]
CW, CG = 500, 40
yc = yp + 110
xs = [M + i * (CW + CG) for i in range(6)]
for (t, s, p, col), x in zip(cadena, xs):
    caja(x, yc, CW, 210, col)
    texto(x + 24, yc + 26, t, ff(34, True), INK, maxw=CW - 48)
    texto(x + 24, yc + 76, s, ff(26), GREY, maxw=CW - 48)
    texto(x + 24, yc + 150, "→ " + p, ff(26, True), col, maxw=CW - 48)
for i in range(5):
    flecha(xs[i] + CW + 3, yc + 105, xs[i + 1] - 5, yc + 105)

# rama que no trae
d.text((xs[3] + 20, yc + 232), "Google: 1 página indexada · 1 visita — todavía no trae", font=ff(24), fill=(150, 90, 90))
# rama B2B
d.rounded_rectangle([xs[4] - 10, yc + 262, xs[5] + CW, yc + 340], radius=18, fill=(240, 247, 240), outline=AREA["monetiza"], width=3)
d.text((xs[4] + 12, yc + 278), "vía B2B: informe de precios a 30 tiendas (29 €)", font=ff(26, True), fill=AREA["monetiza"])

# ---------------- panel 3: circuito de control ----------------
yz = 1890
d.line([M, yz - 40, W - M, yz - 40], fill=(226, 226, 224), width=3)
texto(M, yz, "3 · El circuito que impide engañarnos", ff(52, True), INK)

KW, KG = 540, 60
yk = yz + 100
xk = [M + i * (KW + KG) for i in range(3)]
for (t, s_, col), x in zip([("turno", "el puesto trabaja", AREA["direccion"]),
                            ("prueba", "URL · cifra · commit", AREA["producto"]),
                            ("auditoría 21:00", "¿la prueba sostiene?", AREA["control"])], xk):
    caja(x, yk, KW, 170, col)
    texto(x + 24, yk + 30, t, ff(36, True), INK, maxw=KW - 48)
    texto(x + 24, yk + 84, s_, ff(28), GREY, maxw=KW - 48)
for i in range(2):
    flecha(xk[i] + KW + 4, yk + 85, xk[i + 1] - 5, yk + 85)

# dos salidas: cumple (arriba) y falla (abajo)
XR = xk[2] + KW + 90
WR = 760
caja(XR, yk - 10, WR, 110, (46, 125, 50))
texto(XR + 26, yk + 8, "cumple", ff(34, True), INK)
texto(XR + 200, yk + 14, "reparto y meta +50 %", ff(28), GREY)
caja(XR, yk + 130, WR, 110, (176, 64, 64))
texto(XR + 26, yk + 148, "falla", ff(34, True), INK)
texto(XR + 200, yk + 154, "pierde un intento", ff(28), GREY)
codo([(xk[2] + KW + 4, yk + 85), (XR - 30, yk + 85), (XR - 30, yk + 45), (XR - 6, yk + 45)])
codo([(xk[2] + KW + 4, yk + 95), (XR - 60, yk + 95), (XR - 60, yk + 185), (XR - 6, yk + 185)])
d.text((xk[2] + KW + 10, yk + 40), "sí", font=ff(26, True), fill=(46, 125, 50))
d.text((xk[2] + KW + 10, yk + 150), "no", font=ff(26, True), fill=(176, 64, 64))

# 5 fallos -> cese -> vuelve al turno
codo([(XR + WR // 2, yk + 246), (XR + WR // 2, yk + 330), (xk[0] + KW // 2, yk + 330), (xk[0] + KW // 2, yk + 178)],
     color=(176, 64, 64))
d.text((xk[0] + KW // 2 + 20, yk + 336), "5 fallos → cese y entra el banquillo", font=ff(26, True), fill=(176, 64, 64))

# pie
texto(M, H - 100, "Fuente: 18 turnos activos en el programador · plantilla y pesos en EMPRESA.json · reglas en ORGANIGRAMA.md · 04-11-2026",
      ff(26), GREY, maxw=W - 2 * M)

img.save("/Users/home/Documents/deepseek-harness/default-workspace/dinero/ORGANIGRAMA-VISUAL.png")
img.save("/Users/home/Documents/deepseek-harness/default-workspace/dinero/ORGANIGRAMA-VISUAL.pdf", "PDF", resolution=300.0)
print("guardado PNG + PDF")
