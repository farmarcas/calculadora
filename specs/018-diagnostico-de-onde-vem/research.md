# Research — "De onde vêm esses números"

## 1. De onde vêm os dados
- **Decision**: usar só o que o Diagnóstico já devolve: `cobertura` (por função e hora: pessoas, `ok`, `exigido`), `vendas.horas` (`vendaMedia` só do dono, `participacao`), `regras[]` (capacidade, necessidade, saldo, turnos, vigência, descrição), `config` (turnos, modo do mínimo, convenção), `loja.horarios`, `colaboradores`, `quadro`, `fontes.base`.
- **Rationale**: o pedido manda reaproveitar os cálculos; a cobertura já é do pior dia, já desconta intervalo e já traz o mínimo por hora (inclusive com turnos sobrepostos, pelo motor do spec 017).
- **Alternatives**: recalcular no front (duplica regra e pode divergir).

## 2. Montador puro
- **Decision**: `montar.js` recebe o diagnóstico e devolve um view-model por aba (eixo de horas, turnos recortados ao horário da loja, picos, observação, vendas fora do horário, linhas e grupos da equipe). Memorizado por loja e regra.
- **Rationale**: testável sem tela e sem recalcular ao trocar de aba.

## 3. Hora de pico e observação automática
- **Decision**: `isHoraPico` = venda ≥ 75% do maior valor; `buildObservacaoPico` só devolve texto quando a maior cobertura de Atendimento (pior dia) está fora do pico e é maior que a do pico; senão `null` (nada é renderizado). Para quem não é dono vale a participação (%) no lugar do R$.
- **Rationale**: é exatamente a suposição do pedido, isolada em duas funções.

## 4. Estimativa de 8h24 (único acréscimo no servidor)
- **Decision**: o servidor passa a incluir em `regras[r42].com8h24` a capacidade/saldo por função recalculados **com a convenção ligada**, usando `verificarRegra` e `regraPara('r42', true, …)`; só quando a convenção da loja está desligada. A tela decide se mostra (só quando as horas que faltam diminuem).
- **Rationale**: "nenhuma fórmula nova": é a função existente com o parâmetro ligado; campo aditivo não muda nada do que já sai.
- **Alternatives**: refazer a conta no front (duplicaria a regra de capacidade).

## 5. O que sai da página e o que fica
- **Decision**: saem Quadro por turno, Quadro por função, Verificação por regra, Cobertura da escala atual, Horários de maior venda e Escala atual por colaborador (tudo coberto pelas 3 abas). **Ficam**, abaixo do cartão e sem mudar, **"Escala redistribuída"** e **"Déficit e contratações por função"**.
- **Rationale**: o pedido manda não remover se algum dado só existir ali. Conferi no código: "Escala redistribuída" (`regras[].redistribuicao`), "Dias e horários que cobrem o descoberto" (`sugestao.distribuicao`) e a "Alternativa de parcial com hora extra" só aparecem nesses dois blocos; os Cenários e o Personalizar não mostram isso. Isso vai para o relatório.
- **Alternatives**: removê-los (perde informação); levá-los para dentro de Personalizar (obra maior, fora do escopo).

## 6. Abas na URL
- **Decision**: `?tela=escala&aba=cobertura|regras|equipe` com `history.replaceState`, lido ao abrir; padrão "cobertura". O menu limpa o endereço ao trocar de tela, então não colide com o `aba` do Cadastro de loja.
- **Rationale**: é o padrão já usado no Cadastro; sem biblioteca de rotas.

## 7. Atalhos para o Cadastro
- **Decision**: `abrirNoCadastro({ loja, aba })` grava o endereço do Cadastro (`?tela=cadastros&loja=…&aba=dados|equipe|regras`) e chama o callback que o Diagnóstico já recebe para ir a Cadastros. "Enviar base comercial" usa o `onEnviar` existente.
- **Rationale**: o painel do Cadastro (spec 017) já lê loja e aba do endereço ao abrir.

## 8. Período das vendas
- **Decision**: a dica das vendas mostra "média por dia" e o arquivo da base (`fontes.base.arquivo`, hoje "média por dia, jul–set/2026"), não as datas de `vendas.periodo`.
- **Rationale**: a base carregada já é a média por dia; as datas do período são de uma semana de referência e enganariam.

## 9. Turnos diferentes por dia na aba 3
- **Decision**: não se aplica: o modelo guarda **um turno por pessoa** (entrada, saída e dias). "Varia" e a dica por dia não são renderizados; fica registrado no relatório.

## 10. Horário da loja que varia por dia
- **Decision**: "dentro do horário" = hora presente em `cobertura.horas` (a cobertura já usa o pior dia); o eixo é a união dessas horas, das horas com venda e dos turnos.
