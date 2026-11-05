# Quickstart: validar a spec 030

Pré-requisito: `docker compose up -d --wait`.

1. **Testes**: `docker compose exec -T api npm test`, `npm run test:integration` na API e `docker compose exec -T web npx vitest run` verdes.
2. **Dados antigos**: antes de aplicar a migration, anotar quantas simulações estão em `em_uso` e `substituida` (`select status, count(*) from simulacoes group by 1`); depois da migration, nenhuma tem esses estados, o total de simulações é o mesmo e os dados de cada uma (nome, quadro, resultado) são os mesmos.
3. **Tela da simulação**: abrir uma simulação: não há "Marcar como em uso" nem a janela de aprovar; criar, ajustar, gravar, clonar e descartar funcionam.
4. **Lista**: só aparecem Rascunho, Gravada e Descartada; as que eram em uso e substituídas aparecem como Gravada; uma delas pode ser descartada.
5. **Comparação**: escolher duas simulações: duas colunas, sem "referência" e sem a linha "Diferença mensal frente à em uso"; a síntese de cada uma fala só dela.
6. **API**: `POST /api/v1/simulacoes/:id/aprovar` responde 404.
7. **Sem mudança fora da Simulação**: o Diagnóstico e o Cadastro de uma loja mostram os mesmos números de antes.
