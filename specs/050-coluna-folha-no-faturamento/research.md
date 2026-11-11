# Research: Coluna "Folha no faturamento" (A3)

- **Hoje**: `textoDoPeso` (linha-regras.js) devolve texto, `aumento` ("+1,7 p.p.") e `reais` ("(R$ 7.659/mês)"); a célula usa `Peso` em `LinhaDeCenario.jsx`; a grade é `.linha-cenario` em `index.css` (6 colunas, quebra em 5 linhas).
- **Diferença dos pesos**: o servidor calcula `aumentoPp = depois − hoje` sobre os valores sem arredondar (`pesoDepois − pesoHoje`), e a tela mostra `hoje` e `depois` arredondados; em casos de borda a conta não bate. A correção é arredondar antes (`arred1(depois) − arred1(hoje)`), com `semZeroNegativo` para não mostrar −0,0.
- **Estado**: `custoSentido` (`aumenta | igual | diminui`) já vem do R$ (`adicional`), igual para todos os perfis.
- **Frases de falta**: `custoEstado` já traz `sem_salarios` e `sem_faturamento`; o gestor recebe `sem_salarios`/`sem_calculo` e a tela troca por "Dados do custo ainda não informados." (nunca "faturamento").
- **"Igual"**: o texto "Sobe só porque a venda cai." só faz sentido quando o peso depois é maior que hoje; quando é igual ou menor, a linha de baixo fica vazia (sem texto) — a spec pede o texto para "Sem contratações"; usaremos o texto sempre que o custo é zero e o peso depois > hoje, e nada quando é igual.
- **Texto de abertura**: está em `Comparativo.jsx`; a regra dos 50% já aparece no modal "Como calculamos" do bloco do horário estendido (spec 049), então basta tirá-la do texto de abertura.
- **Altura da linha pelo Horário**: a faixa dos 7 dias define a altura; a célula da folha usa `align-self: start` e `line-height` fixo, para não esticar a linha.
- **Tokens**: `--text-success-strong: #3E7500` já existe; o âmbar `#B45F00` não existe e entra como `--chip-aumenta-texto`, com fundos claros (âmbar e verde) calculados para contraste AA.
- **aria-label**: gerado em `linha-regras.js` (dono: "Folha sobe 1,7 ponto percentual, de 8,0% para 9,7% do faturamento"; gestor: "Custo de pessoal aumenta").
