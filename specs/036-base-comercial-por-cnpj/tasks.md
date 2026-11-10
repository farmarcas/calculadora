# Tarefas: Base comercial por CNPJ (julho a outubro)

Formato: `- [ ] ID [P] [História] descrição com o arquivo`. Servidor em `backend/node`, tela em `frontend/react/src`. Cada fatia termina com os testes passando e um commit. O formato atual de envio (código da loja e data) não muda. A base antiga nunca é apagada. Antes da importação real (fatia 5) há backup do banco e uma pausa para a sua confirmação.

## Fatia 1 — Banco e leitor (base para todas as histórias)
- [x] T001 [US2] Migration `backend/node/prisma/migrations/<data>_clientes_e_unidades_decimais/migration.sql`: `vendas_hora.clientes` e `vendas_hora.unidades` de inteiro para `double precision`; `prisma/schema.prisma` acompanha (`Float`); gerar o cliente do Prisma
- [x] T002 [P] [US2] Teste de integração da migration (`escala/decimais-migration.integration.test.ts`): valores inteiros existentes ficam iguais e um decimal (5,06) é gravado e lido sem arredondar
- [x] T003 [US1] `planilhas/leitor.ts`: calcular a largura da planilha com soma acumulada em vez de `Math.max(...lista)` (quebra com mais de ~125 mil linhas); teste em `planilhas/leitor.test.ts` com 200 mil linhas
- [x] T004 [US1] `shared/middlewares/upload.ts`: limite de 20 MB (texto do erro cita 20 MB); ajustar o teste que cita 10 MB, se houver
- [x] T005 Rodar os testes do servidor e commitar a fatia

## Fatia 2 — Conversão pura do arquivo (Histórias 1, 2 e 4)
- [x] T006 [US1] `escala/base-por-cnpj.ts` (novo, puro): `ehBasePorCnpj(cabecalhos)` (cnpj + dia_semana + faturamento, com nomes aceitos em maiúsculas, com espaço ou sublinhado); `vezesPorDia(inicio, fim)` (segunda…domingo, período inclusivo, mínimo de 7 dias); `dataDeReferencia(inicio, diaSemana)` (primeira ocorrência no período)
- [x] T007 [US1] Em `base-por-cnpj.ts`: `interpretarPorCnpj(aba, periodo)` valida CNPJ (14 dígitos, aceita pontuação), dia 1 a 7, hora 0 a 23 e faturamento maior ou igual a zero (vazio ou texto rejeita com a linha e o motivo); soma linhas repetidas da mesma loja, dia e hora e divide pelas vezes do dia; CMV vazio fica sem CMV; tickets viram clientes; ignora valor bruto e ticket médio; devolve linhas por CNPJ no formato de venda por hora (margem = venda − CMV)
- [x] T008 [US4] Em `base-por-cnpj.ts`: `avisosDaBase(linhas)` conta linha zerada, unidades menores que clientes, CMV maior que a venda e lojas com menos de 6 dias da semana (só informam)
- [x] T009 [US3] Em `base-por-cnpj.ts`: `faturamentoDaBase(linhasDaLoja)` devolve o faturamento médio por dia da semana (soma das horas, em reais) e o CMV médio em % (uma casa), nulo onde não há dado
- [x] T010 [P] [US1] `escala/base-por-cnpj.test.ts`: período de julho a outubro dá 17/17/18/18/18/18/17; primeira ocorrência (01/07/2026 é quarta); conversão à mão (total 3.620,44 em segunda ÷ 17); soma de repetidos; linhas inválidas com motivo; CMV vazio; colunas ignoradas; avisos; faturamento e CMV médio; linhas de uma loja que só abre 6 dias
- [x] T011 Rodar os testes do servidor e commitar a fatia

