# Tarefas: Novo cabeçalho e menu lateral (Radar)

Formato: `- [ ] ID [P] [História] descrição com o arquivo`. Pasta base da tela: `frontend/react/src`. Cada fatia termina com os testes passando e um commit.

## Fatia 1 — Base da casca (sem mudar nada que a pessoa vê ainda)
- [x] T001 [P] Copiar o logo do desenho para `frontend/react/public/radar-logo.png` (1295×238, fundo transparente) e conferir que o Vite o serve em `/radar-logo.png`
- [x] T002 [P] `shell/icones.jsx`: SVG embutidos (loja, calendário, prancheta, play, envio, menu de três linhas, seta) com `aria-hidden`, cor herdada (`currentColor`/token do ícone) e tamanho por prop
- [x] T003 [P] `shell/menu.js`: uma lista que descreve o menu inteiro (Minhas Lojas › Lojas e Parâmetros legais [só operador]; Escala › Diagnóstico e Simulações; Grupos [só operador]); funções puras `itensDoMenu(perfil)`, `itemAtual(tela, secao)` e `destino(id)`
- [x] T004 [P] `shell/estadoDoMenu.js`: `lerRecolhido()` e `gravarRecolhido()` com leitura e escrita protegidas (erro cai no padrão), e `padraoPorLargura(largura)` (aberto a partir de 768 px)
- [x] T005 [P] `shell/horas.js`: `horasDeFuncionamento(horarios)` = soma de (fechamento − abertura) dos dias abertos do formato `{ versao: 2, dias[7] }`; sem horário válido devolve `null`
- [x] T006 Testes (`shell/menu.test.js`, `estadoDoMenu.test.js`, `horas.test.js`): operador vê Grupos e Parâmetros legais e os outros perfis não; item atual por tela e seção; preferência persiste e cai no padrão se o armazenamento falhar; Sumaré - Centro (08–21 de seg a sex e 08–20 no sábado) = 77 h; loja sem horário = `null`
- [x] T007 Rodar os testes da tela e commitar a fatia

## Fatia 2 — Menu lateral e barra superior (História 1, P1)
- [ ] T008 [US1] `shell/BarraSuperior.jsx`: `header` de 80 px com fundo de card e sombra leve do Alquimia; botão de três linhas (40×40) com nome "Recolher menu"/"Expandir menu", `aria-expanded` e `aria-controls`; logo como link para o início com `alt="Radar"`; espaço flexível; lugar do avatar (preenchido na fatia 4)
- [ ] T009 [US1] `shell/MenuLateral.jsx` aberto (280 px): `nav` com `aria-label="Menu principal"`, itens de 56 px sem divisores, ícone de 22 px, rótulo em negrito de 14 px, seta nos itens com subitens, subitens recuados em 32 px, só o item atual com fundo `--color-primary-soft` e barra de 3 px na cor principal e `aria-current="page"`
- [ ] T010 [US1] `shell/MenuLateral.jsx` recolhido (72 px): só ícones centralizados com 56 px, o mesmo destaque do item atual, `aria-label` com o nome, dica à direita (fundo escuro do Alquimia, texto branco de 13 px, 32 px de altura) no mouse e no foco; Minhas Lojas e Escala abrem um painel à direita com os subitens (fecha com Esc, clique fora e ao escolher; foco volta ao ícone)
- [ ] T011 [US1] Gaveta em tela estreita (abaixo de 768 px): o menu começa recolhido e o botão da barra o abre por cima do conteúdo, com fechamento por Esc e por clique fora; transição de largura de 150–200 ms, sem animação com `prefers-reduced-motion`
- [ ] T012 [US1] `shell/AppShell.jsx` e `App.jsx`: montar barra, menu, faixa (vazia por enquanto) e `main`; mover para a casca a escolha de tela e de seção (`tela`, `secao`) mantendo `confirmarSaida()` e o endereço (`?tela=`); `CadastrosPage` passa a receber `secao` (saem as abas internas Lojas/Parâmetros legais) e `EscalaPage` passa a receber `secao` (saem as abas Diagnóstico/Simulações); preferência do menu lida e gravada pelo `estadoDoMenu.js`
- [ ] T013 [US1] Conferir no navegador: recolher, recarregar e manter; Tab pelos ícones com dica; painel dos subitens no recolhido; operador × dono × consulta; gaveta a 375 px; e commitar a fatia

