# Subir un vídeo a YouTube (procedimiento que funciona)

Escrito el 04-11-2026 después de 4 subidas fallidas por una causa que no era la que parecía. **No improvisar: seguir esto.**

## Antes de nada: el vídeo no se pierde
Los borradores **se quedan en la cuenta**. Si cierras el diálogo, entra en `studio.youtube.com` → **Contenido** → y busca el borrador antes de volver a subir. Cuatro intentos míos = cuatro borradores acumulados, ninguno perdido.

## El fallo real
El botón **Siguiente** se queda **deshabilitado** en "Detalles". No es el servidor, no es la verificación del canal, no es la subida. Se detecta así:

```js
[...document.querySelectorAll('[aria-invalid="true"]')]  // te dice qué campo está mal
```

**Causa encontrada: la descripción.** Contenía `->` (flecha ASCII). Cambiarla por `→` desbloqueó los tres pasos.

## Procedimiento
1. `studio.youtube.com` → **Crear** → **Subir vídeos** → seleccionar el fichero.
2. Rellenar título y descripción. **Sin `->`, sin `<`, sin `&` raros.** Usar `→`, `•` y texto normal.
3. Comprobar que no hay campos inválidos: `document.querySelectorAll('[aria-invalid="true"]')` debe estar vacío.
4. Avanzar: **Detalles → Elementos → Comprobaciones → Visibilidad**.
5. Audiencia: **"No, no está creado para niños"** (obligatorio o "Siguiente" no avanza).
6. Visibilidad: radio **`name=PUBLIC`**. Verificar que queda marcado antes de guardar.
7. Guardar/Publicar y **esperar**: el vídeo aparece primero en la pestaña **Shorts**, no en "Vídeos".

## Verificación (sin cookies, desde fuera)
```bash
# 1) oembed: dice si existe y es público
curl -s "https://www.youtube.com/oembed?url=https://youtu.be/<ID>&format=json"

# 2) canal público, pestaña Shorts
curl -s -A "Mozilla/5.0" "https://www.youtube.com/@TimeLineError-V7/shorts" | grep -o '/shorts/[\w-]\{11\}'
```

**Regla:** un vídeo no está publicado hasta que lo diga el `oembed` **o** la página pública del canal. La lista de Studio no es prueba: puede ir con retraso y no muestra los Shorts.

## Lo que aprendí y aplico desde ya
- **Mirar el DOM antes de acusar al servidor.** Cuatro subidas con esperas fijas de 30 s no dicen nada; `[aria-invalid]` lo dice todo.
- **Los Shorts no salen en la pestaña "Vídeos".** Buscar en "Shorts" antes de concluir que se perdió.
- **Verificar desde fuera, sin sesión.** Es la única prueba de que el mundo lo ve.
