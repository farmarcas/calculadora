# Quickstart: validar o resultado em horas e porcentagem

Pré-requisito: uma loja com equipe, custos e base comercial (a Arariba, código 264, serve) e o PR dos cenários em linhas já na branch.

## 1. Testes
`docker compose exec api npm test` e `npm run test:integration`; `docker compose exec web npm test`.

## 2. Como dono
Abrir "Personalizar" em um cenário: o card não tem nenhum "R$"; Venda e Custo de pessoal em %; tabela Hoje × Simulação × Mudança; faixa dos 7 dias; pill de status; "Contratar" com as horas do parcial; "Salvar como cenário N" como antes.

## 3. Mexer na simulação
Adicionar uma vaga, reduzir o sábado e fechar o domingo: o custo, a venda, o total de horas e a faixa mudam; a faixa amarela diz a causa.

## 4. Gestor e consulta
Abrir a mesma simulação: números e textos idênticos; a resposta de rede não tem reais.

## 5. Sem dados
Loja sem base comercial: Venda "Não estimada". Loja sem salários: Custo "—" com a frase.

## 6. Comparação de simulações salvas
Como dono, a comparação continua com os valores em reais.

## 7. Celular
375 px: o card empilha sem rolar para o lado.
