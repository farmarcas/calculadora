#!/bin/sh
# Regenera templates/ a partir dos arquivos que rodam de verdade na raiz.
#   scripts/sync-templates.sh          copia (atualiza templates/)
#   scripts/sync-templates.sh --check  só confere; sai com erro se houver divergência (usado na CI)
set -eu
cd "$(dirname "$0")/.."

MODE=${1:-sync}
STATUS=0

# copia ORIGEM DESTINO
copy() {
  if [ "$MODE" = "--check" ]; then
    cmp -s "$1" "$2" || { echo "DIVERGENTE: $2 (fonte: $1)"; STATUS=1; }
  else
    mkdir -p "$(dirname "$2")"
    cp "$1" "$2"
  fi
}

copy docker-compose.yml                         templates/docker/docker-compose.yml
copy .env.example                               templates/docker/.env.example
copy backend/node/Dockerfile                    templates/docker/node.Dockerfile
copy backend/node/docker/dev-entrypoint.sh      templates/docker/node.dev-entrypoint.sh
copy backend/node/.dockerignore                 templates/docker/.dockerignore
copy frontend/react/Dockerfile                  templates/docker/react.Dockerfile
copy frontend/react/docker/dev-entrypoint.sh    templates/docker/react.dev-entrypoint.sh

EXCLUDES="--exclude=afd-exemplo --exclude=skills --exclude=node_modules --exclude=dist --exclude=src/generated --exclude=coverage --exclude=.env"
if [ "$MODE" = "--check" ]; then
  # Só conteúdo importa: 'c' = checksum diferente; '+++' = arquivo novo; '*deleting' = sobra no template.
  OUT=$(rsync -rcn --delete --itemize-changes $EXCLUDES backend/node/ templates/backend/node/ | awk 'substr($0,3,1)=="c" || /\+\+\+/ || /^\*deleting/' || true)
  if [ -n "$OUT" ]; then echo "DIVERGENTE: templates/backend/node"; echo "$OUT"; STATUS=1; fi
else
  mkdir -p templates/backend/node
  rsync -rc --delete $EXCLUDES backend/node/ templates/backend/node/
fi

[ "$STATUS" = 0 ] && echo "templates em dia" || echo "Rode scripts/sync-templates.sh e faça commit."
exit $STATUS
