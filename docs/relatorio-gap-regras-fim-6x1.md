# Relatório de gap — Regras da Calculadora Fim da Escala 6x1

**Data:** 28/10/2026 · **Base comparada:** branch `feat/cadastro-loja-completo` (inclui as specs 001 a 007) · **Documento de regras:** `regras_calculadora_fim_6x1.md`
**Nada foi implementado.** Legenda: ✅ implementado · 🟡 parcial · ❌ ausente · ⚠️ divergente.
Caminhos relativos a `backend/node/src/modules/` (back) e `frontend/react/src/` (front).

## Leitura rápida

- **O núcleo legal já existe:** as três fases (44h / 42h / 40h), 8h por dia, 5 dias, divisor 220/210/200, cobertura do farmacêutico em todo o horário, intervalo de 11h entre jornadas e a conta de quantas pessoas contratar por cargo.
- **A maior diferença é o desenho dos dados.** O documento prevê o lojista informando um **quadro agregado por cargo** (quantidade, salário, jornada, escala). O sistema trabalha com **funcionários individuais** vindos da planilha de escala e do cadastro, e com **salário médio por função** (nunca individual, por proteção de dados).
- **Maiores lacunas:** tabela de parâmetros com vigência (hoje as regras estão fixas no código), fator de cobertura de férias e absenteísmo, custo completo (encargos por regime, provisões, adicionais, comissão), cenário de hora extra, adicional noturno, regra do domingo, cargos fora da CLT (sócio, estagiário, aprendiz), convenções coletivas e o aviso "valide com contador e sindicato".

## Contagem

| Status | Itens |
|---|---|
| ✅ Implementado | 29 |
| 🟡 Parcial | 28 |
| ⚠️ Divergente | 12 |
| ❌ Ausente | 61 |

(Contagem feita sobre as linhas das tabelas abaixo.)

## 2. Modelo de dados

