# Quickstart: Intervalo de até 2 horas não precisa de cobertura

Pré-requisito: ambiente no ar (reinicie a API depois de trocar de branch: `docker compose restart api`), perfil dono, Sumaré.

1. Abrir a Simulação (Personalizar) e a Escala por hora de um dia em que a única farmacêutica da manhã sai para almoçar (ex.: 10h–11h): a célula das 10h mostra "1" (sem "0 !"), e a dica diz "Em intervalo (não precisa de cobertura): Eliane".
2. Conferir a barra do turno: o trecho do intervalo continua listrado, e a dica diz que o intervalo de até 2 horas não precisa de cobertura.
3. Comparar o Diagnóstico: as horas de farmacêutico que faltam não incluem mais o almoço; o cenário "Manter horários" pede menos (ou nenhuma) contratação por causa disso.
4. Mudar o intervalo de uma pessoa para 3 horas (pela API de simulação ou num turno de teste): as horas voltam a descontar.
5. Conferir Atendimento e Caixa: o almoço também não abre falta.
6. Arrastar um turno: a cobertura recalculada na tela segue o mesmo critério.

Testes: `docker compose exec api npm test` e `npm run test:integration`; `docker compose exec web npm test`.
