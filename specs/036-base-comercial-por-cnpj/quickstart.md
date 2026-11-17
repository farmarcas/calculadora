# Quickstart: validar a base por CNPJ

Pré-requisito: ambiente no ar e o arquivo da base nova.

## 1. Testes
`docker compose exec api npm test` e `npm run test:integration`; `docker compose exec web npm test`.

## 2. Conferência (nada é gravado)
Enviar o arquivo e informar 01/07/2026 a 31/10/2026: a tela mostra 1.834 CNPJs, 1.791 lojas substituídas, 43 sem loja, 23 mantidas e os avisos (62, 73, 585).

## 3. Importação
Confirmar o envio. Medir o tempo total (meta: abaixo de 45 s). Anotar quantas lojas foram gravadas.

## 4. Conferência dos números
- Total por loja: média do dia × vezes do dia no período fica a menos de 0,5% do total do arquivo (script de conferência em todas as lojas).
- Arariba (264): CMV médio 58,7%, venda média da segunda-feira ≈ R$ 23.288.
- Razão base nova ÷ antiga na maioria das lojas entre 0,8 e 1,3.

## 5. Cenários e Simulação
Abrir os cenários e a Simulação da Arariba: régua em margem, clientes por hora no gráfico.

## 6. Cadastro
Loja com CMV médio já digitado mantém o valor; loja sem, recebe o calculado.

## 7. Voltar atrás
Conferir que a carga anterior de uma loja continua no banco como inativa. Não há tela para reativá-la: voltar atrás é feito por mim, em comando, com a sua autorização.
