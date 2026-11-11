# Quickstart: Coluna "Folha no faturamento" (A3)

Pré-requisito: ambiente no ar (reinicie a API depois de trocar de branch), Diagnóstico de Cosmópolis e Paulínia, regra de 42h, janela de 1236 px.

1. Dono, Cosmópolis: "Manter horários" mostra "9,7%" grande, "do faturamento", "hoje 8,0%", chip âmbar "+1,7%" e "R$ 7.659 a mais por mês"; o cabeçalho é "Folha no faturamento".
2. "Sem contratações": "8,2%", chip neutro "folha igual" e "Sobe só porque a venda cai."; nada de "p.p." nem "R$ 0/mês".
3. Paulínia, "Manter horários": "14,7%", "hoje 10,3%", "+4,4%", "R$ 11.112 a mais por mês".
4. Um cenário que reduz equipe: chip verde "−0,6%" e "R$ 2.340 a menos por mês" (usar uma simulação de teste, se não houver na loja).
5. Gestor e consulta: cabeçalho "Custo de pessoal" e só "Aumenta", "Igual" ou "Diminui"; a resposta da API sem campos de custo.
6. Loja sem salários e loja sem faturamento: as frases do pedido, sem números; gestor: "Dados do custo ainda não informados.".
7. Em 1236 px, a coluna da folha tem no máximo 3 linhas e a altura da linha é a do Horário.
8. Texto de abertura novo, sem a regra dos 50%.
9. Leitor de tela: o chip tem o `aria-label` completo.

Testes: `docker compose exec api npm test`; `docker compose exec web npm test`.
