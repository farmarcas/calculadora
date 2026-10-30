# Implementation Plan: Encargos por regime tributário

**Spec**: [spec.md](spec.md) · plano aprovado em 2026-10-30

## Decisões
1. **Função pura** `calcularEncargos` em `regras/encargos.ts` (componentes, total, regime usado, regime ausente), com padrões no código.
2. **Tabela nova** `parametros_encargos` (regime, vigência, componentes, criado por), no padrão de `parametros_legais`: nunca edita, sempre cria versão; rotas `GET/POST /parametros-encargos` (leitura de todos, escrita do dono).
3. **Substituição num só ponto**: onde a loja é carregada para o cálculo, o `encargosPct` é calculado do regime e injetado em `Custos` (`custosEfetivos`). Os consumidores (`calcularCusto`, `contratacao-horas`, `capacidade`, `cenarios`, `cenarios-extras`, simulações) não mudam.
4. **Ajustes por loja** em `lojas.custos.encargos { ratPct?, fap?, rescisaoLigada? }` (JSON, sem migration de coluna).
5. **Regime ausente**: Presumido + alerta; seletor grava `lojas.regime_tributario`.
6. **Tela**: card da folha, "Ver composição", ajustes e "Restaurar padrão"; seção "Encargos por regime" em Parâmetros legais.
7. **Planilha**: coluna "Encargos (%)" vira RAT (%), FAP e Provisão de rescisão.

## Fatias
1. Tabela, função de cálculo e rotas (US1, US3).
2. Ligação nos cálculos, regime ausente e ajustes por loja (US1, US2, US4).
3. Tela, planilha e antes/depois (US5).
