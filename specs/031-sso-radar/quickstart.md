# Quickstart: Entrar pelo Radar (SSO)

## Sem o Radar (automático)

1. Com o login desligado, os testes de sempre continuam verdes: `npm test` e `npm run test:integration` na API, `npm test` na tela.
2. Os testes novos usam um Radar de mentira, injetado no `createApp`, e cobrem:
   - pedido sem sessão recusado em todas as rotas de dados;
   - código inválido ou já usado, API do Radar fora do ar;
   - papéis de FR-012;
   - criação de grupo e loja, loja excluída que não volta, dois logins ao mesmo tempo;
   - `X-GE` e `X-Perfil` forçados; acesso parcial por loja; importação recusada no acesso parcial;
   - "Sair" invalida o cookie na hora.

## Com o Radar de desenvolvimento

Precisa da API de autenticação de dev (rede interna) e de `SSO_HABILITADO=true`, `RADAR_AUTH_URL`, `SSO_CLIENT_ID`, `SSO_CLIENT_SECRET`, `JWT_SEGREDO` e `RADAR_URL` no `.env`. O compose local não lê `SSO_SLUG` nem `SESSAO_HORAS`: valem os padrões `Calculadora` e 8 horas.

1. Abrir http://localhost:3000 numa janela anônima: aparece "Ir para o Radar", sem nenhum dado.
2. No Radar de dev logado, escolher "Calculadora" em Aplicações: abre outra aba, conectada.
3. Conta com 2 grupos: os dois aparecem no filtro; a lista de lojas muda ao trocar.
4. Conta com parte das lojas: só essas aparecem; abrir o endereço de outra responde "não encontrado".
5. "Sair": aparece a tela de saída; recarregar não reconecta.
6. Conferir na API de autenticação de dev que o `Sso:Calculadora` aponta para `http://localhost:3000/sso/callback`.

## Publicação (nesta ordem)

1. Cadastrar `Sso__Calculadora__*` no cofre de cada ambiente.
2. Publicar `api-authentication-dotnet`.
3. Publicar `webapp-radar`.
4. Conferir num caso real que `grupos_economicos.identificacao` é o número do grupo no Radar, comparando um grupo conhecido.
5. Preencher as variáveis no Coolify e publicar a calculadora. Sem elas, a publicação falha dizendo qual falta.
