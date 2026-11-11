# Pesquisa: card de resultado da simulação

- **Decision**: extrair a conta do peso para `peso-folha.ts` e usá-la nos Cenários e na Simulação. **Rationale**: uma conta só para o mesmo número. **Alternatives**: copiar a fórmula (risco de divergir) ou chamar `montarLinhas` (acopla a simulação aos cenários).
- **Decision**: faturamento de referência da loja (`faturamentoMensalDe`) também na simulação. **Rationale**: hoje o card divide pela base ×52/12, e os Cenários pelo Cadastro mensal; sem igualar, "hoje 8,0%" divergiria. **Alternatives**: manter a base (números diferentes entre telas).
- **Decision**: campo `custoDoDono` separado e opcional. **Rationale**: a resposta de gestor e consulta não pode nem ter a chave; o `emHoras` continua igual para todos, só com `custoSentido` a mais. **Alternatives**: misturar no `emHoras` (exigiria limpar por perfil e arriscaria vazar).
- **Decision**: "Pessoas" e "Horas contratadas" seguem como hoje (já estão em `emHoras`); "Hora extra" vem de `horaExtraH`. **Rationale**: nada novo no servidor.
- **Decision**: o bloco "Horário a mais" reaproveita `blocoDoHorarioEstendido` (valores e modal já existentes), mudando só título, selo e rótulos ("Custo da mercadoria" em vez de "CMV"). **Rationale**: a conta é da spec 049 e não muda.
- **Decision**: cores de queda de pessoas e horas usam a cor neutra de texto do design system. **Rationale**: pedido do board.