| ID | Status | Onde está / o que falta |
|---|---|---|
| DM-01 loja_id | ✅ | `Loja.id` e `Loja.codigo` (`prisma/schema.prisma`) |
| DM-02 cidade, uf | 🟡 | Existem (spec 007), mas opcionais; o documento os quer obrigatórios |
| DM-03 regime_tributario | 🟡 | `Loja.regimeTributario` (simples/presumido/real), opcional e **só informativo**: nenhum cálculo o usa |
| DM-04 faturamento_mensal (12 meses) | ⚠️ | Hoje: faturamento médio por dia da semana + um mensal + margem % (`Loja.faturamento`, só dono). Não há lista de meses |
| DM-05 horário por dia | ✅ | `Loja.horarios` versão 2, sete dias com aberta/24h (`cadastros/horarios.ts`) |
| DM-06 opera_24h | ✅ | Derivado do horário (dia 24h) e atalho "Loja 24 horas" |
| DM-07 abre_feriados | ❌ | Feriados e horários especiais por data não existem (README, Pendências) |
| DM-08 serviços farmacêuticos | ❌ | — |
| DM-09 delivery próprio | ❌ | — |
| DM-10 convenção comerciários | ❌ | — |
| DM-11 convenção farmacêuticos | ❌ | — |
| DM-20 cargo (enum) | ⚠️ | Existem 5 funções (Farmacêutico, Atendimento, Caixa, Apoio, Perfumaria) mais cargo em texto livre. Faltam RT × substituto, gerente, estoquista, entregador, limpeza, dermoconsultora |
| DM-21 quantidade | 🟡 | Contagem derivada de funcionários individuais, não informada por grupo |
| DM-22 salario_base | ⚠️ | Só salário médio por função (`Loja.custos`, só dono), por decisão de proteção de dados |
| DM-23 jornada contratual | ✅ | `Funcionario.cargaSemanalH` e `cargaMensalH` |
| DM-24 escala_atual | 🟡 | `TurnoAtual.tipoEscala` é texto vindo da planilha; não há enum 6x1/5x2/12x36 usado no cálculo |
| DM-25 turno (manhã/tarde/noite) | ❌ | Derivável de entrada e saída, mas não existe |
| DM-26 média de horas extras | ❌ | A apuração do ponto mede hora extra real, mas não alimenta o custo |
| DM-27 adicionais fixos | ❌ | — |
| DM-28 comissão média | ❌ | — |
| DM-29 benefícios | ❌ | Só um percentual único de encargos |
| DM-30 gerente cargo de confiança | ❌ | — |
| DM-31 caixa_dedicado | 🟡 | O mínimo de Caixa é configurável por loja (`Loja.minimos`), mas o padrão é 1, não "só se dedicado" |
| DM-32 dermoconsultora paga pela indústria | 🟡 | Dá para marcar a pessoa "fora do cálculo" (`funcaoEscala` nula); não há o campo |
| DM-40 tipo não CLT | ❌ | Só existe `regime` em texto livre |
| DM-41 função coberta | ❌ | — |
| DM-42 sócio é farmacêutico | ❌ | — |
| DM-43 horas e dias do não CLT | ❌ | — |
| DM-50 faixas por dia | ⚠️ | O mínimo vale para todo o horário aberto; não há faixas |
| DM-51 posições mínimas por faixa | ⚠️ | `Loja.minimos` é um número por função, igual em todas as horas |
| DM-52 origem da cobertura | ❌ | — |
| DM-53 padrão por faturamento | ❌ | O padrão é fixo (1 farmacêutico, 1 atendimento, 1 caixa) em `regras/perfis.ts` |
| DM-54 farmacêutico ≥ 1 sempre | ✅ | Validado na configuração da loja (`escala/escala.schemas.ts`, Lei 13.021) |
| DM-60 parâmetros legais com vigência | ⚠️ | Fixos no código (`regras/perfis.ts`, `regraPara`), vigência só como texto; sem tabela editável |
| DM-61 encargos por regime | ❌ | Um único `encargosPct` digitado pelo dono (`custos/custos.schemas.ts`) |
| DM-62 provisões | ❌ | Não separadas; dependem do percentual digitado |
| DM-63 convenções | ❌ | — |
| DM-64 fator de cobertura (férias, absenteísmo) | ❌ | O motor não aplica nenhuma folga para férias nem faltas |
| DM-65 padrão de cobertura por faturamento | ❌ | — |

## 3. Regras gerais

| ID | Status | Onde está / o que falta |
|---|---|---|
| R-GER-J01 jornada por fase | ✅ | `regras/perfis.ts` (44 / 42 / 40) |
| R-GER-J02 8h por dia | ✅ | `maxDia = 8` (8h24 só com a opção de convenção na 42h) |
| R-GER-J03 5 dias na F1 e F2 | ✅ | `dias = 5` |
| R-GER-J04 jornada efetiva | ✅ | `tetoEfetivo = min(teto, dias × maxDia)`; sem convenção de 8h24, a 42h vira 40h na prática (alinhado ao VAL-01) |
| R-GER-J05 hora extra ≤ 2h/dia | ❌ | Não há planejamento com hora extra; a apuração só alerta hora extra real por percentual (`apuracao/alertas.ts`) |
| R-GER-J06 interjornada 11h | ✅ | `simulacoes/avaliar.ts` ('interjornada') |
| R-GER-J07 intrajornada | 🟡 | 1h acima de 6h e intervalo fora do turno são validados; faltam os 15 min para jornada de 4h a 6h |
| R-GER-J08 adicional noturno e hora reduzida | ❌ | Loja 24h é aceita, mas sem 20% nem hora de 52min30s |
| R-GER-J09 domingo 1 a cada 3 semanas | ❌ | — |
| R-GER-J10 adicional de domingo e feriado | ❌ | — |
| R-GER-J11 jornada parcial 30h / 26h | 🟡 | Vagas parciais de 16/24/32h existem como opção de contratação; sem as regras do art. 58-A |
| R-GER-J12 sem redução salarial, divisor | ✅ | `DIVISOR` 220/210/200 (`custos/custo.ts`) |
| R-GER-J13 quem já cumpre não gera impacto | 🟡 | Quem já está no quadro mantém o salário médio e não gera delta; não há teste explícito de "já está em 5x2 e ≤ jornada" |

