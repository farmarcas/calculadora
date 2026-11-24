# Quickstart: validar flags e experimentos

Pré-requisitos: ambiente no ar (`docker compose up -d --build --wait`), token do Mixpanel no `.env`, login do Radar (ou pessoa de teste).

1. **Sem flag criada**: abrir o sistema logado. Nenhuma tela muda e os testes passam (`docker compose exec -T web npx vitest run`).
2. **Flag de teste**: criar no Mixpanel (projeto Radar Escala) uma flag nova, ligada para um perfil específico. No navegador, `flagLigada("nome-da-flag")` devolve `true` para esse perfil e `false` para os demais.
3. **Padrão sem flag**: perguntar por um nome que não existe devolve `false`/o padrão, sem erro.
4. **Experimento de teste**: criar um experimento com duas versões; abrir a tela duas vezes com a mesma pessoa e ver a mesma versão; no Mixpanel aparece `$experiment_started` com o nome e a versão.
5. **Desligar**: com `VITE_MIXPANEL_FLAGS=0`, nenhuma chamada de flags sai (aba de rede) e tudo devolve o padrão.
6. **Demonstração e saída**: sem login, nenhuma chamada de flags; ao sair, nenhuma chamada para pessoa anônima.
7. **Limpeza**: apagar a flag e o experimento de teste criados.
