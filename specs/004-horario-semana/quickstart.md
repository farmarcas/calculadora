# Validação ponta a ponta — horário por dia

1. `docker compose up -d --build --wait`; abrir http://localhost:3000 → Cadastros.
2. Nova loja: marcar segunda a sábado abertos 08:00–22:00 e domingo fechado; salvar e reabrir (tudo igual); a tabela mostra "Seg a sáb 08:00–22:00 · Dom fechada".
3. Editar a loja: atalho "Loja 24 horas" → sete dias 24h; desmarcar o domingo (fechada) e salvar.
4. Loja antiga (cadastrada só com semana): aparece corretamente nos sete dias, sem precisar salvar.
5. Baixar a planilha modelo: colunas por dia e `Loja_24h`. Importar uma planilha com domingo fechado e uma loja 24h; depois uma com as colunas antigas: as duas funcionam (confirmação de colunas como hoje).
6. Escala → loja com domingo aberto → Diagnóstico: a necessidade semanal e a cobertura incluem o domingo; numa loja 24h a cobertura vai de 00h a 24h.
7. Simulações: a grade mostra o domingo; uma simulação gravada antes continua com o horário que tinha.
8. Mudar o horário de uma loja com simulação em uso: aparece "desatualizada" (e **não** aparece só por ter convertido o formato).
9. `docker compose exec api npm test` e `npm run test:integration` passam.
