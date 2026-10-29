# Contagens antes e depois da migration (fatia 1)

Conferência feita em 2026-10-29 no banco local. Nada foi apagado.

| Tabela | Antes | Depois |
|---|---|---|
| lojas | 39 | 39 |
| funcionarios | 11 | 11 |
| simulacoes | 6 | 6 |
| importacoes_cadastro | 3 | 3 |
| auditoria | 63 | 63 |
| cargas | 3 | 3 |
| batidas | 237 | 237 |

- Diagnóstico da loja 001 (perfil dono): mesmo conteúdo antes e depois (resumo SHA-256 `bda18a9c…fcff14f`).
- Todas as lojas, importações e registros de auditoria existentes foram para o "Grupo inicial".
- CNPJs existentes passaram a ter só os 14 dígitos. Duas lojas ativas repetiam o mesmo CNPJ (003 Guarulhos e a filial 07, código 6): a mais antiga (003) manteve; a filial 07 ficou com "CNPJ pendente". Hoje 2 lojas estão sem CNPJ (essa e a 002).
- `prisma migrate diff` entre o banco e o schema: sem diferença.
