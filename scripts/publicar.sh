#!/bin/bash
# Publica la web en GitHub Pages (repo <usuario>.github.io) y activa el despliegue.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
USUARIO="carlespeadel-bit"
REPO="$USUARIO.github.io"
RAMA="main"

if ! gh auth status >/dev/null 2>&1; then
  echo "Necesito tu login de GitHub una vez (30 s)."
  gh auth login -h github.com -p https -w || exit 1
fi

git remote get-url origin >/dev/null 2>&1 || \
  git remote add origin "https://github.com/$USUARIO/$REPO.git"
git branch -M "$RAMA"

if ! gh repo view "$USUARIO/$REPO" >/dev/null 2>&1; then
  echo "Creando $USUARIO/$REPO ..."
  gh repo create "$REPO" --public --source=. --remote=origin
fi

git push -u origin "$RAMA" || exit 1

echo "Activando GitHub Pages ..."
gh api -X POST "repos/$USUARIO/$REPO/pages" -f build_type=workflow >/dev/null 2>&1 \
  || gh api -X PUT "repos/$USUARIO/$REPO/pages" -f build_type=workflow >/dev/null 2>&1 \
  || echo "(Pages ya estaba activo o hay que activarlo a mano en Settings)"

gh workflow run publicar.yml --repo "$USUARIO/$REPO" 2>/dev/null

echo ""
echo "Listo. En 3-4 minutos: https://$REPO/"
echo "Estado del despliegue: gh run watch --repo $USUARIO/$REPO"
