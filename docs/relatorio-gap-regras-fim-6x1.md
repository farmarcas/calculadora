# Relatório de gap — Regras da Calculadora Fim da Escala 6x1

**Data:** 29/10/2026 (versão 2, para o documento de regras atualizado com DM-12/13, DIAG e cenários 1 a 3 detalhados) · **Base comparada:** branch `chore/remover-gerenciar` (inclui as specs 001 a 008) · **Documento de regras:** `regras_calculadora_fim_6x1.md`
**Nada foi implementado.** Legenda: ✅ implementado · 🟡 parcial · ❌ ausente · ⚠️ divergente.
Caminhos relativos a `backend/node/src/modules/` (back) e `frontend/react/src/` (front).

## Leitura rápida

- **O que já existe e bate com o documento:** as três fases com parâmetros editáveis e vigência, 8 h por dia, 5 dias, divisor 220/210/200, farmacêutico em todo o horário, mínimo por turno, intervalo de 11 h, o Diagnóstico por turno, os pontos de atenção, o aviso de estimativa e os cenários 1 a 3 (mais "Estender horário" e "Reduzir equipe", que o documento não pede).
- **O que mudou desde a versão 1 do relatório:** os parâmetros legais passaram a ter tabela com vigência, o mínimo passou a ser por turno, o aviso de estimativa entrou e a aba de ponto foi retirada. O documento também trocou a seção de cenários (agora detalhada) e passou a dizer que **hora extra não é cenário**, então o item antigo CEN-02 deixou de valer.
- **A maior diferença continua sendo o desenho dos dados:** o documento prevê um quadro agregado por cargo; o sistema usa funcionários individuais e salário médio por função, como combinado.
- **Maiores lacunas:** custo completo (encargos por regime, provisões, adicionais, comissão, benefícios), fator de férias e absenteísmo, hora noturna e adicional noturno, regra do domingo, pessoas fora da CLT (sócio, estagiário, aprendiz), convenções coletivas, e nos cenários as horas protegidas, a recaptura, a enumeração de combinações do Cenário 3 e a tabela comparativa.

## Contagem

| Status | Itens |
|---|---|
| ✅ Implementado | 44 |
| 🟡 Parcial | 48 |
| ⚠️ Divergente | 13 |
| ❌ Ausente | 66 |

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
| DM-12 venda_por_hora | 🟡 | Base comercial por data e hora (`VendaHora`), usada como média por dia da semana e hora (`escala/vendas.ts`); sem a base, estimativa pelo faturamento do cadastro dividido igualmente entre as horas abertas (`escala/vendas-cadastro.ts`). Não limita às últimas 12 semanas; só avisa quando há menos de 14 dias |
| DM-13 margem_bruta_pct | 🟡 | `Loja.faturamento.margemPct` (só dono) e a coluna de margem da base comercial. Falta o padrão por faixa de faturamento quando o lojista não informa |
| DM-20 cargo (enum) | ⚠️ | Existem 5 funções (Farmacêutico, Atendimento, Caixa, Apoio, Perfumaria) mais cargo em texto livre. Faltam RT × substituto, gerente, estoquista, entregador, limpeza, dermoconsultora |
| DM-21 quantidade | 🟡 | Contagem derivada de funcionários individuais, não informada por grupo |
| DM-22 salario_base | ⚠️ | Só salário médio por função (`Loja.custos`, só dono), por decisão de proteção de dados |
| DM-23 jornada contratual | ✅ | `Funcionario.cargaSemanalH` e `cargaMensalH` |
| DM-24 escala_atual | 🟡 | `TurnoAtual.tipoEscala` é texto vindo da planilha; não há enum 6x1/5x2/12x36 usado no cálculo |
| DM-25 turno (manhã/tarde/noite) | ❌ | Derivável de entrada e saída, mas não existe |
| DM-26 média de horas extras | ❌ | A apuração do ponto foi retirada; nada alimenta o custo |
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
| DM-50 faixas por dia | 🟡 | Turnos da loja (até 6, nome, início e fim), iguais em todos os dias e recortados pelo horário de cada dia (spec 008, `regras/turnos.ts`). Não há faixas diferentes por dia da semana |
| DM-51 posições mínimas por faixa | ✅ | Mínimo por cargo em cada turno (`Loja.turnos`), usado pelo motor por hora (`regras/requisitos.ts`) |
| DM-52 origem da cobertura | ❌ | — |
| DM-53 padrão por faturamento | ❌ | O padrão é fixo (1 farmacêutico, 1 atendimento, 1 caixa) em `regras/perfis.ts` |
| DM-54 farmacêutico ≥ 1 sempre | ✅ | Validado na configuração da loja (`escala/escala.schemas.ts`, Lei 13.021) |
| DM-60 parâmetros legais com vigência | 🟡 | Tabela `parametros_legais` com versões e data de início: jornada, horas por dia (e com convenção), dias e divisor (`regras/parametros.ts`, tela "Parâmetros legais"). Faltam limite e adicional de hora extra, adicional noturno e hora noturna |
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
| R-GER-J05 hora extra ≤ 2h/dia | ❌ | Sem planejamento com hora extra; a apuração do ponto, que alertava hora extra real, foi retirada do sistema |
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
| CALC-03 turnos por dia e posição | 🟡 | Agora por turno: soma por camada de `⌈horas ÷ 8⌉` (`regras/capacidade.ts`); blocos fixos de 8 h, sem o ajuste de intervalo |
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

