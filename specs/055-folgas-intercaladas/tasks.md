# Tasks: Folgas sugeridas mais intercaladas

**Spec**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md)

## Phase 1: Servidor — US1, US2, US3

- [ ] T001 Em `backend/node/src/modules/escala/semana-com-folgas.ts`, adicionar `nome?: string` ao tipo `HorarioPessoa`; em `backend/node/src/modules/simulacoes/simulacoes.service.ts` (e onde mais os horários forem montados a partir do quadro) preencher `nome` quando existir.
- [ ] T002 [US1] Em `aplicarFolgas` (laço "As demais folgas"), calcular para cada dia candidato a **proximidade** às outras folgas da mesma pessoa: `3 − min(distância circular em dias, 3)` contando as folgas novas e as que ela já tem (dias abertos sem turno); domingo e segunda são vizinhos.
- [ ] T003 [US2] No mesmo laço, trocar a ordem de decisão por: (1) falta nova de cobertura, (2) proximidade, (3) folgas da função naquele dia, (4) maior sobra de cobertura, (5) desempate rotativo `(dia − posição da pessoa na função) mod 7`. Sem sorteio.
- [ ] T004 [US3] Depois de escolher, se a pessoa terminou com alguma folga nova vizinha de outra folga dela, acrescentar uma vez o aviso "Nome: não deu para afastar as folgas sem faltar gente." (sem nome, usar a função).
- [ ] T005 [P] Testes em `semana-com-folgas.test.ts`: 5 atendentes na regra de 40h trabalhando 7 dias com 2 folgas cada → nenhuma pessoa com folgas seguidas e as folgas em pelo menos 5 dias diferentes; cobertura nunca pior que a ordem antiga (mesma ou menos hora abaixo do mínimo); mesma entrada, mesma saída; domingo e segunda como vizinhos; uma pessoa com 1 folga não muda; função de uma pessoa só; aviso com nome quando só há dias vizinhos sem falta; rodízio de domingo e 11 h de descanso seguem valendo.

## Phase 2: Tela — US1, US2, US3

- [ ] T006 [US1] Em `frontend/react/src/features/simulacao/escala/folgas-regras.js` (`sugerirFolgas`), aplicar a mesma ordem de decisão e o mesmo aviso, com o nome vindo do quadro.
- [ ] T007 [P] Testes em `folgas-regras.test.js` com os mesmos casos de T005, mais um teste de **paridade**: a mesma entrada (quadro, turnos, cobertura, regra) dá os mesmos dias de folga no servidor e na tela.

## Phase 3: Fechamento

- [ ] T008 Rodar `tsc`, `eslint`, testes de unidade e de integração da API (sozinho) e testes e build da tela; os testes de capacidade e de cenários que usam `semanaComFolgas` precisam seguir passando (se algum número mudar, revisar antes de ajustar).
- [ ] T009 Conferir no navegador: Cosmópolis (e outra loja com várias pessoas) com "Sugerir folgas" e com a simulação aberta já com folgas; ver folgas afastadas, espalhadas, avisos com nome e a cobertura por hora.
- [ ] T010 Atualizar o `README.md` e marcar as tarefas; commit na branch atual, push e atualizar `local/ver-tudo`. Sem PR novo.

## Dependências

T001 → T002 → T003 → T004 → T005; T006 depende de T003/T004; T007 depende de T005 e T006; T008–T010 por último.
