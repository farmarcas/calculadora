# Feature Specification: Encargos da folha por regime tributário

**Feature Branch**: `feat/encargos-por-regime`
**Created**: 2026-10-30
**Status**: Draft (plano aprovado pelo dono do pedido em 2026-10-30)
**Input**: Itens DM-61, DM-62, DIAG-04, CALC-20 e CALC-21 do `regras_calculadora_fim_6x1.md`: o encargo da folha deve vir do regime tributário da loja, não de um percentual digitado.

## Situação de hoje

- O encargo é um **percentual digitado por loja** (campo "Encargos (%)" nos custos e coluna da planilha). Só 38 das 1.813 lojas locais têm custos; as 37 do grupo 216 usam 66% e uma loja do Simples usa 32%.
- O regime tributário já existe no cadastro da loja (`simples`, `presumido`, `real`; 7 lojas sem regime), mas é só informativo.
- O percentual entra em: folha atual, custo das vagas simuladas, custo adicional dos Cenários 1 e 3 (inclusive a variante de 26 h + 6 h extras), economia do Cenário 5 e comparação das simulações.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Encargos calculados pelo regime da loja (Priority: P1)

O dono vê a folha e os custos com o **percentual total de encargos do regime da loja**, calculado a partir de componentes (INSS patronal, RAT × FAP, terceiros, FGTS, provisões de 13º e férias + 1/3 e, se ligada, rescisão), e não mais um número digitado.

**Acceptance Scenarios**:
1. **Given** uma loja do Simples Nacional, sem rescisão, **Then** o total é de cerca de 29,0% (entre 28,9% e 29,1%).
2. **Given** uma loja de Lucro Presumido com RAT 2% e FAP 1,0, sem rescisão, **Then** o total é de cerca de 62,2% (entre 62,1% e 62,3%).
3. **Given** uma loja de Lucro Real com os mesmos parâmetros, **Then** o total é igual ao do Presumido.
4. **Given** o total do regime, **Then** ele vale na folha atual, no custo das contratações, na hora extra e nos cenários.

### User Story 2 - Regime ausente: Presumido com alerta e escolha na hora (Priority: P1)

Loja sem regime (ou com regime inválido) usa Lucro Presumido, o cenário mais conservador, e mostra o alerta "Não encontramos o regime tributário da loja. Calculamos com Lucro Presumido. Confirme o regime para um resultado mais preciso." O usuário escolhe o regime ali mesmo e a escolha fica gravada na loja.

### User Story 3 - Parâmetros editáveis por regime, com vigência (Priority: P1)

Uma tabela de parâmetros de encargos por regime, com data de início de vigência e versões (nunca edita, sempre cria versão nova), editável pela tela de Parâmetros legais, sem mexer em código. Cada regime guarda os **componentes**; o total é sempre calculado.

### User Story 4 - Ajuste por loja de RAT, FAP e rescisão (Priority: P2)

O dono ajusta, por loja, o RAT (faixa 1% a 3%), o FAP (0,5 a 2,0) e a provisão de rescisão (desligada por padrão; 4% no Simples e 5% no Presumido/Real), com o botão "Restaurar padrão". Alterar uma loja não afeta as outras.

### User Story 5 - Tela clara: total, regime e composição (Priority: P2)

O card da folha diz "Salários + encargos {total}% ({regime})", com o detalhe expansível "Ver composição" e a nota "Percentuais de referência. Confirme com seu contador."

## Requirements *(mandatory)*

- **FR-001**: Tabela de encargos por regime com vigência e versões; padrão no código quando não há versão.
- **FR-002**: Componentes por regime: INSS patronal, RAT, FAP, terceiros, FGTS, 13º (8,33%), férias + 1/3 (11,11%), rescisão (4% Simples; 5% Presumido/Real).
- **FR-003**: `diretos = INSS + RAT×FAP + terceiros + FGTS`; `provisões = 13º + férias`; `sobre provisões = provisões × diretos`; `total = diretos + provisões + sobre provisões + rescisão (se ligada)`.
- **FR-004**: Padrões: Simples (INSS 0, RAT 0, terceiros 0, FGTS 8); Presumido e Real (INSS 20, RAT 2, FAP 1,0, terceiros 5,8, FGTS 8).
- **FR-005**: O total do regime substitui o percentual digitado em todos os cálculos; o percentual digitado antes deixa de valer.
- **FR-006**: Regime ausente ou inválido usa Presumido e dispara o alerta.
- **FR-007**: Ajuste por loja de RAT (1–3), FAP (0,5–2,0) e rescisão, com "Restaurar padrão"; não afeta outras lojas.
- **FR-008**: A hora extra mantém o adicional de 50% e usa o novo total de encargos (os reflexos do CALC-22 ficam fora desta entrega).
- **FR-009**: Só o dono vê custos e composição.

## Success Criteria

- **SC-001**: Os totais por regime ficam dentro das faixas dos cenários de aceite.
- **SC-002**: Mudar o regime da loja muda a folha e os custos dos cenários sem outra ação.
- **SC-003**: Antes/depois da folha de uma loja de teste em cada regime, mostrado ao final.

## Assumptions

- Decision: os 38 percentuais digitados à mão são ignorados daqui em diante (aprovado). Why: DIAG-04 manda não usar percentual fixo.
- Decision: a coluna "Encargos (%)" da planilha de importação é substituída por RAT (%), FAP e Provisão de rescisão (Sim/Não); planilhas antigas com a coluna continuam importando, e o valor é ignorado com aviso.
- Decision: benefícios, comissão e adicionais do CALC-20 e os reflexos da hora extra do CALC-22 ficam fora desta entrega.
