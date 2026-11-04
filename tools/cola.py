#!/usr/bin/env python3
"""Rellena dinero/cola-pines.json con cartas limpias y todos los datos para componer la pieza."""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pieza import slugify, eur

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST = os.path.join(ROOT, "..", "dinero", "cola-pines.json")
TOPE = int(sys.argv[1]) if len(sys.argv) > 1 else 400

cards = json.load(open(os.path.join(ROOT, "data", "cards.json")))
cambios = {}
try:
    ch = json.load(open(os.path.join(ROOT, "data", "changes.json")))
    for m in ch.get("suben", []) + ch.get("bajan", []):
        cambios[m["id"]] = (m["de"], m["a"])
except Exception:
    pass


def limpia(c):
    v = [(x.get("trend") or x.get("avg")) for x in (c.get("variants") or []) if (x.get("trend") or x.get("avg"))]
    return not (len(v) > 1 and max(v) > min(v) * 3)


# lo que vende manda: el sellado del 30.º aniversario es el top de Amazon;
# después los personajes que la gente busca por nombre; el precio solo desempata.
POPULARES = ("pikachu", "charizard", "umbreon", "espeon", "eevee", "mew", "mewtwo",
             "lugia", "rayquaza", "gengar", "snorlax", "gyarados", "blastoise", "venusaur")

def demanda(c):
    n = (c.get("name") or "").lower()
    s = 0
    if c.get("setId") == "30th": s += 5
    if "151" in (c.get("setName") or ""): s += 3
    if any(k in n for k in POPULARES): s += 2
    if (c.get("rarity") or "").lower() in ("holo", "ultra rara", "rara"): s += 1
    if c["price"] >= 100: s += 1
    return s

cands = [c for c in cards if c.get("price") and c.get("image") and c["price"] >= 15 and limpia(c)]
cands.sort(key=lambda c: (-demanda(c), -c["price"]))

# solo cartas con imagen que exista de verdad (hay sets con 404)
import concurrent.futures, urllib.request

def imagen(c):
    for suf in ("/high.png", "/high.webp"):
        u = c["image"].rstrip("/") + suf
        try:
            r = urllib.request.urlopen(urllib.request.Request(u, method="HEAD",
                headers={"User-Agent": "Mozilla/5.0"}), timeout=12)
            if r.status == 200:
                return u
        except Exception:
            continue
    return None

validas = []
with concurrent.futures.ThreadPoolExecutor(16) as ex:
    futuros = {ex.submit(imagen, c): c for c in cands[:TOPE + 60]}
    for f in concurrent.futures.as_completed(futuros):
        u = f.result()
        if u:
            c = futuros[f]
            c["_img"] = u
            validas.append(c)
validas.sort(key=lambda c: -c["price"])
cands = validas[:TOPE]

cola = []
for c in cands:
    antes, ahora = cambios.get(c["id"], (None, c["price"]))
    enlace = f"https://valorcarta.github.io/carta/{c['id']}-{slugify(c['name'])}/"
    cola.append({
        "id": c["id"], "nombre": c["name"], "set": c["setName"],
        "precio": ahora, "antes": antes if (antes and antes > 0) else None,
        "imagen": c["_img"],
        "enlace": enlace,
        "titulo": f"¿Cuánto vale {c['name']}? {eur(ahora)} · {c['setName']}"[:100],
        "descripcion": (f"{c['name']} de {c['setName']}: precio de referencia de Cardmarket hoy, {eur(ahora)}. "
                        f"Ficha con histórico y enlace de compra. Enlace de afiliado de Amazon."),
        "estado": "pendiente",
    })

json.dump(cola, open(DEST, "w"), ensure_ascii=False, indent=1)
print(f"cola: {len(cola)} cartas -> {os.path.abspath(DEST)}")
print("primera:", cola[0]["titulo"])
