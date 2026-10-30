# Quickstart: verificar a nova lógica

1. Ambiente de pé (`docker compose ps`), tela em http://localhost:3000, papel **Dono do grupo**, GE 216, loja **Porto Feliz**.
2. Diagnóstico na regra de 42 h: o **farmacêutico** mostra necessidade 94 h, capacidade 40 h, gap 54 h e a sugestão **1 integral de 40 h + 1 parcial de 14 h**, com ociosidade 0%, custo mensal e o aviso do CRF.
3. **Atendimento e Apoio** aparecem com meta (nível de hoje), sem alerta de falta; as sugestões deles vêm marcadas "para manter o nível de hoje".
4. Numa loja do GE 216 **sem atendente** ou sem caixa: nenhum alerta de falta desses cargos, e o Cenário 2 não fica inviável por isso.
5. Em Cadastros › Configuração da loja, o campo de mínimo aparece como **meta opcional**; informar uma meta a substitui.
6. Regra de 40 h: os mesmos cálculos, números próprios.
7. Cenários 1, 2 e 3 e o comparativo abrem com a contratação nova; gestor vê horas e sugestões sem nenhum valor em reais.
8. (Fatias 5 e 6) O parcial mostra dias e horários; funcionário com horário fixo é mantido e avisado.
9. Rodar `npm test`, `npm run test:integration`, lint, tsc, build do `web` e `scripts/check-repo.sh`.
