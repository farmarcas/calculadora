# Tarefas: Encargos por regime tributário

## Fatia 1 — Tabela e cálculo (US1, US3)
- [x] T001 Migration `parametros_encargos` + `schema.prisma` (modelo `ParametroEncargo`)
- [x] T002 `regras/encargos.ts`: tipos, padrões, `validarEncargos`, `calcularEncargos` (componentes e total)
- [x] T003 Testes à mão do cálculo: Simples ≈ 29,0%; Presumido ≈ 62,2%; Real = Presumido; rescisão ligada; RAT/FAP fora da faixa; regime ausente
- [x] T004 `parametros/encargos.repository.ts` e rotas `GET/POST /parametros-encargos`; teste de integração
- [x] T005 Rodar tudo e commitar a fatia

## Fatia 2 — Ligação nos cálculos (US1, US2, US4)
- [ ] T006 `custosEfetivos`: total do regime (com ajustes da loja) no lugar do percentual digitado, onde a loja é carregada (diagnóstico, cenários, simulações, custos)
- [ ] T007 Regime ausente/inválido: Presumido + `alertaRegime` na resposta; rota para gravar o regime escolhido
- [ ] T008 Ajustes por loja (RAT, FAP, rescisão) em `custos.encargos`, com validação e "restaurar padrão"
- [ ] T009 Testes de integração: mudar o regime muda a folha; ajuste de uma loja não afeta outra
- [ ] T010 Rodar tudo e commitar a fatia

## Fatia 3 — Tela, planilha e antes/depois (US5)
- [ ] T011 `QuadroCentral`: "Salários + encargos {total}% ({regime})", "Ver composição", alerta e seletor de regime, nota do contador
- [ ] T012 `Custos.jsx`: sai o campo "Encargos (%)"; entram RAT, FAP, rescisão e "Restaurar padrão"
- [ ] T013 Parâmetros legais: seção "Encargos por regime" com versões
- [ ] T014 Planilha: "Encargos (%)" vira RAT (%), FAP e Provisão de rescisão; coluna antiga ignorada com aviso
- [ ] T015 Antes/depois da folha de uma loja de teste em cada regime; README; rodar tudo e commitar
