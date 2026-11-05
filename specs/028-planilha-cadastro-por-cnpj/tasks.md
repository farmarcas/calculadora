# Tarefas: Planilha do Cadastro pelo CNPJ e encargos só pelo regime

Formato: `- [ ] ID [P] [História] descrição com o arquivo`. Servidor em `backend/node/src/modules`, tela em `frontend/react/src/features`. Cada fatia termina com os testes passando e um commit. Sem migration e sem apagar dado do banco.

## Fatia 1 — Encargos só pelo regime (História 4, P1)
- [x] T001 [US4] `custos/encargos-loja.ts` e `regras/encargos.ts`: o cálculo da loja passa a ser `calcularEncargos(regime, tabela)` sem ajustes (rescisão desligada); a resposta mantém o formato (`ratPct`, `fap` do regime e `rescisaoLigada: false`); `custos.repository.ts` e `custos.schemas.ts`: `encargos` continua aceito no pedido, mas a gravação preserva o `encargos` que já está guardado e não o altera
- [x] T002 [US4] `cadastros/configuracao.ts` e `planilhas/campos.ts`: `rat_pct`, `fap` e `rescisao` viram campos `legado: true` (reconhecidos e ignorados); a leitura da linha deixa de validar a faixa e de devolver `encargos`; `cadastros/cadastros.service.ts`: sai o trecho que grava os ajustes de RAT/FAP/rescisão e o aviso "ajustes de encargos ignorados"; `planilhas/modelo.ts`: sai da ajuda o texto sobre RAT, FAP e rescisão e entra "os encargos vêm do regime tributário da loja"
- [x] T003 [US4] `cadastro-loja/AbaRegras.jsx` e `dicasDeEncargos.js`: sem campos, dicas, validação e botão "restaurar padrão" de RAT, FAP e rescisão; a tela mostra o total e os componentes do regime; o corpo enviado não traz mais `encargos`
- [x] T004 [US4] Testes: `regras/encargos.test.ts` e o de `custos` (total = regime, sem ajuste); integração de custos (enviar `encargos` não altera o guardado nem o custo); integração de importação (planilha com RAT/FAP/rescisão inválidos importa sem erro e não grava ajustes); `modelo.test.ts` (sem as três colunas); testes da tela de Regras
- [x] T005 Rodar os testes (servidor, integração e tela) e commitar a fatia

## Fatia 2 — Lojas e funcionários pelo CNPJ no servidor (Histórias 1, 2 e 3, P1)
- [x] T006 [US1] `cadastros/documentos.ts`: `cnpjDaPlanilha(texto)` — só dígitos, completa com zeros à esquerda até 14 quando vier com 8 a 13 dígitos, e devolve o CNPJ válido ou o motivo do erro; reaproveitar `validarCnpj` e `normalizarCnpj`
- [x] T007 [P] [US1] `planilhas/campos.ts`: `codigo` (loja) e `loja` (código de lotação) viram `legado: true` e deixam de ser obrigatórios; `cnpj` (Lojas) ganha rótulo "CNPJ" com sinônimos "cnpj da loja"; `nome` da loja vira "Nome da loja / Apelido" e deixa de ser obrigatório; novo campo `cnpj_loja` ("CNPJ da loja") na aba Funcionários; `funcao_escala` passa a ter o rótulo "Cargo" com os sinônimos de antes mais "cargo"; `cargo` (texto livre) vira `legado: true`
- [x] T008 [US1] `cadastros/cadastros.repository.ts` e `cadastros.service.ts`: `buscarLojaPorCnpj` (só do grupo, só lojas ativas, comparando dígitos); a confirmação deixa de exigir o código e passa a exigir "CNPJ ou código" (aba Lojas) e "CNPJ da loja ou código de lotação" (aba Funcionários), com mensagem clara quando faltar
- [x] T009 [US1] `cadastros/processar.ts` (lojas): a chave da linha é o CNPJ (normalizado e validado) ou, sem CNPJ, o código; erros de linha em português ("CNPJ da loja vazio", "CNPJ inválido", "CNPJ … repetido na planilha"); nome em branco só é erro quando a loja não existe e não há como criar; `cadastros.service.ts`: encontra a loja por CNPJ, recusa "CNPJ não encontrado entre as lojas do grupo" sem criar loja, nunca altera o código cadastrado, e CNPJ e código na mesma linha seguem o CNPJ; mantém as permissões (operadora cria pelo código antigo; dono atualiza; gestor só equipe)
- [x] T010 [US2] `cadastros/processar.ts` e `cadastros.service.ts` (funcionários): ligar à loja pelo "CNPJ da loja" (ou pelo código de lotação antigo); sem loja do grupo, erro "CNPJ não encontrado entre as lojas do grupo" (ou o texto de hoje no caso do código); a função continua deduzida do texto de "Cargo" e do cargo antigo juntos
- [x] T011 [US1] Testes: `processar.test.ts` e o de `documentos` (CNPJ com e sem pontuação, 13 dígitos sem o zero, inválido, repetido, vazio); integração de importação (por CNPJ atualiza a loja certa; CNPJ desconhecido recusa só a linha; planilha antiga por código funciona como antes; CNPJ e código juntos seguem o CNPJ e o código não muda; funcionários por CNPJ e por código; "Balconista" vira Atendimento; gestor só vê lojas do grupo dele)
- [x] T012 Rodar os testes do servidor (unidade e integração) e commitar a fatia

