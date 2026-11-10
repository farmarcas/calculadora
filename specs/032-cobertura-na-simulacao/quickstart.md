# Quickstart: validar a cobertura na Simulação

Pré-requisito: ambiente de pé (`docker compose ps` com os três serviços `healthy`) e uma loja com equipe, turnos e base de vendas.

## 1. Testes
- Servidor: `docker compose exec api npm test` e `docker compose exec api npm run test:integration`.
- Tela: `docker compose exec web npm test`.

## 2. Na tela (como dono)
1. Abrir uma simulação em rascunho. A seção "Cobertura e vendas" aparece entre o horário e as contratações, com turnos, vendas e uma linha por função.
2. Comparar com o Diagnóstico da mesma loja: sem mudar nada, os números da grade são os mesmos (SC-002).
3. Reduzir o fechamento de um dia. As horas retiradas ficam cinza; vendas dessas horas ficam tracejadas e o aviso lista as horas (US1, US2).
4. Desligar a única pessoa de Atendimento de uma faixa. A cobertura de Atendimento cai nessas horas e fica amarela com "▲" (US3).
5. Adicionar uma vaga sem turnos. A grade não muda e o aviso diz "1 vaga ainda sem horário" (US3).
6. Conferir que o saldo, a folha extra e as horas do painel de resultado não mudaram por causa da seção (SC-005).

## 3. Como gestor
Abrir a mesma simulação com o perfil de gestor: as barras mostram só a participação por hora e nenhum valor em reais chega à resposta da API (SC-004).

## 4. Loja sem base de vendas e sem turnos
A linha de vendas some com a mensagem "Sem vendas por hora…", e a linha "Turnos" não aparece; a cobertura continua.

## 5. Celular (375 px)
A grade rola para o lado dentro do quadro, com a coluna de função fixa, e a página inteira não rola para o lado (SC-006).
