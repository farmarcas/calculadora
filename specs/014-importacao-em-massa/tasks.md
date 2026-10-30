# Tarefas: Importação em massa do cadastro de loja

**Entrada**: spec.md, plan.md, research.md, data-model.md, contracts/api.md, quickstart.md
**Regra de ouro**: cada fatia termina com `npm test`, `npm run test:integration`, lint e `tsc` verdes, e um commit. Contas dos testes feitas à mão.

## Fatia 1 — Modelo e leitura das colunas novas (US2)

**Teste independente**: o modelo traz as colunas novas e o interpretador lê convenção, metas, salários, encargos e horário fixo de uma linha.

- [x] T001 [US2] `planilhas/campos.ts`: campos de loja `convencao_8h24`, `meta_farmaceutico`, `meta_atendimento`, `meta_caixa`, `meta_apoio`, `meta_perfumaria`, `salario_*` (5) e `encargos_pct`; campo de funcionário `horario_fixo`; rótulos, sinônimos e exemplos
- [x] T002 [US2] `planilhas/modelo.ts`: aba "Como preencher" explica as colunas novas, quem preenche o quê (salário, encargos, faturamento e margem só do dono) e que vazio mantém o valor; teste que lista as colunas do modelo
- [x] T003 [US2] `cadastros/processar.ts` + teste: ler `convencao_8h24`, metas (inteiro 0 a 10, Farmacêutico ≥ 1), salários (> 0), encargos (0 a 300) e `horario_fixo` (Sim/Não), devolvendo `configuracao` por loja e `horarioFixo` por funcionário; valores inválidos viram erro de linha citando a coluna; vazio devolve nada
- [x] T004 [US2] Teste de cobertura (SC-001): cada campo da edição de loja e de funcionário tem a coluna correspondente no modelo; planilha antiga (sem colunas novas) continua sendo lida
- [x] T005 Rodar tudo e commitar a fatia

## Fatia 2 — Gravação e permissões (US2 + US3)

**Teste independente**: o dono atualiza lojas existentes e a loja fica como na edição manual; loja inexistente vira erro; o gestor ignora a aba Lojas com aviso.

- [x] T006 [US2] `cadastros/cadastros.repository.ts`: método para gravar configuração (convenção, metas com mescla) e custos (salário com mescla e encargos) da loja; `horarioFixo` no criar e atualizar funcionário
- [x] T007 [US3] `cadastros/cadastros.service.ts` (`confirmarImportacao`): operador como hoje; dono só atualiza lojas existentes (loja nova = erro "Loja não cadastrada: só o operador cria lojas"; código e CNPJ diferentes ignorados com aviso); gestor ignora a aba Lojas com aviso; salário, encargos, faturamento e margem só do dono, citados nos avisos para os demais
- [x] T008 [US2] Custos incompletos: salário sem encargos (e sem encargos gravados) não grava custo e avisa; vazio nunca apaga
- [x] T009 [US4] Resumo: campo `avisos` e `linha` real nos erros de loja e de funcionário (hoje `linha: 0`); auditoria cita avisos
- [x] T010 [US3] Testes de integração (`cadastros.routes.integration.test.ts`): operador cria e atualiza; dono atualiza horário, margem, convenção, metas e custos de loja existente e recebe erro para loja nova; gestor importa equipe e a aba Lojas é ignorada com aviso; vazio mantém; planilha antiga funciona; horário fixo gravado; o resultado é o mesmo da edição manual (SC-003)
- [x] T011 Rodar tudo e commitar a fatia

## Fatia 3 — Tela (US1 + US4)

**Teste independente**: no navegador, o título é "Cadastro de Loja", há um só botão "Importar em massa" com ícone de upload, e o modelo é baixado de dentro do modal.

- [x] T012 [US1] `components/ui/index.jsx`: ícone de upload (SVG de traço, Lucide) como componente pequeno
- [x] T013 [US1] `features/cadastros/CadastrosPage.jsx`: `h1` "Cadastro de Loja"; um só botão "Importar em massa" com o ícone (para quem cuida do grupo ou é operador); saem "Baixar planilha modelo" e "Importar equipe por planilha"
- [x] T014 [US1] `features/cadastros/ImportarPlanilha.jsx`: botão "Baixar planilha modelo" no topo do modal (não fecha o modal); `podeLojas` vale para operador e dono; textos explicando as duas abas
- [x] T015 [US4] Resumo no modal: criados, atualizados, avisos (ignorado por permissão) e erros com aba, linha e motivo
- [x] T016 Conferir no navegador (operador, dono, gestor e consulta); rodar tudo e commitar a fatia

## Fatia 4 — Fechamento

- [ ] T017 Conferência com uma planilha real: baixar o modelo, preencher algumas lojas do grupo 216 e a equipe, importar como dono e conferir a edição das lojas (tempo para as 37 lojas abaixo de 1 minuto, SC-002)
- [ ] T018 Documentação: README (importação em massa, colunas novas, quem importa o quê), `scripts/sync-templates.sh`, `scripts/check-repo.sh`
- [ ] T019 Conferência final: `npm test`, `npm run test:integration`, `npm run lint`, `npx tsc --noEmit`, build do `web`, `quickstart.md` do começo ao fim; commitar

## Dependências e ordem

- Fatia 1 → 2 → 3 → 4, nessa ordem.
- Sem migration em nenhuma fatia.
