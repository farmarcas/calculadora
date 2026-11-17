# Implementation Plan: Novo layout do parecer do cenário (modal e PDF)

**Branch**: `feat/coluna-folha-no-faturamento` | **Date**: 2026-11-12 | **Spec**: [spec.md](spec.md)

## Summary

O servidor passa a montar o parecer **já organizado para o novo layout** (chip de status, parágrafo, três cartões e a tabela "O que muda", com todos os textos e números já formatados em pt-BR e as versões do dono e do público). A modal e o PDF só desenham o que vem pronto, então os dois mostram sempre o mesmo conteúdo e o servidor garante que gestor e consulta nunca recebem valores em reais. A modal ganha rodapé fixo, foco preso e retorno do foco; o PDF é redesenhado em uma página com cabeçalho com logo, rodapé com "Página n de total" e quebra antes da tabela. O cálculo não muda.

## For the reader

Chosen: o parecer guardado passa para a **versão 2**, com a estrutura nova; pareceres da versão 1 (os salvos há pouco, na spec 056) abrem montados na hora no layout novo, com o aviso de "montado agora".

Why: o layout exige dados que a versão 1 (só frases) não tem, como "hoje" e "com o cenário" lado a lado; remontar na hora é o que a spec já prevê para cenários antigos.

Chosen: textos e números chegam do servidor já formatados e com o tom de cada chip (âmbar, verde ou neutro).

Why: modal e PDF não podem divergir, e a regra de "sem valores em reais" fica num lugar só.

Chosen: a observação que a pessoa escreveu ao salvar continua aparecendo, em um quadro depois da tabela (na modal e no PDF), e o resultado do "horário a mais" também, só para o dono.

Why: o board não os mostra, mas a spec 056 os pede e tirar a observação apagaria algo que a pessoa escreveu.

Chosen: o foco preso, o Esc e o retorno do foco entram na janela padrão do sistema (`Modal`), com rodapé fixo opcional.

Why: todas as janelas ganham o mesmo comportamento acessível, e o parecer só usa.

## Technical Context

- **Servidor** (`backend/node/src/modules/simulacoes/`):
  - `parecer.ts`: nova forma `ParecerV2 = { status, paragrafo, cartoes: { folha, equipe, farmaceutico }, tabela: { linhas }, horarioAMais? }` montada em `montarParecer` (versão 2) a partir do `ResultadoSimulacao` já calculado; `dono` e `publico` prontos. Textos: parágrafo em frases curtas sem rótulos ("Contratando…", "Ninguém é desligado,", "o horário continua igual ao do Cadastro", "e todos trabalham 5 dias por semana e folgam 2.", "A venda não muda, mas a folha pesa mais no faturamento."), "42h por semana" no lugar de "jornada cheia", desejáveis marcados. Cartão da folha: peso depois, chip com a **diferença dos pesos arredondados** (`aumentoPp`), "hoje X% · R$ Y a mais por mês" (Y = folha depois − folha hoje, como exibida). Público: "Custo de pessoal", "—", "sem valores em reais", chip Aumenta/Igual/Diminui, ou "Dados do custo ainda não informados.".
  - `simulacoes.service.ts`: `parecer()` devolve `{ id, nome, loja, regra ("Regra de 42h"), numeroCenario, salvoEm, salvoPor, observacao, status, paragrafo, cartoes, tabela, horarioAMais, montadoAgora }` na versão do perfil; versão 1 ou ausente é remontada. `parecerPdf()` gera o arquivo com o mesmo objeto e nome `parecer-{loja}-cenario-{n}.pdf`.
  - `parecer-pdf.ts`: layout novo em A4 com `bufferPages` para escrever "Página n de total" depois; quebra antes de "O que muda" quando a tabela inteira não cabe; linhas da tabela nunca cortadas.
- **Tela** (`frontend/react/src/`):
  - `components/ui/index.jsx` → `Modal`: props opcionais `subtitulo` e `rodape` (fora da rolagem), foco preso (helper puro em `components/ui/foco.js` com teste), foco inicial na janela e **devolução do foco** ao fechar.
  - `api/client.js` → `baixarArquivo`: erro de resposta (não 2xx) vira `ApiError` em vez de baixar um arquivo de erro.
  - `features/grade/ParecerDoCenario.jsx` (+ `ParecerCartoes.jsx`, `ParecerTabela.jsx`) e `parecer-regras.js`: chip, parágrafo (14 px, line-height 1,6), três cartões, tabela, quadro da observação, rodapé com "Fechar" e "Baixar parecer em PDF" (carregando com indicador e desabilitado; erro com "Tentar de novo"), rodapé com o aviso para gestor e consulta.
  - Chips âmbar e verde usam os tokens `--chip-aumenta-*` e `--chip-diminui-*` já criados (comentário no código: fora do DS).
- **Testes**: Vitest do `montarParecer` v2 (Cosmópolis dono e público, folha igual, folha que cai, sem salários, sem faturamento, desligados, horário a mais, desejáveis, sem "jornada cheia"), do PDF (uma página, "Página 1 de 1", nome do arquivo, quebra antes da tabela com conteúdo longo, texto do público sem "R$"), da tela (regras de texto, foco preso) e integração (parecer e PDF por perfil, cenário v1 remontado).

## Constitution Check

Sem conflito: linguagem simples; valores em reais só para o dono, garantidos no servidor; nenhuma dependência nova; sem mudança de banco.

## Project Structure

```text
specs/057-parecer-novo-layout/  spec · plan · research · quickstart · tasks
backend/node/src/modules/simulacoes/parecer.ts · parecer-pdf.ts · simulacoes.{service,routes}.ts (+ testes)
frontend/react/src/components/ui/index.jsx (Modal) · foco.js (+ teste)
frontend/react/src/api/client.js
frontend/react/src/features/grade/ParecerDoCenario.jsx · ParecerCartoes.jsx · ParecerTabela.jsx · parecer-regras.js (+ teste)
templates/ (sincronizado) · README.md
```

## Complexity Tracking

Nenhuma violação a justificar.
