# Implementation Plan: Sistema multiempresário por GE

**Branch**: `feat/multitenant-ge` | **Date**: 2026-10-29 | **Spec**: [spec.md](spec.md)

## Summary

Cada empresário passa a ser um **GE**. A loja pertence a um GE; funcionários, cargas, simulações e importações pertencem a ele **pela loja**; a importação de cadastro e a auditoria carregam o GE direto. Todo acesso ao banco recebe o GE de quem chama e filtra por ele; registro de outro GE responde "não encontrado". Um novo perfil, **operador da plataforma**, carrega o Excel da plataforma (vários GEs por arquivo; só lojas Ativado; conferir → confirmar, por CNPJ), criando os GEs que faltam. O empresário edita qualquer dado da loja (menos o CNPJ) e cadastra a equipe. Sem login: perfil e GE vêm de cabeçalhos escolhidos em tela; o SSO futuro só passa a preencher esses dois valores. Os dados de hoje migram para um GE inicial.

## For the reader

Chosen: o **GE é informado em cada chamada e conferido no servidor em toda consulta ao banco**, sem confiar na tela.

Why: assim, quando o login por SSO chegar, ele só diz "quem é e de qual GE", e a separação já está pronta e testada.

Chosen: a carga do operador usa **o relatório de lojas da plataforma** como ele já é (modelo igual para baixar), com conferência antes de gravar e identificação da loja pelo **CNPJ**.

Why: o operador envia o relatório que já tem, um só arquivo cria todos os GEs, e reenviar atualiza sem duplicar. Só lojas Ativado entram.

Chosen: o sistema **lembra o que veio do Excel** em cada loja; se o empresário corrigiu algo, a conferência do reenvio mostra e, por padrão, mantém a correção.

Why: nenhuma correção do empresário some sem o operador decidir.

Chosen: os dados de hoje vão para um **GE inicial** por migration, sem apagar nada.

Why: nada se perde e os diagnósticos continuam com os mesmos números.

## Technical Context

**Language/Version**: Node 22 + TypeScript (API), React + Vite + Tailwind (tela), como já está
**Primary Dependencies**: nenhuma nova (exceljs já lê e gera planilhas)
**Storage**: PostgreSQL 16; 1 tabela nova (`grupos_economicos`), colunas novas em `lojas`, `importacoes_cadastro`, `auditoria`; 1 migration escrita à mão com preenchimento dos dados atuais
**Testing**: Vitest (CNPJ, leitura e comparação do Excel, regras de reenvio) e Supertest contra `app_test` (isolamento entre dois GEs em **todas** as rotas, permissões dos perfis, carga ponta a ponta)
**Target Platform**: Docker Compose local
**Project Type**: web (api + front)
**Performance Goals**: Excel real (≈2.800 linhas, ≈1.800 ativas, ≈490 GEs) conferido em ≤ 60 s e gravado em ≤ 2 min (consultas em lote por CNPJ, uma só ida ao banco)
**Constraints**: nunca `down -v` nem `migrate reset`; valores em reais só para o dono do GE (operador não vê); regras legais seguem globais; o CNPJ nunca revela outro GE
**Scale/Scope**: dezenas de GEs, até alguns milhares de lojas no total

## Constitution Check

| Princípio | Situação |
|---|---|
| I Spec Kit | OK — spec e plano; tarefas dependem de aprovação |
| II Docker | OK — tudo roda no Compose |
| III Stack | OK — nada acrescentado |
| IV Migrations | OK — uma migration nova, sem mexer nas aplicadas |
| V Dados locais | OK — a migration só acrescenta e preenche; antes de aplicar, copia-se o estado (contagens) para conferir depois |
| VII Começar pequeno | OK — cinco fatias que terminam verdes |
| VIII Técnico é do agente | OK |

Sem violações. Reavaliado depois do desenho: igual.

## Project Structure

```text
backend/node/prisma/
├── schema.prisma                         # GrupoEconomico; geId em Loja, ImportacaoCadastro, Auditoria; ultimaCarga em Loja
└── migrations/20261029120000_multitenant_ge/   # tabela, colunas, GE inicial, preenchimento, índices únicos
backend/node/src/shared/
├── middlewares/perfil.ts                 # + PLATFORM_OPERATOR; lê X-GE, valida e põe geId em res.locals
├── middlewares/ge.ts (+test)             # contexto do GE (ativo, existe) e exigirGe()
└── auditoria/auditoria.ts                # grava o geId
backend/node/src/modules/
├── ge/                                   # CRUD de GE, lista com progresso, desativar
│   ├── ge.routes.ts / ge.service.ts / ge.repository.ts / ge.schemas.ts
│   └── cnpj.ts (+test)                   # normaliza e valida os dígitos verificadores
├── cargas-lojas/                         # Excel do operador
│   ├── carga-lojas.routes.ts / .service.ts / .repository.ts
│   ├── modelo-lojas.ts                   # planilha modelo (colunas fixas + instruções)
│   └── comparar.ts (+test)               # criar / atualizar / rejeitar / conflito com edição do empresário
├── cadastros/ escala/ simulacoes/ custos/  # recebem geId e filtram; loja só criada pelo operador
frontend/react/src/
├── api/client.js                         # envia X-Perfil e X-GE
├── App.jsx                               # perfil "Operador da plataforma", seletor de GE, GE sempre visível
└── features/ge/                          # lista de GEs, criar GE, enviar Excel, conferência
```

**Structure Decision**: `geId` é passado **explicitamente** a cada método de repositório (não por contexto escondido). Dá mais linhas, mas cada consulta mostra seu filtro e o teste de isolamento consegue provar rota por rota. O GE é guardado só em `lojas`, `importacoes_cadastro` e `auditoria`; o resto herda pela loja, evitando dado inconsistente.

## Fatias de entrega

1. **Banco e GE inicial:** schema, migration, GE inicial com os dados de hoje, conferência de contagens antes/depois.
2. **Contexto do GE e isolamento:** cabeçalho `X-GE`, perfil de operador, `geId` em todos os repositórios existentes, auditoria com GE; testes com dois GEs em todas as rotas; os testes atuais passam a rodar dentro de um GE.
3. **CNPJ e permissões da loja:** CNPJ válido e único; criar/remover loja só pelo operador; empresário edita tudo menos o CNPJ; código único dentro do GE; planilha de funcionários só aceita lojas do GE.
4. **GE e carga de lojas por Excel:** CRUD/desativar GE, lista com progresso, modelo, conferir, confirmar, reenvio por CNPJ, conflito com edição do empresário.
5. **Tela e fechamento:** seletor de perfil e GE, tela do operador, Cadastros do empresário sem criar/remover loja, README, `sync-templates`, conferência final.

## Riscos

- **Sem login, quem altera o cabeçalho vê outro GE.** Aceito nesta fase (decidido); vai para o README e para o aviso do SSO.
- **Lista de GEs aberta a todos** para a escolha em tela. Só nome e identificação, também decidido como provisório; some com o SSO.
- **Muitos pontos de consulta** (cerca de 50). Mitigado pelo teste que percorre todas as rotas com o GE errado.
