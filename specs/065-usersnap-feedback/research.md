# Research: Usersnap

## Decisão 1: pacote oficial `@usersnap/browser`
- Decisão: usar `loadSpace(chave)` do pacote oficial (1.0.2).
- Motivo: é a forma recomendada pelo Usersnap, com suporte completo às regras de quem vê cada widget no painel; já traz tipos e `destroy`.
- Alternativas: colar o script do Usersnap no `index.html` (carregaria para quem ainda não fez login e fura a regra da spec); injetar o script na mão (mais código para o mesmo resultado).

## Decisão 2: carregar só depois do login
- Decisão: `loadSpace` só é chamado dentro de `identificar`.
- Motivo: FR-002 e SC-003: nada do Usersnap na tela de entrada nem na demonstração.

## Decisão 3: identificação
- Decisão: `user` com `userId`, `email`, `nome`, `perfil`, `papel_radar` e `custom` com a `loja`. Os campos extras aceitos pelo pacote são texto, número ou booleano.
- Motivo: cobre FR-004 sem dado além do já medido no Mixpanel (spec 059). Grupo econômico e CNPJ ficam de fora, como já foi decidido na medição.

## Decisão 4: tela atual
- Decisão: confiar no endereço da página que o Usersnap já captura.
- Motivo: o app navega por `?tela=...`; evita manter outro estado.

## Decisão 5: homologação e local sem chave
- Decisão: chave só no build de produção.
- Motivo: mesmo padrão do token do Mixpanel; feedback real não se mistura com testes.

## Decisão 6: sem política de segurança de conteúdo
- Verificado: o nginx do front não define `Content-Security-Policy`, então o Usersnap carrega sem ajuste. Se um dia houver CSP, será preciso liberar os domínios do Usersnap.

## Pendente da pessoa
- A chave de espaço (Space API key) do projeto no Usersnap. Ela fica em Settings do espaço no painel; entra no `.env` local para teste e no segredo `USERSNAP_SPACE_KEY` do repositório para produção.
