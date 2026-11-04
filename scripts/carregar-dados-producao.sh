#!/usr/bin/env bash
# Carrega o arquivo gerado por exportar-dados-local.sh no banco da PRODUÇÃO.
# Rode no servidor da produção (onde o Docker do Coolify está), depois de copiar o arquivo para lá.
# Uso: scripts/carregar-dados-producao.sh <arquivo.sql.gz> <nome-do-container-do-postgres>
#   (o nome do container aparece em "docker ps"; o do Coolify tem o prefixo do serviço, ex.: postgres-xxxx)
# Tudo ou nada: se algo falhar, nada é gravado. Linhas que já existem na produção são mantidas, não sobrescritas.
set -euo pipefail
arquivo="${1:?informe o arquivo .sql.gz}"
container="${2:?informe o nome do container do postgres (docker ps)}"
[ -f "$arquivo" ] || { echo "Arquivo não encontrado: $arquivo"; exit 1; }

echo "Vai gravar os dados de $arquivo no banco do container $container (produção)."
read -r -p "Digite CARREGAR para continuar: " resposta
[ "$resposta" = "CARREGAR" ] || { echo "Cancelado. Nada foi alterado."; exit 1; }

gunzip -c "$arquivo" | docker exec -i "$container" sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 --single-transaction -q'
echo "Pronto. Conferindo as contagens:"
docker exec -i "$container" sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -c "select '"'"'grupos'"'"', count(*) from grupos_economicos union all select '"'"'lojas'"'"', count(*) from lojas union all select '"'"'funcionarios'"'"', count(*) from funcionarios union all select '"'"'vendas_hora'"'"', count(*) from vendas_hora"'
