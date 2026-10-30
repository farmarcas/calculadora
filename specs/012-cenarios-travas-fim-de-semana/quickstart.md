# Quickstart: verificar o Cenário 2 com travas

1. Ambiente de pé (`docker compose ps`), tela em http://localhost:3000, papel **Dono do grupo**.
2. Abra a Escala de uma loja do GE 216 (por exemplo a Arariba): o Cenário 2 **não** pode mais fechar segunda a sexta nem passar de 10% de perda; sem solução dentro das travas, mostra "Não resolve sozinho" e o que falta.
3. Em uma loja com equipe que cabe depois de poucas horas a menos no fim de semana: o cartão mostra "Sáb e dom fecham N h mais cedo", sem dia fechado.
4. Em uma loja sem margem informada: "Margem perdida" e "Saldo mensal" aparecem como "—" com o aviso, nunca R$ 0.
5. Com a margem informada, o saldo volta a aparecer.
6. Papel **Gestor**: vê os passos, os horários e o status, sem nenhum valor em reais.
7. Rodar `npm test`, `npm run test:integration`, lint, tsc, build do `web` e `scripts/check-repo.sh`.