## Fatia 3 — Servidor: conferência e importação (Histórias 1, 2, 3 e 4)
- [x] T012 [US1] `escala/escala.repository.ts`: `lojasDoGe()` (id, código, nome, CNPJ) para casar em memória pelos 14 dígitos; `substituirBaseEmLote(lojaId, arquivo, linhas, rejeitadas, periodo)` (base ativa vira inativa e a nova entra com `createMany`, período declarado na carga); `preencherFaturamentoVazio(lojaId, dias, cmvPct)` só onde está vazio, devolvendo se a loja já tinha valor próprio
- [x] T013 [US1] `escala/escala.schemas.ts` e `escala/escala.routes.ts`: ler `periodoInicio` e `periodoFim` do formulário nas rotas de revisar e importar (AAAA-MM-DD; período inválido ou menor que 7 dias dá 422 `PERIODO_INVALIDO` na importação)
- [x] T014 [US1] `escala/escala.service.ts` (`revisarBase`): formato por CNPJ devolve `formato`, `periodo` e vezes por dia, `precisaPeriodo`, lojas substituídas, mantidas, `cnpjsSemLoja` (com total), o que preenche no Cadastro e os avisos, sem gravar nada; o formato antigo continua igual
- [x] T015 [US1] `escala/escala.service.ts` (`importarBase`): por loja, em paralelo limitado, grava a base nova (venda, CMV, clientes e unidades), preenche o Cadastro só onde está vazio, trata falha de uma loja sem desfazer as outras; ignora e lista CNPJs sem loja; auditoria com contagens; resposta só com contagens (nenhum valor em reais)
- [x] T016 [US1] Teste de integração (`escala/base-por-cnpj.integration.test.ts`): importa um arquivo pequeno com 3 lojas (duas cadastradas e uma não); base anterior fica inativa; total por loja bate; venda, CMV, clientes e unidades gravados; CNPJ sem loja listado e não criado; loja fora do arquivo mantém a base; período ausente dá 422; formato antigo continua importando
- [x] T017 [US3] Teste de integração: loja com CMV médio digitado mantém o valor; loja sem recebe o calculado; faturamento por dia só onde vazio; a resposta informa quantas já tinham valor
- [x] T018 [US4] Teste de integração: a conferência traz os avisos e não grava nada (nenhuma carga nova); linha inválida é rejeitada sem derrubar as demais; gestor não recebe nenhum valor em reais
- [x] T019 Rodar os testes do servidor (unidade e integração) e commitar a fatia

## Fatia 4 — Tela: período e conferência (Histórias 1 e 4)
- [x] T020 [US1] `features/diagnostico/base.js`: regras puras do formato novo (pede período quando `precisaPeriodo`, `podeEnviar` exige período válido, texto de cada aviso, texto de substituídas, mantidas e CNPJs sem loja, resumo do envio por CNPJ) + `base.test.js`
- [x] T021 [US1] `features/diagnostico/ModalEnviarBase.jsx`: ao detectar o formato por CNPJ, mostra os campos de data inicial e final; refaz a conferência quando o período muda; mostra a conferência (substituídas, mantidas, sem loja com a lista recolhida, o que preenche no Cadastro, avisos com ícone de atenção) e o resultado final; o fluxo do formato antigo continua igual
- [x] T022 [US1] Teste do modal (se já existir teste de componente) ou ao menos das regras puras; conferir no navegador com o arquivo real
- [x] T023 Rodar os testes da tela e commitar a fatia

## Fatia 5 — Importação real e conferência (Histórias 1 a 4)
- [ ] T024 Backup do banco local em `~/Documents/backups-calculadora/` e **pausa para a sua confirmação** antes de gravar (a gravação usa o comando `importar-base-cnpj --aplicar`, não a tela)
- [ ] T025 Aplicar a migration no banco local e importar o arquivo real com o período 01/07/2026 a 31/10/2026; medir o tempo e a memória; anotar lojas gravadas, mantidas e sem cadastro
- [ ] T026 Conferir todas as lojas por script: total (média do dia × vezes no período) a menos de 0,5% do total do arquivo; razão entre a base nova e a antiga; Arariba com CMV 58,7% e segunda-feira perto de R$ 23.288; cenários e Simulação da Arariba em margem com clientes por hora
- [ ] T027 Se o tempo passar de 45 s, registrar o plano B (segundo plano) como próxima fatia, sem implementar agora

## Fatia 4b — Comando para a rede inteira (descoberto na implementação)
- [x] T029 `escala/base-por-cnpj.service.ts`: `gravarBaseDaLoja` compartilhada entre a tela e o comando; `src/scripts/importar-base-cnpj.ts` (+ `npm run importar-base-cnpj` e `:prod`): lê o arquivo, casa os CNPJs com as lojas de todos os grupos, ensaio por padrão e `--aplicar` para gravar, relatório de lojas gravadas e falhas
- [x] T030 Ensaio com o arquivo real: 1.791 lojas em 486 grupos, 43 CNPJs sem loja, 23 lojas fora do arquivo, avisos 62/73/585/13 (iguais aos da análise)

## Final — Fechamento
- [ ] T028 Atualizar `docs/` (documentação de cálculos: seção da base por CNPJ), conferir o quickstart, rodar `tsc` e todos os testes, atualizar o `local/ver-tudo` e enviar a branch `feat/base-comercial-jul-out`

## Dependências
- Fatia 1 antes de todas. Fatia 2 antes da 3. Fatia 3 antes da 4 e da 5.
- A migration (T001) vai no mesmo PR; produção só recebe a base quando alguém importar o arquivo por lá.

## Ordem sugerida
Fatias 1 a 4 sem mexer em dados. Fatia 5 só depois do seu OK, com backup.