## 4. Regras por cargo

| ID | Status | Onde está / o que falta |
|---|---|---|
| R-CARGO-00 ordem G1 → G2 → G3 | ⚠️ | Cada função é verificada em paralelo (`regras/capacidade.ts`); como uma não cobre a outra, o resultado é equivalente, mas não há grupos G1 a G4 |
| R-FARM-01 farmacêutico em todo o horário | ✅ | Cobertura por hora e aviso "a lei exige" (`escala/diagnostico.ts`) |
| R-FARM-02 RT e substituto iguais | ✅ | Uma só função "Farmacêutico", sem distinção cadastral de RT/CRF |
| R-FARM-03 só farmacêutico cobre | ✅ | A cobertura é por função: ninguém mais conta como farmacêutico |
| R-FARM-04 intervalo exige sobreposição | 🟡 | Aviso 'intervalo-descoberto' na simulação; o cálculo de pessoas do Diagnóstico não soma essa cobertura |
| R-FARM-05 2 farmacêuticos em pico | ⚠️ | Dá para pedir mínimo 2, mas vale o dia todo, não só no pico |
| R-FARM-06 piso da convenção dos farmacêuticos | ❌ | — |
| R-FARM-07 12x36 em loja 24h | ❌ | Turno de 12h é recusado (acima de 8h); não existe modo 12x36 nem o alerta de F2 |
| R-FARM-08 sócio farmacêutico abate | ❌ | — |
| R-BAL-01 convenção dos comerciários | ❌ | — |
| R-BAL-02 não cobre farmacêutico | ✅ | Por função |
| R-BAL-03 elegível a jornada parcial | 🟡 | Vagas parciais existem para qualquer função, sem regra específica |
| R-BAL-04 comissão na base | ❌ | — |
| R-CX-01 caixa não dedicado não soma | ⚠️ | Padrão soma 1 caixa; é preciso zerar o mínimo à mão |
| R-CX-02 quebra de caixa | ❌ | — |
| R-GER-01 gerente impactado | ❌ | Não existe a função gerente |
| R-GER-02 cargo de confiança | ❌ | — |
| R-GER-03 gerente farmacêutico em G1 | ❌ | — |
| R-ENT-01 entregador fora da escala | 🟡 | Função "Apoio" tem mínimo 0 por padrão; não há "entregador" nem `delivery_proprio` |
| R-ENT-02 periculosidade 30% | ❌ | — |
| R-ENT-03 janela de entrega | ❌ | — |
| R-EST-01 estoquista com janela própria | ❌ | — |
| R-EST-02 alocar em horário de menor fluxo | ❌ | — |
| R-LIMP-01 limpeza terceirizada fora | 🟡 | Pode-se deixar a pessoa fora do cálculo; sem campo próprio |
| R-LIMP-02 limpeza CLT em G3 parcial | ❌ | — |
| R-DERMO-01 paga pela indústria fora | 🟡 | Mesmo atalho de "fora do cálculo" |
| R-DERMO-02 paga pela loja em G2 | 🟡 | Função "Perfumaria" existe (mínimo 0 por padrão) |
| R-APR-01 aprendiz 6h/dia | ❌ | — |
| R-APR-02 aprendiz sem hora extra | ❌ | — |
| R-APR-03 menor sem noturno | ❌ | — |
| R-APR-04 aprendiz não conta como posição | ❌ | Só por estar "fora do cálculo" |
| R-APR-05 ME/EPP sem cota | ❌ | — |
| R-ESTAG-01 estagiário 6h/dia e 30h | ❌ | — |
| R-ESTAG-02 estagiário não substitui farmacêutico | 🟡 | Vale por estar fora do cálculo, sem regra explícita |
| R-ESTAG-03 fora do impacto | 🟡 | Idem |
| R-SOC-01 sócio abate a função | ❌ | — |
| R-SOC-02 só abate G1 se farmacêutico | ❌ | — |
| R-SOC-03 sócio sem custo de folha | 🟡 | Sócio fora do cálculo não custa; sem tipo "sócio" |

