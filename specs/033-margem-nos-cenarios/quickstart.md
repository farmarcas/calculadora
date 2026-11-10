# Quickstart: validar a margem nos cenários e na Simulação

Pré-requisito: ambiente de pé e uma loja com equipe, custos informados e uma base de vendas **com margem por hora** (colunas de venda e de margem).

## 1. Testes
- Servidor: `docker compose exec api npm test` e `docker compose exec api npm run test:integration`.
- Tela: `docker compose exec web npm test`.

## 2. Cenário 3 decide pela margem (como dono)
1. Montar na base duas horas de sábado: uma com venda alta e margem baixa, outra com venda menor e margem alta.
2. Abrir os cenários da loja: o Cenário 3 prefere cortar a hora de menor margem (US1).
3. Os rótulos dizem "margem" (US1, FR-006).

## 3. Os três cartões e o sugerido na mesma régua
Conferir que saldo, perda e ganho dos três cartões estão em margem e que o cenário destacado é o de menor impacto nessa régua (US2). O Cenário 1 segue sem perda nem ganho de margem.

## 4. Simulação, lista e comparação
1. Abrir uma simulação que fecha um dia: "Margem que deixa de entrar" e saldo em margem (US4).
2. A lista e a comparação mostram o mesmo saldo do painel (SC-006).
3. Folha extra, hora extra e custo não mudaram.

## 5. Base sem margem, com margem parcial e com margem incoerente
Enviar uma base sem a coluna de margem: todos os números ficam idênticos aos de antes, com rótulos em "venda" (SC-003, SC-007). Repetir com margem em poucas horas e com uma hora de margem maior que a venda: volta à venda e o aviso diz o motivo (US3).

## 6. Perfis
Abrir os cenários e a Simulação como gestor: nenhum valor em reais (margem ou venda) chega à resposta; a `regua` sim (US5, SC-004).

## 7. Simulação gravada antes
Abrir uma simulação gravada antes da entrega: o saldo é recalculado, e o painel diz qual régua usou (US4, cenário 4).
