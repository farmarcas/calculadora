# Data Model: Cenários que já contam as folgas

Nenhuma tabela nova nem migration. Muda o que é calculado e devolvido.

- **Entrada do motor (`EntradaCenarios`)**: ganha `horarios?: HorarioPessoa[]` (matrícula, função, dias, entrada, saída, intervalo), vindo de `turnosDoCadastro`; sem ele, vale a conta por horas de hoje.
- **Semana com folgas (módulo novo)**: `{ turnos, retirados, avisos, domingoSugerido, coberturaPorDia }` por regra; `contratacoes: [{ funcao, cargaH, turnos[] }]`; `resolve: boolean`.
- **`LinhaFuncao`** (resultado de `verificarRegra`): `capacidadeH` passa a significar "horas exigidas que a equipe cobre" quando há horários; `gapH` e `contratar` saem dela; novo texto na `memoria` ("Com as folgas, a equipe cobre Xh das Yh exigidas").
- **Simulação**: `quadro`, `turnos` (já com folgas) e vagas com `turnos` (já posicionados). `desatualizada` continua comparando a base com a equipe do Cadastro.

Regras: ninguém passa de `regra.dias` dias nem das horas da regra; o farmacêutico fica coberto em todas as horas ou o cenário diz "Não resolve sozinho"; vaga é no máximo 20 por simulação.
