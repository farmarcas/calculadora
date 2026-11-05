# Data Model: Modais de importação

Nenhuma tabela ou coluna muda.

**Revisão da importação do Cadastro** (resposta, não é guardada): contagens de lojas e funcionários que atualizam, são novos e têm erro; lista de erros (aba, linha, motivo); avisos (por exemplo, valores ignorados por permissão); mapeamento entendido.

**Revisão da base comercial** (resposta, não é guardada): arquivo, linhas lidas, lojas reconhecidas, lojas não cadastradas, período (primeira e última data das vendas), envios anteriores que serão substituídos (loja e data) e erros de linha.

**Importação do Cadastro** (`importacoes_cadastro`): continua guardando o arquivo lido e o mapeamento, como hoje; a revisão lê o registro e **não** muda seu status.

**Carga de base comercial** (`cargas`): continua como hoje; a nova substitui a anterior (que fica inativa no histórico) só no envio, nunca na revisão.
