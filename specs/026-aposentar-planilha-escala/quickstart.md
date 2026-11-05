# Quickstart: Aposentar a planilha de escala

1. Ambiente de pé e migration aplicada: `docker compose up -d --build --wait`.
2. Ensaio da migração: `docker compose exec -T api npm run migrar-escala` e ler o relatório (por loja: preenchidos, já tinham dados, sem correspondente). Conferir que nada foi gravado. Depois `docker compose exec -T api npm run migrar-escala -- --aplicar`, e repetir para ver que a segunda vez não muda nada.
3. Diagnóstico de uma loja migrada: mesmos números de antes (equipe no cálculo, contratações sugeridas, horas que faltam).
4. Cadastro › Equipe: editar um funcionário, informar início e fim do intervalo (e testar os erros: só um dos dois, fim antes do início, fora do turno); ver a cobertura por hora descontar o almoço.
5. Importar planilha de funcionários com e sem as colunas de intervalo; baixar o modelo e ver as colunas.
6. Importar (botão do topo): só a Base comercial; nenhum texto manda "importar a escala"; o Diagnóstico não mostra "linhas rejeitadas na importação da escala".
7. Personalizar um cenário numa loja sem funcionários com horário: a Simulação abre com o aviso novo (sobre o Cadastro, sem "turnos" nem "importe a planilha").
8. Testes: `docker compose exec -T api npx vitest run` (e a integração das áreas tocadas) e `docker compose exec -T web npx vitest run`; `npx vite build`.
