# Relatório da entrega — Cadastro de loja em painel único (spec 017)

## 1. Reaproveitado, criado, removido
**Reaproveitado**: rotas de loja, funcionários, configuração e custos; `Abas`, `Botao`, `Cartao`, `Ficha`, `Aviso`, `Modal`; `Encargos.jsx` (composição, alerta de regime); `ImportarPlanilha` (importar equipe); a tabela de parâmetros de encargos; o motor de turnos e de mínimos.
**Criado (servidor)**: `situacaoDoCadastro`; filtros `uf` e `situacao` e busca por CNPJ em `GET /lojas`; `PUT/GET /lojas/:id/painel` (salvar tudo); `coberturaDeTurnos`; `modoMinimo` no JSON de turnos; `emHora` com o maior mínimo na sobreposição.
**Criado (tela)**: `features/cadastro-loja/` (página, lista, detalhe, rascunho único, endereço, guarda de saída, aba Dados com tabela por dia e resumo mensal, aba Equipe com formulário e desfazer, aba Regras com custos, convenção e mínimo por turnos, barra de turnos, modo Nova loja); `Segmentado`, `Chave`, `Toast`, `Passo` em `components/ui`; Vitest no front (v2).
**Removido**: `FormLoja`, `EquipeLoja`, `ConfiguracaoLoja`, `FaturamentoLoja`, `HorarioSemana`, `diagnostico/Configuracao`, `Custos` e `TurnosLoja` (as telas e botões de salvar antigos), e o botão "Remover loja" da lista antiga.

## 2. Suposições "a confirmar" e onde ficam
- **Completo × Revisar**: `backend/node/src/modules/cadastros/situacao.ts` (`situacaoDoCadastro`, `TOLERANCIA_MENSAL`).
- **Sobreposição de turnos (maior mínimo por cargo, não soma)**: `backend/node/src/modules/regras/requisitos.ts` (`emHora`); espelhada na tela em `features/cadastro-loja/turnos.js`.
- **Cobertura (aviso, nunca bloqueia)**: `regras/turnos.ts` (`coberturaDeTurnos`, `avisosDeTurnos`) e `turnos.js` (`coberturaDoHorario`).
- **Horário que varia por dia**: a cobertura e a janela do mínimo são avaliadas **dia a dia** (os turnos são iguais em todos os dias); a janela mostrada na tela é do primeiro horário aberto ao último da semana.
- **Modo "Mínimo único do dia"**: `modo` dentro do JSON de turnos; em `unico` o motor ignora os turnos e usa o mínimo único (`exigenciasDaLoja`).

## 3. Estado "Nova loja" (não estava desenhado)
Só o operador cria. O painel mostra os dados da loja (ID loja, nome e CNPJ obrigatórios; cidade, UF, bandeira e regime opcionais), as abas Equipe e Regras e custos aparecem bloqueadas ("Disponível depois de cadastrar a loja"); ao gravar, a loja entra na lista e abre na aba Dados com as abas liberadas. Funcionamento e faturamento são preenchidos depois, na aba Dados.

## 4. Dados que faltavam e migrações
- **Nenhuma migration**: faturamento por dia, turnos e o modo do mínimo já cabiam nos campos existentes (o modo entrou no JSON de turnos).
- Não existia um endpoint único de salvar: criado `PUT /lojas/:id/painel` (valida tudo antes e grava numa única atualização da loja).
- A matrícula de funcionário é obrigatória no sistema e não está no desenho: é gerada automaticamente (prefixo `EQ-`).
- Cargo no formulário: lista com as 5 funções da escala e "Outro (fora do cálculo)" (com o nome do cargo).

## 5. Divergências do desenho
- **Colunas da tabela de funcionamento e da equipe**: o detalhe é mais estreito que no desenho (menu lateral), então as colunas foram reduzidas e a tabela vira blocos abaixo de ~680 px (funcionamento) e ~860 px (equipe), por largura do conteúdo.
- **"Remover loja"** (operador) não está no desenho e foi retirado; se for necessário, precisa de um lugar no painel.
- **Trocar de modo do mínimo** não pede confirmação, porque nada é descartado (os dois ficam guardados).
- **"Ver mais" da lista** acumula 20 lojas por vez (o desenho mostra 6); a altura da lista é fixa (640 px) com rolagem interna.
- **Importar em massa**: o botão passou a secundário, o fluxo não mudou. O "ID loja" desta tela é o mesmo "Código" do resto do produto (rótulo diferente só aqui).
- A mensagem de erro do servidor ao salvar é mostrada em texto no topo do detalhe; o foco por campo vale para os erros que a tela sabe validar antes (nome, horários, faturamento, turnos, custos).

## 6. Conferência
SC-001 a SC-006: lista, filtros e CNPJ com testes de integração; salvar de uma vez com um clique; motivo em texto no cabeçalho; equipe sem sair da loja; sem rolagem horizontal da página em 360, 420, 1440 e 1920 px (nas 3 abas); contas (horas do dia, soma semanal, mensal × 52 ÷ 12, divergência de 10%, janela do mínimo, sobreposição, cobertura, situação) com testes. Testes: 439 unitários e 195 de integração no servidor; 33 no front.