## Fatia 3 — Faixa de contexto: Loja e Importar (História 2, P1)
- [ ] T014 [US2] `App.jsx`: carregar a lista de lojas e guardar a `lojaId` na casca (mesmo `/lojas?pageSize=100` da Escala); `EscalaPage` recebe `lojaId`, `versaoDados` e `onImportar`, e perde o seletor de loja, o botão "Enviar planilhas" e o estado da lista; o modal `EnviarPlanilhas` passa a ser aberto pela casca e, ao concluir, sobe `versaoDados` para a Escala recarregar
- [ ] T015 [US2] `shell/FaixaDeContexto.jsx` (64 px, fundo de card, borda inferior sutil, padding de 32 px): "N h de funcionamento por semana" (12 px, cor secundária) quando `horasDeFuncionamento` não é `null`; filtro "Loja" de 280 px com `código · nome`; botão primário "Importar" com ícone de envio, `aria-label="Importar planilhas"`, só para quem pode escrever; a faixa só aparece nas telas da Escala
- [ ] T016 [US2] Responsivo da faixa: abaixo de 1024 px duas linhas (texto em cima; filtro ocupando o espaço livre e Importar embaixo); abaixo de 600 px o Importar vira só o ícone, mantendo o `aria-label`; alvos de 44 px no celular
- [ ] T017 [US2] Grupo sem lojas: o filtro diz que não há lojas e o Importar segue disponível a quem pode escrever; a tela da Escala mantém o aviso "Nenhuma loja cadastrada"
- [ ] T018 [US2] Conferir no navegador: Sumaré - Centro mostra 77 h; trocar de loja muda Diagnóstico e Simulações e a loja permanece ao trocar de tela; não existe outro seletor de loja; Importar abre o envio de planilhas e recarrega o diagnóstico ao concluir; consulta não vê o Importar; 1440, 900 e 375 px; commitar a fatia

## Fatia 4 — Menu da conta (História 3, P2)
- [ ] T019 [US3] `shell/MenuDaConta.jsx`: avatar com as iniciais e seta na barra (`aria-haspopup`, `aria-expanded`); popover de 320 px com borda e sombra do Alquimia e 8 px de raio; nome e papel; bloco "Demonstração" (etiqueta, Grupo e Papel) só quando `import.meta.env.VITE_MODO_DEMONSTRACAO !== "false"`; "Sair" separado por uma linha, que por enquanto volta papel e grupo ao padrão de demonstração
- [ ] T020 [US3] Fechar com Esc, clique fora e ao escolher uma opção, devolvendo o foco ao avatar; trocar o papel para um que não vê a tela atual leva à primeira tela permitida (regra que já existe em `App.jsx`)
- [ ] T021 [US3] Tirar de `App.jsx` o antigo cabeçalho (texto "Suíte", trilha, seletores soltos de Grupo e Papel) e conferir no navegador: abrir, trocar papel e grupo, Esc, clique fora, foco de volta ao avatar; e commitar a fatia

## Fatia 5 — Acabamento e entrega
- [ ] T022 Revisar acessibilidade (landmarks, ordem de Tab, foco visível, contraste, alvos de 40/44 px, `aria-current`) e rolagem horizontal da página de 360 a 1440 px
- [ ] T023 Conferir que nenhuma tela mudou de conteúdo, de cálculo ou de rota, e que alterações não salvas ainda pedem confirmação ao trocar de tela
- [ ] T024 README (bullet da spec 023 e o aviso de `VITE_MODO_DEMONSTRACAO`), rodar `vitest` e `vite build`, atualizar `local/ver-tudo` e enviar a branch para o PR
