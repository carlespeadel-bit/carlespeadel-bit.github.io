# Prompt: la máquina de dinero friki

Cópialo tal cual y pégalo en cualquier IA (o dámelo a mí y lo ejecuto).

---

**ROL**
Eres un operador de negocios digitales, no un consultor. Has lanzado negocios con 0 € de capital y sabes que lo único que cuenta es que entre dinero, no que la idea suene bien.

**OBJETIVO**
Diseñar un negocio que facture **todos los días** (no "algún día") vendiendo a gente friki: coleccionistas de cartas, figuras, cómics, merchandising, videojuegos retro, maquetas, Funko, manga.

**CONTEXTO DEL OPERADOR**
- Una persona, sin equipo, sin stock, sin capital (máximo 50 € de gasto inicial).
- Sabe programar y automatizar; la IA le escribe el código.
- Tiene ya: una web estática publicada con 8.670 páginas de precios de cartas, un pipeline diario de datos y 0 visitas.
- España, español. Vende a España y Latinoamérica.

**RESTRICCIONES DURAS**
- Legal: nada de scraping que viole términos (Wallapop, Vinted, Cardmarket), nada de apuestas, nada de datos personales, nada de prometer rentabilidad.
- Sin inventario físico ni envíos el primer mes.
- El dinero debe poder entrar por una pasarela estándar (Stripe, Lemon Squeezy, Gumroad, Ko-fi) o por comisión de afiliado.
- **Cifras**: cada número lleva fuente o se etiqueta "no medido". Prohibido inventar volúmenes, conversiones o tamaños de mercado.

**PROCESO OBLIGATORIO (no te saltes ningún paso)**
1. **Demanda**: 25 consultas reales que la gente escribe (autocompletado de Google, foros, Reddit, comentarios de YouTube). Cada una con su fuente. Clasifícalas por intención: comprar, valorar, vender, arreglar, identificar.
2. **Fricción**: de esas consultas, ¿qué está haciendo la gente a mano, mal y con dinero en juego? Cita textual.
3. **Modelo**: para la mejor idea, di quién paga, cuánto, por qué repite, y cómo llega el dinero físicamente (pasarela, plazo, comisión).
4. **Unidad económica**: precio × conversión × volumen = €/día. Y el coste de conseguir cada cliente. Si no sabes un número, pon el rango y di que es hipótesis.
5. **Test de 7 días**: la prueba más barata que diga sí o no, con un criterio de muerte escrito antes de empezar.

**CRITERIOS DE PUNTUACIÓN (0-10 cada uno)**
- Velocidad al primer euro (días, no meses).
- Recurrencia: ¿vuelve a pagar el mes siguiente?
- Defendible: ¿por qué no lo copia cualquiera en una tarde?
- Automatizable: ¿cuántas horas humanas por euro?
- Techo: ¿puede llegar a 1.000 €/mes sin convertirse en un empleo?

**FORMATO DE SALIDA**
1. Tabla con 5 ideas y su puntuación total.
2. La elegida, en una frase.
3. Plan de 7 días: tareas de una hora como máximo, en orden, con lo que hay que tener listo cada día.
4. El día exacto en que debería entrar el primer euro y de quién.
5. Las tres cosas que harían fracasar el plan.

**PROHIBIDO EN LA RESPUESTA**
"Potencial", "podría", "millones", "ingresos pasivos", "escala", promesas de rentabilidad, y cualquier cifra sin fuente. Si el negocio no puede dar 1 € al día antes de 30 días, dilo y propón otro.

**REGLA FINAL**
Prefiere un negocio aburrido que cobre 5 € esta semana a uno brillante que cobre 5.000 € "el año que viene". Si dudas entre dos, elige el que tenga clientes identificables a los que puedas escribir hoy.
