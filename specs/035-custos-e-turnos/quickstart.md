# Quickstart: validar Custos e Turnos

Pré-requisito: ambiente de pé; uma loja com base comercial (ex.: Farmácia Norte) e outra sem base.

## 1. Testes
Servidor: `docker compose exec api npm test` e `docker compose exec api npm run test:integration`. Tela: `docker compose exec web npm test`.

## 2. Aba, ordem e padrão (US1)
Abrir o Cadastro de uma loja nova: a terceira aba se chama "Custos e Turnos"; seções na ordem Custos de Salário em Folha, Turnos, Encargos e Convenção Coletiva; "Por turnos" selecionado e "Nenhuma alteração" no rodapé. Abrir uma loja com "Mínimo único do dia" salvo: continua nele.

## 3. Gráfico, alças e tabela (US2, US3)
Loja com base: ver barras por hora, 3 picos em destaque, faixas dos turnos. Arrastar uma alça: fim e início mudam juntos, tabela e detalhe acompanham. Selecionar faixa e linha: sincronizam. Trocar o tipo de dia: só os valores mudam.

## 4. Teclado (US2)
Tab nas faixas e alças; setas movem 1 hora; Enter seleciona; o leitor anuncia "Turno <nome>, <início> a <fim>".

## 5. Sugerir turnos (US4)
Clicar em "Sugerir turnos pelo movimento": faixas tracejadas, "Descartar" não muda nada, "Aplicar" muda os turnos (ainda é preciso salvar).

## 6. Sem dados (US5)
Loja sem base: caixa "Sem faturamento por hora", linha do tempo simples, "—" no faturamento, botão de sugerir desabilitado com a dica. "Enviar base comercial" abre o envio; depois de enviar, a tela passa ao normal sem perder turnos editados.

## 7. Perfis (US6)
Como gestor: barras e "% do dia", nenhum valor em reais na tela nem na resposta.

## 8. Celular
375 px: gráfico e tabela rolam dentro do quadro; a página não rola para o lado; alças alcançáveis por toque.
