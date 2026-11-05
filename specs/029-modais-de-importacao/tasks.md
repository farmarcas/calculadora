# Tarefas: Modais de importação

Formato: `- [ ] ID [P] [História] descrição com o arquivo`. Servidor em `backend/node/src/modules`, tela em `frontend/react/src`. Cada fatia termina com os testes passando e um commit. Sem migration. Os estados que o board não desenhou seguem `contracts/estados-da-tela.md` (aprovado).

## Fatia 1 — Revisão do Cadastro que não grava (servidor) (História 1, P1)
- [x] T001 [US1] `cadastros/cadastros.service.ts`: separar o miolo de `confirmarImportacao` em `executarImportacao(imp, mapeamento, perfil, { simular })`; com `simular`, as mesmas leituras e decisões (reconhecer a loja por CNPJ ou código, atualizar ou criar, recusar a linha) sem nenhuma escrita (`atualizarLoja`, `criarLoja`, `gravarConfiguracao`, funcionários), usando identificadores provisórios para lojas "novas" da própria planilha; devolve também as contagens (`atualiza`, `novas`, `comErro`) de lojas e de funcionários
- [x] T002 [US1] `cadastros/cadastros.service.ts` e `cadastros.routes.ts`: `revisarImportacao(id, mapeamento, perfil)` e `POST /importacoes/cadastro/:id/revisar` (mesmas permissões da confirmação; não muda o status da importação; corpo igual ao da confirmação); resposta `{ arquivo, lojas, funcionarios, erros, avisos }` do contrato; perfil que não importa lojas devolve `lojas` zerado e o aviso de aba ignorada
- [x] T003 [US1] Mensagens de coluna faltando: `Não encontramos a coluna X. Baixe o modelo e confira os nomes das colunas.` (no lugar de "Faltou indicar a coluna…") na confirmação e na revisão; arquivo vazio: `A planilha está vazia. Preencha a partir da linha 2 do modelo e envie de novo.`
- [x] T004 [US1] Testes de integração (`importacao-revisao.integration.test.ts`): a revisão não altera o banco (contagem de lojas, funcionários e status da importação iguais antes e depois); os números da revisão são os mesmos da confirmação (por CNPJ, por código antigo, linhas com erro, funcionários novos e existentes); gestor e dono; coluna faltando e planilha vazia
- [x] T005 Rodar os testes do servidor (unidade e integração) e commitar a fatia

## Fatia 2 — Revisão da base comercial (servidor) (História 2, P1)
- [x] T006 [US2] `escala/escala.service.ts` e `escala.routes.ts`: `revisarBase(arquivo, buffer)` e `POST /cargas/base/revisar` (multipart, mesmas permissões de `/cargas/base`): lê, soma por loja, **não grava**; devolve `{ arquivo, linhas, lojas, lojasNaoCadastradas, periodo: { inicio, fim }, substitui: [{ codigo, desde }], erros, totalErros }`; `desde` é a data do envio ativo da loja (`baseAtiva`)
- [x] T007 [US2] Mensagens: coluna faltando no formato `Não encontramos a coluna Hora. Baixe o modelo e confira os nomes das colunas.` (`abrir` do serviço); arquivo acima de 10 MB com a mensagem `O arquivo tem mais de 10 MB. Divida a planilha em arquivos menores.` (tratamento do erro do Multer no `uploadPlanilha`)
- [x] T008 [US2] Testes de integração: a revisão não grava (cargas e vendas iguais antes e depois); período e número de lojas corretos; `substitui` traz a loja e a data quando já havia base e vem vazio quando não havia; loja não cadastrada listada; coluna faltando, formato errado e arquivo acima do limite
- [x] T009 Rodar os testes do servidor e commitar a fatia

## Fatia 3 — Componentes comuns da tela (História 3, P1)
- [x] T010 [P] [US3] `components/importacao/useArmadilhaDeFoco.js`: hook que prende Tab e Shift+Tab dentro da janela, fecha com Esc (quando permitido), trava a rolagem do corpo e devolve o foco ao elemento que abriu; `formato.js`: tamanho em KB/MB, datas dd/mm/aaaa, período, e `listaDeErrosCsv(erros)`; testes de unidade de `formato.js` e da lógica de foco/Esc
- [x] T011 [P] [US3] `components/importacao/JanelaDeImportacao.jsx`: casca do modal (`role="dialog"`, `aria-modal`, `aria-labelledby`, `aria-busy` quando ocupado, ~680 px, raio 8, sombra, cabeçalho com título e chip opcional, × com `aria-label="Fechar"`, corpo com `gap` 16, rodapé com Cancelar e botão principal); durante o envio não fecha; tokens do Alquimia
- [x] T012 [P] [US3] `components/importacao/PassoNumerado.jsx` (círculo 24 px, título, descrição e ação à direita), `AvisoCaixa.jsx` (informativo, atenção, erro, com ícone e texto) e `QuadroDoArquivo.jsx` (ícone, nome, apoio e "Trocar arquivo")
- [x] T013 [US3] `components/importacao/AreaDeEnvio.jsx`: `<button>` real com borda tracejada, arrastar e soltar, clique e teclado (Enter e Espaço), `<input type="file">` escondido acionado por ele (nenhum campo nativo à mostra), legenda "Formatos aceitos: .xlsx ou .csv · até 10 MB", `aria-describedby` nos formatos, região `aria-live="polite"` que anuncia o arquivo escolhido, recusa na hora de formato diferente de .xlsx/.csv
- [x] T014 [US3] `shell/AvisoGlobal.jsx` e provedor: banner `role="status"` no alto da tela que some sozinho em ~8 s ou ao fechar; `main.jsx`/`App.jsx` envolvem a aplicação; teste da regra de duração e de troca de mensagem
- [x] T015 Rodar os testes da tela e commitar a fatia

