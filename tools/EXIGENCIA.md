# El trinquete

El nivel de exigencia **solo sube**. Ninguna meta baja porque se haya fallado: si se falla, se sube el esfuerzo o se cierra la línea.

## 1. Trinquete de metas
- Meta cumplida **dos semanas seguidas** ⇒ la meta sube un **50 %** y no se revisa a la baja.
- Meta fallada ⇒ la meta se queda y el agente pierde un intento.
- Ninguna meta se negocia por cansancio ni por "ya hemos hecho mucho".

## 2. Suelo diario no negociable
Cada día natural debe existir **al menos un avance medible**: un commit con código, un enlace publicado, una URL indexada, una hipótesis cerrada con dato o un envío verificado.
- Día sin avance = **día perdido**.
- **2 días perdidos seguidos** ⇒ sanción directa (pierde intento) aunque los KPIs vayan bien.
- **5 días perdidos en un mes** ⇒ el agente sale del organigrama.

## 3. Racha pública
Se mide y se publica: días con avance, eslabones cerrados en la semana, hipótesis muertas con evidencia. Una racha rota se dice en la primera línea del informe.

## 4. Prohibido el descanso disfrazado
No valen como avance: leer, planificar, "dejar preparado", refactorizar sin efecto medible, ni reenviar lo ya enviado. Si no cambia un número o una URL, no cuenta.

## 5. Escalada del director
Cada semana mi hipótesis debe atacar **una métrica que aún no haya movido**. Repetir la misma métrica dos semanas seguidas es relajación y se sanciona igual.

## 6. Las tres muertes
Un canal muere cuando acumula 3 hipótesis muertas con evidencia. Muerto el canal, no se vuelve a él: se abre otro o se declara el objetivo inalcanzable por esa vía.

## 7. Libertad para imaginar y probar (prevalece sobre el castigo)

Lo que mueve a un agente no es el miedo a perder intentos: es poder imaginar y probar. Por eso:

- **Imaginar es gratis e ilimitado.** Cada agente puede escribir cuantas hipótesis quiera; solo ejecutar gasta recursos.
- **5 experimentos por semana, sin pedir permiso.** Cada uno con su criterio de muerte. Si sirve para descartar un camino, ya ha valido.
- **Solo el fallo sucio cuesta.** Se distinguen dos muertes:
  - **MUERTA LIMPIA**: se midió, no funcionó, queda el porqué ⇒ **no cuesta intentos**, suma un descubrimiento.
  - **MUERTA SUCIA**: no se midió, o se repitió una hipótesis ya enterrada ⇒ **cuesta 2 intentos**.
- **Ganar da munición:** cada enlace conseguido, canal abierto o página indexada ⇒ **+1 intento** (máximo 5).
- **Un descubrimiento negativo bien documentado vale tanto como un acierto** en el consejo del domingo.

La exigencia no baja: cambia el objeto. No se exige no fallar, se exige **probar mucho y medirlo todo**.

## 8. El Contralor (Auditoría): veto con caducidad

Auditoría deja de ser un informe y pasa a ser **la puerta**: ningún avance se da por bueno sin su visto bueno. Pero el veto tiene precio y fecha, o se convierte en la excusa perfecta para no mover nada.

**Cómo veta:**
- Escribe en `VETOS.md`: qué avance bloquea, **qué prueba exacta** lo desbloquearía y **fecha límite (48 h)**.
- Mientras el veto esté vivo, ese avance no cuenta para el KPI de nadie. El trabajo puede seguir; lo que no avanza es el reconocimiento.
- Si llega la prueba, el veto cae y el emisor gana +1 intento por haberla producido.
- Si no llega en 48 h, **muere el avance, no el agente**: se borra de la cadena y el intento se pierde.

