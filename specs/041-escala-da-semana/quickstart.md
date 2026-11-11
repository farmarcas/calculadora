# Quickstart: Escala da semana

Pré-requisito: ambiente no ar (`docker compose up -d --wait`), web em http://localhost:3000.

1. Abrir uma Simulação de uma loja com equipe (ex.: Sumaré). Abaixo da "Escala por hora" aparece "Escala da semana".
2. Conferir: Farmacêutico e Caixa abertos, Atendimento recolhido; clicar no cabeçalho do grupo recolhe e expande.
3. Conferir folga (quadro tracejado), "FECHADA" no domingo (loja que não abre) e o intervalo ("int. 11h").
4. Conferir a coluna Semana: soma das células, sem o intervalo.
5. "+ Contratar" um Farmacêutico parcial para sexta e sábado: aparece a linha "Contratação simulada" (tracejada, nome azul), folga nos outros dias; remover some a linha.
6. Clicar numa célula (perfil dono ou gestor): a Escala por hora abre naquele dia.
7. Trocar para o perfil visualizador: nada de R$; células não clicáveis; grupos ainda recolhem.
8. Simulação sem turnos: aparece o estado vazio com "Cadastrar turnos".
9. Largura estreita: a tabela rola para o lado e a coluna da pessoa fica fixa.

Testes: `docker compose exec web npm test` (funções puras em `semana-regras.test.js`).
