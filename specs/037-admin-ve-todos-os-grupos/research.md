# Research: Admin do Radar vê todos os grupos

## 1. Onde montar a lista

- **Decision**: no `Sso/Exchange` da API de autenticação, depois de validar o código e carregar a pessoa com o papel.
- **Rationale**: é chamado de servidor para servidor, com as credenciais da calculadora, e a calculadora já o chama. Nada novo para configurar.
- **Alternatives considered**:
  - `Payload` do `Sso/Start`: rejeitado, vem do navegador e pode ser alterado.
  - Montar no `Sso/Start` e guardar junto com o código: funciona, mas guarda dados no cache sem ganho; o resultado é o mesmo no `Exchange`.
  - `SessionInfo`: rejeitado, é usado por todos os webapps do Radar; mudar a lista de lojas de lá afeta o Radar inteiro.
  - Calculadora chamar `EconomicGroup/AllOnlyIdAndName`: rejeitado pelo negócio (chamada e configuração novas).

## 2. Regra da lista

- **Admin** (`roles.Name = 'Admin'`): todos os grupos de `economic_group`, `FullAccess = true`, mais os grupos das lojas vinculadas (já contidos na lista, mas a junção é por id para não depender disso).
- **Demais papéis**: os grupos das lojas em `store_users` da pessoa, `FullAccess = false`.
- **Junção**: um grupo aparece uma vez; se vier das duas origens, vale `FullAccess = true`. Ordem por nome.
- **Lojas sem grupo**: não geram grupo.
- **Partner** (fornecedor, distribuidor): não tem lojas, a lista sai vazia; a calculadora já recusa essas contas pela permissão.
- A regra fica numa classe pura (`SsoEconomicGroups`), testada no xUnit; as duas consultas ficam no comando.

## 3. Uso na calculadora

- `trocarCodigo` passa a devolver `{ accessToken, economicGroups? }`. Campo ausente ou nulo: regra de hoje (FR-011).
- Grupos com `fullAccess = true`: criados se faltarem (`identificacao = String(id)`, `nome`), sem sobrescrever; os ativos entram na sessão com `acessoTotal: true` e `lojaIds: []`. A guarda de lojas já libera quem tem `acessoTotal`.
- Grupos com `fullAccess = false`: ignorados como lista; o acesso parcial continua vindo das lojas do `SessionInfo`, que trazem o CNPJ para criar as lojas.
- Grupo que aparece nas duas origens: vale o acesso total.
- Sessão sem nenhum grupo: tela de sem acesso, como hoje. O Admin sem lojas vinculadas passa, porque recebe os grupos inteiros.

## 4. Tamanho da sessão

- **Decision**: guardar a lista de grupos do Admin na coluna `grupos` da sessão, como para os demais.
- **Rationale**: nenhuma regra nova na guarda de grupos e lojas, nem migration. Cerca de 100 bytes por grupo.
- **Alternative considered**: uma marca "acesso a todos" na sessão. Menor, mas abre um segundo caminho de autorização em `ge.ts`, `guarda-de-lojas.ts` e no corpo da sessão. Fica como saída se o volume crescer.

## 5. Desempenho no login

- No Radar: uma consulta simples em `economic_group` (id e nome).
- Na calculadora: um `createMany` com `skipDuplicates` para os grupos que faltam e um `findMany` por `identificacao`, dentro da transação que já existe. Até 2.000 linhas cabem com folga em 5 s.