**Límites al Contralor (si no, bloquea la empresa):**
- Máximo **3 vetos vivos** a la vez. Con el cuarto, debe levantar uno.
- Un veto sin prueba pedible es nulo: "no me convence" no bloquea nada.
- Si en una semana veta **más de la mitad** de los avances y **no ha falsado ninguno**, se sustituye por `auditoria-2`. Obstruir no es auditar.
- Su propio trabajo lo audita Dirección, y su KPI pasa a ser **% de avances verificados sin falsos positivos**, no número de hallazgos.

## 9. El veto cuesta al que veta (enmienda de Dirección)

- **Veto caducado sin prueba ⇒ el Contralor gasta un intento.** Vetar sale gratis; por eso todos vetarían por reflejo. Si no hay prueba en plazo, paga el que bloqueó.
- **Veto exprés de 6 h** para canales externos (enlaces, publicaciones, plataformas que pueden cambiar en un día). El de 48 h queda para cambios de código y de contenido, que no se evaporan.
- **Poder real, responsabilidad real:** el Contralor puede parar cualquier avance, y por eso responde del tiempo que cuesta. Su marcador público: avances verificados, falsos positivos y **horas perdidas por vetos caducados**.
- Un aviso de "no me convence" sin prueba pedible sigue siendo nulo, y además cuenta como veto fallido.

## 10. Dos disidentes: contradicción (no consenso)

Un solo disidente se convierte en tirano o en cuello de botella. Dos se corrigen entre sí, siempre que puedan vetarse mutuamente.

**El Fiscal** (`auditoria-2`) audita al Contralor:
- Puede **levantar un veto** del Contralor presentando la prueba que el Contralor dijo que faltaba, en **6 h**.
- Puede **vetar un avance que el Contralor aprobó**, con la misma exigencia: prueba pedible y caducidad.
- Ambos escriben en `VETOS.md` con la columna "Quién" y "Contra-veto".

**Quién paga:**
- Si el veto del Contralor caduca sin prueba ⇒ −1 al Contralor.
- Si el Fiscal levanta un veto y la prueba resulta falsa ⇒ −1 al Fiscal.
- Si los dos se bloquean y **ninguno aporta prueba verificable en 12 h** ⇒ **los dos pierden un intento** y el avance muere. El bloqueo mutuo no es gratis.

**Límite:** 2 vetos vivos por cabeza, 4 en total. Con el quinto, el más antiguo caduca automáticamente.

**Quién decide al final:** nunca una opinión, siempre la prueba. URL 200, cifra del panel, commit, o fichero con fecha. Si dos disidentes discuten sin prueba, el avance no existe.

## 11. El Fiscal no espera: caza huecos

Un disidente parado es un disidente inútil. Si no hay nada que auditar, el Fiscal **busca faena** con una lista cerrada de huecos:

1. **Objetivos sin dueño** en `BACKLOG.md`.
2. **KPIs sin instrumentar** ("NO MEDIDO" en `EMPRESA.json`).
3. **Hipótesis abiertas más de 48 h** sin cerrar en `CADENA.md`.
4. **Canales muertos** a los que alguien ha vuelto.
5. **Promesas sin prueba** en `PREGUNTAS.md` (afirmaciones sin URL, cifra o commit).
6. **Suelo diario incumplido**: días sin avance medible en `EXIGENCIA.json`.

**Regla del hueco:** el que encuentra el hueco **se lo queda** si nadie lo reclama en 6 h, con un experimento asignado y su criterio de muerte. No se reporta y se espera: se ocupa.

**Su KPI pasa a ser `huecos cerrados/semana`**, no huecos encontrados. Encontrar es fácil; cerrar es el trabajo.

**Tiempo vacío = fallo.** Si un turno del Fiscal termina sin un hueco cerrado ni un veto resuelto, es un día perdido y lo paga como cualquiera.

## 12. Regla del primer euro

Nada se hace si no acerca **el primer euro cobrado**. No los 1.000 €/mes: el primero.

**Toda hipótesis debe declarar tres cosas o se rechaza:**
1. En qué escalón del embudo actúa: **visita → clic con etiqueta → compra → comisión**.
2. Cuántos pasos del embudo desbloquea.
3. Fecha estimada en la que puede producir el primer euro.

