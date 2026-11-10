# Tarefas: Cobertura e vendas por hora dentro da Simulação

Formato: `- [ ] ID [P] [História] descrição com o arquivo`. Servidor em `backend/node/src/modules/simulacoes`, tela em `frontend/react/src`. Cada fatia termina com os testes passando e um commit. Sem migration e sem apagar dado. Nenhum número já calculado da Simulação pode mudar.

## Fatia 1 — Servidor: a cobertura da simulação (Histórias 1, 3 e 4, P1/P2)
- [x] T001 [US1] `escala/diagnostico.ts`: exportar `semValorPorHora` (hoje privada), sem mudar o que faz; os testes do Diagnóstico continuam passando
- [x] T002 [US1] `simulacoes/cobertura-simulacao.ts` (novo, puro): `coberturaDaSimulacao({ dias, quadro, turnos, minimos, vendas, horarios, turnosDaLoja, dono })` → tira os desligados, junta turno e função (vaga conta só se tiver turnos), chama `cobertura()` de `escala/cobertura.ts`, resume as vendas com `resumirVendas` (sem reais para quem não é dono, via `semValorPorHora`) e devolve `{ horas, funcoes, vendas, vagasSemTurnos, horarios, turnosDaLoja }` no formato de `contracts/cobertura-no-detalhe.md`
- [x] T003 [P] [US1] `simulacoes/cobertura-simulacao.test.ts`: hora fora do novo horário vira `pessoas: null`; hora nova entra na conta; desligado não cobre; vaga com turnos cobre e vaga sem turnos não cobre e entra em `vagasSemTurnos`; sem base de vendas `vendas` é nulo; para quem não é dono não existe `vendaMedia`; mesmo resultado que a cobertura do Diagnóstico quando horário e quadro são os mesmos
- [x] T004 [US1] `simulacoes.service.ts` (`detalhe`): chamar a função com os dias, o quadro, os turnos e os mínimos que o detalhe já usa, a base de vendas atual da loja e o perfil; devolver o campo `cobertura`; a lista e a comparação não mudam
- [x] T005 [US4] Testes de integração (`simulacoes.routes.integration.test.ts`): o detalhe traz `cobertura`; o dono recebe `vendaMedia` e o gestor não (o campo nem existe); horário reduzido deixa as horas retiradas com `pessoas: null`; desligar a única pessoa de uma função derruba a cobertura nessas horas; vaga sem turnos aparece em `vagasSemTurnos`; saldo, folha extra e horas do `resultado` são iguais aos de antes (SC-005); a lista e a comparação não trazem `cobertura`
- [x] T006 Rodar os testes do servidor (unidade e integração), reiniciar a API e commitar a fatia

## Fatia 2 — Tela: a seção "Cobertura e vendas" na Simulação (Histórias 1, 2 e 3, P1/P2)
- [x] T007 [US1] `diagnostico/onde-vem/montar.js`: `montarCobertura` aceitar o objeto `cobertura` da simulação (mesmo formato do Diagnóstico) sem regra nova; `montar.test.js` ganha um caso com o formato da simulação
- [x] T008 [US1] `simulacao/CoberturaDaSimulacao.jsx` (novo): monta os dados com `montarCobertura` e desenha a frase do pico, a `GradeCobertura` e a legenda; sem base de vendas mostra "Sem vendas por hora. Envie a base comercial para cruzar equipe e vendas." sem esconder a cobertura; sem turnos da loja a linha "Turnos" não aparece
- [x] T009 [US2] Em `CoberturaDaSimulacao.jsx`: aviso de vendas fora do horário simulado (lista as horas) e aviso "N vaga(s) ainda sem horário: não cobrem nada nesta grade"; sem os atalhos para o Cadastro do Diagnóstico
- [x] T010 [US1] `simulacao/SimulacaoPage.jsx`: encaixar a seção na coluna da esquerda, entre o passo 1 e o passo 2, sem renumerar os passos; a grade acompanha o detalhe que já volta a cada salvamento
- [x] T011 [US1] Grade no celular: rolagem só dentro do quadro, coluna de função fixa, sem rolagem lateral da página inteira (conferir em 375 px)
- [x] T012 Rodar os testes da tela, conferir no navegador local (dono e gestor, loja com e sem vendas, horário reduzido, desligar pessoa, vaga sem turnos) e commitar a fatia

## Fatia 3 — Validação e entrega
- [x] T013 Percorrer o `quickstart.md` no navegador local, conferindo que a grade da Simulação mostra os mesmos números que a do Diagnóstico quando horário e quadro são os mesmos, e no celular
- [x] T014 Reiniciar a API, rodar tudo (servidor, integração, tela e type-check), commitar e subir a branch `feat/simulacao-cobertura-por-hora`

## Dependências e ordem
- T001 antes de T002; T002 antes de T003 e T004; T004 antes de T005.
- A Fatia 2 depende de T004 (o campo precisa existir); T007 pode andar junto da Fatia 1.
- T008 e T009 dependem de T007; T010 depende de T008.

## Estratégia
Primeiro o servidor devolve a cobertura certa e protegida por perfil, com testes que provam que nada do resultado mudou; depois a tela só desenha, reaproveitando o montador e a grade do Diagnóstico. Cada fatia é testável sozinha.