## Fatia 4 — Modal "Importar lojas e funcionários" (História 1 e 3)
- [x] T016 [US1] `features/cadastros/ModalImportarCadastro.jsx`: etapa de envio (título, abertura, aviso azul, três passos com "Baixar modelo" e a área de envio, rodapé com "Cancelar" e "Revisar planilha" desabilitado até haver arquivo); sem a palavra "operador"
- [x] T017 [US1] Mesma tela, etapa de revisão: ao clicar em "Revisar planilha", envia o arquivo (`POST /importacoes/cadastro`) e pede a revisão (`/revisar`) com o mapeamento devolvido; mostra o cartão do arquivo ("Trocar arquivo" volta ao passo 3 e descarta a revisão), a tabela "O que o Radar entendeu" (Lojas e Funcionários; a linha de Lojas só para quem importa lojas), o aviso de atenção com a lista de erros (`aba, linha N: motivo`) e "Baixar lista de erros" (CSV no navegador), e o botão "Gravar X lojas e Y funcionários" com os totais reais
- [x] T018 [US1] Gravação e estados: "Gravar" chama `/confirmar`; durante a leitura e a gravação mostra o progresso, mantém o modal aberto e desabilita os botões; erros do servidor aparecem na caixa de erro (com ícone e texto); falha de conexão volta ao estado anterior; sucesso fecha o modal, devolve o foco e dispara o `AvisoGlobal` ("X lojas e Y funcionários gravados." e, se houver, "N linhas não foram gravadas.")
- [x] T019 [US1] Trocar o uso em `CadastrosPage.jsx` e `AbaEquipe.jsx` (e as props `podeLojas`) pelo novo modal e apagar `ImportarPlanilha.jsx`; testes de unidade da lógica de estados (reducer ou funções puras) e dos textos do botão "Gravar"
- [x] T020 Rodar os testes da tela e do servidor, abrir o fluxo no navegador local (modelo → revisão → gravar) e commitar a fatia

## Fatia 5 — Modal "Enviar base comercial" (História 2 e 3)
- [x] T021 [US2] `features/diagnostico/ModalEnviarBase.jsx`: título com a etiqueta "Opcional", texto de abertura, aviso azul, três passos com "Baixar modelo" (`/planilha-modelo-base`) e a área de envio, rodapé com "Cancelar" e "Enviar base comercial" desabilitado até haver arquivo válido
- [x] T022 [US2] Arquivo escolhido: chama `/cargas/base/revisar`, mostra o quadro (nome, "3,2 MB · 14 lojas · 01/10/2026 a 31/10/2026" com os dados reais e "Trocar arquivo") e, quando `substitui` não está vazio, a caixa de atenção "Este envio substitui o de dd/mm/aaaa." e "As N lojas passam a usar a nova planilha. A anterior fica no histórico."; lojas não cadastradas avisadas; erros de arquivo no lugar do quadro, com o motivo e como corrigir
- [x] T023 [US2] Envio e estados: "Enviar base comercial" chama `/cargas/base`; durante a leitura e o envio, progresso e modal fixo; sucesso fecha e mostra "Base comercial enviada para N lojas."; `onConcluido` recarrega o Diagnóstico; trocar o uso em `App.jsx` e apagar `EnviarPlanilhas.jsx`; testes de unidade da lógica de estados e de formatação do quadro
- [x] T024 Rodar os testes e commitar a fatia

## Fatia 6 — Validação e entrega
- [x] T025 Percorrer o `quickstart.md` no navegador local (os dois modais, arrastar e clicar, só teclado, Esc e foco, erros de arquivo, aviso de sucesso) e conferir que nenhum campo de arquivo nativo aparece
- [x] T026 Reiniciar a API, rodar tudo (servidor, integração e tela), type-check; commitar e subir a branch `feat/modais-de-importacao`

## Dependências e ordem
- Fatias 1 e 2 (servidor) vêm antes das telas que as usam (4 e 5); entre si são independentes.
- A Fatia 3 pode andar junto das Fatias 1 e 2 (arquivos diferentes) e vem antes das 4 e 5.
- T016–T018 dependem de T001–T003 e T010–T014; T021–T023 dependem de T006–T007 e T010–T014.
- Esta entrega parte da branch da planilha por CNPJ (spec 028): o PR dela entra antes, ou junto.

## Estratégia
Primeiro as leituras que não gravam (a base de tudo), depois os componentes comuns e, por fim, cada modal. Cada fatia é testável sozinha; o modal antigo só é apagado quando o novo já o substitui.
