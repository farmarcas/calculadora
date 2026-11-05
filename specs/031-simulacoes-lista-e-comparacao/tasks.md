# Tarefas: Lista de simulações com resultado e comparação com diferença

Formato: `- [ ] ID [P] [História] descrição com o arquivo`. Servidor em `backend/node/src/modules/simulacoes`, tela em `frontend/react/src`. Cada fatia termina com os testes passando e um commit. Sem migration e sem apagar dado.

## Fatia 1 — Servidor: resumo na lista e métricas na comparação (Histórias 1, 3 e 5, P1)
- [x] T001 [P] [US1] `simulacoes/resumo.ts` (novo, puro): `tipoDoCenario(horasAbertas, horasAbertasAntes)` → `mantem | reduz | amplia` e `nomeDeQuemCriou(perfil)` → texto legível ("Administrador da conta", "Gestor de escala", "Consulta", "Administrador da plataforma"; nunca o código); `resumo.test.ts`
- [x] T002 [P] [US1] `simulacoes/desatualizada.ts` (novo, puro): a regra recuperada do histórico (quadro, horário de funcionamento, mínimo por função e convenção contra o retrato gravado nas premissas), aplicada a toda simulação **gravada**; recebe os dados da loja e o quadro atual já lidos (para ler uma vez só por lista); `desatualizada.test.ts` (só mudar o formato do horário não dispara; mudar o horário, o quadro, o mínimo ou a convenção dispara; rascunho e descartada nunca)
- [x] T003 [US1] `simulacoes.service.ts` (`listar`): ler uma vez a loja, a base comercial, os custos, os parâmetros e o quadro atual; para cada simulação calcular o resultado com a mesma `calcularResultado` do painel e devolver `tipo`, `horasAbertas`, `desatualizada`, `criadaPor` e, só para o dono, `saldoMensal` e `folhaExtra` (`null` quando falta salário ou venda por hora); o `resultado` bruto sai da lista; mais recente primeiro; `simulacoes.repository.ts` devolve quadro, premissas e horários na listagem
- [x] T004 [US3] `simulacoes.service.ts` (`comparar`): aceitar 2 a 4 ids na ordem recebida (a primeira é a base), recusar descartadas, outra loja, menos de 2 e mais de 4 com mensagem em português; cada simulação ganha `tipo`, `desatualizada`, `horasAbertas` e, só para o dono, `saldoMensal`, `folhaExtra`, `vendaEstimada` e `vendaQueSai`; `simulacoes.schemas.ts` ajusta o limite de ids
- [x] T005 Testes de integração (`simulacoes.routes.integration.test.ts`): a lista traz os campos novos e não traz `resultado`; o saldo da lista é igual ao do painel (`GET /simulacoes/:id`) e ao da comparação; dono vê saldo e folha, gestor e consulta não os recebem (o campo nem existe); sem salário o saldo vem `null`; gravada com a loja mudada vem `desatualizada: true`; tipo "reduz", "amplia" e "mantem"; comparar com 4 ids funciona e com 5 ou 1 é recusado; a ordem dos ids é a ordem da resposta
- [x] T006 Rodar os testes do servidor (unidade e integração) e commitar a fatia

## Fatia 2 — Regras da tela e token de cor (Histórias 3 e 4)
- [x] T007 [P] [US3] `grade/formato.js` (novo, puro): reais com sinal (`+R$ 4.900`, `−R$ 2.299` com U+2212, `R$ 2.299`), horas (`89h por semana`), rótulos do tipo do cenário, "—" para valor ausente; `formato.test.js`
- [x] T008 [US3] `grade/comparacao.js` (novo, puro): as 15 métricas em 4 grupos com o sentido da cor de cada uma (contrato `regras-da-comparacao.md`); `diferenca(metrica, valor, base)`; `corDaDiferenca`; `trocarBase(ids, id)` (move para a frente); `contarMudancas` ("N de M itens", com M = 11 sem valores em reais); `linhasVisiveis(soOQueMudou)` (esconde iguais e grupos vazios); `comparacao.test.js` cobrindo cada regra de cor, a troca de base, a contagem e o filtro
- [x] T009 [P] (o token já existia no projeto) `styles/alquimia.css`: token `--text-success-strong: #3E7500` (e a variante para o tema escuro, se houver)
- [x] T010 Rodar os testes da tela e commitar a fatia

