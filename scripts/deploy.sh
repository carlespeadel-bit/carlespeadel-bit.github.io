#!/bin/bash
# Publica dist en la rama gh-pages, pero solo si el guardia lo permite.
set -e
cd "$(dirname "$0")/.."
node scripts/informe-tiendas.mjs >/dev/null 2>&1 || true
node ../dinero/guardia.mjs || { echo "Despliegue bloqueado por el guardia."; exit 1; }
cd dist
rm -rf .git
touch .nojekyll
git init -q
git add -A
git -c user.email=bot@valorcarta.es -c user.name=valorcarta commit -qm "sitio compilado $(date -u +%F)"
git push -f "https://valorcarta:${GH_TOKEN}@github.com/valorcarta/valorcarta.github.io.git" HEAD:gh-pages
echo "publicado en gh-pages"
cd ..
echo "--- auditoría interna tras el despliegue ---"
node scripts/auditoria.mjs | head -14