## 6. Diagnóstico e cenários (documento atualizado)

### 6.1 Diagnóstico

| ID | Status | Onde está / o que falta |
|---|---|---|
| DIAG-01 seletor F1/F2 com data | ✅ | Seletor 42h/40h no quadro central; datas vindas da tabela de parâmetros (F1 em 16/12/2026) (`QuadroCentral.jsx`) |
| DIAG-02 unidade principal = turno | 🟡 | O quadro central e os títulos falam em turnos em falta; os cenários 2, 3 e 4 falam em horas (reduzir, estender) |
| DIAG-03 déficit atual × causado pela nova regra | 🟡 | O texto diz "hoje, na regra atual, já faltam ..." e mostra a regra escolhida, mas não há dois números separados (déficit já existente e acréscimo da nova regra) |
| DIAG-04 encargos pelo regime tributário | ❌ | O regime é informativo; os encargos são um percentual digitado pelo dono |
| DIAG-05 pontos de atenção | ✅ | Faixas sem farmacêutico, abaixo do mínimo, maior venda sem cobertura, fora do cálculo e linhas rejeitadas (`escala/diagnostico.ts`, `pontosAtencao`) |
| DIAG-06 diagnóstico é a base dos cenários | ✅ | Os cenários usam a mesma capacidade (`verificarRegra`), os mesmos requisitos por turno e a mesma venda do Diagnóstico |

### 6.2 Base comum aos cenários

| ID | Status | Onde está / o que falta |
|---|---|---|
| CEN-B01 todos para F1 e F2 contra F0 | ✅ | Cada cenário é calculado para 42h e 40h e o custo adicional é contra a folha atual (`escala/cenarios.ts`, `diagnostico.ts`) |
| CEN-B02 capacidade com fator de cobertura | 🟡 | Capacidade = turnos e horas por pessoa na regra; sem o fator de férias e absenteísmo |
| CEN-B03 degrau de turno | 🟡 | O teste de cobertura conta turnos (`⌈horas ÷ 8⌉`), então um corte só vale quando a equipe passa a caber, mas o corte é hora a hora, sem agrupar até o degrau e sem a sobreposição de intervalo |
| CEN-B04 valor da faixa = venda × margem × (1 − recaptura) | 🟡 | A margem perdida usa venda × margem; sem recaptura. O Cenário 2 ordena os cortes pela menor venda, não pelo valor |
| CEN-B05 recaptura | ❌ | — |
| CEN-B06 custo da contratação com piso, encargos do regime, provisões e benefícios | ⚠️ | Salário médio da função × (1 + encargos %); sem piso de convenção, regime, provisões nem benefícios |
| CEN-B07 restrições (farmacêutico, domingo, intervalos, jornada) | 🟡 | Farmacêutico e limites da fase valem; regra de domingo e cobertura de intervalos não entram nos cenários |
| CEN-B08 horas protegidas | ❌ | Os cortes não protegem as horas de maior venda nem marcam "não recomendado" |
| CEN-B09 hora extra não é cenário | ✅ | Não existe cenário de hora extra (a versão anterior do documento pedia um; agora não) |
| CEN-10 nenhum cenário sem farmacêutico | ✅ | Só se corta nas pontas e a cobertura é revalidada com farmacêutico obrigatório |

### 6.3 Cenário 1 — Manter horário e contratar

