#!/usr/bin/env node
// Reauditoría inmediata: corre las dos auditorías y devuelve un veredicto único.
import { execSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname);
const VC = path.resolve(ROOT, '..', 'valorcarta');

const correr = (cmd, cwd) => { try { return execSync(cmd, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { return (e.stdout || '') + (e.stderr || ''); } };

correr('node scripts/auditoria.mjs', VC);
correr('node auditor-turnos.mjs', ROOT);

const internos = await readFile(path.join(ROOT, 'AUDITORIA-INTERNA.md'), 'utf8').catch(() => '');
const turnos = await readFile(path.join(ROOT, 'TURNOS-AUDIT.md'), 'utf8').catch(() => '');

const altos = (internos.match(/^\| alta \|/gm) || []).length;
const sinRastro = (turnos.match(/SIN RASTRO/g) || []).length;

const veredicto = altos === 0 && sinRastro === 0 ? 'PASA' : 'FALLA';
console.log(`REAUDITORÍA: ${veredicto} · hallazgos altos: ${altos} · turnos sin rastro: ${sinRastro}`);
if (veredicto === 'FALLA') process.exitCode = 1;
