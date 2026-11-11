# Quickstart: Folgas sugeridas

Pré-requisito: ambiente no ar, perfil dono ou gestor, web em http://localhost:3000.

1. Abrir a Simulação de Sumaré (Personalizar) na regra de 44h. A Escala da semana mostra todos com 7 dias e o botão "Sugerir folgas".
2. Clicar em "Sugerir folgas": cada pessoa passa a ter 6 dias e 1 folga; os totais caem; os avisos de "dias a mais" somem.
3. Conferir que pessoas da mesma função não folgam no mesmo dia e que o domingo tem folga para ao menos 1 em cada 3 por função.
4. Trocar a regra para 42h e sugerir de novo: 5 dias e 2 folgas por pessoa.
5. Se algum dia ficar descoberto, o aviso aparece no card e a faixa amarela na Escala por hora.
6. "Desfazer sugestão": a semana volta a 7 dias.
7. Clicar numa folga na Escala por hora: vira turno; "Tirar do dia" faz o contrário.
8. Perfil visualizador: o botão não aparece. Conferir o Cadastro: nada mudou.

Testes: `docker compose exec web npm test` (funções puras em `folgas-regras.test.js`).
