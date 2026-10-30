# Implementation Plan: Importação em massa do cadastro de loja

**Branch**: `feat/importacao-em-massa` | **Date**: 2026-10-30 | **Spec**: [spec.md](spec.md)

## Summary

A importação já existe (enviar → conferir o mapeamento → gravar). O trabalho é **completar o modelo e a gravação** com o que o cadastro pede hoje e **simplificar a tela**: título "Cadastro de Loja", um botão "Importar em massa" (ícone de upload) que abre o modal, e o "Baixar planilha modelo" dentro dele. Não há tela nova nem tabela nova: a configuração e os custos já moram na loja (`convencao_8h24`, `minimos`, `custos`) e o horário fixo é a coluna que já existe no funcionário.

## Technical Context

**Stack (a do projeto, preservada)**: Node 22 + TypeScript + Express 5 + Zod 4 + Prisma 7 + exceljs + Vitest; React 18 + Vite + Tailwind.
**Banco**: nenhuma migration. `lojas.convencao_8h24`, `lojas.minimos`, `lojas.custos` e `funcionarios.horario_fixo` já existem.
**Testes**: unitários do interpretador de linhas e do modelo; integração das rotas de importação (operador, dono, gestor).
**Multitenant**: repositórios continuam presos ao GE (`X-GE`); a importação só toca lojas e funcionários do GE.
**Escala**: dezenas a centenas de lojas por arquivo; o processamento é linha a linha, como hoje.

## Decisões

1. **Campos novos entram nas listas de campos** (`CAMPOS_LOJA`, `CAMPOS_FUNCIONARIO`): quem gera o modelo, quem infere as colunas e quem lê as linhas usam a mesma lista, então o modelo e a importação não se separam.
2. **Colunas novas**
   - Lojas: `convencao_8h24` (Sim/Não), `meta_<função>` ×5 (pessoas por hora), `salario_<função>` ×5, `encargos_pct`.
   - Funcionários: `horario_fixo` (Sim/Não).
3. **Gravação**: o interpretador devolve, por loja, um bloco `configuracao` (`convencao8h24`, `minimos`, `custos`). O serviço grava em `lojas` com **mescla** (só o que veio preenchido), por um método novo do repositório de cadastros; célula vazia não apaga.
4. **Permissões na confirmação** (muda o ramo hoje fixo em "só o operador importa lojas"):
   - **Operador**: tudo, como hoje (cria e atualiza lojas).
   - **Dono**: só **lojas existentes** do GE (atualiza horário, faturamento, margem, convenção, metas e custos); loja inexistente vira erro "Loja não cadastrada: só o operador cria lojas"; `cnpj` e `codigo` não mudam (CNPJ diferente é ignorado com aviso).
   - **Gestor**: a aba Lojas é **ignorada com aviso** (não dá erro 403 para a planilha inteira, para não perder a equipe).
   - Salário, encargos, faturamento e margem: só o dono; para os outros perfis as colunas são ignoradas e citadas no resumo.
5. **Resumo** ganha `avisos: string[]` (o que foi ignorado por permissão ou por conflito leve). Os erros de linha seguem `{ aba, linha, motivo }`; o `linha: 0` das mensagens de loja passa a ter o número real da linha.
6. **Validação**: Sim/Não com os mesmos valores já aceitos para "Loja 24h" (`sim, s, x, true, 1, yes` e o oposto); metas inteiras de 0 a 10 (Farmacêutico ≥ 1); encargos de 0 a 300; salário > 0. Linha inválida não entra e o motivo cita a coluna.
7. **Custos incompletos**: `custos` exige `encargosPct`; se a planilha traz salário mas não encargos e a loja não tem encargos gravados, o custo não é gravado e o resumo explica.
8. **Tela**:
   - `CadastrosPage`: `h1` "Cadastro de Loja"; um `Botao` "Importar em massa" com ícone de upload (SVG de traço, Lucide, em `components/ui`); some o botão "Baixar planilha modelo". O botão aparece para quem cuida do grupo ou é operador (como hoje).
   - `ImportarPlanilha`: o botão "Baixar planilha modelo" entra no topo da etapa de envio; `podeLojas` passa a valer para operador **e** dono; textos novos explicando as duas abas.
   - O resumo mostra os avisos.
9. **Planilha modelo**: as duas abas de dados continuam; a aba "Como preencher" ganha a explicação das colunas novas e de quem pode preencher o quê. Linha 2 segue como exemplo.
10. **Compatibilidade**: planilhas antigas (sem as colunas novas) importam como antes: coluna ausente não entra no mapeamento e nada é apagado.

## Project Structure

```text
backend/node/src/modules/
├── planilhas/campos.ts            # campos novos (loja e funcionário)
├── planilhas/modelo.ts            # aba "Como preencher" com as colunas novas
├── cadastros/processar.ts         # lê convenção, metas, salários, encargos, horário fixo
├── cadastros/cadastros.service.ts # confirmação por perfil, avisos, gravação da configuração
├── cadastros/cadastros.repository.ts # gravar configuração e custos com mescla
└── cadastros/*.test.ts            # unitários e integração
frontend/react/src/
├── components/ui/index.jsx        # ícone de upload
├── features/cadastros/CadastrosPage.jsx
└── features/cadastros/ImportarPlanilha.jsx
```

## Fatias

1. **Modelo e leitura (US2)**: campos novos, modelo, interpretador, testes à mão.
2. **Gravação e permissões (US2 + US3)**: serviço e repositório, dono atualiza lojas, avisos, testes de integração.
3. **Tela (US1 + US4)**: título, botão único com ícone, modal com o modelo dentro, resumo com avisos.
4. **Fechamento**: README, templates, conferência final com uma planilha de verdade (grupo 216).

## Riscos

- **Custo no resumo**: planilha com salário sem encargos grava nada de custo: avisar claramente.
- **Dono sobrescrevendo dado do operador**: só altera campos que o dono já edita na tela; nunca código, CNPJ nem criação de loja.
- **Planilha grande**: gravar linha a linha pode demorar; medir no grupo 216 (37 lojas) e, se passar de alguns segundos, agrupar as gravações.