## 5. Algoritmo

| ID | Status | Onde está / o que falta |
|---|---|---|
| CALC-01 horas abertas por dia | ✅ | `escala/diagnostico.ts` (`diasAbertos`) |
| CALC-02 duração do turno | 🟡 | `duracaoTurno` = `min(maxDia, teto ÷ dias)`; sem hora noturna reduzida |
| CALC-03 turnos por dia e posição | ⚠️ | Turnos contados em blocos de 8h × mínimo por função; mínimo fixo no dia, sem faixas |
| CALC-04 cobertura de intervalos do G1 | ❌ | Só aviso na simulação |
| CALC-05 turnos semanais | ✅ | `necessidadeT` em `regras/capacidade.ts` |
| CALC-10 pessoas por dias | ✅ | Capacidade de turnos limitada aos dias da regra (6 na F0, 5 na F1/F2) |
| CALC-11 pessoas por horas | ✅ | `necessidadeH` × capacidade em horas |
| CALC-12 N_base = máximo dos dois | ✅ | `faltaH` usa o maior entre horas e turnos |
| CALC-13 fator de cobertura | ❌ | Não aplicado (ver DM-64) |
| CALC-14 regra de domingo | ❌ | — |
| CALC-15 abater G4 | ❌ | — |
| CALC-16 gap por cargo e fase | ✅ | `contratar` por função em atual, 42h e 40h |
| CALC-20 custo por pessoa | ⚠️ | `salário médio × (1 + encargos %)`; sem adicionais, comissão, provisões separadas nem benefícios (`custos/custo.ts`) |
| CALC-21 encargos por regime | ❌ | O regime é informativo; o percentual é digitado |
| CALC-22 hora normal e hora extra | 🟡 | Valor-hora pelo divisor da fase (usado nas vagas); sem custo de hora extra e reflexos |
| CALC-23 delta de folha | ✅ | Cenário 1 mostra o custo adicional mensal e o custo anual existe em `calcularCusto` |
| CALC-24 impacto sobre o faturamento | ❌ | Há % sobre a folha atual (Cenário 5); falta sobre o faturamento (que agora está no cadastro) |

## 6. Cenários

| ID | Status | Onde está / o que falta |
|---|---|---|
| CEN-01 contratar | ✅ | Cenário 1 "Manter horários" (`escala/cenarios.ts`) |
| CEN-02 hora extra | ❌ | — |
| CEN-03 jornada parcial | 🟡 | Contratos parciais só como arredondamento quando falta uma vaga |
| CEN-04 ajustar horário | 🟡 | O sistema sugere cortes e extensões (Cenários 2, 3 e 4); o lojista não simula um horário novo à mão |
| CEN-05 misto de menor custo | 🟡 | Cenário 3 "Equilíbrio" e o selo "Menor impacto financeiro"; sem combinação com hora extra e parcial |
| CEN-10 nenhum cenário sem farmacêutico | ✅ | Cortes só nas pontas e verificação com farmacêutico obrigatório |

## 7. Saídas

| ID | Status | Onde está / o que falta |
|---|---|---|
| OUT-01 headcount atual × necessário nas 3 fases | ✅ | Quadro central do Diagnóstico (`features/diagnostico/QuadroCentral.jsx`) |
| OUT-02 folha mensal e anual por fase e delta | 🟡 | Custo e delta no Cenário 1 e comparação de custo (spec 002); sem tabela única das três fases |
| OUT-03 impacto em % do faturamento | ❌ | — |
| OUT-04 comparativo de cenários | 🟡 | Existe com cinco cenários; sem hora extra |
| OUT-05 explicação de cada número | ✅ | Campos `memoria` no cálculo de capacidade e custo |
| OUT-06 alertas | 🟡 | Lacuna de farmacêutico existe; faltam hora extra acima do limite, 12x36 em F2, gerente de confiança, domingo |
| OUT-07 aviso "valide com contador e sindicato" | ❌ | Só o README cita falta de validação jurídica; a tela não mostra o aviso |

## 1. Princípios

