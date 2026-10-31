# Tarefas: Diagnóstico — "De onde vêm esses números"

## Fatia 1 — Estimativa de 8h24 (servidor)
- [x] T001 `diagnostico.ts`: incluir `regras[r42].com8h24` (verificação de 42h com a convenção ligada, via `verificarRegra` e `regraPara`), só quando a convenção da loja está desligada; nada existente muda
- [x] T002 Testes: convenção desligada traz o campo e ele reduz (ou não) as horas que faltam; convenção ligada não traz; os demais campos do Diagnóstico ficam idênticos; valores sem R$ para qualquer perfil
- [x] T003 Rodar tudo e commitar a fatia

## Fatia 2 — Montador e contas puras (tela)
- [x] T004 `onde-vem/montar.js`: eixo de horas, recorte de turno ao horário da loja (todos visíveis, mesmo sobrepostos), `isHoraPico` (≥ 75% do maior), `buildObservacaoPico`, vendas fora do horário, estados de cada célula (atende, abaixo, fora)
- [x] T005 `montar.js`: view-model da aba 2 (status "Atende"/"Falta …", saldos em texto, barra com escala comum por função, texto da regra de 42h conforme a convenção, bloco de 8h24 só quando relevante) e da aba 3 (grupos com totais, situação, turno e dias)
- [x] T006 `montar.test.js`: pico, observação (quando mostra e quando não), cobertura com horas fora do horário, recorte de turno e sobreposição, capacidade e saldo por regra (inclusive 8h24), estimativa de 8h24 (quando exibir), linha do tempo; commitar a fatia

## Fatia 3 — Cartão, abas e aba "Cobertura e vendas"
- [x] T007 `OndeVemSecao.jsx`: título e subtítulo por aba, abas acessíveis (tablist, setas, foco), aba em `?aba=`, carregamento, erro com "Tentar de novo", nota "Valores das regras ainda sem validação jurídica." uma vez abaixo do cartão
- [x] T008 `GradeCobertura.jsx` e `AbaCobertura.jsx`: grade única (turnos, vendas com picos, cobertura por função; ▲ e rótulo no abaixo do mínimo; horas fora listradas; legenda), observação, "Vendas fora do horário", "Editar mínimos", vazios (sem vendas, sem turnos), rolagem horizontal com a primeira coluna fixa
- [x] T009 Ligar em `Diagnostico.jsx` no lugar dos blocos que saem (Quadro por turno, Cobertura, Horários de maior venda), mantendo o resto; conferir no navegador e commitar a fatia

## Fatia 4 — Aba "Resultado por regra"
- [x] T010 `TabelaRegras.jsx`: cabeçalho de cada regra (nome, vigência, resumo, "Atende"/"Falta …"), coluna da regra escolhida no topo destacada, linhas por função (capacidade, pessoas × horas, saldo em texto, turnos do farmacêutico, "Precisa de …"), barras com escala comum, legenda
- [x] T011 `BlocoOito24.jsx`: "E se a convenção coletiva permitir 8h24 por dia?" só quando "Não permite" e a estimativa melhora; link "Alterar em Regras e custos"
- [x] T012 Tirar do Diagnóstico "Quadro por função" e "Verificação por regra"; conferir e commitar a fatia

## Fatia 5 — Aba "Equipe no cálculo (N)"
- [x] T013 `AbaEquipe.jsx` e `LinhaDoTempo.jsx`: faixa superior (totais e links), tabela agrupada por função com totais, situação "No cálculo"/"Fora do cálculo", linha do tempo com parte fora do horário listrada, legenda, "Mostrando N de M" e "Ver todos", vazio com "Cadastrar equipe"
- [x] T014 `atalhos.js`: abrir o Cadastro na loja e aba certas (Equipe para definir função e editar, Dados para conferir funcionamento, Regras para mínimos e convenção)
- [x] T015 Tirar "Escala atual por colaborador"; conferir e commitar a fatia

## Fatia 6 — Conferência final
- [x] T016 Conferir que nada acima do cartão mudou (diff dos arquivos dos blocos de cima), que os dois blocos mantidos continuam iguais, 5 larguras (360 a 1920), teclado e rótulos acessíveis
- [x] T017 README; relatório final (reaproveitado, criado, removido e onde a informação segue; suposições e onde ficam; dados montados; divergências; confirmação de que o resto não mudou); rodar tudo e commitar
