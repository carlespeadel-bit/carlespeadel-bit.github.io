#!/usr/bin/env python3
"""Genera un vídeo vertical (Shorts) con los movimientos de precio del día."""
import json, os, subprocess, sys, datetime
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1080, 1920
FPS = 30

def fuente(tam, negrita=False):
    rutas = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if negrita else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial Bold.ttf" if negrita else "/Library/Fonts/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for r in rutas:
        if os.path.exists(r):
            try: return ImageFont.truetype(r, tam)
            except Exception: pass
    return ImageFont.load_default()

cartas = json.load(open(os.path.join(ROOT, "data/cards.json")))
cambios = json.load(open(os.path.join(ROOT, "data/changes.json")))
porid = {c["id"]: c for c in cartas}

movs = [m for m in (cambios.get("suben", []) + cambios.get("bajan", [])) if m["de"] > 0.5 and abs(m["pct"]) < 60]
movs.sort(key=lambda m: abs(m["pct"]), reverse=True)
top = movs[:3]

def eur(n): return f"{n:,.2f} €".replace(",", "X").replace(".", ",").replace("X", ".")

def frame(titulo, lineas, pie, acento=(255, 203, 5)):
    img = Image.new("RGB", (W, H), (10, 10, 11))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 14], fill=acento)
    f_k = fuente(44); f_t = fuente(76, True); f_l = fuente(54); f_p = fuente(40)
    d.text((70, 180), "VALORCARTA", font=f_k, fill=acento)
    y = 300
    for linea in titulo.split("\n"):
        d.text((70, y), linea, font=f_t, fill=(245, 245, 247)); y += 92
    y += 60
    for linea in lineas:
        d.text((70, y), linea, font=f_l, fill=(220, 220, 228)); y += 90
    d.text((70, H - 260), pie, font=f_p, fill=(154, 154, 165))
    d.text((70, H - 180), "valorcarta.github.io", font=f_p, fill=acento)
    return img

frames = []
frames.append(frame("Cuánto valen\nhoy tus cartas", ["Precios de referencia", "de Cardmarket,", "actualizados a diario"], "Pokémon · Yu-Gi-Oh · Magic"))
for m in top:
    c = porid.get(m["id"])
    if not c: continue
    signo = "+" if m["pct"] > 0 else ""
    frames.append(frame(f"{c['name']}\n{c['setName']}", [f"Antes: {eur(m['de'])}", f"Ahora: {eur(m['a'])}", f"Variación: {signo}{m['pct']:.0f} %"], "Datos: Cardmarket vía TCGdex"))
frames.append(frame("Mira tu carta", ["9.830 cartas con precio", "y su media de 30 días.", "Gratis, sin registro."], "valorcarta.github.io"))

tmp = "/tmp/vc_video"
os.makedirs(tmp, exist_ok=True)
for i, f in enumerate(frames):
    f.save(os.path.join(tmp, f"f{i:03d}.png"))

dur = 3.2
entrada = os.path.join(tmp, "lista.txt")
with open(entrada, "w") as fh:
    for i in range(len(frames)):
        fh.write(f"file '{tmp}/f{i:03d}.png'\nduration {dur}\n")
    fh.write(f"file '{tmp}/f{len(frames)-1:03d}.png'\n")

salida = os.path.join(ROOT, "out", f"short-{datetime.date.today()}.mp4")
os.makedirs(os.path.dirname(salida), exist_ok=True)
subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", entrada,
                "-vf", f"fps={FPS},format=yuv420p", "-c:v", "libx264", "-preset", "medium", "-crf", "22",
                salida], check=True, capture_output=True)
print(f"{salida} · {len(frames)} escenas · {os.path.getsize(salida)//1024} KB")
