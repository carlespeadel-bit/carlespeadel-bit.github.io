#!/usr/bin/env node
// Servidor estatico con URLs limpias: /carta/x/ -> dist/carta/x/index.html
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', 'dist');
const PORT = Number(process.env.PORT || 4321);
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
};

createServer(async (req, res) => {
  try {
    const url = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0]);
    let file = path.join(ROOT, url);
    if (!file.startsWith(ROOT)) throw new Error('fuera');
    const st = await stat(file).catch(() => null);
    if (!st || st.isDirectory()) file = path.join(file, 'index.html');
    const html = await readFile(file);
    res.writeHead(200, { 'content-type': TIPOS[path.extname(file)] || 'application/octet-stream' });
    res.end(html);
  } catch {
    const html = await readFile(path.join(ROOT, '404.html')).catch(() => 'No encontrado');
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    res.end(html);
  }
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