| ID | Status | Onde está / o que falta |
|---|---|---|
| CEN1-01 horário mantido | ✅ | `montarManter` em `escala/cenarios.ts` |
| CEN1-02 turnos faltantes | ✅ | `saldoT` e `faltaH` por função (`regras/capacidade.ts`) |
| CEN1-03 integrais = piso(faltantes ÷ dias) e resto | ⚠️ | Conta por horas e turnos: `contratar = ⌈falta ÷ jornada cheia⌉` |
| CEN1-04 resto ≤ 3 turnos vira parcial | ⚠️ | Parcial (16, 24, 32 h) só quando basta uma vaga; não há o limite de 3 turnos como parâmetro |
| CEN1-05 ordem G1 → G2 → G3 | ✅ | Funções independentes; o farmacêutico é obrigatório |
| CEN1-06 etapas F1 e adicional para F2 | 🟡 | As duas fases aparecem no seletor; não há a visão "o que contratar já" e "o adicional depois" |
| CEN1-07 validar a escala resultante | 🟡 | Valida cobertura de horas e turnos; sem regra de domingo e sem intervalos |
| Saída: custo mensal, anual, % do faturamento | 🟡 | Mensal e % sobre a folha atual; falta o anual e o % sobre o faturamento (que já está no cadastro) |

### 6.4 Cenário 2 — Manter equipe e reduzir horário

| ID | Status | Onde está / o que falta |
|---|---|---|
| CEN2-01 equipe atual | ✅ | `montarEconomia` |
| CEN2-02 restrição dos farmacêuticos | ✅ | A cobertura do farmacêutico é verificada a cada corte |
| CEN2-03 candidatos: ponta e dia inteiro | 🟡 | Só pontas (1 hora por vez); dia inteiro não é candidato próprio |
| CEN2-04 só cortes que reduzem turno | 🟡 | Corta a ponta de menor venda até a equipe caber, sem agrupar por degrau |
| CEN2-05 guloso por custo do corte ÷ turnos economizados | ⚠️ | Ordena pela menor venda da ponta; empate: fim do dia primeiro |
| CEN2-06 não cortar horas protegidas | ❌ | — |
| CEN2-07 horas mínimas por dia aberto | ❌ | — |
| CEN2-08 F1 e F2 separados | ✅ | Calculado em cada regra |
| Saída: horário, horas cortadas, venda e margem em risco, economia vs Cenário 1 | 🟡 | Tudo menos o % do faturamento e a economia expressa contra o Cenário 1 (hoje há o impacto total de cada cenário) |

### 6.5 Cenário 3 — Equilíbrio

| ID | Status | Onde está / o que falta |
|---|---|---|
| CEN3-01 enumerar combinações de contratações | ⚠️ | Heurística: fecha as pontas cuja margem mensal é menor que o custo de cobri-las e contrata o resto; não enumera combinações (`montarEquilibrio`) |
| CEN3-02 rodar o Cenário 2 com a nova capacidade | ⚠️ | Idem: não há laço sobre combinações |
| CEN3-03 extensão quando sobra capacidade | 🟡 | Existe como Cenário 4 (Estender horário), separado do Cenário 3 |
| CEN3-04 venda da hora nova com fator 0,5 | ✅ | 50% da hora vizinha na primeira hora nova e 25% na segunda; avisado como referência (`cenarios-extras.ts`) |
| CEN3-05 maior resultado respeitando B07 e B08 | 🟡 | O selo "Menor impacto financeiro" escolhe entre os cenários 1 a 3 (custo + margem perdida); B07 parcial e B08 ausente |
| CEN3-06 desempate: menos contratações | ✅ | `destacar` (empate: menos contratações) |
| CEN3-07 avisar quando coincide com 1 ou 2 | 🟡 | `coincideComManter` existe; não há aviso equivalente para o Cenário 2 |
| CEN3-08 frase-resumo | 🟡 | Cada cenário tem um texto de direcionamento; não há a frase única que combina contratação, corte e extensão |

### 6.6 Comparativo

| ID | Status | Onde está / o que falta |
|---|---|---|
| CEN-C01 tabela lado a lado | ❌ | Os cenários são cartões empilhados, com o destaque no topo |
| CEN-C02 linhas fixas (contratações, horas, folha, margem, resultado, % faturamento, status) | 🟡 | Os cartões trazem contratações, horas, custo, margem e impacto; faltam o % do faturamento e o status viável / não recomendado / inviável |
| CEN-C03 destacar o de maior resultado | ✅ | Selo "Menor impacto financeiro" (só dono), sem esconder os outros |
| CEN-C04 premissas editáveis | ❌ | A margem é editável no cadastro; recaptura, fator de extensão e horas protegidas não existem como parâmetros |

## 7. Saídas

