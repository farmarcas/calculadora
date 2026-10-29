# Research: multiempresário por GE

## 1. Como separar os dados
- **Decision**: coluna `ge_id` nas tabelas que são a raiz (`lojas`, `importacoes_cadastro`, `auditoria`); o resto herda pela loja.
- **Rationale**: uma só fonte da verdade do dono do dado; sem risco de funcionário apontar para um GE e a loja para outro.
- **Alternatives**: `ge_id` em todas as tabelas (inconsistência possível, mais migration); um banco ou schema por GE (pesado demais para dezenas de GEs); segurança por linha no Postgres (boa, mas exige sessão por GE e mudaria a forma de conectar; fica como reforço futuro com o SSO).

## 2. Como aplicar o filtro
- **Decision**: `geId` explícito em cada método de repositório, vindo de `res.locals.geId`.
- **Rationale**: visível na leitura e testável; falhar em passar o parâmetro é erro de tipo, não vazamento silencioso.
- **Alternatives**: extensão do Prisma que injeta o filtro sozinha (mágica difícil de auditar, quebra em consultas cruas); contexto assíncrono global (mesmo problema).

## 3. Como o GE chega à API sem login
- **Decision**: cabeçalho `X-GE` (id do GE) junto do `X-Perfil`. Sem `X-GE`, perfis do GE recebem 400; o operador só acessa as rotas de GE e de carga.
- **Rationale**: é a mesma forma do perfil de demonstração; o SSO troca a origem dos dois valores sem mexer nas rotas.
- **Alternatives**: GE no caminho da URL (obriga mudar todas as rotas e a tela); subdomínio por GE (infra que ainda não existe).

## 4. Registro de outro GE
- **Decision**: 404 igual a "não existe".
- **Rationale**: não revela que o dado existe em outro GE.

## 5. CNPJ
- **Decision**: guardar só os 14 dígitos; validar os dígitos verificadores; único em todo o sistema entre lojas ativas (índice parcial); o CNPJ não pode ser alterado depois pelo empresário. Lojas de hoje sem CNPJ ficam com valor vazio e aparecem como "CNPJ pendente" para o operador completar (a coluna continua aceitando vazio só por causa delas).
- **Rationale**: é a identificação que o operador já tem; evita duplicata na carga.

## 6. Reenvio do Excel e correções do empresário
- **Decision**: guardar em `lojas.ultima_carga` o retrato dos valores vindos do Excel. No reenvio, comparar três coisas: valor da planilha, valor atual e retrato anterior. Se atual ≠ retrato, o empresário corrigiu: é **conflito**, mantido por padrão, com a opção do operador de substituir (por loja ou todas).
- **Rationale**: detecta correção por campo, sem precisar de histórico completo nem de relógio.
- **Alternatives**: sempre sobrescrever (apaga correção); nunca atualizar (reenvio perde a função); data da última edição (marca a loja inteira, não o campo).

## 7. Formato da carga
- **Decision**: o formato é o do relatório de lojas da plataforma (aba "lojas"; colunas: Bandeira, CNPJ, Apelido de Loja, Status, Regime Tributário, Id, Cidade e Estado do endereço na Receita, Grupo Econômico, Anjo Responsável, Nome do responsável pelo GE, SEGUNDA a DOMINGO). Analisado com o arquivo real de 28/10/2026: 2.804 linhas; 1.810 Ativado, 879 Desativado, 114 Montando, 1 Transição; 487 GEs com loja ativa; todos os CNPJs ativos têm 14 dígitos válidos e nenhum se repete; 5 sem regime; 68 sem nenhum horário; horários em "HH - HH" ("07 - 00" = fecha à meia-noite em 410 casos; "00 - 00" = fechado), com 17 células com minutos e segundos e 5 incompletas. Faturamento e funcionários não vêm no arquivo. Conferir e confirmar em duas chamadas, reaproveitando a tabela de importações já existente com o tipo "carga de lojas".
- **Rationale**: reaproveita a leitura de horário e de faturamento que já existe e a confirmação em duas etapas.
- **Alternatives**: mapeamento de colunas a cada envio (trabalhoso para o operador; já existe para o empresário).

## 8. Migração dos dados atuais
- **Decision**: uma migration que cria `grupos_economicos`, insere o GE inicial com id fixo, adiciona `ge_id` nullable, preenche com o GE inicial, depois põe NOT NULL e as chaves; os índices únicos trocam para "dentro do GE". Antes e depois, comparar contagem de lojas, funcionários, simulações e o diagnóstico da loja 001.
- **Rationale**: expand e contract no mesmo arquivo; sem perda e sem `reset`.

## 9. Perfis
- **Decision**: novo `PLATFORM_OPERATOR`: gerencia GEs e lojas de todos, **não** vê valores em reais. Dono e gestor editam loja (exceto CNPJ) e funcionários; consulta só lê.
- **Rationale**: o dono continua sendo o único com acesso aos valores financeiros do próprio GE.

## 10. Regras legais
- **Decision**: continuam globais (sem GE).
- **Rationale**: a lei é a mesma; o spec já diz isso.
