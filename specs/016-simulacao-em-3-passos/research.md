# Research — Simulação em 3 passos

## 1. Onde guardar o horário simulado
- **Decision**: coluna `horarios` (JSON, opcional) na simulação; vazia = "Manter horários" (vale o Cadastro).
- **Rationale**: o horário é parte do rascunho e deve ser congelado ao gravar junto com as premissas; JSON espelha o formato `horarios` da loja (`versao`, `dias[{aberta, abre, fecha}]`) e reaproveita a validação existente.
- **Alternatives**: tabela própria por dia (exagero para 7 linhas); guardar só no navegador (perde ao recarregar e não calcula no servidor).

## 2. Como calcular venda e margem que saem
- **Decision**: horas que estavam abertas no horário do Cadastro e ficam fechadas no simulado; soma da média de venda/margem dessas horas por dia da semana (`vendasPorDiaEHora`) × 52 ÷ 12. Sem base comercial: valor nulo ("sem dado"), nunca zero. Margem: da base (venda × margem bruta da loja); sem margem informada, nula.
- **Rationale**: é a mesma conta dos cenários que fecham dias, aplicada hora a hora; mantém coerência com o Comparativo.
- **Alternatives**: recapturar parte da venda (já existe nos cenários de fechar dia; aqui começa em 0 por ser corte de hora, e fica para depois).

## 3. Horas necessárias por função e resultado das contratações
- **Decision**: chamar `verificarRegra` com os dias do horário simulado, o quadro da simulação (já com as vagas) e as metas da loja; "Situação hoje" vem da mesma chamada sem as vagas.
- **Rationale**: já é o motor dos cenários; garante mesmo "faltam Xh" nas duas telas.

## 4. Hora extra
- **Decision**: horas que ainda faltam depois das contratações simuladas × valor-hora do cargo × 1,5 × (1 + encargos do regime). Sem salário informado: nula.
- **Rationale**: o motor só sabe a variante 26 h + 6 h extras; este é o custo de cobrir o resto do buraco com hora extra, o que o painel promete ("Sem hora extra" quando zero). Marcado como estimativa gerencial.
- **Alternatives**: não mostrar hora extra (descumpre o pedido).

## 5. Impacto por mês
- **Decision**: `impacto = folha extra (vagas) + hora extra + margem perdida`, com sinal negativo na exibição; igual ao "impacto mensal" do cenário quando não há edição de horário (SC-003).
- **Rationale**: é a definição já usada nos cenários ("custo adicional de folha + margem perdida").

## 6. Número do cenário
- **Decision**: `Salvar como cenário N` grava (mesmo `gravar`) e dá o nome "Cenário N" (N = maior número entre simulações gravadas da loja + 1). O rascunho passa a "gravada"; para continuar ajustando cria-se um novo rascunho a partir dela (clonar).
- **Rationale**: reaproveita estados existentes; evita um estado novo.

## 7. Layout responsivo
- **Decision**: container queries (mesma técnica dos cenários); painel fixo só quando o conteúdo tem ≥ 1100 px; abaixo disso desce para depois do passo 3.
- **Rationale**: o menu lateral tira largura; janela larga não garante conteúdo largo.

## 8. Tela antiga
- **Decision**: a tela nova substitui a antiga no fluxo "Personalizar" e "Simulações"; o ajuste por hora do passo 3 reaproveita a grade atual.
- **Rationale**: duas telas para a mesma coisa confundem; os dados e rotas são os mesmos.
