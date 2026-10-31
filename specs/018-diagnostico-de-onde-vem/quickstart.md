# Quickstart — validar "De onde vêm esses números"

1. `docker compose up -d --build --wait`; http://localhost:3000, Escala › loja com escala e vendas (ex.: Sumaré - Centro, grupo 216).
2. Abaixo dos cenários há um único cartão "De onde vêm esses números", aberto em "Cobertura e vendas"; recarregar mantém a aba (`?aba=`); setas trocam de aba.
3. Aba 1: grade com turnos, vendas (picos em azul escuro), cobertura por função; célula abaixo do mínimo com ▲; horas fora do horário listradas; legenda; observação do pico só quando faz sentido; "Vendas fora do horário" só quando existe.
4. Aba 2: três regras lado a lado; coluna da regra escolhida no topo destacada; "Atende"/"Falta …"; saldos em texto; bloco de 8h24 só com a convenção desligada e quando a estimativa reduz o que falta.
5. Aba 3: equipe por função com totais; linha do tempo com parte fora do horário listrada; "No cálculo"/"Fora do cálculo"; atalhos abrem o Cadastro na loja e aba certas.
6. Sem vendas ou sem turnos: vazios com os links; sem equipe: "Nenhum funcionário no cálculo".
7. O que existia acima do cartão está igual ao de antes (cabeçalho, card, cenários). "Escala redistribuída" e "Déficit e contratações" continuam abaixo do cartão.
8. Larguras 1440, 1100, 768, 420 e 360; teclado nas abas; testes: `docker compose exec -T web npm test` e `npm test` no servidor.
