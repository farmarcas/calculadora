# Pesquisa: Cobertura e vendas por hora dentro da Simulação

## Decisão 1: reaproveitar a conta de cobertura do Diagnóstico
- **Decision**: chamar `cobertura(dias, turnos, minimos)` de `escala/cobertura.ts` com os dados da simulação.
- **Rationale**: é uma função pura que já calcula, no pior dia de cada hora, as pessoas presentes por função, descontando intervalos. Reaproveitar garante o mesmo resultado nas duas telas (SC-002).
- **Alternatives considered**: usar `avaliarSimulacao().cobertura` (já existe, mas é por dia e traz só erros e avisos, sem o pior dia por hora que a grade precisa); reescrever a conta no navegador (duplicaria regra de negócio).

## Decisão 2: a conta fica no servidor e vai no detalhe da simulação
- **Decision**: novo campo `cobertura` no detalhe (`GET /simulacoes/:id`), calculado a cada leitura.
- **Rationale**: o detalhe já é recalculado a cada salvamento, então a grade se atualiza sem trabalho extra; não precisa de tabela nem de migration.
- **Alternatives considered**: endpoint próprio (uma ida a mais ao servidor e dois momentos para ficar desatualizado); guardar a cobertura ao gravar (ficaria velha quando as vendas mudam).

## Decisão 3: reaproveitar o montador e a grade da tela
- **Decision**: `montarCobertura` aceita o objeto da simulação no mesmo formato do Diagnóstico (`cobertura`, `vendas`, horários e turnos da loja); `GradeCobertura` não muda.
- **Rationale**: mesmo desenho, mesmas cores e mesmos textos (FR-010) com o menor código novo.
- **Alternatives considered**: copiar a grade para a pasta da Simulação (duas cópias para manter).

## Decisão 4: quem conta no quadro
- **Decision**: desligados saem; vaga conta só se tiver turnos; vagas sem turnos viram um aviso com a quantidade.
- **Rationale**: decisão de negócio da spec (não inventar horário que o dono não definiu).
- **Alternatives considered**: distribuir vagas automaticamente; deixar o dono definir o horário da vaga. Ambas ficam para uma entrega futura.

## Decisão 5: reais só para o dono
- **Decision**: o servidor monta as vendas com `resumirVendas` e, para quem não é dono, aplica a mesma remoção de reais que o Diagnóstico (`semValorPorHora`); a tela nunca recebe o valor.
- **Rationale**: regra do produto (FR-008, SC-004); a proteção fica no servidor, não na tela.

## Decisão 6: onde a seção entra na tela
- **Decision**: seção própria, sem número, entre o passo 1 (horário e vendas) e o passo 2 (contratações), na coluna da esquerda.
- **Rationale**: é onde a pessoa mexe nos horários; não renumera os passos existentes.
- **Alternatives considered**: largura total abaixo de tudo (longe do horário); passo novo numerado (renumeraria o que já existe).

## Pontos em aberto
Nenhum.
