# Implementation Plan: Base comercial por CNPJ (julho a outubro)

**Branch**: `feat/base-comercial-jul-out` | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/036-base-comercial-por-cnpj/spec.md`

## Summary

O importador de base comercial passa a reconhecer o arquivo por CNPJ e dia da semana. Ele converte o total do período em média de um dia, grava venda, CMV, clientes e unidades por loja (substituindo a base ativa, que fica guardada como inativa) e preenche o Cadastro só onde está vazio. A tela de envio ganha os campos do período e uma conferência maior. O formato antigo (código da loja e data) continua igual.

## For the reader

Chosen: o arquivo é lido como "total de julho a outubro" e cada valor é dividido pelas vezes que o dia da semana aparece, para guardar a média de um dia.

Why: é o formato que os cálculos já esperam; sem a divisão, as vendas ficariam 17 vezes maiores.

Chosen: clientes e unidades passam a guardar decimais.

Why: a média de tickets por hora não é inteira, e arredondar perderia o dado das horas de pouco movimento.

Chosen: corrigir o leitor de planilhas para arquivos grandes e subir o limite de 10 para 20 MB.

Why: o leitor atual quebra com mais de uns 125 mil linhas, e o arquivo tem 185 mil.

## Technical Context

**Language/Version**: Node 22 + TypeScript (API); React 18 + Vite + Tailwind (tela)

**Primary Dependencies**: as que o projeto já usa; nenhuma nova

**Storage**: PostgreSQL; uma migration (clientes e unidades de inteiro para decimal em `vendas_hora`)

**Testing**: Vitest (unidade e tela) e testes de integração da API (incluindo a migration)

**Target Platform**: web

**Project Type**: web (API + tela)

**Performance Goals**: importação de 185 mil linhas e 1.791 lojas em menos de 45 s

**Constraints**: nada é apagado (base antiga fica inativa); valores em reais só para o dono; formato atual intacto

**Scale/Scope**: 1 módulo novo de leitura (`base-por-cnpj.ts`), ajustes no serviço e repositório da base, correção do leitor, migration, mudanças na tela de envio

## Constitution Check

- I (Spec Kit): spec aprovada; plano e tarefas passam pelo seu OK antes de código. ✔
- II, V (Docker, dados protegidos): backup do banco antes da importação real; nenhum comando destrutivo; a base antiga não é apagada. ✔
- III (Stack): sem tecnologia nova. ✔
- IV (Banco só muda por migration): a troca de tipo vai por migration versionada. ✔
- VII (Começar pequeno): só o necessário para subir a base; ticket médio e usos de clientes e unidades ficam fora. ✔

Gate aprovado; reavaliado depois do desenho, segue aprovado.

## Project Structure

### Documentation (this feature)

```text
specs/036-base-comercial-por-cnpj/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── importacao-base-por-cnpj.md
└── tasks.md   # etapa seguinte
```

### Source Code (repository root)

```text
backend/node/prisma/migrations/<data>_clientes_e_unidades_decimais/   # NOVO
backend/node/src/shared/middlewares/upload.ts          # limite de 20 MB
backend/node/src/modules/planilhas/leitor.ts           # largura sem espalhar a lista (arquivos grandes)
backend/node/src/modules/escala/
├── base-por-cnpj.ts            # NOVO: reconhecer o formato, validar linhas, converter para média de um dia, avisos
├── base-por-cnpj.test.ts       # NOVO
├── escala.service.ts           # revisar e importar escolhem o formato; casam lojas por CNPJ
├── escala.repository.ts        # lojas do GE por CNPJ; gravar base em lote; preencher faturamento vazio
├── escala.routes.ts            # lê período do formulário
├── escala.schemas.ts           # período
└── escala.routes.integration.test.ts
frontend/react/src/features/diagnostico/
├── ModalEnviarBase.jsx         # campos do período e conferência do formato novo
└── base.js(+test)              # regras puras: texto da conferência, avisos
```

**Structure Decision**: a conversão é uma função pura em `base-por-cnpj.ts`; o serviço só escolhe o formato e grava. Os cálculos de cenários e Simulação não mudam.

## Design

1. **Reconhecer o formato.** O cabeçalho com `cnpj`, `dia_semana` e `faturamento` ativa o formato por CNPJ. Sem eles, o fluxo atual segue como está.
2. **Período.** Vem do formulário (início e fim). Sem ele, a conferência devolve `precisaPeriodo`; a importação recusa com `PERIODO_INVALIDO`. Conta as vezes de cada dia da semana dentro do período, inclusive.
3. **Ler linhas.** Valida CNPJ (14 dígitos), dia (1 a 7), hora (0 a 23) e faturamento (número maior ou igual a zero). Soma linhas repetidas da mesma loja, dia e hora e divide pelo número de vezes do dia. Usa a data de referência do dia (primeira ocorrência no período).
4. **Avisos.** Linha zerada, unidades menores que clientes, CMV maior que a venda e loja com menos de 6 dias da semana. Só informam.
5. **Casar lojas.** Lê as lojas do GE uma vez e casa pelos 14 dígitos. Sem loja: lista e ignora.
6. **Gravar.** Por loja, numa transação: a base ativa vira inativa, a nova entra em lote e o faturamento do Cadastro é preenchido só onde vazio. Algumas lojas em paralelo; falha de uma loja aparece no resultado sem desfazer as outras.
7. **Resposta.** Só contagens e listas de CNPJ; nenhum valor em reais.
8. **Leitor e limite.** Troca a largura por uma soma acumulada e sobe o limite do envio para 20 MB.
9. **Migration.** `clientes` e `unidades` de `vendas_hora` passam a decimal; o esquema do Prisma acompanha.
10. **Tela.** O modal detecta o formato na revisão, pede o período, mostra lojas substituídas, mantidas, sem cadastro, o que preenche no Cadastro e os avisos; a pessoa confirma.
11. **Carga da rede inteira.** Um comando (`npm run importar-base-cnpj`, no molde do `migrar-escala`) lê o arquivo uma vez, casa os CNPJs com as lojas de todos os grupos e grava com a mesma função da tela; sem `--aplicar` é só um ensaio com os números. Descoberto na implementação: o arquivo tem lojas de 486 grupos e a tela enxerga um grupo por vez.
12. **Voltar atrás.** A base anterior fica inativa no banco; não há tela para reativá-la, isso fica por comando, com autorização.

## Complexity Tracking

Nenhuma violação a justificar. Riscos: tempo da importação (medido no quickstart; plano B em segundo plano, em outra fatia) e memória do leitor com 15 MB (medida na implementação).
