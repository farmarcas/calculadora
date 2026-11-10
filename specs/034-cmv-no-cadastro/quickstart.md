# Quickstart: validar o CMV no lugar da margem

Pré-requisito: ambiente de pé e, antes de aplicar a migration no banco local, um backup (o agente faz e avisa onde ficou).

## 1. Testes
Servidor: `docker compose exec api npm test` e `docker compose exec api npm run test:integration`. Tela: `docker compose exec web npm test`.

## 2. A limpeza (US3)
Aplicar a migration. Conferir: nenhuma loja com margem no Cadastro, nenhuma hora de base com margem (CMV nulo); vendas por hora e clientes iguais aos de antes (contagem e soma). Rodar a migration de novo: nada muda.

## 3. Campo no Cadastro (US1)
Como dono, abrir a aba de faturamento: "CMV médio (%)". Salvar 65, reabrir (65). 120 e −5 são recusados. Como gestor: o campo não aparece.

## 4. Base com CMV por hora (US2, US4)
Enviar uma base com a coluna "CMV (R$)". Abrir os cenários e a Simulação: perda de uma hora de R$ 1.000 com CMV R$ 800 = R$ 200 de lucro bruto.

## 5. CMV médio como padrão (US4)
Base sem CMV e CMV médio de 65%: a perda da mesma hora é R$ 350. Sem CMV médio e sem CMV: a loja mede em venda, com o aviso de que falta o CMV.

## 6. Planilha antiga (US2)
Enviar uma base e uma planilha de Cadastro com a coluna de margem antiga: importa sem erro, e a coluna é ignorada.

## 7. Perfis
Gestor e consulta: nenhum valor de CMV nas respostas; `regua` sim.
