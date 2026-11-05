# Research: Planilha pelo CNPJ e encargos só pelo regime

**Decision**: a loja é encontrada pelo CNPJ **dentro do grupo da pessoa** (as buscas do cadastro já são presas ao grupo), comparando só os dígitos.
**Rationale**: o CNPJ já é único no sistema e validado no cadastro; comparar dígitos aceita com ou sem pontuação.
**Alternatives considered**: busca global por CNPJ (deixaria enxergar lojas de outro grupo).

**Decision**: o CNPJ lido do Excel é completado com zeros à esquerda até 14 dígitos antes de validar (quando vier com 8 a 13 dígitos).
**Rationale**: o Excel guarda o CNPJ como número e perde zeros à esquerda; é a causa mais comum de "CNPJ inválido" em planilha.
**Alternatives considered**: exigir texto na célula (frágil, o usuário não controla).

**Decision**: o código e o código de lotação viram colunas "legadas" (como já foi feito com "Encargos (%)" e a margem): continuam reconhecidas na importação, não entram no modelo novo.
**Rationale**: o mecanismo existe e evita que a coluna antiga caia em outro campo por parecença de nome.
**Alternatives considered**: apagar as colunas do mapeamento (planilhas antigas quebrariam ou mapeariam errado).

**Decision**: quando a linha tem CNPJ, ele vale; sem CNPJ, vale o código (planilha antiga). O mapeamento exige "CNPJ **ou** código" no lugar do código obrigatório; no modelo novo o CNPJ aparece com asterisco.
**Rationale**: compatibilidade com o que já foi preparado, sem exigir a coluna antiga.
**Alternatives considered**: tornar o CNPJ obrigatório sempre (rejeitaria as planilhas antigas).

**Decision**: o nome da loja vira "Nome da loja / Apelido" e deixa de ser obrigatório para loja já cadastrada (em branco mantém o nome); continua obrigatório para criar loja (caminho antigo com código).
**Rationale**: a planilha só atualiza lojas existentes por CNPJ; exigir o nome seria ruído.
**Alternatives considered**: manter obrigatório (obriga a repetir o nome já cadastrado).

**Decision**: a planilha por CNPJ **não cria** loja; CNPJ sem loja no grupo é recusado com mensagem.
**Rationale**: o código da loja é obrigatório no cadastro e só a operadora o conhece; criar sem ele geraria lojas incompletas.
**Alternatives considered**: criar com código gerado (inventa dado que a operadora controla).

**Decision**: "Cargo" no modelo novo é a antiga "Função de escala", com os mesmos sinônimos mais "cargo"; o antigo "Cargo" fica como campo legado. A função continua sendo deduzida do texto das duas colunas.
**Rationale**: a dedução já junta função e cargo; assim, na planilha antiga com as duas colunas, qualquer uma que o mapeador escolher produz a mesma função.
**Alternatives considered**: remover a dedução (perderia "balconista" e "vendedor" em planilhas antigas).

**Decision**: a lista do Cargo é uma validação de lista do Excel (Farmacêutico, Atendimento, Caixa), em estilo que impede outro valor ao digitar; a importação não depende dela.
**Rationale**: resolve o problema no momento do preenchimento sem recusar planilhas feitas em outro programa.
**Alternatives considered**: recusar a linha na importação (perde planilhas antigas).

**Decision**: o cálculo de encargos usa só o regime (`calcularEncargos(regime, tabela)` sem ajustes, rescisão desligada); os ajustes antigos continuam em `custos.encargos`, preservados nas gravações e ignorados.
**Rationale**: o pedido é simplificar sem apagar dados; reaproveita a técnica usada na margem (preservar na gravação).
**Alternatives considered**: apagar os ajustes do banco (irreversível e fora do pedido).

**Decision**: RAT, FAP e rescisão viram colunas "legadas" na importação: reconhecidas e ignoradas, sem erro mesmo com valor inválido.
**Rationale**: igual à margem; planilhas antigas seguem importando.
**Alternatives considered**: manter a validação de faixa (recusaria linhas por um dado que não vale mais).

**Decision**: a resposta de custos da API mantém o formato (`encargos` com `ratPct`, `fap` e `rescisaoLigada` do regime/desligada); a tela só deixa de ter os campos.
**Rationale**: não quebra quem lê a resposta; a tela mostra o total e os componentes do regime como antes.
**Alternatives considered**: remover os campos da resposta (mudança de contrato sem ganho).
