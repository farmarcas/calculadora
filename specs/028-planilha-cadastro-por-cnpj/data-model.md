# Data Model: Planilha pelo CNPJ e encargos só pelo regime

Nenhuma tabela ou coluna muda.

**Loja**: `cnpj` (único, já validado no cadastro) passa a ser a chave de reconhecimento na importação; `codigo` continua guardado, único e nunca alterado pela planilha.

**Funcionário**: ligado à loja por `lojaId`; a importação resolve o `lojaId` pelo CNPJ da planilha (ou pelo código, no formato antigo). `funcaoEscala` continua sendo uma de Farmacêutico, Atendimento, Caixa ou "Outros cargos"; `cargo` (texto livre) continua guardado quando vier em planilha antiga.

**Custos da loja** (`custos`): `salarioMedio` como hoje; `encargos` (`ratPct`, `fap`, `rescisaoLigada`) **continua guardado** quando já existe, é preservado ao gravar os custos e **não é lido** pelo cálculo.

**Encargos de cada regime** (Parâmetros legais): inalterados; o total usado no custo é o do regime vigente, sem rescisão.
