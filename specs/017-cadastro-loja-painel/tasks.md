# Tarefas: Cadastro de loja em painel único

## Fatia 1 — Regras de turno e modo do mínimo (servidor) (US5)
- [ ] T001 `requisitos.ts`: `emHora` usa o maior mínimo por cargo entre as fatias que contêm a hora; `reserva` só sem fatia
- [ ] T002 `turnos.ts`: `validarTurnos` sem erro de sobreposição, de início antes da abertura nem de fim depois do fechamento; `coberturaDeTurnos(turnos, dias)` com as faixas sem turno (dia a dia); `avisosDeTurnos` passa a devolver essas faixas em texto
- [ ] T003 `modo` ('turnos' | 'unico') no JSON de turnos; `exigenciasDaLoja` ignora os turnos em modo 'unico'; configuração aceita `modoMinimo` e devolve `avisosDeTurnos`
- [ ] T004 Testes à mão: sobreposição pega o maior mínimo; turno que passa do horário conta só a parte aberta; buraco vira aviso (não erro); modo único ignora turnos sem apagá-los; turnos antigos seguem iguais
- [ ] T005 Ajustar os testes antigos que esperavam erro de sobreposição/buraco; rodar tudo e commitar a fatia

## Fatia 2 — Lista com situação, filtros e CNPJ (servidor) (US1)
- [ ] T006 `cadastros/situacao.ts`: `situacaoDoCadastro(loja, equipe)` (Completo/Revisar + motivo) e testes (cada motivo, faturamento por dia aberto, divergência > 10%, sem farmacêutico)
- [ ] T007 `GET /lojas`: filtros `uf`, `situacao` e busca por CNPJ; item com `situacao`; paginação em memória do GE; testes de integração (combinação de filtros, total, isolamento por GE, sem valores em reais para quem não é dono)
- [ ] T008 Rodar tudo e commitar a fatia

## Fatia 3 — Salvar tudo (servidor) (US3)
- [ ] T009 `PUT /lojas/:id/painel`: esquemas e validação completa antes de gravar; ordem configuração, custos, loja; resposta com loja, situação e avisos
- [ ] T010 Testes de integração: grava tudo junto; erro em um bloco não grava nada; permissões (faturamento e custos só dono; código e CNPJ só operador); Cadastro de outro GE não é afetado
- [ ] T011 Rodar tudo e commitar a fatia

## Fatia 4 — Tela: casca, lista e rascunho (US1, US3, US7)
- [ ] T012 `features/cadastro-loja/CadastroLojaPage.jsx`: cabeçalho, abas de página, aviso fixo (chave), cartão 400 px + detalhe, altura estável com rolagem interna, descida para telas separadas abaixo de ~1100 px
- [ ] T013 `ListaLojas.jsx`: busca com atraso, filtros Cadastro e UF, estado vazio com "Limpar filtros", linha acessível por teclado, paginação "1–6 de N" e "Ver mais", carregamento sem pular
- [ ] T014 `DetalheLoja.jsx` e `useRascunhoLoja.js`: cabeçalho com situação e motivo, 3 abas, rascunho único, contador, "Salvar alterações", "Cancelar", confirmação ao sair, `beforeunload`; `urlDaLoja.js` (loja e aba no endereço)
- [ ] T015 Ligar em `CadastrosPage` (abas "Lojas" e "Parâmetros legais"); conferir no navegador; commitar a fatia

## Fatia 5 — Aba Dados e funcionamento (US2)
- [ ] T016 Vitest no front e `calculos.js` com testes: horas do dia (00:00 = meia-noite), soma semanal, mensal × 52 ÷ 12, divergência > 10%
- [ ] T017 `AbaDados.jsx`: dados da loja (ID e CNPJ só operador, aviso de encargos recalculados)
- [ ] T018 `TabelaFuncionamento.jsx`: uma linha por dia (situação, abre, fecha, 24h, faturamento só dono, horas), "Loja 24 horas", "Copiar horário da segunda" (só horário), rodapé com horas e faturamento semanal
- [ ] T019 `ResumoMensal.jsx`: mensal informado, soma dos dias, margem, alerta de 10% com "Usar R$ …"; validações em texto; perfis sem faturamento não veem a coluna; conferir e commitar a fatia

## Fatia 6 — Aba Equipe e Nova loja (US4, US6)
- [ ] T020 `AbaEquipe.jsx`: busca, "Importar equipe", tabela com CPF mascarado, "Fora do cálculo", editar e remover
- [ ] T021 `FormFuncionario.jsx`: nome, CPF (dígitos verificadores), cargo, carga mensal, entrada, saída, dias; erros em texto; salva na hora com aviso; remover com confirmação e "Desfazer"
- [ ] T022 Modo "Nova loja" (operador): dados editáveis, abas Equipe e Regras desabilitadas até gravar; conferir e commitar a fatia

## Fatia 7 — Aba Regras e custos (US5)
- [ ] T023 `AbaRegras.jsx`: Custos (só dono) com encargos recolhidos e ajuste de RAT, FAP e rescisão; Convenção coletiva com a chave "Não permite / Permite"
- [ ] T024 `MinimoPessoas.jsx` modo "Por turnos": cartões de turno (início, fim, farmacêutico fixo ≥ 1, "+ cargo"), "+ Adicionar turno", `BarraTurnos.jsx` com sobreposição e faixas fora do horário (legenda em texto), "Horário da loja coberto" ou aviso "Sem turno entre …"
- [ ] T025 Modo "Mínimo único do dia" e troca de modo sem apagar o outro (aviso antes); conferir e commitar a fatia

## Fatia 8 — Conferência final
- [ ] T026 Remover as telas e formulários antigos (Editar loja, botões de salvar, quadros antigos de mínimo); README
- [ ] T027 Conferir SC-001 a SC-006, 4 larguras, teclado; rodar tudo; relatório final (reaproveitado, criado, removido, suposições e onde ficam, divergências do desenho); commitar
