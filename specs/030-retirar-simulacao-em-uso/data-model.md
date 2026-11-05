# Data Model: Retirar "Marcar como em uso"

**Simulação** (`simulacoes`): `status` passa a valer `rascunho`, `gravada` ou `descartada` para o sistema. Os valores `em_uso` e `substituida` continuam existindo no tipo do banco, mas **nenhum registro os tem** depois da migration e o código nunca os grava.

**Migration de dados** (sem mudança de estrutura):
```sql
UPDATE simulacoes SET status = 'gravada' WHERE status IN ('em_uso', 'substituida');
```
Nenhuma linha é apagada; nome, quadro, horários, premissas e resultado não mudam.

**Registros de aprovação** (`aprovada_por`, `aprovada_em`, `vigencia_inicio`, `substituida_em`): continuam guardados nas simulações que os tinham; a API deixa de ler e de gravar essas colunas.

**Número do cenário** (`numero_cenario`): inalterado; não há restrição de unicidade ligada ao estado.
