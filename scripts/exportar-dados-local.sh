#!/usr/bin/env bash
# Gera um arquivo com TODOS os dados do banco local, para carregar na produção.
# O arquivo tem dado pessoal real: fica na pasta dados-para-producao/ (ignorada pelo Git) e nunca deve ir para o repositório.
# Uso: scripts/exportar-dados-local.sh        (o ambiente local precisa estar no ar)
set -euo pipefail
cd "$(dirname "$0")/.."
pasta="dados-para-producao"
arquivo="$pasta/dados-$(date +%Y%m%d-%H%M%S).sql.gz"
mkdir -p "$pasta"
chmod 700 "$pasta"

{
  echo "-- Dados do ambiente local. Carregar com scripts/carregar-dados-producao.sh"
  # Sem checar chaves estrangeiras durante a carga (a ordem das tabelas não importa). O "tudo ou nada" vem do script de carga.
  echo "SET session_replication_role = replica;"
  # Fora: histórico de migrations (a produção tem o próprio). Linhas que a produção já criou (ex.: Grupo inicial) são mantidas.
  docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --data-only --column-inserts --rows-per-insert=500 --on-conflict-do-nothing --no-owner -T _prisma_migrations'
} | gzip > "$arquivo"
chmod 600 "$arquivo"

echo "Arquivo gerado: $arquivo ($(du -h "$arquivo" | cut -f1))"
echo "Leva dado pessoal real. Não envie para o Git, e-mail ou chat."