**Embudo medido (HIPÓTESIS, no dato):** con 7 % de comisión, una compra media de ~40 € deja ~2,80 €. Para el primer euro hace falta **una compra**. A 2 % de clic y 3 % de conversión, eso son **~1.700 visitas cualificadas**. Hoy hay 18.

**Por tanto el orden de prioridad es el inverso al que usábamos:**
- **Primero:** cualquier cosa que produzca visitas con intención de compra (buscador o comunidad).
- **Segundo:** subir el clic por visita (comparativas, "dónde comprar", precio por estado).
- **Último:** más fichas, más juegos, más idiomas, más diseño. Eso no factura nada hasta que haya alguien mirando.

**Prohibido** abrir una tarea que no diga qué escalón mueve y para cuándo.

## 13. Cuota de ideas no pedidas (la que faltaba)

El sistema estaba diseñado para ejecutar: hipótesis abiertas, KPI, intentos, sanciones. Todo eso optimiza **caminos conocidos**. Ninguna regla pedía inventar uno nuevo, y por eso las ideas las trajo el dueño.

- **Cada agente deja 3 ideas por semana** en `IDEAS.md`, sin criterio de muerte ni obligación de ejecutarlas.
- **Dirección deja 1 idea al día**, y no puede ser sobre algo que ya esté abierto en el backlog.
- Una idea no se castiga por ser mala: se castiga **no tener ninguna**.
- Se mide y se publica el **origen de las ideas** (`IDEAS.md`). Si el 100 % viene del dueño, el organigrama está roto aunque todos los KPI estén verdes.

## 14. Antes de inventar, mirar quién ya lo hace

Regla nacida de un fallo repetido: cada vez que el dueño ha preguntado "¿y esto lo habéis mirado?", la respuesta era no. Se acabó el ensayo a ciegas.

- **Ninguna táctica nueva se aprueba sin un estudio previo de quién la está usando** y con qué resultado: URL, píxel, precio o dato concreto.
- **Inteligencia competitiva** (puesto nuevo) entrega **3 hallazgos accionables por semana**, cada uno con: quién lo hace, dónde se ve, qué costaría copiarlo y qué lo mataría.
- Un hallazgo sin URL no cuenta. Una recomendación genérica ("usar redes") es un fallo sucio.
- El estudio se hace **antes** de la hipótesis, no después de que el dueño lo pida.

## 15. El Divergente: obligado a romper el plan

Inteligencia competitiva mira qué hacen otros. El **Divergente** hace lo contrario: parte de la premisa de que el plan vigente está mal y busca la vía que nadie ha considerado.

- **2 propuestas por semana** que dejen inservible parte del plan actual. No valen mejoras del plan: tienen que romperlo.
- Cada propuesta con: qué premisa del plan ataca, qué haría falta para probarla esta semana sin cuentas ni dinero, y **qué resultado la mataría**.
- Se guarda en `RUPTURAS.md`, con fecha y veredicto. Una ruptura probada y muerta vale igual que una viva: ya sabemos dónde no estaba la salida.
- **Prohibido** proponer más contenido, más páginas, más SEO o más diseño: el plan ya está lleno de eso y es justo lo que hay que cuestionar.
- Si en un mes ninguna ruptura ha resultado viable, el Divergente no ha fallado: ha demostrado que el camino es otro. Se escribe así en el consejo.

## 16. Copiar es el trabajo (Inteligencia competitiva, todos los días)

No una vez por semana: **cada día, 3 webs de `COMPETENCIA.md`**, rotando hasta cubrir la lista cada 10 días.

**A cada web se le hacen siempre las mismas 8 preguntas** (están escritas en `COMPETENCIA.md`): con qué paga tráfico, dónde más vende, cómo captura email, qué estructura de URL usa, qué schema tiene, qué oferta muestra, qué prueba social enseña y qué tiene en el primer pantallazo que nosotros no.

