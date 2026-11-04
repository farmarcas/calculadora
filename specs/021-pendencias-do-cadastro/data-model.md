# Modelo de dados — Painel "O que falta preencher"

Sem tabela nova. Só campos novos e opcionais nas respostas.

## Pendência
`{ id, aba: 'dados' | 'equipe' | 'regras', texto, motivo, campo, soDono, alerta? }`
- `id`: `dados`, `funcionamento`, `faturamentoDia`, `faturamentoMes`, `margem`, `farmaceutico`, `salario:<Função>`.
- `texto`: uma linha curta ("Falta: cidade e UF", "Faltam 2 dias abertos: quinta e sexta").
- `motivo`: por que importa, mostrado no campo ("Sem a margem, o impacto dos cenários fica em branco.").
- `campo`: o `data-campo` de destino.
- `soDono`: o item depende de faturamento, margem ou salário.
- `alerta`: verdadeiro só no faturamento do mês divergente (botão "Conferir").
Nunca traz valores em R$.

## Respostas
- Painel da loja (`situacao`): ganha `pendencias` (lista) e `quantidade`; o painel da loja ganha `equipe: { farmaceuticos, funcoesNaEquipe }` (sem salários).
- Lista de lojas (`situacao`): ganha `quantidade`.
