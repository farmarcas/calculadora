# Research — Cadastro de loja completo

## Decisões

- **Origem da venda:** base comercial > faturamento do cadastro > nenhuma. Why: a base tem o dado hora a hora; o cadastro só tem o dia. Alternativa rejeitada: somar as duas (mistura dado real com estimativa).
- **Distribuição por hora:** igual entre as horas abertas de cada dia. Why: sem dado por hora, qualquer curva seria inventada; a igualdade é a menos presunçosa e a tela avisa. Consequência: sem curva, "horário de maior venda" não existe, então esse aviso e o indicador somem quando a origem é o cadastro. Alternativa rejeitada: curva padrão de farmácia (dado inventado).
- **Como os cenários consomem:** montar `VendaLinha[]` em uma semana de referência (datas fictícias de segunda a domingo, sem dado de calendário) e passar adiante. Why: `resumirVendas` e `vendasPorDiaEHora` já aceitam esse formato; nenhum cenário muda. Atenção a conferir como `diasAbertos` representa 24 horas e virada de dia, usando a mesma função para as horas abertas.
- **Só mensal informado:** mensal × 12 ÷ 52 ÷ (dias abertos) por dia aberto. Dia a dia informado vence o mensal.
- **Margem:** `margem = venda × margemPct/100`; sem % a margem fica 0 e os cenários mostram "informe a margem" no lugar de número (o comportamento atual sem coluna de margem).
- **Onde guardar o faturamento:** coluna Json em `lojas` (`{ dias: (número|null)[7], mensal, margemPct }`), como `custos` e `alertas` já são. Why: mesmo padrão do projeto; só o dono lê e grava.
- **Carga mensal:** guardada em `cargaMensalH` e convertida em `cargaSemanalH = mensal ÷ 5` na gravação; quem já tem semanal sem mensal mostra mensal = semanal × 5. Resultados do motor não mudam.
- **Horário atual do funcionário:** `entrada`/`saida` em horas decimais (como `TurnoAtual`) e `dias` (Int[]); na montagem do diagnóstico, funcionário sem turno vindo da carga e com os três campos vira um turno atual. Carga importada sempre vence; divergência vira aviso.
- **CPF:** validado por dígitos verificadores; único por loja entre ativos (índice parcial na migration + checagem no serviço para dar mensagem boa); mascarado nas respostas para consulta.
- **Lista de funcionários dentro da loja:** usa as rotas `/funcionarios` já existentes, filtradas por loja, sem rota nova de equipe.

- **Regime tributário:** coluna própria em `lojas` com três valores fixos, em vez de texto livre dentro de `custos`. Why: é dado da loja (não valor em reais), precisa de lista fechada e deve existir em um só lugar. A migration move o valor antigo; `Custos.jsx` perde o seletor e `custos.schemas.ts` deixa de aceitar o campo. Só informativo: nenhum cálculo muda.

## Riscos

- Estimativa igual por hora pode levar os cenários 2 e 3 a cortar sempre a mesma ponta (empate). Mitigação: aviso claro de origem estimada e sugestão de enviar a base para refinar.
- Planilhas antigas: colunas novas são opcionais; teste com a planilha de hoje.

## Ajustes feitos na construção (etapa 3)
- **Dia aberto sem valor** (com outros dias informados) usa a média dos informados; o diagnóstico avisa o uso da estimativa.
- **Valores escondidos de quem não é dono:** com a venda vinda do cadastro, venda e margem dos cenários não saem para gestor e consulta (os cenários em si saem). Com base comercial, nada mudou.
- **Aviso "poucos dias de venda"** não aparece quando a venda é do cadastro (não são dias reais).