## Fatia 3 — Modelo para baixar e ajuda (Histórias 1, 2 e 3)
- [x] T013 [US1] `planilhas/modelo.ts`: o modelo filtra os campos legados também na aba Funcionários; aba Lojas com "CNPJ *" logo no começo (obrigatório marcado), "Nome da loja / Apelido", sem código, RAT, FAP e rescisão; aba Funcionários com "CNPJ da loja *", "Cargo" (a antiga função de escala) e sem "Código da loja de lotação" nem o antigo Cargo; exemplos de linha com CNPJ
- [x] T014 [US2] `planilhas/modelo.ts`: a coluna "Cargo" ganha lista do Excel com Farmacêutico, Atendimento e Caixa (da linha 2 até a 2000), que impede outro valor ao digitar, com mensagem de erro em português; células em branco continuam válidas
- [x] T015 [US1] `planilhas/modelo.ts` (aba "Como preencher"): explica que a loja é identificada pelo CNPJ (e que o CNPJ precisa estar cadastrado), que o Cargo é escolhido na lista, que os encargos vêm do regime tributário, e cita o envio da base comercial; sem menção ao código da loja, RAT, FAP ou rescisão
- [x] T016 Testes: `modelo.test.ts` (colunas presentes e ausentes nas duas abas, lista de validação com as três opções, ajuda atualizada); importação do próprio modelo preenchido (loja por CNPJ e funcionário com Cargo da lista); importação de uma planilha no formato antigo completo
- [x] T017 Rodar os testes e commitar a fatia

## Fatia 4 — Tela de importar e fechamento
- [x] T018 [P] (sem mudança necessária: `EnviarPlanilhas.jsx` é da base comercial e `ImportarPlanilha.jsx` mostra os rótulos vindos do servidor) `diagnostico/EnviarPlanilhas.jsx` e textos da tela de importação do Cadastro: onde falar em "código da loja", "função de escala" ou "RAT/FAP", trocar para o novo vocabulário (CNPJ, Cargo); mensagens de erro de linha aparecem como vêm do servidor
- [x] T019 Percorrer o `quickstart.md` no ambiente local (baixar o modelo, importar por CNPJ, planilha antiga, encargos do regime na tela de Regras de uma loja)
- [x] T020 Reiniciar a API local, rodar tudo (servidor, integração e tela), type-check; commitar e subir a branch `feat/planilha-cadastro-por-cnpj`

## Dependências e ordem
- Fatia 1 é independente das demais e vem primeiro porque reduz o modelo (RAT, FAP e rescisão) antes de reorganizar os campos.
- Fatia 2 antes da 3: o modelo só pode tirar o código depois de o servidor aceitar o CNPJ.
- Dentro da Fatia 2: T006 e T007 antes de T008–T010; T009 antes de T010.
- T018 pode andar junto da Fatia 3.

## Estratégia
Entregar em fatias pequenas com testes verdes a cada uma. A Fatia 1 não mexe na identificação das lojas; a 2 muda só o servidor e continua aceitando o formato antigo; a 3 é a mudança visível no arquivo baixado.
