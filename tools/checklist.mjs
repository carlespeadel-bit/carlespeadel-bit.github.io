#!/usr/bin/env node
// Checklist: qué estamos cumpliendo de verdad, contra el plan a 90 días.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname);
const hoy = new Date().toISOString().slice(0, 10);
const leer = async (f) => (await readFile(path.join(ROOT, f), 'utf8').catch(() => ''));
const backlog = await leer('BACKLOG.md');
const cadena = await leer('CADENA.md');
const exig = JSON.parse(await leer('EXIGENCIA.json') || '{}');
const empresa = JSON.parse(await leer('EMPRESA.json') || '{}');

const hechas = (backlog.match(/- \[x\]/g) || []).length;
const pendientes = (backlog.match(/- \[ \]/g) || []).length;
const eslabonesCerrados = (cadena.match(/\*\*MUERTA\*\*|\*\*VIVA\*\*/g) || []).length;
const cansados = (empresa.empleados || []).filter((e) => e.estado === 'cesado').length;

const checklist = `# Checklist — ${hoy}

## Plan a 90 días
| Hito | Fecha | Estado |
|---|---|---|
| M1 · Google rastrea (≥10 páginas) | 11-11 | ⏳ en curso (hoy: 1) |
| M2 · ≥10 visitas externas en 7 días | 18-11 | ⏳ (hoy: 0) |
| M3 · Primer euro | 25-11 | ⏳ (hoy: 0,00 €) |
| M4 · 10 €/mes | 16-12 | ⏳ |
| M5 · 100 €/mes | 15-01 | ⏳ |
| M6 · 1.000 €/mes | 04-02 | ⏳ |

## Lo cumplido
- [x] Webs publicadas y desplegando a diario (3 sitios, 676 URLs indexables).
- [x] Dominio limpio sin el nombre del dueño.
- [x] Search Console verificado y sitemap enviado.
- [x] Enlaces a producto con etiqueta (14 ASIN, 7 % de comisión).
- [x] Dataset abierto con licencia y release.
- [x] Canal propio (Nostr) publicando sin cuentas.
- [x] Sistema de empresa: KPIs, trinquete, veto, bucle y cadena.
- [x] **${hechas}** tareas cerradas en el backlog.

## Lo pendiente
- [ ] **${pendientes}** tareas abiertas en el backlog.
- [ ] Google lea el sitemap (bloqueado desde el 04-11).
- [ ] Primer enlace externo que no sea de GitHub.
- [ ] Primer clic con etiqueta de una persona real.
- [ ] Primer euro.

## Salud del sistema
- Racha con avance: **${exig.racha_dias_con_avance ?? 0} días** · Días perdidos: **${exig.dias_perdidos ?? 0}**
- Eslabones cerrados con evidencia: **${eslabonesCerrados}** · Agentes cesados: **${cansados}**
- Canales muertos: **${(exig.canales_muertos ?? []).length}**

## La pregunta del plan
¿La tarea de hoy acerca a M1, M2 o M3? Si no, no es trabajo: es entretenimiento.
`;
await writeFile(path.join(ROOT, 'informes', 'CHECKLIST.md'), checklist);
console.log(checklist.split('\n').slice(0, 12).join('\n'));
