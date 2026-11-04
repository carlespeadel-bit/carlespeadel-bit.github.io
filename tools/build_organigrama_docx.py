#!/usr/bin/env python3
"""Genera el organigrama de ValorCarta en DOCX desde EMPRESA.json (fuente única).

Uso: python3 tools/build_organigrama_docx.py [salida.docx]
"""
import json, os, sys
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SALIDA = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "ORGANIGRAMA.pdf").replace(".pdf", ".docx")

AMARILLO = RGBColor(0xE0, 0xA8, 0x00)
GRIS = RGBColor(0x55, 0x55, 0x55)
NEGRO = RGBColor(0x11, 0x11, 0x11)

emp = json.load(open(os.path.join(ROOT, "tools", "EMPRESA.json")))
e = {x["id"]: x for x in emp["empleados"]}
comprometido = sum(x["sueldo"] for x in emp["empleados"] if x["estado"] == "activo")


def sombrear(celda, hexcolor):
    tcPr = celda._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:fill"), hexcolor)
    tcPr.append(shd)


def borde_inferior(p, color="E0A800", size=12):
    pPr = p._p.get_or_add_pPr()
    pbdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), str(size))
    bottom.set(qn("w:color"), color)
    pbdr.append(bottom)
    pPr.append(pbdr)


def anchos_fijos(t):
    t.autofit = False
    tblPr = t._tbl.tblPr
    layout = OxmlElement("w:tblLayout")
    layout.set(qn("w:type"), "fixed")
    tblPr.append(layout)


def tabla(doc, cabeceras, filas, anchos, fuente=8.5):
    t = doc.add_table(rows=1, cols=len(cabeceras))
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    anchos_fijos(t)
    for i, w in enumerate(anchos):
        t.columns[i].width = Cm(w)
    for i, (h, w) in enumerate(zip(cabeceras, anchos)):
        c = t.rows[0].cells[i]
        c.width = Cm(w)
        p = c.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(fuente)
        r.font.color.rgb = NEGRO
        sombrear(c, "F4F1E8")
    for fila in filas:
        celdas = t.add_row().cells
        for i, (val, w) in enumerate(zip(fila, anchos)):
            celdas[i].width = Cm(w)
            p = celdas[i].paragraphs[0]
            p.paragraph_format.space_after = Pt(1)
            txt = str(val)
            negrita = txt.startswith("**") and txt.endswith("**")
            r = p.add_run(txt.strip("*"))
            r.font.size = Pt(fuente)
            r.bold = negrita
    return t


doc = Document()
sec = doc.sections[0]
sec.top_margin = Cm(1.8); sec.bottom_margin = Cm(1.6)
sec.left_margin = Cm(2.0); sec.right_margin = Cm(2.0)
est = doc.styles["Normal"]
est.font.name = "Helvetica"
est.font.size = Pt(9.5)
est.paragraph_format.space_after = Pt(4)

# ---------- cabecera ----------
p = doc.add_paragraph()
r = p.add_run("VALORCARTA")
r.bold = True; r.font.size = Pt(10); r.font.color.rgb = AMARILLO
p2 = doc.add_paragraph()
r = p2.add_run("Organigrama")
r.bold = True; r.font.size = Pt(30); r.font.color.rgb = NEGRO
p3 = doc.add_paragraph()
r = p3.add_run("Versión 3 · 4 de noviembre de 2026 · fuente única: tools/EMPRESA.json")
r.font.size = Pt(9); r.font.color.rgb = GRIS
borde_inferior(p3)

# ---------- la meta ----------
doc.add_paragraph()
p = doc.add_paragraph()
r = p.add_run("1. La única meta")
r.bold = True; r.font.size = Pt(14)
p = doc.add_paragraph()
r = p.add_run("ingresos_mes ≥ 1.000 €.  ")
r.bold = True; r.font.size = Pt(11)
r = p.add_run("Todo lo demás —páginas, enlaces, ASIN, vídeos— son medios. Coste fijo de la estructura: 0 €/mes. "
              "Si entran ingresos, se reparte el 50 % por peso entre los que cumplan su KPI; si no, cero.")
r.font.size = Pt(9.5)

# ---------- estructura ----------
p = doc.add_paragraph()
r = p.add_run("2. Estructura")
r.bold = True; r.font.size = Pt(14)
tabla(doc,
      ["Área", "Puestos"],
      [["**Dirección**", "Dirección General · KPI: ingresos_mes"],
       ["**Demanda**", "Analista de demanda · Redactor jefe · Distribución"],
       ["**Producto**", "Ingeniería · SEO técnico · Datos"],
       ["**Monetización**", "Afiliados"],
       ["**Control**", "Auditoría · Soporte · Fiscal"],
       ["**Estudio**", "Inteligencia · Enlace · Creativa · Optimizador · Divergente · Abstraedor · Estrategia"],
       ["**Puertas de calidad**", "Vídeo: 3 «no» bloquean la publicación · Turno: sin URL, cifra o commit no es avance"]],
      [3.6, 13.4])

# ---------- plantilla ----------
doc.add_paragraph()
p = doc.add_paragraph()
r = p.add_run("3. Plantilla: 15 puestos (14 con reloj; SEO sin él)")
r.bold = True; r.font.size = Pt(14)
orden = ["director", "demanda", "contenido", "distribucion", "constructor", "seo",
         "datos", "afiliados", "auditor", "soporte", "inteligencia", "enlace", "fiscal", "optimizador", "creativa"]
filas = []
for k in orden:
    x = e[k]
    filas.append([f"**{x['nombre']}**", x["objetivo"], x["turno"]])
