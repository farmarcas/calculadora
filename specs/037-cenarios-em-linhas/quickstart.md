# Quickstart: validar os cenários em linhas

Pré-requisito: ambiente no ar e uma loja com equipe, custos e base comercial (a Arariba, código 264, serve).

## 1. Testes
`docker compose exec api npm test` e `npm run test:integration`; `docker compose exec web npm test`.

## 2. Como dono
Abrir os cenários: três linhas (Equilíbrio, Manter horários, Sem contratações), cinco colunas e o botão Personalizar; nenhum "R$" na área; um selo "CENÁRIO SUGERIDO" na linha certa.

## 3. Faixa dos 7 dias
Cada linha mostra as horas dos sete dias; dias alterados em verde ou rosa com a diferença; dia fechado com "Fechado" e as horas perdidas; Manter horários com "sem mudança".

## 4. Status e causa
Conferir a pill e a faixa amarela de cada estado (uma loja de teste por estado).

## 5. Gestor e consulta
Mesmas linhas, sem selo de sugerido; Equilíbrio indisponível quando os custos não foram informados; a resposta de rede não tem reais.

## 6. Personalizar e Salvar como cenário
Personalizar cria a simulação com as contratações e os horários do cenário; Salvar como cenário continua igual.

## 7. Celular
Largura de 375 px: cada linha empilha as colunas, sem rolar para o lado.
