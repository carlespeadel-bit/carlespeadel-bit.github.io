#!/usr/bin/env python3
"""Vídeo vertical v2: la carta manda, el número grita, nada de fondo vacío."""
import json, os, subprocess, datetime
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1080, 1920
AMARILLO = (255, 203, 5)
NEGRO = (10, 10, 11)

def fuente(tam, negrita=False):
    for r in ["/System/Library/Fonts/Supplemental/Arial Bold.ttf" if negrita else "/System/Library/Fonts/Supplemental/Arial.ttf",
              "/System/Library/Fonts/Helvetica.ttc"]:
        if os.path.exists(r):
            try: return ImageFont.truetype(r, tam)
            except Exception: pass
    return ImageFont.load_default()

def eur(n): return f"{n:,.2f} €".replace(",", "X").replace(".", ",").replace("X", ".")

def fondo_con_carta(ruta_img):
    """Fondo: la misma carta ampliada, desenfocada y oscurecida."""
    base = Image.open(ruta_img).convert("RGB")
    escala = max(W / base.width, H / base.height)
    b = base.resize((int(base.width * escala) + 1, int(base.height * escala) + 1))
    x = (b.width - W) // 2; y = (b.height - H) // 2
    b = b.crop((x, y, x + W, y + H)).filter(ImageFilter.GaussianBlur(38))
    velo = Image.new("RGB", (W, H), (8, 8, 10))
    return Image.blend(b, velo, 0.78)

def escena_hook(c, de, a, pct):
    im = fondo_con_carta(c["img"])
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 16], fill=AMARILLO)
    carta = Image.open(c["img"]).convert("RGB")
    ch = 760
    carta = carta.resize((int(carta.width * ch / carta.height), ch))
    im.paste(carta, ((W - carta.width) // 2, 250))
    f_g = fuente(190, True); f_m = fuente(58); f_s = fuente(46)
    txt = f"+{pct:.0f} %" if pct > 0 else f"{pct:.0f} %"
    w = d.textlength(txt, font=f_g)
    d.text(((W - w) / 2, 1060), txt, font=f_g, fill=AMARILLO)
    d.text((70, 1300), "en un solo día", font=f_m, fill=(235, 235, 240))
    nombre = f"{c['name']} · {c['set']}"
    d.text((70, 1400), nombre[:38], font=f_s, fill=(170, 170, 180))
    return im

def escena_carta(c, de, a, pct, i):
    im = fondo_con_carta(c["img"])
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 16], fill=AMARILLO)
    d.text((70, 120), "VALORCARTA", font=fuente(40), fill=AMARILLO)
    carta = Image.open(c["img"]).convert("RGB")
    ch = 640
    carta = carta.resize((int(carta.width * ch / carta.height), ch))
    im.paste(carta, ((W - carta.width) // 2, 230))
    f_n = fuente(64, True); f_v = fuente(120, True); f_l = fuente(46)
    d.text((70, 940), c["name"][:24], font=f_n, fill=(245, 245, 247))
    d.text((70, 1020), c["set"][:34], font=fuente(42), fill=(160, 160, 172))
    d.text((70, 1130), eur(a), font=f_v, fill=AMARILLO)
    d.text((70, 1290), f"antes {eur(de)}", font=f_l, fill=(180, 180, 190))
    signo = "+" if pct > 0 else ""
    d.text((70, 1370), f"{signo}{pct:.0f} % en 24 h", font=fuente(56, True), fill=(126, 231, 135) if pct > 0 else (248, 81, 73))
    d.text((70, H - 150), "valorcarta.github.io", font=fuente(44), fill=AMARILLO)
    return im

def escena_final():
    im = Image.new("RGB", (W, H), NEGRO)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 16], fill=AMARILLO)
    d.text((70, 300), "VALORCARTA", font=fuente(46), fill=AMARILLO)
    d.text((70, 420), "Mira", font=fuente(150, True), fill=(245, 245, 247))
    d.text((70, 590), "cuánto", font=fuente(150, True), fill=(245, 245, 247))
    d.text((70, 760), "vale la tuya", font=fuente(150, True), fill=(245, 245, 247))
    d.text((70, 1000), "9.830 cartas con precio", font=fuente(56), fill=(210, 210, 220))
    d.text((70, 1090), "y media de 30 días.", font=fuente(56), fill=(210, 210, 220))
    d.text((70, 1250), "Gratis. Sin registro.", font=fuente(52, True), fill=AMARILLO)
    d.text((70, H - 200), "valorcarta.github.io", font=fuente(64, True), fill=AMARILLO)
    return im

usadas = json.load(open("/tmp/vc_img/lista.json"))
# ordenar por subida
usadas.sort(key=lambda x: -x[6])
frames = []
if usadas:
    c0 = usadas[0]
    frames.append(escena_hook({"img": c0[1], "name": c0[2], "set": c0[3]}, c0[4], c0[5], c0[6]))
for i, u in enumerate(usadas):
    frames.append(escena_carta({"img": u[1], "name": u[2], "set": u[3]}, u[4], u[5], u[6], i))
frames.append(escena_final())

tmp = "/tmp/vc_video2"; os.makedirs(tmp, exist_ok=True)
for i, f in enumerate(frames): f.save(f"{tmp}/f{i:03d}.png")
dur = 3.0
with open(f"{tmp}/lista.txt", "w") as fh:
    for i in range(len(frames)): fh.write(f"file '{tmp}/f{i:03d}.png'\nduration {dur}\n")
    fh.write(f"file '{tmp}/f{len(frames)-1:03d}.png'\n")

salida = os.path.join(ROOT, "out", f"short-v2-{datetime.date.today()}.mp4")
subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", f"{tmp}/lista.txt",
                "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-preset", "medium", "-crf", "21", salida],
               check=True, capture_output=True)
print(f"{salida} · {len(frames)} escenas · {os.path.getsize(salida)//1024} KB")
