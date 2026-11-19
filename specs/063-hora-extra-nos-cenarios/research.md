# Research: Hora extra antes de contratar

## Como funciona hoje (verificado no código)

| Pergunta | Resposta | Onde |
| --- | --- | --- |
| Onde nasce a "contratação"? | Em `verificarRegra`: calcula `gapH` (horas semanais de falta) por função e chama `sugerirContratacao`. Cenários e Simulação leem esse resultado. | `regras/capacidade.ts` |
| Os Cenários conhecem hora extra? | Não: "Manter" é só contratar (`contratacoesDe`, `custoDasVagas`). | `escala/cenarios.ts` |
| A Simulação conhece? | Só como custo da falta que sobra depois das vagas: `falta × 5 semanas × salário-hora × 1,5 × encargos`, sem teto. | `simulacoes/resultado.ts` (~linha 290) |
| E a "variante com hora extra" do contrato? | Removida na spec 044; só o campo `extrasAdicionalPct = 50` restou. | `regras/contratacao-horas.ts` |
| Peso da folha | `(folhaHoje + custoAdicional) ÷ (faturamento × (1 + variação da venda))`; já recebe qualquer custo adicional. | `escala/peso-folha.ts` |
| Número do cartão × Simulação | Os dois passam por `verificarRegra` com os mesmos horários (spec 043). | `capacidade.ts`, `resultado.ts` |

Riscos a conferir na implementação: (1) `passa()` bloqueia a falta do farmacêutico (`obrigatorio && falta`): a falta bruta continua existindo, então a decisão "cobre com hora extra" vive em campos novos, sem mudar `falta`; (2) quem lê `faltaH` para calcular horas usadas da contratação (`contratacoesDe`) passa a ler a falta que sobra; (3) a simulação gravada já guarda o resultado? Se o resultado for calculado na leitura, "não recalcular gravadas" exige confirmar o que é congelado (T001 verifica e ajusta a spec se for o caso).

## Decisões

### D1 — Um módulo só para a regra e o custo
**Decision**: `regras/hora-extra.ts` com `HORA_EXTRA = { maxPorDiaH: 2, maxPorSemanaH: 10, adicionalPct: 50, semanasNaFolha: 5 }`, `coberturaComHoraExtra(...)` e `custoMensalDaHoraExtra(...)`.
**Why**: o pedido manda "uma única função compartilhada, não duas cópias"; hoje a conta mora dentro de `resultado.ts` e passa a morar aqui, e `resultado.ts` a importa.
**Alternatives**: manter a conta em `resultado.ts` e importá-la nos Cenários (descartada: acopla Cenário a Simulação e mistura regra com custo).

### D2 — A decisão entra em `verificarRegra`, antes de `sugerirContratacao`
**Decision**: depois de achar `gapH` (da cobertura real ou da capacidade), abater `horaExtraH`; a contratação cobre `gapH − horaExtraH`.
**Why**: é o único ponto que Cenários e Simulação já compartilham; assim o cartão e a Simulação não divergem por construção (spec 043).
**Alternatives**: calcular a hora extra separadamente em cada tela (descartada: duas cópias, risco de divergir).

### D3 — Quanta hora extra cabe (teto por pessoa e por dia)
**Decision**: por função, a hora extra possível é `min(falta, Σ por dia de min(faltaDoDia, pessoas escaladas no dia × 2 h), pessoas × 10 h)`. A falta por dia vem da cobertura real (`coberturaDaFuncao` sobre os turnos da semana com folgas); sem cobertura real, usa-se só o teto semanal.
**Why**: respeita 2 h/dia e 10 h/semana por pessoa sem simular a escolha de quem estende cada turno (aproximação por função, honesta e simples); o que a aproximação não cobre vira contratação.
**Alternatives**: escolher pessoa a pessoa e esticar os turnos (descartada: muda a escala; o `esticarTurnos` da spec 046 já cobre o caso de quem trabalha menos que a jornada).

### D4 — Quem conta como "escalado"
**Decision**: as pessoas da função no quadro (equipe atual e vagas da simulação, sem os desligados).
**Why**: uma vaga que a pessoa adicionou na Simulação também pode estender o turno; desligados não existem na simulação.

