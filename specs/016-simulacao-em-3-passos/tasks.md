# Tarefas: Simulação do cenário em 3 passos

## Fatia 1 — Resultado calculado e horário simulado (US1, US2, US4)
- [x] T001 Migration: `simulacoes.horarios` (Json opcional) e `numero_cenario` (inteiro opcional) + `schema.prisma`
- [x] T002 `simulacoes.schemas.ts`: `horarios` no PUT (7 dias, `fecha > abre`, ao menos 1 dia aberto, passos de 15 min) ou `null`
- [x] T003 `simulacoes/resultado.ts`: horas abertas (antes/depois), venda e margem que saem (base por dia/hora × 52÷12; nulas sem base ou sem margem), horas necessárias por função (`verificarRegra`), folha extra, hora extra (research 4), impacto
- [x] T004 Testes à mão do resultado: sem edição o impacto = o do cenário; fechar a segunda às 20h gera venda/margem que saem; sem base = nulo, não zero; função coberta vs ainda falta; hora extra com e sem salário
- [x] T005 `simulacoes.service.ts` + repositório: salvar horário no rascunho (só rascunho), bloco `resultado` em GET/PUT (valores em R$ só para o dono), congelar horário ao gravar
- [x] T006 Testes de integração: PUT com horário válido/ inválido, 409 fora de rascunho, dono vs gestor, Cadastro intocado
- [x] T007 Rodar tudo e commitar a fatia

## Fatia 2 — Numeração, salvar e marcar em uso (US6)
- [ ] T008 `gravar` dá "Cenário N" (maior N da loja + 1) e devolve `numeroCenario`; rota para o próximo número do botão
- [ ] T009 Testes: numeração por loja, duas lojas independentes, "marcar em uso" só dono
- [ ] T010 Rodar tudo e commitar a fatia

## Fatia 3 — Tela: cabeçalho, parâmetros e painel (US1, US6)
- [ ] T011 `features/simulacao/SimulacaoPage.jsx`: Voltar, título com a loja, "Marcar como em uso", grade `minmax(0,1fr) 360px` com painel fixo por largura do conteúdo (descida abaixo de ~1100 px)
- [ ] T012 `BarraParametros.jsx`: Regra 42h|40h, Horário Manter|Mudar, regime e encargos, marcas do perfil, "Maior venda"
- [ ] T013 `PainelResultado.jsx`: impacto uma vez, cinco linhas, aviso "Nenhuma alteração de horário ainda", carregamento só nos valores, `aria-live`, "Salvar como cenário N"
- [ ] T014 Ligar "Personalizar" e a lista de simulações à tela nova; commitar a fatia

## Fatia 4 — Passo 1: horário e gráfico (US2, US3)
- [ ] T015 `PassoHorario.jsx`: lista só leitura ("Igual ao Cadastro") e editável (campos HH:mm, erro com ícone e texto, "Alterado", "Restaurar do Cadastro", rodapé "X h abertas · antes Y h", confirmação ao voltar para Manter)
- [ ] T016 `GraficoVendas.jsx`: dias Seg–Sáb, Venda (R$)|Clientes, 15 barras de 07h a 21h, pico em destaque, rótulo só no maior, legenda, "Fechada na simulação", altura fixa; sem base = aviso; R$ só dono
- [ ] T017 Rodar a tela em 1440/1100/768/420 e commitar a fatia

## Fatia 5 — Passos 2 e 3 (US4, US5)
- [ ] T018 `PassoContratacoes.jsx`: tabela por função, botões + Integral 40h / Parcial 16h / Parcial 24h, Remover, resultado, custo, rodapé com total e "Sem hora extra"
- [ ] T019 `PassoEscala.jsx`: grade por função com cores, Folga, Fechada, "Ver mais N pessoas", clique no dia abre o ajuste por hora (reaproveita `Grade.jsx`)
- [ ] T020 Conferência final: SC-001 a SC-005, rolagem horizontal, teclado, README, tela antiga fora do fluxo; rodar tudo e commitar
