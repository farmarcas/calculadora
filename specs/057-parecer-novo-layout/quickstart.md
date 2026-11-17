# Como conferir

1. Subir o ambiente e abrir um cenário salvo em Cosmópolis ("Ver parecer"), como dono.
2. A modal tem o título "Parecer do cenário · Cosmópolis", o subtítulo (loja · regra · cenário n; "Salvo em … pelo dono"), o chip de status, o parágrafo, os três números (folha com chip e "hoje X% · R$ … a mais por mês", equipe, farmacêutico faltando), a tabela "O que muda" (com a folha por mês) e o rodapé fixo.
3. Rolar o conteúdo (tela pequena): o rodapé continua visível. Esc fecha e o foco volta ao botão "Ver parecer". Tab fica dentro da janela.
4. "Baixar parecer em PDF": o botão mostra o indicador e fica desabilitado; baixa `parecer-cosmopolis-cenario-5.pdf` (uma página, "Página 1 de 1", logo, mesmo conteúdo). Derrubar a API e tentar: aparece "Não foi possível baixar o PDF. Tente de novo." e "Tentar de novo".
5. Como gestor e consulta: "Custo de pessoal", "—", "sem valores em reais", chip Aumenta; sem a linha "Folha por mês"; rodapé com "Valores em reais aparecem só para o dono do grupo."; o PDF sem "R$" nem "%".
6. Cenário salvo antes (parecer v1) e cenário antigo: abrem no layout novo com o aviso de "montado agora".
7. Testes: `docker compose exec -T api npx vitest run`, `… api npm run test:integration` (sozinho), `… web npx vitest run`; e `sh scripts/check-repo.sh` e `npm run lint` na API.
