#!/usr/bin/env node
// Comité de organización: prepara la reunión semanal que rediseña el organigrama.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname);
const leer = async (f) => (await readFile(path.join(ROOT, f), 'utf8').catch(() => ''));
const empresa = JSON.parse((await leer('EMPRESA.json')) || '{}');
const cadena = await leer('CADENA.md');
const auditoria = await leer('AUDITORIA-INTERNA.md');
const exig = JSON.parse((await leer('EXIGENCIA.json')) || '{}');
const hoy = new Date().toISOString().slice(0, 10);

const empleados = empresa.empleados ?? [];
const sinKpi = empleados.filter((e) => ['huecos_cerrados', 'vetos_resueltos', 'hitos_a_tiempo', 'verificacion', 'consultas_semana', 'paginas_semana'].includes(e.kpi));
const cesados = empleados.filter((e) => e.estado === 'cesado');
const sinIntentos = empleados.filter((e) => e.estado !== 'cesado' && (e.intentos ?? 3) === 0);
const muertas = [...cadena.matchAll(/\*\*MUERTA[^*]*\*\*/g)].length;
const enCurso = [...cadena.matchAll(/\*\*EN CURSO[^*]*\*\*/g)].length;
const hallazgos = [...auditoria.matchAll(/^\| (alta|media|baja) \|/gm)].length;

const preguntas = [
  '¿Qué rol no ha producido nada medible en dos semanas? Se fusiona o se elimina.',
  '¿Qué KPI sigue sin instrumentar? Sin número no hay puesto.',
  '¿Qué regla ha costado más de lo que ha aportado? Se deroga.',
  '¿Qué puesto nuevo hace falta para el siguiente hito y con qué número se le mide?',
  `¿El organigrama tiene ${empleados.length} fichas y ${muertas} hipótesis muertas: sobran o faltan manos?`,
];

const md = `# Comité de organización — ${hoy}

Asisten: Dirección, Estrategia, Contralor, Fiscal. Duración objetivo: 15 minutos. **No se evalúa a personas: se rediseña la estructura.**

## Foto para decidir
| Dato | Valor |
|---|---|
| Agentes en nómina | ${empleados.length} |
| Cesados acumulados | ${cesados.length} |
| Sin intentos restantes | ${sinIntentos.length} |
| Roles cuyo KPI no es un número | ${sinKpi.length} |
| Hipótesis muertas / en curso | ${muertas} / ${enCurso} |
| Hallazgos de auditoría abiertos | ${hallazgos} |
| Días perdidos / racha | ${exig.dias_perdidos ?? 0} / ${exig.racha_dias_con_avance ?? 0} |

## Agenda (las cinco preguntas)
${preguntas.map((p, i) => `${i + 1}. ${p}`).join('\n')}

## Decisiones (se rellenan en la reunión, una por línea)
| Cambio | Tipo (crear/fusionar/eliminar/regla) | Dueño | Número que lo mide | Fecha de muerte |
|---|---|---|---|---|
|  |  |  |  |  |

## Regla de la casa
Ningún cambio de organigrama entra sin **dueño, número y fecha de muerte**. Un puesto nuevo sin KPI es un sueldo regalado; una regla nueva sin criterio de muerte es burocracia.

## Después de la reunión
- Aplicar los cambios en \`EMPRESA.json\` y \`ORGANIGRAMA.md\`.
- Un experimento por cambio, añadido a \`CADENA.md\`.
- Lo que no se aplique hoy, no se decide: se aparca con fecha.
`;
await writeFile(path.join(ROOT, 'REUNION.md'), md);
console.log(md.split('\n').slice(0, 14).join('\n'));
