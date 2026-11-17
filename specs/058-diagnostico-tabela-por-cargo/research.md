# Research — spec 058

## 1. Onde estão os números por cargo
Decision: ler `regra.funcoes[]` de cada regra (campos `pessoas`, `capacidadeH`, `necessidadeH`, `gapH`, `saldoH`, `contratar`, `obrigatorio`, `origemMeta`, `sugestao.horasContratadas`, `cargaCheiaH`, `saldoT`).
Rationale: é a mesma fonte de "Contratações sugeridas" e dos cenários; a conta não muda.
Alternatives: recalcular na tela (duplica regra, risco de divergência) — descartado.

## 2. Hoje → com a sugestão
Decision: pessoas depois = `pessoas + contratar`; horas depois = `capacidadeH + horasContratadas da sugestão`; falta depois = `max(0, gapH − horasContratadas)`; "hoje" usa os valores atuais. Equipe toda: soma dos cargos, e folga = capacidade − necessidade (como `resumo.saldoHoras`), depois = folga + horas contratadas.
Rationale: espelha a sugestão que o servidor já calcula.
Alternatives: pedir ao servidor um campo "depois" — desnecessário, são somas simples.

## 3. "Obrigatório" / "Desejável" / "Sem falta"
Decision: farmacêutico = Obrigatório (`obrigatorio`); outro cargo = Desejável quando `contratar > 0` (a contratação existe para manter o nível de hoje, `ehDesejavel`), senão Sem falta.
Rationale: mesma regra já usada nos chips e nos cenários.

## 4. Loja aberta na semana
Decision: `diag.loja.horasAbertas` (já enviado pelo servidor).

## 5. Permissões
Decision: manter o servidor como está: `folhaMensal` e `faturamentoMensal` só existem para o dono. No card, gestor/consulta não veem a folha em R$ nem o faturamento. "Aumenta/Igual/Diminui" só aparece se houver variação a comparar; o Diagnóstico mostra a folha atual (sem variação), então para esses perfis o bloco da folha simplesmente não aparece. Um teste de integração confirma que a resposta não traz esses campos.
Rationale: não abrir dado de custo; a spec pede a regra no servidor.

## 6. Cores fora do design system
Decision: pílula rosa → `--func-warning-50`/`--func-attention-100` (o mais próximo já usado no card); barra vermelha → `--func-danger-300` (ou o token de erro mais próximo); tags por cargo → `corDaFuncao` já existente. Comentário no código em cada uso.

## 7. Acessibilidade
Decision: `<table>` com `th scope`; barras com `role="img"` e `aria-label` ("42h: faltam 21h por semana"); botão "i" nativo (Enter/Espaço) com `aria-label="Como a folha é calculada"` reaproveitando `DicaComposicao`.
