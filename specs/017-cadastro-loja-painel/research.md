# Research — Cadastro de loja em painel único

## 1. Sobrepor turnos sem mexer na conta toda
- **Decision**: no motor, `emHora` passa a usar o **maior** mínimo por cargo entre as fatias que contêm a hora (hoje usa a primeira que achar); a `reserva` (mínimo único) só vale em hora sem fatia. A validação de turnos deixa de reclamar de sobreposição, de início antes da abertura e de fim depois do fechamento; sobram nome repetido, início = fim e farmacêutico ≥ 1.
- **Rationale**: o resto do motor já olha só as horas abertas (`camadasDoDia`), então a conta não muda onde não há sobreposição; turnos já gravados continuam valendo.
- **Alternatives**: somar mínimos na sobreposição (dobra a exigência sem motivo); recortar os turnos ao gravar (perde o que a pessoa digitou).

## 2. Cobertura como aviso
- **Decision**: função pura que lista as faixas do horário da loja (dia a dia) sem nenhum turno; vira o aviso "Sem turno entre 17:00 e 18:00". O servidor devolve a lista; a tela só mostra.
- **Rationale**: mesma conta no servidor e na tela; não bloqueia (spec FR-011).

## 3. Modo do mínimo sem migration
- **Decision**: guardar `modo: 'turnos' | 'unico'` no JSON de turnos (`{ versao: 1, modo, turnos }`). Em modo "unico", o motor ignora os turnos e usa o mínimo único; os turnos ficam guardados.
- **Rationale**: trocar de modo não apaga o outro (FR-012) e não precisa de coluna nova. Sem `modo` vale o comportamento de hoje (usa turnos se houver).

## 4. Situação do cadastro e filtros
- **Decision**: `situacaoDoCadastro(loja, equipe)` pura, no servidor; a listagem carrega as lojas do grupo com o necessário (equipe com função, faturamento, horário), calcula, filtra por busca/UF/situação e **pagina em memória**.
- **Rationale**: o filtro por situação precisa da conta em todas as lojas; um grupo tem centenas, não milhares. O motivo não revela valores em reais (só "falta faturamento de quarta").
- **Alternatives**: coluna gravada de situação (desatualiza); calcular só na tela (não filtra a lista inteira).

## 5. Salvar tudo de uma vez
- **Decision**: rota `PUT /lojas/:id/painel` que recebe dados, horário, faturamento, configuração e custos **opcionais**, **valida tudo antes** e só então grava na ordem (configuração, custos, loja). Devolve a loja e a situação atualizadas.
- **Rationale**: evita "metade salva". As validações são as mesmas das rotas atuais (reaproveita os esquemas); as rotas antigas continuam (importação e usos existentes).
- **Alternatives**: a tela chamar três rotas em sequência (pode deixar parcial); transação de banco única (as rotas atuais usam o cliente direto; não vale a reescrita).

## 6. Endereço (deep link) sem biblioteca de rotas
- **Decision**: `?tela=cadastros&loja=<id>&aba=<dados|equipe|regras>` lido ao abrir e atualizado com `history.replaceState`; nada sensível no endereço.
- **Rationale**: o app não tem roteador; adicionar um só para isso é peso desnecessário.

## 7. Rascunho único e saída com alterações
- **Decision**: um hook guarda o rascunho (cópia profunda do salvo + alterações); contador de alterações por comparação campo a campo; confirmação ao trocar de loja/tela e `beforeunload`.
- **Rationale**: dados e regras compartilham o rascunho (FR-005); a equipe fica fora dele (grava na hora).

## 8. Remover com desfazer na equipe
- **Decision**: remover usa a rota atual (remoção lógica); "Desfazer" recria o funcionário com os mesmos dados (mesma matrícula quando possível).
- **Rationale**: sem rota nova de restauração; o resultado para a pessoa é o mesmo.

## 9. Contas puras com teste no front
- **Decision**: horas do dia (fim 00:00 = meia-noite), soma semanal, mensal × 52 ÷ 12, divergência > 10% e cobertura ficam em `calculos.js`, testadas com Vitest no front; a cobertura oficial também existe no servidor com teste.
- **Rationale**: SC-006 pede conferência à mão dessas contas.

## 10. ID loja × Código
- **Decision**: o rótulo nesta tela é "ID loja" (campo `codigo`); o resto do produto segue "Código" e o relatório avisa a divergência.
