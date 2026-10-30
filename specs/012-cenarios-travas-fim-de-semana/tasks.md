# Tasks: Cenário 2 com travas — fim de semana primeiro

**Input**: `specs/012-cenarios-travas-fim-de-semana/` (spec, plan, research, data-model, contracts)
**Tests**: incluídos (contas à mão da ordem dos passos, do piso de 4 h, da proteção de dias, das travas de 10% e 85%, do "faltam X h", da margem em branco; Supertest com a loja do caso real e os perfis).
Formato: `[ID] [P] [US] descrição com caminho`. Caminhos do backend relativos a `backend/node/`, do front a `frontend/react/`.
Segurança do banco: sem migration nesta spec; nada de `down -v` nem `prisma migrate reset`.

## Phase 1: Setup

- [X] T001 Conferir o branch `feat/cenarios-travas-fim-de-semana`, o ambiente de pé (`docker compose ps` saudável) e os testes atuais verdes (`npm test`, `npm run test:integration`), anotando as contagens de partida

## Phase 2: Fatia 1 — Núcleo das travas (US1 e US2, sem tela) 🎯 MVP

**Teste independente**: com equipe pequena e horário todos os dias, só sábado e domingo mudam, na ordem reduzir → fechar domingo → fechar sábado; nenhum passo viola as travas.

- [X] T002 [US1] Teste + `src/modules/escala/ajustes-fim-de-semana.ts`: constante `TRAVAS` (`perdaMaxPct` 10, `horasMinPct` 85, `horasMinDia` 4) e tipos `Passo`, `EstadoFimDeSemana`, `ResultadoSequencia`
- [X] T003 [US1] Teste + perda estimada: dia reduzido perde `vendaMes × (1 − horasAtuais ÷ horasDeHoje)`, dia fechado perde a `vendaMes` inteira; perda total em % do faturamento mensal de referência; contas à mão (ex.: dia de 12 h cortado em 2 h tira 1/6)
- [X] T004 [US1] Teste + redução: corta 1 h do fechamento do dia de menor venda por hora (empate: domingo) que ainda tenha mais de 4 h abertas; nunca abaixo de 4 h; dia sem venda cai no empate
- [X] T005 [US1] Teste + sequência: depois de cada passo confere se a equipe cobre (`verificarRegra`) e para no primeiro que cobre; esgotadas as reduções, fecha o domingo (se aberto e não protegido), depois o sábado (se aberto e não protegido); domingo já fechado é pulado; dia protegido só reduz; segunda a sexta nunca mudam
- [X] T006 [US2] Teste + travas: um passo só vale se o estado resultante tem perda ≤ 10% e horas ≥ 85% das de hoje; senão para e devolve o último estado válido, a trava que impediu (`perda` ou `horas`) e `faltaH` (soma da falta das funções que ainda faltam)
- [X] T007 Rodar tudo (`npm test`, `npm run lint`, `npx tsc --noEmit`) e commitar a fatia

**Checkpoint**: a regra nova existe, é pura e está provada com números à mão.

## Phase 3: Fatia 2 — Cenário 2 usa o núcleo (US1, US2 e US3 no servidor) 🎯

**Teste independente**: o Diagnóstico da loja do caso real (94 h, equipe pequena) devolve corte de no máximo 15% das horas, perda de até 10%, nenhum dia útil tocado e `naoResolveSozinho`; sem margem, margem perdida e saldo vêm nulos.

- [X] T008 [US1] `src/modules/escala/cenarios.ts` (`montarEconomia`): troca `escolherDiasAFechar` pela sequência do núcleo; novos campos `naoResolveSozinho`, `travou`, `faltaH`, `passos`, `horariosAjustados` e (só dono) `perdaFaturamentoPct`; `diasFechar`, `horasSemana`, `horarioSemana`, `vendaCortadaMes` e `margemCortadaMes` passam a refletir o estado final; os casos de inviável por falta de gente no quadro e de "equipe já cobre" ficam como estão
- [X] T009 [US3] Margem não informada: `margemCortadaMes` e `margemMes` por dia viram nulos quando nenhuma margem foi informada (hoje valem 0); o teto de perda continua pelo faturamento; textos do cenário sem frase de "perde cerca de R$ 0 de margem"
- [X] T010 [US2] Textos do cenário (`resumo` e `direcionamento`): descrevem os passos na ordem ("Sáb e dom fecham 2 h mais cedo; domingo fecha…"), dizem qual trava parou e o que falta, e apontam o Cenário 3; sem valores em reais para quem não é dono
- [X] T011 [US2] `destaque` e impacto: cenário com `naoResolveSozinho` ou sem margem não entra no "Cenário sugerido" nem no selo de menor impacto
- [X] T012 [US1] Teste + `src/modules/escala/comparativo.ts`: status `nao_resolve`, `ajustes` por coluna, `faltaH`, `perdaFaturamentoPct` (só dono), alerta "Informe a margem bruta média da loja no Cadastro…"; margem e saldo nulos sem margem
- [X] T013 [US1] Refazer à mão, uma a uma, as expectativas dos testes antigos do Cenário 2 (`cenarios-dias.test.ts`, `cenarios.test.ts`, `cenarios-extras.test.ts`, `comparativo.test.ts`, `diagnostico.test.ts`) que esperavam fechar dia útil ou valores com margem zero; anotar no teste o porquê de cada mudança
- [X] T014 [US2] Teste de integração em `escala.routes.integration.test.ts`: a loja do caso real (94 h, equipe pequena, só faturamento mensal) não passa de 10% de perda nem de 15% de corte de horas, não toca em dia útil e mostra `naoResolveSozinho`; gestor e consulta recebem passos, horários e status sem nenhum campo em reais
- [X] T015 Rodar tudo (`npm test`, `npm run test:integration`, `npm run lint`, `npx tsc --noEmit`) e commitar a fatia

