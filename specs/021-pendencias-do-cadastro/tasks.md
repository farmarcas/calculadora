# Tarefas: Painel "O que falta preencher" no Cadastro de loja

## Fatia 1 — A regra vira lista (servidor)
- [x] T001 `situacao.ts`: `pendenciasDoCadastro(loja, farmaceuticos, cadastro)` devolve todas as pendências (id, aba, texto, motivo, campo, soDono, alerta) na ordem de hoje; `situacaoDoCadastro` passa a ser derivada dela (Completo se vazia; senão Revisar com o texto da primeira); `quantidade` na situação; nenhum valor em R$
- [x] T002 `painel.ts`: `situacao.pendencias`, `situacao.quantidade` e `equipe: { farmaceuticos, funcoesNaEquipe }` (sem salários) em leitura e em gravação; `cadastros.service.ts`: `situacao.quantidade` na lista de lojas
- [x] T003 Testes (`situacao.test.ts` e integração): tudo pendente, 2–3 pendências em abas diferentes, completa, divergência de faturamento (alerta), função sem gente não exige salário, itens `soDono` marcados, os textos e a ordem atuais continuam iguais, a lista nunca traz valores nem salários para nenhum perfil
- [x] T004 Rodar os testes do servidor e de integração e commitar a fatia

## Fatia 2 — A mesma regra sobre o rascunho (tela)
- [ ] T005 `pendencias.js`: função pura que recebe o rascunho (loja e custos), o que o servidor informa da equipe e os itens `soDono` do servidor, e devolve a lista, o total, os feitos, o que o perfil pode preencher e a contagem por aba; para quem não é dono, os itens `soDono` vêm da lista do servidor e não são reavaliados
- [ ] T006 `pendencias.test.js`: os mesmos casos da T003 (tabela de entradas e saídas), mais campo preenchido tira a pendência antes de salvar, esvaziar a devolve, perfil gestor (itens do dono sem botão), consulta (nenhum botão), contagem por aba só do que a pessoa resolve
- [ ] T007 Commitar a fatia

## Fatia 3 — Faixa, abas e navegação (tela)
- [ ] T008 `PainelPendencias.jsx`: faixa amarela compacta e expandida (título "Faltam N itens…", "X de Y feitos", barra com `role="progressbar"`, "Ver o que falta/Esconder" com `aria-expanded`, itens por aba em colunas, "Preencher"/"Conferir", "Só o dono do grupo preenche", resumo "1 você pode preencher · 2 só o dono"); confirmação "Cadastro completo. Todas as informações foram preenchidas."; região com nome e `aria-live` na contagem; começa aberta em Revisar e recolhida abaixo de 640 px
- [ ] T009 `components/ui/index.jsx` (Abas): número opcional por aba, em amarelo, com texto para leitor de tela ("1 pendência"); `DetalheLoja.jsx`: painel no lugar da linha do primeiro motivo, contador nas abas, e "Preencher" (troca de aba, rolagem centralizada até o campo, foco, painel recolhe, leitor de tela anuncia o nome do campo e o motivo)
- [ ] T010 Itens feitos viram "Feito" (riscado) e a contagem anuncia "Faltam N itens"; ao salvar, recalcula (Completo vira confirmação, etiqueta e contadores se atualizam)
- [ ] T011 Testes puros do que for lógica (textos, plural, resumo por perfil) e commitar a fatia

## Fatia 4 — Destaque nos campos (tela)
- [ ] T012 `index.css` e um pequeno auxiliar: classe `cl-pendente` (anel com o token de atenção), selo "Preencher"/"✓ Preenchido" e motivo ligado por `aria-describedby`; o anel de foco azul continua por cima
- [ ] T013 Aplicar nos campos: nome, cidade, UF, regime (acrescentar `data-campo`), horário de funcionamento, só os dias abertos sem faturamento, faturamento do mês (alerta "Confira o faturamento do mês…"), margem, e um campo de salário por função que falta; o destaque some no instante em que o campo fica válido e volta se for esvaziado
- [ ] T014 Conferir no navegador e commitar a fatia

## Fatia 5 — Lista de lojas e celular
- [ ] T015 `ListaLojas.jsx`: nas lojas em Revisar, segunda linha "N pendências · principal motivo" (singular "1 pendência"), em uma linha com reticências; Completo sem mudança; etiqueta e filtro intactos
- [ ] T016 Celular (360 px): faixa recolhida de 56 px, lista empilhada com "Preencher" de largura total, alvos de 44 px, sem rolagem lateral

## Fatia 6 — Conferência final
- [ ] T017 Conferir como dono, gestor e Somente consulta (nenhuma aba some; itens do dono sem botão), em 5 larguras (360 a 1920), com teclado e leitor de tela, e no grupo do Sumaré (as 37 lojas: totais e motivo principal coerentes com a regra)
- [ ] T018 Conferir que o diagnóstico, os cenários e os cálculos não mudaram (diff) e que nenhum valor em R$ aparece nos avisos
- [ ] T019 README e resumo final; rodar tudo e commitar