### D5 — O custo é uma conta só, sem mudar o resultado de hoje
**Decision**: `custoMensalDaHoraExtra({ horasSemana, salarioMedio, divisor, encargosPct })` = `horasSemana × 5 × (salário ÷ divisor) × 1,5 × (1 + encargos)`; sem salário, nulo (nunca parcial). Mesmas variáveis de `resultado.ts` hoje.
**Why**: pedido (3) e spec 052: o número de hoje não muda para quem já usava a Simulação.

### D6 — Campos novos, sem mudar o que já existe
**Decision**: `LinhaFuncao` ganha `horaExtraH`, `horaExtraCustoMensal`, `faltaAposHoraExtraH`; `gapH`/`faltaH`/`falta` continuam como a falta bruta. Cenários e linhas ganham `horaExtra: { funcao, horasSemana, custoMensal? }[]`.
**Why**: quem já lê esses campos (diagnóstico, regras do farmacêutico) não quebra; as telas novas leem os campos novos.

### D7 — Status e rótulo sem novo status técnico
**Decision**: o `status` do cenário continua o mesmo (`viavel`, ...); a linha ganha `semContratar` (verdadeiro quando há hora extra e nenhuma contratação), e a tela mostra "Cobre sem contratar" nesse caso.
**Why**: evita mexer nos mapas de status e de cor da tela; o rótulo novo é só texto.

### D8 — Alerta "hora extra demais"
**Decision**: dois alertas por função, nos cenários e na Simulação: (a) hora extra mensal da função **maior** que o custo mensal da contratação integral que a cobriria ("contratar sairia mais barato", com os dois valores só para o dono); (b) falta acima do teto ("a hora extra não basta, o resto vira contratação").
**Why**: é o pedido (5) e só usa números que o cálculo já tem.

### D9 — Parecer
**Decision**: `frasesDeContratacao` ganha a hora extra: "Sem contratar ninguém, cobrindo com N h de hora extra por semana," / "…com N h de hora extra e contratando …". Custo só para quem vê valores.

### D10 — Telas sem R$ para gestor/consulta
**Decision**: as horas de hora extra aparecem para todos; custo e peso só quando o servidor mandar (já é o padrão `e.dono`).
**Why**: spec 052; a checagem fica no servidor.

## Resultado da implementação (19/11/2026)

- **Gravadas (T001):** uma simulação gravada é **recalculada na leitura** (`resultadoDe`), a partir das premissas congeladas. Para os números dela não mudarem, a regra nova da Simulação (teto e falta real por hora) só vale em **rascunho com turnos** (`horaExtraComTeto` + `coberturaReal`); a gravada mantém a conta de antes (sem teto). Os Cenários e a Simulação aberta por Personalizar usam a regra nova.
- **Onde a decisão entrou:** `semanaComFolgas` (falta real por hora, com folgas, e as vagas sugeridas) e, sem cobertura real, `verificarRegra` (por horas); ambos opt-in (`horaExtra`). O diagnóstico bruto e a sugestão de vagas sem horários seguem como antes.
- **Duas medidas de falta convergem:** o cartão usa a falta real de `semanaComFolgas`; a Simulação, a falta real dos turnos (`falta-real.ts`, a mesma conta de cobertura). Por isso o cartão e o Personalizar coincidem (teste de integração e conferência em Cosmópolis: 3 h, 1 vaga, R$ 8.029,07, peso 9,0%).
- **Efeito no produto:** uma falta pequena que o "esticar turnos" (spec 046) já não fecha deixa de virar contratação; uma contratação integral que já cobre tudo não paga hora extra (a hora extra só entra no que a contratação não alcança).
- **Testes antigos de contratação:** os de `cenarios`, `cenarios-extras` e `comparativo` passam `horaExtra: false` (opção nova de `EntradaCenarios`) para continuarem provando a conta de contratação; os novos (`hora-extra-cenarios.test.ts`) ligam a hora extra. No teste de integração das rotas, os números de uma loja com 1 farmacêutico passaram de R$ 12.976 para R$ 13.949,20 (a contratação mais 2 h de hora extra).
- **Fora desta entrega:** o Cenário 2 (horários sem contratar) não usa hora extra; reflexos (DSR, férias, 13º) continuam fora, como decidido.