## Phase 4: Fatia 3 — Tela (US3 e US4)

**Teste independente**: no navegador, o cartão do Cenário 2 mostra o selo "Não resolve sozinho", a mudança de horário com reduções e fechamentos, o que falta e o aviso de margem.

- [X] T016 [US1] `features/diagnostico/Comparativo.jsx`: selo amarelo "Não resolve sozinho" na linha do título (junto dos demais); linha "Mudança de horário" com as reduções ("Sáb 08h–18h (antes 08h–22h) · Dom fechado") e os fechamentos; "Horas abertas" já mostra a diferença; sem "Cenário sugerido" nem "Viável" quando não resolve
- [X] T017 [US4] `features/diagnostico/Cenarios.jsx` (detalhe do Cenário 2): lista dos passos aplicados, a trava que parou, quanto falta e o caminho sugerido (Cenário 3); aviso "Informe a margem bruta média…" quando a margem não existe
- [X] T018 [US3] "Margem perdida" e "Saldo mensal estimado" mostram "—" (nunca R$ 0) quando nulos; bloco do saldo em cinza
- [X] T019 Conferir no navegador (dono e gestor): loja do GE 216 (sem margem, não resolve sozinho), loja com equipe que cabe depois de reduzir, loja com margem informada, loja 001; telas largas e estreitas
- [X] T020 Rodar tudo e commitar a fatia

**Nota da fatia 3**: conferido no navegador com a loja Porto Feliz do GE 216 (dono e gestor): selo "Não resolve sozinho", mudança de horário com as reduções, "Ainda falta cobrir", aviso da trava e, sem valores em reais para o gestor. 35 das 37 lojas do GE 216 aparecem como "inviável" no Cenário 2 porque o quadro não tem ninguém na função Caixa (mínimo 1): é dado, não regra.

## Phase 5: Fatia 4 — US5: Cenário 3 com as mesmas travas e fechamento (P2)

**Teste independente**: o Equilíbrio nunca fecha dia útil nem passa do teto de perda; entre as opções permitidas escolhe a de menor impacto.

- [ ] T021 [US5] Teste + `ajustes-fim-de-semana.ts`: gerar os estados permitidos (cada dia de fim de semana: original, reduzido de 1 em 1 h até 4 h, fechado quando não protegido) já filtrados pelas travas
- [ ] T022 [US5] `src/modules/escala/cenarios.ts` (`montarEquilibrio`) e `cenarios-dias.ts` (`melhorCombinacao`): avaliar só os estados permitidos e escolher o de menor impacto (custo adicional + margem perdida), com o desempate atual (menos contratações, menos cortes); `coincideComManter` e `coincideComEconomia` seguem valendo; texto descreve a redução
- [ ] T023 [US5] Refazer à mão as expectativas dos testes do Cenário 3 que esperavam dia útil fechado; teste de integração: o Equilíbrio nunca fecha segunda a sexta e respeita 10% e 85%
- [ ] T024 [US5] Tela do Cenário 3 (`Comparativo.jsx` e `Cenarios.jsx`): mostra as reduções do fim de semana como o Cenário 2
- [ ] T025 Documentação: README (nova regra do Cenário 2 e 3, as travas, o status "Não resolve sozinho", a margem em branco), `scripts/sync-templates.sh`, `scripts/check-repo.sh`
- [ ] T026 Conferência final: `npm test`, `npm run test:integration`, `npm run lint`, `npx tsc --noEmit`, build do `web`, `quickstart.md` do começo ao fim, cenários 1, 4 e 5 sem mudança de resultado; commitar

## Dependências e ordem

- Fatia 1 → 2 → 3 → 4, nessa ordem; cada uma termina com tudo verde e commit.
- A Fatia 4 (Cenário 3) pode ficar para depois sem atrapalhar as anteriores.
- Dentro da Fatia 2, T008 a T011 mexem em `cenarios.ts`; T012 depende deles; T013 vem por último, depois que as regras estão fixas.
