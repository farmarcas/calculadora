# Tarefas: Clareza dos cenários do Diagnóstico

## Fatia 1 — Falta de cobertura do Cenário 2 (servidor)
- [ ] T001 `cenarios.ts` (`montarEconomia`): calcular, com os horários do cenário e a equipe atual, `faltaPorFuncao` (funções que não são farmacêutico, só `gapH > 0`) e `semFarmaceuticoH` (`gapH` do farmacêutico, 0 se coberto); nada existente muda
- [ ] T002 `cenarios.ts`: campo `resultado` do Cenário 2 ("Nenhum horário precisa mudar" ou a frase de cada dia alterado, reaproveitando `fraseDoPasso`); o `foco` deixa de dizer "Reduzir o fim de semana…" e vira a premissa
- [ ] T003 Testes (`cenarios.test.ts`): caso Sumaré (sem corte, falta de atendimento e apoio, 0 h sem farmacêutico); caso com corte (resultado descreve o dia); caso sem falta (campos vazios); farmacêutico ausente (horas > 0); gerente sem valores em R$
- [ ] T004 Rodar os testes do servidor e commitar a fatia

## Fatia 2 — Premissas, selos e regras de aparecimento (servidor)
- [ ] T005 `cenarios.ts`/`comparativo.ts`: `premissa` fixa por coluna (Manter horários, Foco em economia, Equilíbrio) e `resultado` por coluna (Cenário 1 lista o que contrata; Cenário 3 diz o que a combinação faz ou "igual ao Cenário 1/2")
- [ ] T006 `comparativo.ts`: `sugerido` separado de `destaque` — o "Cenário sugerido" vai para o Cenário 1 quando o de menor custo deixa função abaixo do nível de hoje; `recolher` no Cenário 3 quando coincide; `lojaCobreTudo` quando o Cenário 1 não contrata e o 2 não muda nada
- [ ] T007 `comparativo.ts`: comparação com o Cenário 1 passa a trazer a falta que acompanha a economia
- [ ] T008 Testes (`comparativo.test.ts`): selo, recolhimento, frase única, os três casos de aparecimento da spec e os cenários 4 e 5 intactos; commitar a fatia

## Fatia 3 — Cartões (tela)
- [ ] T009 `Comparativo.jsx`: mostrar premissa (subtítulo) e linha de resultado em cada cartão; nomes e ordem não mudam
- [ ] T010 `Comparativo.jsx`: linha amarela de consequência (venda e margem quando reduz horários; horas por função quando não reduz, sem venda perdida; horas sem farmacêutico só quando > 0); some quando não há falta
- [ ] T011 `Comparativo.jsx`: selos "Menor custo" e "Cenário sugerido"; comparação com o Cenário 1 com o preço da economia; chip "(opcional)" no lugar de "(meta)" (`chipsDeContratacao`)
- [ ] T012 `Comparativo.jsx`: Cenário 3 recolhido ("Mesmo resultado do Cenário X") e frase única quando a loja cobre tudo; layout em colunas continua certo
- [ ] T013 Testes da tela e commitar a fatia

## Fatia 4 — Conferência final
- [ ] T014 Conferir Sumaré, uma loja que cobre tudo, uma com corte de fim de semana e uma sem custos, como dono e como gerente, em 5 larguras (360 a 1920), com teclado e leitor de tela
- [ ] T015 Conferir que o quadro do diagnóstico, os cenários 4 e 5, o simulador e os valores em R$ (só dono) não mudaram
- [ ] T016 README (seção do Diagnóstico) e resumo final com o que mudou e o que ficou de fora; rodar tudo e commitar
