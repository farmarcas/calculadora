# Pesquisa: CMV no Cadastro e na base comercial

## Decisão 1: renomear a coluna e deixar nula, em vez de criar outra
- **Decision**: `vendas_hora.margem` vira `cmv`, aceitando nulo, e todas as linhas recebem nulo.
- **Rationale**: uma só coluna, com o nome certo, e "nulo" diz "sem dado". Com zero não dá para distinguir "sem CMV" de "CMV zero", e CMV zero significaria lucro bruto igual à venda inteira, o que enganaria.
- **Alternatives considered**: manter `margem` e criar `cmv` ao lado (duas colunas para o mesmo assunto, uma morta); manter o zero (ambíguo).

## Decisão 2: o lucro bruto é calculado na leitura
- **Decision**: o banco guarda o CMV; o repositório entrega a cada linha o lucro bruto (venda − CMV, ou nulo).
- **Rationale**: as contas e a régua já leem `margem` por hora; mudar o que ela significa na entrada preserva todo o resto e os testes das specs 033.
- **Alternatives considered**: reescrever todas as contas para ler CMV (muito código e risco).

## Decisão 3: CMV médio por hora ausente
- **Decision**: horas sem CMV usam venda × (1 − CMV médio da loja); sem CMV médio, vale a regra de cobertura de 90% de hoje, com volta à venda.
- **Rationale**: é o que o texto de apoio descreve (CMV% médio quando falta o dado da hora) e evita misturar réguas.
- **Alternatives considered**: usar o CMV médio em toda hora, ignorando o CMV por hora (perde o mix do dia).

## Decisão 4: a limpeza vai numa migration
- **Decision**: a migration zera a margem das bases e remove `margemPct` do faturamento das lojas.
- **Rationale**: é o jeito versionado, idempotente e testável de limpar dado (como a migration "simulações sem em uso"); em produção roda na publicação.
- **Alternatives considered**: um script manual (sem versionamento e fácil de esquecer em produção).

## Decisão 5: planilhas antigas
- **Decision**: a coluna "Margem bruta (R$)" da base e a "margem" do Cadastro continuam entendidas e ignoradas.
- **Rationale**: ninguém perde planilhas já preparadas; o CMV é uma coluna nova.

## Pontos em aberto
Nenhum. A origem do CMV médio (preenchido pela Farmarcas, com marca de "validar") fica para uma etapa seguinte, pois não muda a conta.
