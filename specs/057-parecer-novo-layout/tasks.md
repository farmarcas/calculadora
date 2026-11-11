# Tasks: Novo layout do parecer do cenário (modal e PDF)

**Spec**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md)

## Phase 1: Servidor — parecer v2 (US1, US2, US3)

- [x] T001 [US2] Em `backend/node/src/modules/simulacoes/parecer.ts`, definir os tipos `ParecerV2` (`status`, `paragrafo`, `cartoes.{folha,equipe,farmaceutico}`, `tabela.linhas`, `horarioAMais?`) e `ParecerGuardado` com `versao: 2`, `dono` e `publico`.
- [x] T002 [US2] Montar o **chip de status** (Cobre o horário, Vende mais, Perde venda, Equipe menor que hoje, Inviável; "Não recomendado" quando o horário a mais não paga a folha) e o **parágrafo** em frases curtas sem rótulos nem hifens ("Contratando…", "Ninguém é desligado," / "Desligando 1 atendente,", "o horário continua igual ao do Cadastro" ou a mudança, "e todos trabalham 5 dias por semana e folgam 2.", venda e custo), com "42h por semana" (nunca "jornada cheia") e as contratações que não são de farmacêutico marcadas como desejáveis.
- [x] T003 [US2] Montar os **três cartões**: Folha no faturamento (dono: peso depois, chip com a diferença dos pesos arredondados em "%", "hoje X% · R$ Y a mais/menos por mês" com Y = folha depois − folha hoje; "folha igual" e "Sobe só porque a venda cai."; sem dados: a frase do que falta), Equipe ("9 pessoas", chip "+2", "hoje 7") e Farmacêutico faltando ("0 h", chip "coberto" ou "faltam", "hoje faltam 16 h por semana"). Cada chip com o tom (âmbar, verde ou neutro) e sempre com sinal ou palavra.
- [x] T004 [US2] Montar a **tabela "O que muda"** (Farmacêutico faltando, Venda, Pessoas, Horas contratadas por semana e, só para o dono, Folha por mês) com `hoje`, `comOCenario` e `mudanca` (texto e tom), e o bloco do horário a mais (só dono, "Custo da mercadoria").
- [x] T005 [US3] Versão pública: cartão "Custo de pessoal" com "—", "sem valores em reais" e chip Aumenta, Igual ou Diminui (ou "Dados do custo ainda não informados."), sem a linha de folha, parágrafo com "o custo de pessoal aumenta/fica igual/diminui", sem nenhum "R$" nem "%" de custo.
- [x] T006 [P] Testes em `parecer.test.ts` (reescrever para v2): Cosmópolis dono e público, folha igual, folha que cai (verde), sem salários, sem faturamento, desligados, horário a mais, desejáveis, nenhum texto com "jornada cheia", "p.p.", "pontos" ou "CMV", e o público sem "R$" nem "%".

## Phase 2: Servidor — entrega e PDF (US3, US4)

- [x] T007 Em `simulacoes.service.ts`, `parecer()` devolve `{ id, nome, loja, regra ("Regra de 42h"), numeroCenario, salvoEm, salvoPor, observacao, status, paragrafo, cartoes, tabela, horarioAMais, montadoAgora }` na versão do perfil; pareceres de versão 1 ou ausentes são remontados na hora (`montadoAgora: true`).
- [x] T008 [US4] Reescrever `parecer-pdf.ts` no layout novo (A4, margens do board): logo, título "Parecer do cenário · {Loja}", subtítulo, chip, parágrafo, três cartões, "O QUE MUDA" e tabela, quadro da observação e do horário a mais, rodapé com o aviso à esquerda e "Página n de total" à direita (`bufferPages`); quebra antes de "O que muda" quando a tabela inteira não cabe; linhas da tabela nunca cortadas; no público, o aviso "Valores em reais aparecem só para o dono do grupo.".
- [x] T009 [US4] Nome do arquivo `parecer-{loja-em-minusculas-sem-acento}-cenario-{n}.pdf` (sem número: `parecer-{loja}.pdf`), no servidor e na tela.
- [x] T010 [P] Testes: `parecer-pdf.test.ts` (PDF válido, "Página 1 de 1", logo, conteúdo longo gera mais de uma página com a quebra antes da tabela, nome do arquivo, versão pública sem "R$") e integração em `simulacoes.routes.integration.test.ts` (parecer e PDF por perfil; v1 remontado; checagem do texto do PDF do gestor sem "R$" nem "%").

## Phase 3: Tela — janela e acessibilidade (US5)

- [x] T011 Criar `frontend/react/src/components/ui/foco.js` (`proximoFoco(elementos, atual, shift)` puro) com teste, e em `components/ui/index.jsx` (`Modal`): props opcionais `subtitulo` e `rodape` (fora da rolagem), foco inicial na janela, foco preso com Tab, Esc fecha e **devolve o foco** ao elemento que abriu.
- [x] T012 Em `api/client.js`, `baixarArquivo` lança `ApiError` quando a resposta não é 2xx (sem baixar o texto do erro como arquivo); conferir os outros usos.

## Phase 4: Tela — parecer (US1, US2, US3, US4, US5)

- [x] T013 Reescrever `grade/parecer-regras.js` (+ teste): título, subtítulo (loja · regra · cenário; "Salvo em … pelo {papel}"), nome do arquivo, rótulos e tons dos chips (cores dos tokens `--chip-*`, com comentário de que estão fora do DS).
- [x] T014 Criar `ParecerCartoes.jsx` e `ParecerTabela.jsx` e reescrever `ParecerDoCenario.jsx`: chip de status, parágrafo (14 px, line-height 1,6), três cartões em fundo suave, tabela "O que muda" ("Com o cenário" em negrito, "Mudança" à direita), quadro da observação e do horário a mais, rodapé fixo com o aviso e "Fechar" e "Baixar parecer em PDF" (indicador e desabilitado ao gerar; erro com "Não foi possível baixar o PDF. Tente de novo." e "Tentar de novo"); rodapé do público com "Valores em reais aparecem só para o dono do grupo."; sem `text-transform` em maiúsculas no título.
- [x] T015 Garantir que o botão "Ver parecer" (lista e comparação) é o que recebe o foco de volta ao fechar a modal.

## Phase 5: Fechamento

- [x] T016 Rodar `tsc`, `npm run lint` (com prettier; formatar os arquivos novos), testes de unidade e de integração da API (sozinho), testes e build da tela, `sh scripts/sync-templates.sh` e `sh scripts/check-repo.sh`.
- [x] T017 Conferir no navegador, como dono, em Cosmópolis: modal, rolagem com rodapé fixo, Esc e foco, PDF (convertido em imagem para ver o layout, e o texto extraído), estado de erro; como gestor e consulta (sem R$ nem %); e um parecer v1 remontado.
- [x] T018 Atualizar o `README.md` e marcar as tarefas; commit na branch atual, push e atualizar `local/ver-tudo`. Sem PR novo.

## Dependências

T001 → T002 → T003 → T004 → T005 → T006; T007 depende de T005; T008 → T009 → T010; T011 e T012 antes de T014; T013 → T014 → T015; T016–T018 por último.
