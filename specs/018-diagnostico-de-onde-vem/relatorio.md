# Relatório da entrega — Diagnóstico: "De onde vêm esses números" (spec 018)

## 1. Reaproveitado, criado, removido
**Reaproveitado**: todos os cálculos do Diagnóstico (cobertura por hora com o mínimo exigido, vendas por hora, resultado por regra, equipe, quadro), a regra de turnos e de mínimo por hora do spec 017, `verificarRegra`/`regraPara` (para o 8h24), o painel do Cadastro de loja (os atalhos usam o endereço dele), `onEnviar` e `onDefinirFuncao` do Diagnóstico.
**Criado (servidor)**: `regras[r42].com8h24` (aditivo; só horas, sem R$).
**Criado (tela)**: `features/diagnostico/onde-vem/` — `OndeVemSecao` (cartão, abas acessíveis, aba na URL, erro), `montar.js` (montador puro e memorizado), `AbaCobertura`/`GradeCobertura`, `AbaResultado`/`TabelaRegras`/`BlocoOito24`, `AbaEquipe`/`LinhaDoTempo`, `atalhos.js`, `url.js`; 29 testes do montador.
**Removido da página**: Quadro por turno, Cobertura da escala atual, Horários de maior venda, Quadro por função, Verificação por regra, Escala atual por colaborador (e o arquivo `QuadroTurnos.jsx`). A informação continua nas 3 abas.
**NÃO removido (de propósito)**: **Escala redistribuída** e **Déficit e contratações por função**. A regra do pedido era conferir se a informação existe em Personalizar/Simulação antes de remover. Não existe: a redistribuição (`regras[].redistribuicao`), os "dias e horários que cobrem o descoberto" (`sugestao.distribuicao`) e a "alternativa de parcial com hora extra" só aparecem nesses dois blocos (o Personalizar parte da escala atual com as contratações do cenário, sem a redistribuição). Os dois blocos ficam abaixo do cartão, sem mudança de comportamento.

## 2. Suposições "a confirmar" e onde ficam
- **Hora de pico** (venda ≥ 75% do maior valor): `onde-vem/montar.js` → `isHoraPico`, `LIMITE_PICO`.
- **Condição da observação do pico** (só quando o maior nº de atendentes está fora do pico e é maior que no pico; usa o bloco de pico que contém a hora mais vendida): `montar.js` → `buildObservacaoPico`.
- **Mínimo na sobreposição de turnos** (maior mínimo por cargo): vem pronto do servidor (`cobertura.porHora[].exigido`, regra `emHora` do spec 017); a tela não recalcula.
- **Horário da loja que varia por dia**: "dentro do horário" = hora presente em `cobertura.horas` (a cobertura já é do pior dia); a janela mostrada no texto vai do primeiro horário aberto ao último (`janelaDaLoja`).
- **Turnos diferentes por dia (aba 3)**: não se aplica — o modelo guarda um turno por pessoa; "varia" e a dica por dia não existem.
- **Estimativa de 8h24**: servidor, `diagnostico.ts` (`com8h24`); a escolha da função mostrada (a que mais melhora) e a condição de exibir: `montar.js` → `montarOito24`.

## 3. Dados que não existiam e como foram montados
- `com8h24` (único acréscimo no servidor). Todo o resto foi montagem no front a partir de campos que já saíam do Diagnóstico.
- A dica das vendas usa `fontes.base.arquivo` (a base já é a média por dia); as datas de `vendas.periodo` são de uma semana de referência e não são mostradas.

## 4. Divergências entre os quadros e o implementado
- **"Escala redistribuída" e "Déficit e contratações" permanecem na página** (ver seção 1), apesar de o quadro mostrar a página sem eles.
- **Rótulo de meta**: o quadro diz "Meta do dono: manter o nível de hoje"; quando a origem é o nível de hoje, a tela diz "Meta: manter o nível de hoje" (o que é verdade); com meta do dono, "Meta do dono".
- **Na regra de 42h da Sumaré** o cabeçalho diz "Faltam 2 funções" (atendimento e apoio); o quadro mostra "Falta atendimento" com uma só.
- **Quem não é dono** vê a participação (%) no lugar do R$ nas vendas; o eixo pode perder a hora cuja participação arredonda para 0%.
- **Tabelas largas** (aba 3 e aba 2) rolam por dentro do cartão em telas estreitas, como o pedido previa para as grades.
- **Frase da nota jurídica** removida do rodapé do bloco de contratações (o único bloco mantido que a tinha); aparece uma vez abaixo do cartão.

## 5. Confirmação
**Diagnóstico (card), regras do topo e Cenários sugeridos não foram alterados.** Conferido por diff: `QuadroCentral.jsx`, `Comparativo.jsx`, `Cenarios.jsx`, `EscalaPage.jsx`, `cardDiagnostico.js` e `Encargos.jsx` não mudaram; em `Diagnostico.jsx` só saíram os blocos antigos, entrou a linha que monta o cartão e foi retirada uma frase do rodapé de "Déficit e contratações". Os dois blocos mantidos continuam idênticos por dentro.

## 6. Conferência
Larguras 360, 768, 1100, 1440 e 1920 px nas 3 abas: sem rolagem horizontal da página (a conferência achou e corrigiu um estouro causado por texto de leitor de tela fora do contêiner de rolagem). Todos os controles e imagens da seção têm nome acessível; as abas funcionam por setas, Home e End, com a aba no endereço. Testes: servidor 439 unitários e 199 de integração; front 62.
