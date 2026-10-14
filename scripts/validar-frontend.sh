#!/bin/sh
# Valida o frontend (tsc, vitest, eslint, prettier) num container descartável.
# O código é montado somente leitura: nada é alterado na sua pasta.
# Uso: scripts/validar-frontend.sh [pasta-do-frontend]   (padrão: frontend/react)
set -eu
cd "$(dirname "$0")/.."
DIR="${1:-frontend/react}"
docker run --rm -v "$PWD/$DIR":/src:ro node:22-alpine sh -c '
  cp -r /src /app && cd /app &&
  npm ci --no-audit --no-fund >/dev/null 2>&1
  echo "== tsc ==";      npx tsc | tail -5
  echo "== vitest ==";   npx vitest run 2>&1 | grep -E "Test Files|Tests |FAIL"
  echo "== eslint ==";   npx eslint . | tail -5
  echo "== prettier =="; npx prettier --check src | tail -3
'
git status --short
