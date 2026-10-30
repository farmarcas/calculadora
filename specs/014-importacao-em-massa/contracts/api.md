# Contrato: importação em massa

Sem rota nova. Mudam só as respostas e a permissão.

- `POST /api/v1/importacoes/cadastro` (enviar): igual; a resposta de `campos` passa a listar as colunas novas.
- `POST /api/v1/importacoes/cadastro/:id/confirmar`:
  - **Permissão**: `PLATFORM_OPERATOR` e `TENANT_ADMIN` importam a aba Lojas (o dono só atualiza lojas existentes); `SCHEDULE_MANAGER` importa só Funcionários e a aba Lojas é ignorada com aviso; `SCHEDULE_VIEWER` segue sem permissão. O 403 `SEM_PERMISSAO` deixa de existir para o dono ao enviar a aba Lojas.
  - **Resposta**: `{ lojas, funcionarios, erros, avisos }`; `erros[].linha` com o número real da linha.
- `GET /api/v1/planilha-modelo`: o arquivo passa a trazer as colunas novas e a ajuda atualizada.