| ID | Status | Onde está / o que falta |
|---|---|---|
| OUT-01 headcount atual × necessário nas 3 fases | ✅ | Quadro central do Diagnóstico (`features/diagnostico/QuadroCentral.jsx`) |
| OUT-02 folha mensal e anual por fase e delta | 🟡 | Custo e delta no Cenário 1 e comparação de custo (spec 002); sem tabela única das três fases |
| OUT-03 impacto em % do faturamento | ❌ | — |
| OUT-04 comparativo de cenários | 🟡 | Existe com cinco cenários; sem hora extra |
| OUT-05 explicação de cada número | ✅ | Campos `memoria` no cálculo de capacidade e custo |
| OUT-06 alertas | 🟡 | Lacuna de farmacêutico existe; faltam hora extra acima do limite, 12x36 em F2, gerente de confiança, domingo |
| OUT-07 aviso "valide com contador e sindicato" | ✅ | `avisoEstimativa` no Diagnóstico e banner na tela (`escala/diagnostico.ts`, `features/diagnostico/Diagnostico.jsx`) |

## 1. Princípios

| ID | Status | Onde está / o que falta |
|---|---|---|
| P-01 parâmetros com vigência | 🟡 | Jornada, horas, dias e divisor vêm da tabela com vigência; encargos, provisões, adicionais e pisos ainda não existem |
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

## Itens ausentes por prioridade

**P0 (essenciais para o resultado ficar correto):**
1. **DM-61 / DM-62 / CALC-20 a CALC-22 / CEN-B06 / DIAG-04:** custo completo e encargos pelo regime tributário (hoje um percentual digitado).
2. **DM-64 / CALC-13 / CEN-B02:** fator de cobertura de férias e absenteísmo.
3. **CALC-24 / OUT-03 / CEN-C02:** impacto em % do faturamento (o faturamento já está no cadastro) e custo anual nos cenários.
4. **CEN-B08 / CEN2-06:** horas protegidas (as 3 de maior venda) e o status "não recomendado".
5. **CEN-B03 / CEN2-04 / CEN2-05:** corte por degrau de turno, com ordenação por custo do corte ÷ turnos economizados.
6. **CEN-B04:** valor da faixa pela margem, com recaptura (ver CEN-B05).
7. **CEN3-01 / CEN3-02 / CEN3-05:** Cenário 3 por enumeração de combinações de contratações, escolhendo o maior resultado.
8. **CEN-B07 / CEN1-07 / CALC-04 / R-FARM-04:** regra do domingo e cobertura de intervalos dentro dos cenários.
9. **CEN-C01 / CEN-C02:** tabela comparativa lado a lado, com o status viável, não recomendado ou inviável.
10. **R-GER-J08 / R-GER-J07 (15 min):** adicional noturno, hora reduzida e intervalo de 15 min.
11. **DM-40 a DM-43 / R-SOC / R-ESTAG-02 / R-APR-02 e 03 / CALC-15:** pessoas fora da CLT.
12. **DM-13 padrão por faixa de faturamento** e **DM-12 limitada às últimas 12 semanas**.

**P1:**
DM-07 a DM-11, DM-27 a DM-30, DM-52, DM-53, DM-63, DM-65; R-GER-J09 a J11; R-FARM-05 a 07; R-BAL-01 e 04; R-GER-01 a 03; R-ENT-01 a 03; R-EST-01; R-LIMP-01; R-DERMO-01 e 02; R-APR-01 e 04; R-ESTAG-01 e 03; CEN-B05; CEN1-03, 04 e 06; CEN2-03, 07; CEN3-03, 07 e 08; CEN-C03 e C04; DIAG-02 e 03; OUT-05 e 06 completos; VAL-02 a VAL-05.

**P2:**
DM-29; R-CX-02; R-EST-02; R-LIMP-02; R-APR-05.

## Decisões já tomadas (versão 1) e o que ainda precisa da sua resposta

**Já decididas:** manter funcionários individuais com mínimo por turno calculado da lista; manter salário médio por função; parâmetros legais editáveis com vigência; turnos definidos por cada loja.

**Para decidir antes de implementar as lacunas acima:**
1. **Cenário 3 por enumeração (CEN3-01):** o documento pede testar todas as combinações de contratações por função. Hoje o Cenário 3 é uma regra simples (fecha o que não se paga e contrata o resto). Trocar pela enumeração muda os números que o dono vê. Posso substituir, ou prefere manter o atual e acrescentar a enumeração como cenário novo?
2. **Cenário 1 (CEN1-03 e CEN1-04):** o documento conta contratações por turnos (inteiras = faltantes ÷ dias, resto até 3 turnos vira parcial). Hoje a conta é por horas e a vaga parcial só aparece quando basta uma pessoa. Adotamos a regra do documento?
3. **Cenário "Reduzir equipe" e "Estender horário":** o documento não os prevê. Mantemos como extras fora da comparação, como estão?
4. **Custo e encargos:** para o custo completo, a fonte dos percentuais por regime (INSS patronal, RAT, terceiros) e das provisões é a tabela de parâmetros editável. Quem fornece os valores iniciais?
