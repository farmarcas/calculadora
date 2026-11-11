# Tasks: Esticar os turnos até o limite da regra

**Input**: `/specs/046-esticar-turnos-ao-limite/` (spec, plan, research, data-model, contracts, quickstart)

Servidor: `backend/node/src/modules`. Tela: `frontend/react/src/features/simulacao/escala`.

## Phase 1: Fundação — a função pura `esticarTurnos` (bloqueia as histórias)

- [x] T001 Em `simulacoes/avaliar.ts`, `TurnoSim` ganha `antes?: { entrada: number; saida: number }`; em `simulacoes/simulacoes.schemas.ts`, o `turnoSchema` aceita `antes` (opcional, de 15 em 15 minutos, 0 a 24); `turnosParaGravar` da tela e o resto do fluxo preservam o campo.
- [x] T002 Em `escala/semana-com-folgas.ts`, `HorarioPessoa` ganha `fixo?: boolean`; criar `esticarTurnos({ turnos, horarios, dias, regra, minimos })`: para cada função com exigência, calcula as faltas por dia e hora; para cada pessoa abaixo do limite (menor entre `cargaH` e `tetoEfetivo`), sem horário fixo, em cada dia que trabalha, estende o fim hora a hora enquanto a hora seguinte tem falta, dentro do horário da loja, até `regra.maxDia` líquidas e respeitando 11 h de descanso até o dia seguinte; se o fim não alcança, estende o começo; para ao chegar ao limite semanal ou quando a falta acaba; guarda `antes`; intervalo de 1 h entra quando o turno passa de 6 h; ordem das pessoas: mais folga de jornada primeiro, desempate pela matrícula.
- [x] T003 Testes em `escala/semana-com-folgas.test.ts`: estica só onde falta; para no limite semanal e no máximo do dia; não sai do horário da loja; respeita o descanso de 11 h; quem está no limite, quem tem horário fixo e vaga não mudam; sem falta, ninguém muda; guarda `antes`; determinístico; a falta só diminui (nunca aumenta).

## Phase 2: História 1 e 2 — Cenários e Personalizar com turnos esticados (P1)

**Teste independente**: Cosmópolis, regra de 42h: as contratações diminuem ou ficam iguais, e o cartão é igual à Simulação.

- [x] T004 [US2] Em `escala/semana-com-folgas.ts`, `semanaComFolgas` chama `esticarTurnos` entre as folgas e a conta de falta; `funcoes[*].faltaH` e as contratações usam os turnos esticados; devolve também `esticados`.
- [x] T005 [US2] Em `escala/escala.service.ts` e `escala/diagnostico.ts`, passar `fixo` aos horários da equipe (`matriculasHorarioFixo`); em `simulacoes/simulacoes.service.ts`, `doEscalaAtual` marca `fixo` e `criar` com `comVagasSugeridas` usa os turnos esticados (com `antes`).
- [x] T006 [US2] Atualizar os testes de unidade e de integração que mudam de número (cenários, comparativo, diagnóstico, simulações), **listando cada mudança**; teste de integração: em uma loja com pessoas abaixo do limite e falta de cobertura, o Personalizar traz turnos esticados com `antes`, ninguém passa do limite, e as contratações do cartão são iguais às das vagas e menores ou iguais às de antes (SC-002 e SC-003).
- [x] T007 [US1] Teste de integração: ninguém passa do limite de horas por semana nem do máximo por dia depois do esticamento (SC-001), em Personalizar nas três regras.

## Phase 3: História 3 — A tela mostra o que foi esticado (P2)

- [x] T008 [US3] Em `escala-regras.js`, `turnoEsticado(t)` (tem `antes` e é diferente) e `textoDoEsticamento(t, limite)`; `LinhaDaPessoa.jsx`: marca "ajustado" na barra e dica "Turno aumentado de 07h–15h para 07h–16h24 para cobrir a falta, dentro do limite de 42h"; `EscalaMobile.jsx` com o mesmo texto; testes em `escala-regras.test.js`.
- [x] T009 [US3] `LinhaDaSemana.jsx`: o total da semana mostra o valor depois do esticamento e não destaca como acima da jornada; teste em `semana-regras.test.js`.

## Phase 4: História 4 — Ajustar e desfazer (P2)

- [x] T010 [US4] Em `folgas-regras.js`, `esticarTurnos` com os mesmos casos do servidor (função pura na tela); "Sugerir folgas" aplica folgas e esticamento; "Desfazer sugestão" desfaz os dois; ao arrastar, `antes` é mantido e a marca some quando o turno volta ao horário de `antes` (`movimento-regras.js`); testes.
- [x] T011 [US4] Em `SimulacaoPage.jsx`, ligar "Sugerir folgas" ao esticamento e manter o desfazer pela chave dos turnos; texto do card diz que turnos podem ser aumentados dentro do limite.

## Phase 5: Fechamento

- [x] T012 Rodar toda a suíte (servidor: `npm test`, `npm run test:integration`, `tsc`, `eslint`; tela: `npm test`, build) e corrigir; listar os testes cujos números mudaram de propósito.
- [x] T013 Conferir no navegador (dono, gestor, consulta) os passos do `quickstart.md`, em Cosmópolis, depois de reiniciar a API; Cadastro intacto.
- [x] T014 Atualizar o `README.md` (cenários, Personalizar, folgas) com o esticamento e a pendência do jurídico.

## Dependências e ordem

T001 → T002 → T003; depois T004 → T007, T008 → T011, por fim T012 → T014.

MVP: T001–T007: os cenários e o Personalizar já usam os turnos esticados, sem a tela ainda mostrar a marca.

Risco: T004–T006 mexem na conta dos cenários; cada passo roda a suíte inteira antes do seguinte e as mudanças de número são listadas.
