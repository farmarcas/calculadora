# Quickstart — conferir o painel "O que falta preencher"

1. `/subir-ambiente` (ou `docker compose up -d --build --wait`).
2. Cadastros › Lojas, grupo com lojas em "Revisar" (por exemplo, 32 sem margem).
3. Como dono, abrir uma loja em Revisar:
   - faixa amarela aberta, "Faltam N itens", "X de Y feitos" e barra;
   - itens agrupados por aba, cada um com "Preencher";
   - contador amarelo nas abas com pendência.
4. Clicar em "Preencher" de um salário: abre Regras e custos, o campo fica centralizado e com foco, o painel recolhe.
5. Digitar um valor válido: o selo vira "✓ Preenchido", o item vira "Feito" e a contagem cai, sem salvar. Apagar: volta ao amarelo.
6. Salvar: a loja passa a Completo (se nada faltar), a faixa vira a confirmação e a lista mostra a etiqueta verde.
7. Lista de lojas: "N pendências · principal motivo" nas lojas em Revisar.
8. Como gestor: itens de faturamento, margem e salário sem botão ("Só o dono do grupo preenche"), todas as abas de hoje visíveis.
9. Como Somente consulta: nenhum botão.
10. Em 360 px: painel recolhido (56 px), botões de 44 px, sem rolagem lateral.
11. Rodar os testes do servidor, de integração e da tela.
