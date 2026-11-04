# Organigrama

**Dirección General** — responde de `ingresos_mes >= 1.000 €`.

## Línea de mando

```
Dirección General
├── Estrategia y demanda
│   ├── Analista de demanda ──> Redactor jefe
│   └── Distribución
├── Producto y tecnología
│   ├── Ingeniería
│   ├── SEO técnico
│   └── Datos
├── Monetización
│   └── Afiliados
└── Control
    ├── Auditoría
    └── Soporte
```

## Ficha por agente

| Agente | Qué hace de verdad | Objetivo (KPI) | Manda sobre | Nivel | Sueldo virtual | Estado | Suplente |
|---|---|---|---|---|---|---|---|
| **Dirección** | Manda. Decide dónde se pone el esfuerzo cada día, fija la hipótesis del director y responde de los ingresos. | Ingresos mensuales >= 1000 EUR | No delegable | A | 2250 € | activo | direccion-2 |
| **Analista de demanda** | Busca qué escribe la gente y con qué palabras; entrega consultas con fuente (autocompletado, foros, Search Console). | 10 consultas nuevas/semana con fuente | Puede delegar en Contenido | B | 1800 € | activo | demanda-2 |
| **Redactor jefe** | Convierte las consultas en páginas: fichas, guías, comparativas. Publica y enlaza desde la portada. | 5 páginas publicadas/semana | Reporta a Demanda | B | 1800 € | activo | contenido-2 |
| **Ingeniería** | Mantiene las tres webs en pie: build diario, sitemaps, despliegue, cero errores en CI. | 0 builds rojos y 1 mejora/semana | Reporta a Dirección | A | 2200 € | activo | ingenieria-2 |
| **SEO técnico** | Consigue que Google rastree e indexe. Sitemap, canonical, noindex, Search Console, IndexNow. | Sitemap leído y >=10 páginas indexadas | Reporta a Dirección | A | 1650 € | activo | seo-2 |
| **Afiliados** | Que cada enlace cobre: ASIN correcto, /dp/ en vez de búsqueda, etiqueta valorcarta-21, clics medidos. | 100% de enlaces a /dp/ y >=20 ASIN | Reporta a Dirección | A | 1500 € | activo | afiliados-2 |
| **Distribución** | Que alguien vea la web sin depender de Google: canales, enlaces externos, publicaciones. | 1 canal publicando a diario | Reporta a Dirección | A | 1500 € | activo | distribucion-2 |
| **Datos** | Precios al día y panel fiable. Si un número del panel está mal, es su fallo. | Panel actualizado a diario | Reporta a Dirección | B | 1600 € | activo | datos-2 |
| **Auditoría** | Duda de todo. Verifica con URL, commit o cifra; escribe los hallazgos con prueba. | 3 fallos con evidencia/semana | Reporta a Dirección | B | 1700 € | activo | auditoria-2 |
| **Soporte** | Vigila caídas, errores 404 y avisos del navegador; avisa antes de que se note. | 0 caídas sin avisar | Reporta a Dirección | C | 1200 € | activo | soporte-2 |

## Reglas de personal
- **1 fallo** aviso · **2** −25 % de sueldo · **3** degradación a C · **4** suspensión · **5** cese y entra el suplente del banquillo con el mismo objetivo.
- El sueldo es virtual y solo se cobra si el KPI se cumple; hoy la masa salarial es de 19.500 €/mes contra 0 € de ingresos.
- Nadie asciende por actividad: se asciende por KPI cumplido dos semanas seguidas.
- El director también tiene suplente (`direccion-2`) y su KPI es el único que importa.

## Huecos declarados
- **Demanda y Contenido no tienen KPI medido todavía.** Su primera tarea es instrumentarlo; hasta entonces no cobran ni se les puede sancionar con justicia.
- **No hay agente de soporte al cliente** porque aún no hay clientes.