## Fatia 3 — Lista de simulações com resultado e seleção (Histórias 1 e 2, P1)
- [x] T011 [US1] `grade/ListaDeSimulacoes.jsx` (substitui a tabela de `GradeTab.jsx`): título, subtítulo, "Mostrar descartadas" e "Nova simulação"; colunas seleção, Nome (com o tipo em linha de apoio), Situação (selos Rascunho, Gravada, Desatualizada com dica por `title` e `aria-describedby`), Saldo por mês (16 px, negrito, verde/vermelho, sinal), Horas abertas, Folha extra, Criada (data e "por <nome legível>") e "Abrir"; linha selecionada com `--color-primary-soft`, altura mínima 64 px; colunas em reais só quando a API as devolve; estado vazio com o texto do board
- [x] T012 [US2] `grade/BarraDeComparar.jsx` e a seleção em `GradeTab.jsx`: de 2 a 4 (a quinta não marca e explica o máximo), descartada não marca, a ordem da escolha vale, barra escura "N simulações selecionadas. A primeira escolhida é a base da comparação." com "Limpar" e "Comparar"; sem barra com 0 ou 1; rótulo "Selecionar <nome>"
- [x] T013 Testes da lógica de seleção (limite, ordem, descartada) e da lista (campos em reais ausentes para quem não é dono); rodar os testes da tela; conferir no navegador local; commitar a fatia

## Fatia 4 — Comparação com diferença frente à base (Histórias 3, 4 e 5)
- [x] T014 [US3] `grade/ComparacaoDeSimulacoes.jsx` (substitui `Comparar.jsx`): cabeçalho com título, subtítulo "As diferenças são frente à base (nome). N de M itens mudaram.", toggle "Mostrar só o que mudou" e "+ Adicionar simulação"; tabela com a coluna de rótulos (280 px), uma coluna por simulação (selos Base, situação, tipo) e a coluna Diferença (uma por não base); grupos em caixa alta com `--surface-subtle`; `<th scope="col">` no cabeçalho fixo (`position: sticky` em contêiner com rolagem, primeira coluna fixa), `<th scope="row">` nas linhas; linha Saldo destacada (18 px, negrito, verde/vermelho); linhas que mudaram com rótulo em negrito e fundo leve, iguais com "igual"; diferença "▲ +…"/"▼ −…" na cor do efeito; sem síntese
- [x] T015 [US4] Controles: "Usar como base" e "Remover da comparação" em cada coluna que não é a base (a base não os oferece), "+ Adicionar simulação" com a lista das simulações ainda não incluídas (desabilitado com 4 colunas), voltar à lista com explicação ao ficar com menos de duas; trocar a base recalcula tudo no navegador
- [x] T016 [US5] Valores em reais: a comparação esconde as linhas de Saldo, Folha extra, Venda estimada e Venda que deixa de entrar quando a API não as devolve (M = 11); textos "Horas que faltam", "Horas que sobram" e "Venda que deixa de entrar"; busca no código da tela que confirma que não resta "em uso", "Referência" nem código de perfil
- [x] T017 Apagar `Comparar.jsx` e os restos; rodar os testes da tela; conferir no navegador local (selecionar, comparar, trocar a base, "só o que mudou", adicionar e remover); commitar a fatia

## Fatia 5 — Validação e entrega
- [x] T018 Percorrer o `quickstart.md` no navegador local (como dono e como gestor), conferindo o saldo igual nos três lugares e "Desatualizada" depois de mudar o horário da loja
- [x] T019 Reiniciar a API, rodar tudo (servidor, integração e tela), type-check; commitar e subir a branch `feat/simulacoes-lista-e-comparacao`

## Dependências e ordem
- A Fatia 1 vem antes das telas que usam os campos novos (3 e 4); T001 e T002 são independentes e andam antes de T003.
- A Fatia 2 (regras puras e token) é independente do servidor e pode andar junto da Fatia 1; vem antes das Fatias 3 e 4.
- T012 depende de T011; T014 a T016 dependem de T008 e T004.

## Estratégia
Primeiro os números certos no servidor e as regras puras testadas (cor, diferença, base, contagem), depois a lista e por fim a comparação. Cada fatia é testável sozinha, e o saldo é conferido contra o painel em todas.
