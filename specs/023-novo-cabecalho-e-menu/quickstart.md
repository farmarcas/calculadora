# Quickstart: Novo cabeçalho e menu lateral (Radar)

1. Ambiente de pé: `docker compose up -d --wait` e abrir http://localhost:3000.
2. Menu: recolher e abrir, recarregar a página (a escolha permanece); clicar em Diagnóstico e Simulações e ver o item atual destacado.
3. Menu recolhido: passar o mouse e usar Tab num ícone (aparece a dica); clicar em Escala (abre o painel com Diagnóstico e Simulações).
4. Perfis: como operador, ver Grupos e Parâmetros legais; como dono, gestor e consulta, não ver.
5. Faixa: nas telas da Escala, ver as horas de funcionamento da loja (ex.: Sumaré - Centro = 77 h), trocar de loja e ver as duas telas mudarem; não existe outro seletor de loja.
6. Importar: clicar e ver o envio de planilhas; como consulta, o botão não aparece.
7. Conta: abrir pelo avatar, trocar papel e grupo (demonstração), fechar com Esc e ver o foco voltar ao avatar.
8. Celular (375 px): menu começa recolhido e abre como gaveta; faixa em duas linhas abaixo de 1024 px; só o ícone no Importar abaixo de 600 px.
9. Testes: `docker compose exec -T web npx vitest run` e `npx vite build`.
