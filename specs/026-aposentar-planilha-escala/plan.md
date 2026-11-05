# Implementation Plan: Aposentar a planilha de escala

**Branch**: `feat/aposentar-planilha-escala` | **Date**: 2026-11-05 | **Spec**: [spec.md](spec.md)

## Summary

O Diagnóstico e a Simulação passam a ler só os funcionários do Cadastro. Duas colunas novas (início e fim do intervalo) entram no funcionário, na planilha de funcionários, no modelo para baixar e na tela de Equipe. Um script de migração, com ensaio antes de gravar, copia as escalas já importadas para o Cadastro (só onde está vazio). Depois disso saem o envio e o modelo da planilha de escala, a pendência de "linhas rejeitadas na importação da escala" e os textos que mandavam importar a escala, inclusive o aviso da Simulação.

## For the reader

Chosen: o Cadastro vira a única fonte da equipe; a escala importada é copiada para lá uma vez, e o envio dela sai da tela e da API.

Why: já existe o caminho que lê a equipe do Cadastro (é o que o Diagnóstico usa hoje para quem não está na planilha); só faltava o intervalo, que é acrescentado, e garantir que ninguém perca dado.

## Technical Context

**Language/Version**: TypeScript (Node 20) no servidor; React 18 + Vite + Tailwind na tela
**Primary Dependencies**: as já usadas; sem biblioteca nova
**Storage**: PostgreSQL; **1 migration** (duas colunas novas em `funcionarios`: `ini_intervalo` e `fim_intervalo`, horas decimais, opcionais, como entrada e saída). Nada é apagado.
**Testing**: Vitest no servidor (validação do intervalo, importação, cobertura com intervalo, migração, diagnóstico sem escala importada, simulação a partir do Cadastro) e na tela (formulário de funcionário); conferência no navegador
**Target Platform**: Docker Compose local; a migração dos dados roda na produção com o mesmo script (ensaio primeiro)
**Performance Goals**: sem efeito mensurável
**Constraints**: nenhum dado do Cadastro é sobrescrito; nenhum dado de escala importada é apagado; valores e permissões como hoje; planilha de funcionários antiga (sem as colunas novas) continua válida
**Scale/Scope**: 1 migration, 1 script, ~8 arquivos de servidor, ~5 de tela

## Constitution Check

- I. Spec Kit: cumprido (spec 026 → plano → tarefas → implementação).
- II. Docker: testes e conferência no ambiente local.
- III. Stack: a existente.
- IV. Banco só muda por migration: **cumprido**, 1 migration do Prisma para as colunas novas; o script de migração de dados é separado e só escreve nos campos vazios.
- V. Dados locais protegidos: o script roda em ensaio por padrão (`--aplicar` para gravar) e nunca apaga; as tabelas de escala ficam.
- VI/VIII. Linguagem simples e técnico do agente: cumprido.
- VII. Começar pequeno: não apaga tabelas antigas, não mexe na Base comercial.

Resultado: sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/026-aposentar-planilha-escala/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/cadastro-intervalo.md
└── tasks.md   # /speckit-tasks
```

### Source Code

```text
backend/node/
├── prisma/
│   ├── schema.prisma                                  # funcionarios.iniIntervalo / fimIntervalo
│   ├── migrations/<data>_intervalo_funcionario/       # as duas colunas
│   └── migrar-escala-para-cadastro.ts                 # ensaio + --aplicar + relatório (npm run migrar-escala)
└── src/modules/
    ├── planilhas/campos.ts, modelo.ts                 # colunas e exemplo do intervalo; sai o modelo da escala
    ├── cadastros/
    │   ├── processar.ts                               # lê e valida o intervalo na importação
    │   ├── cadastros.schemas.ts, cadastros.service.ts # validação na tela (HH:MM, dois juntos, dentro do turno)
    │   └── cadastros.repository.ts                    # grava e devolve o intervalo
    ├── escala/
    │   ├── escala.repository.ts                       # turnosDoCadastro com intervalo; sai escalaAtiva e a gravação da escala
    │   ├── escala.service.ts                          # diagnóstico só do Cadastro; sai o envio da escala e a divergência
    │   ├── escala.routes.ts                           # saem /cargas/escala e /planilha-modelo-escala
    │   └── diagnostico.ts                             # textos do estado "sem horário"; sai a pendência de linhas rejeitadas
    └── simulacoes/simulacoes.service.ts               # equipe do Cadastro (e turnos) em vez da escala importada; mensagens novas

frontend/react/src/features/
├── diagnostico/{EnviarPlanilhas,Diagnostico,Comparativo,QuadroCentral}.jsx   # só Base comercial; textos e avisos novos
└── cadastro-loja/{FormFuncionario.jsx,equipe.js,AbaEquipe.jsx}              # campos e validação do intervalo
```

## Design

**Intervalo no funcionário.** Duas colunas opcionais, em horas decimais como entrada e saída. Regras (as mesmas na planilha e na tela): os dois juntos ou nenhum; fim depois do início; os dois dentro do turno (entrada ≤ início e fim ≤ saída); formato HH:MM. A cobertura por hora e a redistribuição já sabem usar o intervalo (`cobertura.ts` e `distribuir-parcial.ts`); só passam a recebê-lo do Cadastro.

**Equipe do Diagnóstico só do Cadastro.** `turnosDoCadastro` devolve o intervalo; o diagnóstico para de buscar a escala importada, de mesclar as duas fontes e de calcular "divergências". O estado "sem horário" diz para cadastrar o horário dos funcionários. A pendência de linhas rejeitadas e a fonte "escala importada" saem do quadro; o campo continua na resposta como zero por compatibilidade, para não quebrar a tela durante a troca.

**Simulação.** `origem: escala_atual` continua existindo no contrato (a tela envia esse valor), mas passa a significar "a equipe do Cadastro com horários": o quadro vem dos funcionários (função no cálculo e carga) e os turnos, dos horários deles. Sem nenhum funcionário com horário, a tela cai em "do zero" (quadro do Cadastro, sem turnos) com o aviso novo. **O aviso desatualizado fica assim:** "Esta loja ainda não tem funcionários com horário no Cadastro: a simulação parte do quadro do Cadastro, sem horários. Contratações, horários e impacto já funcionam; para ver a cobertura de quem já trabalha, cadastre o horário dos funcionários em Cadastros › Equipe." O texto que o servidor devolve nesse caso também muda ("Cadastre o horário dos funcionários da loja antes de criar a simulação a partir da equipe."), e a tela deixa de depender do texto antigo para decidir o fallback (passa a usar um código de erro).

**Migração de dados.** Script `npm run migrar-escala` (dentro do container da API): por padrão só mostra o que faria (ensaio); com `--aplicar` grava, numa transação por loja. Para cada loja com escala importada ativa e cada turno dela, acha o funcionário da mesma loja e matrícula e preenche só o que está vazio: dias, entrada, saída, intervalo (início e fim), função de escala e carga semanal. Não cria funcionários, não sobrescreve, e pode rodar de novo sem mudar nada. O relatório lista por loja: preenchidos, que já tinham dados, e pessoas sem correspondente.

**Envio de planilhas.** A tela deixa só a Base comercial; a API perde as rotas da escala. A leitura da planilha de escala (`interpretar.ts` e os campos) sai do caminho do envio; o que for de uso comum com a Base comercial fica.

## Complexity Tracking

Sem violações a justificar.