| ID | Status | Onde está / o que falta |
|---|---|---|
| P-01 parâmetros com vigência | ⚠️ | Tudo fixo em `regras/perfis.ts` e `custos/custo.ts` |
| P-02 três fases com a mesma base | ✅ | Atual, 42h e 40h calculadas juntas |
| P-03 farmacêutico primeiro | ✅ | Obrigatório e validado; as demais funções não o substituem |
| P-04 saída rastreável | ✅ | `memoria` por função e por custo |
| P-05 opcionais ausentes não quebram | 🟡 | Custos ausentes → "informe"; venda ausente → cadastro; ainda falta marcar padrões usados em todos os campos |

## 8. Pontos a validar

| ID | Status | Onde está / o que falta |
|---|---|---|
| VAL-01 horas/dia e dias por fase parametrizados | 🟡 | Parametrizado no código; a opção de 8h24 é por loja |
| VAL-02 12x36 em F2 | ❌ | — |
| VAL-03 gerente de confiança | ❌ | — |
| VAL-04 adicionais de domingo e feriado | ❌ | — |
| VAL-05 regulamentação posterior | ❌ | Depende da tabela de parâmetros (P-01) |

## Divergências de texto a conferir

- A vigência da F1 no código é "15/12/2026" (`regras/perfis.ts`); o documento diz "a partir de 16/12/2026".

## Itens ausentes por prioridade

**P0 (essenciais para o resultado ficar correto):**
1. **P-01 / DM-60 / DM-61 / DM-62:** tabela de parâmetros com vigência (legal, encargos por regime, provisões).
2. **DM-64 / CALC-13:** fator de cobertura de férias e absenteísmo.
3. **CALC-20 a CALC-22:** custo completo (encargos por regime, provisões, adicionais, comissão, hora extra com reflexos).
4. **CALC-24 / OUT-03:** impacto sobre o faturamento (o dado já está no cadastro).
5. **CEN-02 / R-GER-J05:** cenário de hora extra, com limite de 2h por dia.
6. **R-GER-J08 / R-GER-J07 (15 min):** adicional noturno, hora reduzida e intervalo de 15 min.
7. **DM-40 a DM-43 / R-SOC / R-ESTAG-02 / R-APR-02 e 03 / CALC-15:** pessoas fora da CLT (sócio, estagiário, aprendiz) e como abatem a necessidade.
8. **CALC-04 / R-FARM-04:** cobertura do intervalo do farmacêutico dentro do cálculo de pessoas.
9. **OUT-07:** aviso de estimativa com validação por contador e sindicato.

**P1:**
DM-07 a DM-11, DM-26 a DM-30, DM-50 a DM-53, DM-63, DM-65; R-GER-J09 a J11; R-FARM-05 a 07; R-BAL-01 e 04; R-GER-01 a 03; R-ENT-01 a 03; R-EST-01; R-LIMP-01; R-DERMO-01 e 02; R-APR-01, 04; R-ESTAG-01 e 03; CEN-03 a CEN-05 completos; CALC-14; OUT-05 e OUT-06 completos; VAL-02 a VAL-05.

**P2:**
DM-29; R-CX-02; R-EST-02; R-LIMP-02; R-APR-05; CEN-05 (misto otimizado).

## Decisões que precisam da sua resposta antes de implementar

1. **Quadro agregado × funcionários individuais.** O documento pede um quadro por cargo informado pelo lojista; o sistema parte de funcionários individuais e planilhas. Manter o desenho atual e só acrescentar os cargos e campos que faltam, ou criar também uma entrada agregada para lojas sem planilha?
2. **Salário.** O sistema guarda só salário médio por função (decisão de proteção de dados). Aceita continuar assim, apenas com mais componentes de custo (adicionais, comissão, benefícios), ou o documento exige salário por grupo de cargo?
3. **Parâmetros legais.** Quem mantém a tabela com vigência (encargos, adicionais, convenções): fica no código com data, ou precisa de tela de edição?
4. **Faixas de cobertura.** Passar do mínimo único por função para mínimos por faixa horária muda bastante o motor; confirmar que é prioridade.
