# Contrato de tela: lápis e janela de horário

Interface (não há endpoint novo; grava com `PUT /simulacoes/:id`, campo `turnos`, como o arrastar).

## Lápis
- Aparece só com a simulação **editável** e a pessoa com **turno** no dia (inclui contratação simulada).
- Nome acessível: `Editar horário de {Nome} na {dia}` (ex.: "Editar horário de Maria na terça").
- Alcançável por Tab; Enter e Espaço abrem a janela; área de toque de pelo menos 44 × 44 px (no computador pode ser menor, com área de clique estendida).
- Computador: ao fim da barra do dia, depois do total da semana da linha; celular: à direita do horário da pessoa.

## Janela
- Título "Horário de {Nome}", subtítulo com o dia por extenso e o funcionamento da loja ("Terça · a loja funciona das 07:00 às 22:00").
- Campos (nesta ordem): **Entrada**, **Início do intervalo**, **Fim do intervalo**, **Saída**; os do intervalo são opcionais; os quatro vêm preenchidos com o horário atual.
- Linha de apoio: "Cobre as horas de 08h a 16h." (mesma regra da cobertura); erros em `role="alert"` ao lado de cada campo.
- Botões: "Cancelar" (fecha sem gravar) e "Salvar" (valida; com erro não grava; sem mudança não grava de novo). Esc cancela; Enter salva; foco inicial na Entrada; ao fechar, o foco volta ao lápis.

## Mensagens (linguagem simples)
| Situação | Mensagem |
| --- | --- |
| Campo obrigatório vazio ou ilegível | "Informe um horário válido, como 07:32." |
| Saída igual ou antes da entrada | "A saída precisa ser depois da entrada." |
| Fora do funcionamento do dia | "A loja funciona das {abre} às {fecha} neste dia." |
| Só um campo do intervalo | "Preencha o início e o fim do intervalo, ou deixe os dois vazios." |
| Intervalo fora do turno | "O intervalo precisa ficar dentro do turno." |
| Início depois do fim | "O início do intervalo precisa ser antes do fim." |