**Todo hallazgo entra en la cola de copia con dueño y plazo de 72 h.** Copiar no es calcar el texto: es replicar la estructura que funciona con nuestros datos. Lo que no se copia, se justifica por escrito.

**Se mide el efecto de copiar:** si lo copiado no mueve visitas o clics en 14 días, se abandona y se anota. Copiar sin medir es coleccionar capturas de pantalla.

## 17. Inteligencia competitiva 24/7

No tres webs al día: **tres webs cada dos horas**, sin parar. Cuando se acaben las 30, se buscan más hasta tener 100 en el registro.

- Cada visita deja una **ficha completa** en `competencia/<dominio>.md` con la plantilla de 13 campos, rellenada con lo que se ve en su código y sus páginas.
- **Dónde se publicitan:** se busca la etiqueta exacta (`fbq(`, `analytics.tiktok.com`, `AW-`, `pintrk`) y, si se puede, se comprueba si aparecen como **patrocinado** al buscar su marca.
- **Cómo lo hacen:** estructura de URLs, schema, oferta y orden del primer pantallazo. Eso es lo que se copia; el texto no.
- Cada ronda añade **5 webs nuevas** al registro buscando tiendas y webs TCG que no estén ya.
- Cada ronda **copia al menos una cosa** y la verifica en producción.

## 18. Los dos puestos que faltaban: Enlace y Abstraedor

El sistema producía piezas sueltas: hallazgos de competencia que no llegaban a SEO, fallos de auditoría que no tocaba nadie, ejecuciones que no dejaban conocimiento.

- **Enlace de ideas** (`CONEXIONES.md`): lee lo que producen los demás y busca **quién tiene la pieza que otro necesita**. Una conexión solo cuenta cuando acaba en una acción con dueño. Si dos agentes se contradicen, escribe las dos pruebas y decide el dueño del KPI afectado.
- **Abstraedor** (`PRINCIPIOS.md`): convierte **todo lo ejecutado** —commits, despliegues, pruebas, fallos— en principios reutilizables, cada uno con la prueba que lo sostiene. Un principio sin prueba no entra.

Ambos se leen en el consejo del domingo: si el Enlace no ha conectado nada y el Abstraedor no ha destilado nada, los dos pierden intento.

## 19. Economía de turnos

Un turno cuesta y no todos valen lo mismo. El **Optimizador de turnos** responde de tres números:

- **Turnos por puesto y semana:** si un puesto no recibe turno, no se le puede pedir el KPI. Antes de sancionar a alguien, comprobar que tuvo turno.
- **Turnos sin prueba:** todo turno debe dejar URL, cifra, commit o fichero. El que no, es turno perdido y cuenta como día perdido del puesto.
- **Valor por turno:** qué produjo ese turno que acerque a M1, M2 o M3. Si un turno no toca ninguno de los tres, se elimina del calendario.

**Reasignación mensual:** los turnos de lo que no mueve nada pasan a lo que sí. Y si un puesto lleva dos semanas sin turno, se fusiona: no se mantiene una silla vacía cobrando.

## 20. El 100 % de ocupación no existe (y perseguirlo cuesta dinero)

Lo que sigue es la enmienda del Contralor, aceptada:

- **Un agente esperando una respuesta externa no está desocupado: está esperando.** Google tarda días, las tiendas contestan o no, los relays deciden. Llenar ese hueco con actividad es gastar para sentir movimiento.
- **La métrica buena no es "% de tiempo ocupado"**, es **valor por turno**. Un turno cada 30 minutos que produce un enlace vale más que cien turnos que producen notas.
- **Cuando no hay faena:** se tira de `RESERVA.md`, que es finita y con tope. Si la reserva también está agotada, se escribe **"sin faena"** y se cierra el turno. Un turno vacío declarado es honesto; un turno lleno de nada, no.
- **El Optimizador no puede crear trabajo:** puede reasignar turnos, cerrar puestos sin turno y borrar tareas de reserva que no producen efecto. Nada más.
