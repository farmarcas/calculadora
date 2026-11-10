# Pesquisa: Resultado da simulação em horas e porcentagem

## Decisão 1: um bloco novo no resultado, igual para todos os perfis
- **Decision**: o resultado da simulação ganha o bloco `emHoras`, só com porcentagens, horas, pessoas e textos. Os campos em reais que já existem (`saldoMensal`, `folhaExtra`, `horaExtra` e outros) ficam como estão, só para o dono, porque a lista, a comparação e o passo de contratações ainda os usam.
- **Rationale**: o gestor e a consulta hoje não recebem venda nem custo, então não teriam as variações em %. O bloco novo é calculado com os números completos e só leva %, sem nenhum valor em reais.
- **Alternatives considered**: calcular as % na tela (precisaria dos reais lá); apagar os campos em reais do resultado (quebra a comparação e o passo de contratações).

## Decisão 2: venda em venda real, mesmo quando a régua é margem
- **Decision**: a variação da venda usa a venda real das horas que fecham e a venda real estimada das horas novas, sobre o faturamento mensal real. Hoje o cálculo guarda esses valores na régua (margem ou venda); o bloco novo calcula também a versão em venda real com a mesma conta.
- **Rationale**: é o mesmo critério das linhas de cenário (spec 037): "Venda" é % da venda, e a margem fica só dentro do cálculo do saldo.
- **Alternatives considered**: % da margem (não bate com o rótulo "Venda").

## Decisão 3: custo de pessoal = custo adicional ÷ folha de hoje
- **Decision**: custo adicional (folha das vagas mais a hora extra) dividido pela folha do quadro de hoje. Os custos vêm da loja para qualquer perfil, e só a porcentagem sai.
- **Rationale**: a conta já existe para o dono; só faltava dividir pela folha de hoje.
- **Alternatives considered**: usar o custo das vagas sem a hora extra (esconde parte do custo).

## Decisão 4: o que são "pessoas" e "horas contratadas"
- **Decision**: hoje = quadro do Cadastro que entra no cálculo (sem vagas); simulação = quadro com as vagas simuladas, sem os desligados. Horas contratadas = soma da carga semanal de cada pessoa. A hora extra em horas é a soma do que ainda falta cobrir depois das contratações, por função, que é exatamente o que já vira o custo da hora extra.
- **Rationale**: é o que a simulação já considera como equipe; nenhum cálculo novo de cobertura.
- **Alternatives considered**: contar só pessoas com turno (esconderia vagas sem turnos).

## Decisão 5: status e causa decididos no servidor, na ordem das linhas de cenário
- **Decision**: uma função pura escolhe o status (Inviável quando não há farmacêutico no quadro, Vende mais, Perde venda, Equipe menor que hoje quando ainda faltam horas depois das contratações, Cobre o horário) e uma causa só. Os status de cenário que só fazem sentido nos cenários sugeridos (Não resolve sozinho, Não recomendado) não aparecem na simulação.
- **Rationale**: os três perfis veem o mesmo status; a tela só desenha.
- **Alternatives considered**: decidir na tela (o gestor não tem os dados).

## Decisão 6: reaproveitar os componentes das linhas de cenário
- **Decision**: a faixa dos 7 dias, a pill de status, o texto das variações e o do total de horas vêm de `cartao/` (spec 037). A tela adapta o horário da simulação ao formato da faixa.
- **Rationale**: um só visual e uma só regra para o mesmo conceito.
- **Alternatives considered**: duplicar os componentes (diverge com o tempo).

## Decisão 7: depende da spec 037
- **Decision**: a branch nasce em cima de `feat/cenarios-em-linhas` e o PR dela entra primeiro.
- **Rationale**: usa arquivos novos dela.

## Pontos em aberto
Nenhum.
