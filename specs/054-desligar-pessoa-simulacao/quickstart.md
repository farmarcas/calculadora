# Como conferir

1. Subir o ambiente e abrir a Escala, aba Simulações, como dono, em Cosmópolis (use "Analisar" para abrir um rascunho).
2. Em "Escala por hora", clique em **Desligar** em um atendente: os turnos dele somem, aparece a faixa "Desligados na simulação (1)" e o card mostra Pessoas "8 → 7" (−1), horas contratadas menores e, para o dono, a folha em queda.
3. Clique em **Religar**: a pessoa volta com os mesmos turnos e o card volta ao que era.
4. Desligue o único farmacêutico: o resultado mostra "Sem farmacêutico no quadro".
5. Recarregue a página: o desligado continua desligado.
6. Gestor: vê e usa os botões, sem valores em reais. Consulta e simulação gravada: sem botões, mas com a faixa.
7. Confira que o Cadastro da loja não mudou.
8. Testes: `docker compose exec -T api npx vitest run`, `… api npm run test:integration` (sozinho) e `… web npx vitest run`.
