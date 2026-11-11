# Tasks: Nome e parecer do cenário salvo (com PDF)

**Spec**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md)

Decisões fechadas com a pessoa: o exemplo de Cosmópolis (resumo, decisões, efeitos, observação separada) vale como modelo; as folgas entram em uma frase; "quem salvou" mostra o perfil (dono, gestor ou consulta), que é o que o sistema guarda.

## Phase 1: Banco e dependência

- [ ] T001 Criar a migração `backend/node/prisma/migrations/20261111180000_parecer_do_cenario/migration.sql` com `ALTER TABLE "simulacoes" ADD COLUMN "observacao" TEXT, ADD COLUMN "parecer" JSONB;` e acrescentar `observacao String?` e `parecer Json?` ao modelo `Simulacao` em `schema.prisma`; aplicar com `prisma migrate deploy` (nunca `reset`) e rodar `prisma generate`.
- [ ] T002 Adicionar `pdfkit` (e `@types/pdfkit`) às dependências de `backend/node/package.json`, reconstruir a imagem da API e conferir que sobe saudável.

## Phase 2: Servidor — US2, US4

- [ ] T003 [US2] Criar `backend/node/src/modules/simulacoes/parecer.ts` com `montarParecer(entrada)` pura que devolve `{ dono, publico }`, cada um com `resumo` (2 a 3 frases), `decisoes` e `efeitos` (seções com itens de texto): contratações (função e carga), desligamentos, horário alterado por dia, folgas (uma frase), cobertura (horas de falta por função e status), venda, equipe e custo; o dono recebe folha antes e depois, peso no faturamento e reais por mês e, com horas a mais, o horário a mais ("Custo da mercadoria", Recomendado ou Não recomendado); o público recebe só aumenta, igual ou diminui. Frases em pt-BR simples, sem "p.p.", sem "pontos" e sem "CMV"; setas escritas como "para".
- [ ] T004 [P] [US2] Testes em `parecer.test.ts`: Cosmópolis com 1 farmacêutico (8,0% para 9,7%, R$ 7.659, 8 para 9 pessoas, 352 h para 394 h, horário igual, nenhum desligamento); sem contratação; com desligados (folha cai, "diminui"); horário a mais (sábado até 23h, resultado −R$ 6.694, Não recomendado); sem salários e sem faturamento (diz o que falta, sem número); versão pública sem "R$" nem "%" de custo em nenhum texto.
- [ ] T005 [US1] Em `simulacoes.schemas.ts`, `gravarReq` aceita `nome` (1 a 60 caracteres, sem espaços nas pontas) e `observacao` (até 1000); em `simulacoes.repository.ts`, buscar nome igual na loja sem diferenciar maiúsculas (ignorando descartadas) e gravar `observacao` e `parecer`.
- [ ] T006 [US1] Em `simulacoes.service.ts`, `gravar` (com `comoCenario`): exige nome, recusa nome repetido (409, "Já existe um cenário com esse nome nesta loja."), monta o parecer do retrato do momento (resultado, premissas e quadro de agora) e grava tudo junto; sem `nome` o comportamento antigo ("Cenário N") continua para quem chamar a rota sem ele.
- [ ] T007 [US2] Em `simulacoes.service.ts` e `simulacoes.routes.ts`: `GET /simulacoes/:id/parecer` devolve `{ nome, loja, regra, salvoEm, salvoPor, observacao, resumo, decisoes, efeitos, montadoAgora }` na versão do perfil (dono completa; os demais pública); para cenário antigo, monta na hora e marca `montadoAgora: true`, sem observação.
- [ ] T008 [US3] Criar `parecer-pdf.ts` (`gerarPdf(parecer)` com `pdfkit`, Helvetica; "−" vira "-") e a rota `GET /simulacoes/:id/parecer.pdf` (mesmo conteúdo do parecer da tela, nome do arquivo com o nome do cenário limpo de caracteres inválidos).
- [ ] T009 [P] Testes de integração em `simulacoes.routes.integration.test.ts`: salvar com nome e observação; nome vazio e nome com mais de 60 (400); nome repetido em outra caixa (409); salvar duas vezes (a segunda 409); parecer do dono com números; parecer de gestor e consulta sem `R$`/`%` de custo e sem campos de custo; PDF por perfil (começa com `%PDF`, sem "R$" para gestor); cenário antigo abre com `montadoAgora`; o parecer guardado não muda depois de mudar o Cadastro.

## Phase 3: Tela — US1, US2, US3

- [ ] T010 [US1] Criar `frontend/react/src/features/simulacao/salvar-regras.js` (+ `salvar-regras.test.js`): nome sugerido "Cenário N", validação (vazio, mais de 60), contagem da observação (até 1000) e mensagens em linguagem simples.
- [ ] T011 [US1] Criar `ModalSalvarCenario.jsx` (nome com a sugestão, observação com contagem, erro do servidor dentro da janela sem perder o que foi digitado, botão bloqueado enquanto grava) e ligar em `SimulacaoPage.jsx`: o botão "Salvar como cenário N" abre a janela e só então chama `gravar` com `nome` e `observacao`.
- [ ] T012 [US2] Criar `frontend/react/src/features/grade/parecer-regras.js` (+ teste) e `ParecerDoCenario.jsx`: título com o nome, loja, regra, data e quem salvou, resumo, decisões, efeitos, observação separada, aviso de "montado agora" para antigos e a frase final de estimativa.
- [ ] T013 [US3] Botão "Baixar parecer em PDF" em `ParecerDoCenario.jsx`, reaproveitando o download já existente em `api/client.js`.
- [ ] T014 [US2] Link "Ver parecer" em `ListaDeSimulacoes.jsx` (cenários salvos) e em `ComparacaoDeSimulacoes.jsx`, abrindo o parecer; mostrar o nome escolhido no lugar do automático.

## Phase 4: Fechamento

- [ ] T015 Rodar `tsc`, `eslint`, testes de unidade e de integração da API (sozinho) e testes e build da tela.
- [ ] T016 Conferir no navegador, como dono, em Cosmópolis: salvar com nome e observação, nome repetido, abrir o parecer, baixar o PDF e abrir o arquivo; depois como gestor e consulta (sem valores) e um cenário salvo antes.
- [ ] T017 Atualizar o `README.md` e marcar as tarefas; commit na branch atual, push e atualizar `local/ver-tudo`. Sem PR novo.

## Dependências

T001 → T002; T003 → T004; T005 → T006 → T007 → T008 → T009; T010 → T011; T012 → T013 → T014; T015–T017 por último.
