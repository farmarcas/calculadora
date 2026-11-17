# Data Model: Peso do custo de pessoal no faturamento

Sem tabela nova.

- `LinhaDeCenario.custoPctFaturamento?: { hoje: number; depois: number; aumentoPp: number; aumentoMensal: number } | null` (só dono).
- `LinhaDeCenario.custoSentido: 'aumenta' | 'igual' | 'diminui'` (todos os perfis, sem número).
- `LinhaDeCenario.custoPct` deixa de ser usado pela tela (continua na API do dono para quem lê).
