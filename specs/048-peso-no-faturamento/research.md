# Research: Peso do custo de pessoal no faturamento

- **Folha e faturamento já existem**: `cen.atual.folhaMensal` (salários + encargos do regime + provisões, `calcularCusto`) e `cen.manter.faturamentoMensalRef` (Cadastro; senão soma dos dias × 52 ÷ 12; senão base × 52 ÷ 12).
- **Conferência à mão (dados locais)**: Cosmópolis 36.037,60 ÷ 450.567 = 8,0%; com 1 farmacêutico (R$ 7.659,08) = 9,7%, +1,7 p.p. Paulínia 25.677,88 ÷ 249.921 = 10,3%; com R$ 11.112,32 = 14,7%, +4,4 p.p.
- **Faturamento depois**: cenário que muda a venda usa `faturamento × (1 + vendaPct)`; o aumento em R$ continua sendo só a folha nova − a atual.
- **p.p.** = `depois − hoje` com uma casa; **R$** = `adicional` do cenário, inteiro.
- **Outros perfis**: `custoSentido` = `aumenta` se `adicional > 0`, `diminui` se `< 0`, senão `igual`; sem número.
- **Provisões e premiação**: as provisões já fazem parte do encargo do regime (`regras/encargos.ts`); premiação fora da folha não entra (não é lançada no sistema).
