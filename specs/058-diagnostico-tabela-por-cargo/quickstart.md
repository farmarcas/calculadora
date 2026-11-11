# Quickstart — spec 058

1. Subir o ambiente (`docker compose up -d --build --wait`) e abrir Escala › Diagnóstico de uma loja com farmacêutico em falta (ex.: Cosmópolis).
2. Conferir, na aba da regra de 42h: chip, título, parágrafo, barras (42h em vermelho/negrito) e a tabela com Farmacêutico, demais cargos e "Equipe toda".
3. Trocar para 44h e 40h: títulos, barras e tabela mudam sem recarregar.
4. Conferir que "Contratações sugeridas" soma as mesmas pessoas do cenário "Manter horários".
5. Entrar como gestor/consulta: sem R$ e sem faturamento; a resposta da rota não traz `folhaMensal` nem `faturamentoMensal`.
6. Só teclado: Tab até o "i", Enter/Espaço abre a explicação.
7. Loja sem falta: chip verde, título "A loja cobre todo o horário com farmacêutico", sem "Contratações sugeridas".
8. Testes: `docker compose exec -T web npx vitest run`, e o de integração da rota de diagnóstico.
