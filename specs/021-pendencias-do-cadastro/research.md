# Pesquisa — Painel "O que falta preencher"

## 1. A regra vira lista, sem mudar o que ela decide
- Decision: `pendenciasDoCadastro(loja, farmaceuticos, cadastro)` devolve todas as pendências em ordem fixa; `situacaoDoCadastro` passa a ser "Completo se a lista é vazia, senão Revisar com o texto da primeira".
- Rationale: os textos e a ordem de hoje não mudam (os testes atuais seguem valendo) e a etiqueta nunca diverge do painel.
- Alternatives: manter duas funções paralelas — descartada, porque divergiriam.

## 2. Itens e ordem
dados → funcionamento → faturamento por dia → faturamento do mês (divergência) → margem bruta → farmacêutico → salário do Farmacêutico → salário de Atendimento/Caixa (só com gente). Cada item leva: id, aba, texto curto, motivo do campo, campo de destino (`data-campo`), `soDono`.
- Observação: a ordem de hoje põe "farmacêutico" antes do faturamento e dos salários; o painel agrupa por aba, e o "principal motivo" da lista segue a ordem de hoje para não mudar nenhum texto atual.

## 3. Permissões
- Decision: o servidor marca `soDono` nos itens de faturamento, margem e salários; a tela decide o botão pelo perfil (dono: todos; operador e gestor: dados, funcionamento e equipe; consulta: nenhum).
- Rationale: as permissões já existem na tela (`editaLoja`, `cuidaDoGrupo`, dono); nenhuma nova.
- Gestor continua vendo todas as abas que vê hoje; só faturamento, margem e custos seguem ocultos.

## 4. A regra sobre o rascunho (antes de salvar)
- Decision: `pendencias.js` recebe o rascunho (loja, custos) e o que o servidor informa da equipe (`farmaceuticos`, `funcoesNaEquipe`); devolve a mesma lista. Quando a equipe muda (a aba grava na hora), o painel recarrega e vem a equipe nova.
- Rationale: o destaque precisa sumir quando o campo fica válido, antes de salvar.
- Garantia de igualdade: os mesmos casos de teste (tabela de entradas e saídas) rodam no servidor e na tela.

## 5. Dados que a tela precisa e que ainda não vêm
- Para o gestor o faturamento e os salários não chegam; ele não os calcula. Itens `soDono` vêm da lista do servidor (que enxerga tudo) e ficam como "Só o dono do grupo preenche"; a tela não tenta reavaliá-los para quem não é dono.
- Para o dono, a tela recalcula tudo sobre o rascunho.

## 6. Navegação e foco
- Decision: "Preencher" troca a aba (já há `onAba`), espera a renderização, usa `data-campo` (já existe em nome, margem, mensal, dia-N, fat-N, salario-F) e acrescenta `data-campo` em cidade, UF e regime; rola até o campo centralizado, foca, e recolhe o painel.
- Rationale: reaproveita o padrão que o "Salvar" já usa para focar o primeiro erro.

## 7. Destaque dos campos
- Decision: classe `cl-pendente` (anel com o token de atenção) e um selo "Preencher"/"✓ Preenchido", mais um texto de motivo ligado por `aria-describedby`. Sem cores novas.
- Rationale: estado nunca só por cor; o anel de foco azul continua por cima.

## 8. Contador nas abas
- Decision: o componente de abas aceita um número opcional por aba, mostrado em amarelo com texto para leitor de tela ("1 pendência").
- Rationale: reaproveita o componente existente.

## 9. Celular
- Decision: abaixo de 640 px o painel começa recolhido (56 px) e os alvos têm 44 px; as abas já rolam na horizontal.
