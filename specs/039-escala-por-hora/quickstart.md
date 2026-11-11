# Quickstart: validar a Escala por hora

Pré-requisito: uma loja com equipe com horário no Cadastro, custos e base comercial (a Arariba, código 264) e o PR dos cenários em linhas e do resultado em horas já na branch.

## 1. Testes
`docker compose exec api npm test` e `npm run test:integration`; `docker compose exec web npm test`.

## 2. Ver a escala (dono)
Abrir "Personalizar" de um cenário e descer até "Escala por hora": abas dos dias, Venda por hora (R$), Clientes por hora, uma linha por função com pessoas por hora e mínimo, uma linha por pessoa com o turno.

## 3. Falta de cobertura
Num dia com uma hora sem farmacêutico: célula rosa com "N !" e borda vermelha e a faixa amarela com as horas.

## 4. Contratar
Em "+ Contratar" da função: o formulário já vem com a sugestão; "Adicionar à simulação" cria a linha azul, a falta some e o total da semana sobe; "Remover" desfaz.

## 5. Arrastar
Arrastar um turno e puxar uma borda: a cobertura e a faixa de aviso mudam na hora; a mudança grava ao soltar.

## 6. Gestor e visualizador
Gestor: sem Venda por hora e sem custo ou venda no efeito. Visualizador: sem "+ Contratar", sem arrastar e sem "Remover".

## 7. Sem dados e celular
Loja sem base comercial: "Sem clientes por hora nesta base". 375 px: lista por função, faixa de cobertura com rolagem, sem rolagem lateral da página.
