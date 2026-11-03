# Modelo de dados — Cenário 3 com horário estendido

Sem tabela nova. Campos novos e opcionais na resposta do diagnóstico:

- **Passo de cenário**: novo tipo `estender` (dia, horas novas, `de`, `para`), ao lado de `reduzir` e `fechar`.
- **Cenário 3 (`equilibrio`)**
  - `horasEstendidas`: lista de `{ dia, horasNovas, origemVenda: 'registrada' | 'vizinha', vendaMes?, margemMes? }` (valores em R$ só para o dono).
  - `margemGanhaMes` (dono): margem mensal estimada das horas novas.
  - `impactoRobusto` (dono): impacto calculado com metade da margem ganha, usado só para decidir o "Cenário sugerido".
- **Comparativo**: na coluna do Cenário 3, `estimativaDeVenda` (booleano) para o aviso; `margemMes` pode ficar positiva (margem ganha) quando a extensão compensa.
