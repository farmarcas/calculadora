# Research — Cobertura por turno e parâmetros legais

## Decisões

- **Peça central "requisitos":** `emHora(cargo, dia, hora)` e a lista de cargos exigidos. Why: hoje o mínimo é um número por cargo usado em ~15 lugares (capacidade, cobertura, cenários, simulação, apuração); trocar cada um por turno espalharia a ideia. Alternativa rejeitada: passar a lista de turnos a cada função.
- **Compatibilidade:** as funções aceitam o mínimo antigo (`Record<cargo, número>`) **ou** requisitos; `comoRequisitos` converte o antigo em "igual em todas as horas". Why: os testes e chamadas atuais continuam valendo sem mudança, e a paridade é automática.
- **Necessidade por camadas:** em vez de `mínimo × horas abertas`, soma-se, para cada camada k = 1…máximo, as horas em que o requisito é ≥ k; horas = Σ camadas, turnos = Σ_dias Σ_camadas ⌈horas_k ÷ 8⌉. Com requisito igual em todas as horas dá exatamente `mínimo × ⌈horas ÷ 8⌉` (igual ao de hoje). Why: dá o número certo de pessoas para um pico sem exigir o pico o dia todo.
- **Onde guardar os turnos:** coluna Json `lojas.turnos` = lista de `{ nome, inicio, fim, minimos: { cargo: n } }`. Why: turno e mínimos são validados juntos; mesmo padrão de `horarios`, `custos` e `faturamento`. `lojas.minimos` continua como mínimo único de reserva (loja sem turnos, hora fora de qualquer turno).
- **Pré-preenchimento (FR-006):** ao criar o primeiro turno, cada um nasce com os mínimos atuais da loja. Nenhuma migration de dados.
- **Validação dos turnos:** ordenados, sem sobreposição, sem buraco, dentro da janela do primeiro ao último horário aberto da semana; turno que vira a noite (fim < início) vale como dois pedaços (início–24h e 0h–fim). Mudar o horário da loja revalida e avisa no próximo acesso, sem apagar nada.
- **Quantidade por turno:** `cobertura.ts` já calcula pessoas por hora no pior dia, descontado o intervalo; o quadro por turno é o menor valor entre as horas do turno. Pessoas sem função de escala, sem horário ou sem dias ficam fora e são contadas à parte com o motivo. Escala importada continua mandando sobre o horário do cadastro (já é assim).
- **Custo da hora nos cenários:** `custoMensalDaHora` deixa de ser um valor único e passa a depender do requisito da hora cortada. Com requisito igual, o valor é o mesmo de hoje.
- **Simulação e apuração:** o snapshot da simulação (`premissas.minimos`) passa a aceitar a forma com turnos; a comparação "premissas mudaram" passa a ser por igualdade profunda.
- **Parâmetros legais:** tabela `parametros_legais` (fase, jornada semanal, horas por dia, horas por dia com a convenção de 8h24 (só 42h), dias, divisor, início da vigência, quem alterou). Versão vigente de uma fase = a mais recente com início ≤ hoje; se todas começam no futuro (caso da 42h e da 40h hoje), vale a mais antiga. `regraPara(id, convenção, tabela = valores de hoje)` mantém todas as chamadas e testes atuais; os serviços que importam carregam a tabela e a passam adiante. `DIVISOR` passa a vir da tabela com o mesmo padrão.
- **Vigência da 42h:** a versão inicial usa 16/12/2026 (documento de regras); corrigível na tela.
- **Aviso de estimativa:** texto fixo no componente do Diagnóstico, sempre visível junto do título dos cenários.

## Riscos

- Mexer em ~15 pontos que leem o mínimo: mitigado pela compatibilidade com o formato antigo e pela paridade nos testes que existem (166 + 105 hoje seguem passando).
- Cenários gulosos (cortes) podem ficar mais lentos: no máximo 168 horas por loja, sem preocupação.
- Quem já tem simulações salvas: o snapshot antigo continua válido (forma antiga aceita).
