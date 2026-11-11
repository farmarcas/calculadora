# Data model — spec 058

Nenhuma tabela nem campo novo no banco ou na API. A tela monta, a partir da resposta existente do diagnóstico, estas estruturas em memória:

- **LinhaDeCargo**: `funcao`, `status` (obrigatorio | desejavel | sem_falta), `pessoas {hoje, depois}`, `horas {hoje, depois}`, `falta {hoje, depois}`, `turnosAcobrir` (só farmacêutico), `sobraH` (cargo sem falta).
- **EquipeToda**: `pessoas {hoje, depois}`, `horas {hoje, depois}`, `folga {hoje, depois}` (capacidade − necessidade).
- **Referência da loja**: `horasAbertas` da semana.
