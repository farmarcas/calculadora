# Como conferir

1. Subir o ambiente e abrir a Escala, aba Simulações, como dono, em Cosmópolis.
2. **Manter horários com 1 contratação:** bloco Folha "9,7%", chip "+1,7%", "hoje 8,0%", "R$ 7.659 a mais por mês"; lista com Folha por mês (R$ 36.020 → R$ 43.679), Pessoas 8 → 9 (+1), Horas 352h → 394h (+42h) e "Sem hora extra.".
3. **Sem contratação:** chip "folha igual", "Sobe só porque a venda cai.", linhas "igual" e a faixa amarela com a causa.
4. **Reduz equipe:** chip verde "−0,6%", "−R$ 2.340" em verde e Pessoas "−1" em cor neutra.
5. **Gestor e consulta:** "Custo de pessoal" com um chip; lista sem Folha por mês; resposta da API sem `custoDoDono` nem `horarioEstendido`.
6. **Sem salários / sem faturamento:** as frases certas, sem números.
7. **Horário a mais (sábado até 23h):** venda R$ 2.214, custo da mercadoria 56,4% = R$ 1.249, lucro bruto R$ 965, folha R$ 4.924, resultado −R$ 3.958 em vermelho, selo "Não recomendado"; link "Como calculamos" abre e Esc fecha.
8. Coluna estreita (300 px): nenhum texto escondido.
9. Buscar na tela: nenhum "p.p.", "pontos", "CMV" nem "sobre a folha".
10. Testes: `docker compose exec -T api npx vitest run`, `… api npm run test:integration` (sozinho) e `… web npx vitest run`.