tabla(doc, ["Puesto", "KPI", "Turno"], filas, [4.0, 8.6, 4.4])

# ---------- estudio ----------
doc.add_paragraph()
p = doc.add_paragraph()
r = p.add_run("4. Estudio: 3 puestos sin turno diario propio")
r.bold = True; r.font.size = Pt(14)
filas = [[f"**{e[k]['nombre']}**", e[k]["objetivo"], e[k]["turno"]] for k in ["divergente", "abstraedor", "estrategia"]]
tabla(doc, ["Puesto", "Qué hace", "Turno"], filas, [3.6, 9.0, 4.4])

# ---------- nómina ----------
doc.add_paragraph()
p = doc.add_paragraph()
r = p.add_run("5. Dinero")
r.bold = True; r.font.size = Pt(14)
t = doc.add_table(rows=1, cols=2)
t.style = "Table Grid"
anchos_fijos(t)
t.columns[0].width = Cm(8.5)
t.columns[1].width = Cm(8.5)
c = t.rows[0].cells
c[0].width = Cm(8.5); c[1].width = Cm(8.5)
for celda, (etq, val, nota) in zip(c, [("Coste fijo", "0 €/mes", "no hay sueldos: 18 fichas sin coste"),
                                       ("Reparto si hay ingresos", "50 %", "de ingresos_mes, por peso (34 puntos)")]):
    p = celda.paragraphs[0]
    r = p.add_run(etq); r.font.size = Pt(9); r.font.color.rgb = GRIS
    p = celda.add_paragraph()
    r = p.add_run(val); r.bold = True; r.font.size = Pt(20); r.font.color.rgb = NEGRO
    p = celda.add_paragraph()
    r = p.add_run(nota); r.font.size = Pt(8); r.font.color.rgb = GRIS
p = doc.add_paragraph()
r = p.add_run("Quedan muertos los tres números que circulaban: 19.500 € escrito a mano, 41.000 € sumando fichas duplicadas y 0 € pagado. "
              "Ahora el dinero solo se calcula y solo existe si entra.")
r.font.size = Pt(8.5); r.font.color.rgb = GRIS

# ---------- relojes ----------
doc.add_page_break()
p = doc.add_paragraph()
r = p.add_run("6. Relojes: 80 disparos al día")
r.bold = True; r.font.size = Pt(14)
tabla(doc, ["Turno", "Puesto", "Disparos/día"],
      [["07:10 mantenimiento", "Ingeniería", "1"],
       ["09:00 bucle del director", "Dirección", "1"],
       ["09:30 nota Nostr", "Distribución", "1"],
       ["10:00 contenido y demanda", "Demanda · Redactor", "1"],
       ["11:00 afiliados y datos", "Afiliados · Datos", "1"],
       ["12:30 vídeo", "Dirección creativa", "1"],
       ["16:00 caza de huecos", "Fiscal", "1"],
       ["18:00 Pinterest", "Distribución", "1"],
       ["20:00 optimizador", "Optimizador", "1"],
       ["21:00 supervisión", "Auditoría", "1"],
       ["22:00 enlace y principios", "Enlace · Abstraedor", "1"],
       ["cada 3 h tráfico", "Distribución", "8"],
       ["cada 2 h competencia", "Inteligencia", "12"],
       ["**cada 30 min vigía**", "**Soporte**", "**48**"],
       ["semanal", "Consejo · Comité · Ruptura", "~0,6"]],
      [6.6, 7.4, 3.0])
p = doc.add_paragraph()
r = p.add_run("El vigía se lleva el 60 % de los disparos. Un hueco declarado: SEO técnico no tiene reloj. "
              "Riesgo estructural: los 17 relojes cuelgan de una sola sesión.")
r.font.size = Pt(8.5); r.font.color.rgb = GRIS

# ---------- reglas ----------
doc.add_paragraph()
p = doc.add_paragraph()
r = p.add_run("7. Reglas de personal")
r.bold = True; r.font.size = Pt(14)
reglas = [
    "Trinquete. Meta cumplida dos semanas seguidas ⇒ sube un 50 %. Fallada ⇒ se queda y se pierde un intento.",
    "Suelo diario. Cada día, un avance medible. Día sin avance = perdido; 2 seguidos ⇒ sanción; 5 al mes ⇒ fuera.",
    "No es avance leer, planificar, «dejar preparado» ni refactorizar sin efecto medible.",
    "Muertes. Limpia (se midió) no cuesta y suma un descubrimiento; sucia (sin medir o repetida) cuesta 2 intentos.",
    "Sanciones. 1 aviso · 2 nivel C · 3 suspensión · 4 cese (entra el banquillo, nunca se duplica la ficha). No hay sueldo que descontar.",
    "Veto con caducidad: 48 h código y contenido, 6 h canales externos; máximo 3 vivos.",
    "Freno de reglamentación: máximo 2 reglas nuevas por semana. Una regla sin turno que la ejecute no se escribe.",
    "Nadie asciende por actividad: se asciende por KPI cumplido dos semanas seguidas.",
]
for i, txt in enumerate(reglas, 1):
    p = doc.add_paragraph(style="List Number")
    r = p.add_run(txt); r.font.size = Pt(9)
    p.paragraph_format.space_after = Pt(2)

# ---------- pie ----------
p = doc.add_paragraph()
borde_inferior(p, "DDDDDD", 6)
p = doc.add_paragraph()
r = p.add_run("Si este documento y EMPRESA.json discrepan, manda el JSON y se corrige aquí en el mismo turno.")
r.font.size = Pt(8); r.font.color.rgb = GRIS

doc.save(SALIDA)
print("guardado:", SALIDA)
