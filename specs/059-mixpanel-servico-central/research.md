# Research — Medição com Mixpanel

## Onde medir: front ou servidor
- **Decision**: no front (navegador).
- **Rationale**: telas, cliques, perfil e sessão estão no front; o SDK de navegador resolve identidade e fila de envio. O servidor não sabe qual tela foi aberta.
- **Alternatives**: enviar do backend (perde telas; mais código e segredo no servidor); misto (complexidade sem ganho no MVP).

## Biblioteca
- **Decision**: `mixpanel-browser` (SDK oficial), isolado em `analytics/servico.js`.
- **Rationale**: identidade, filas e novas tentativas prontos; trocar de ferramenta depois é mexer só no serviço.
- **Alternatives**: chamar a API HTTP do Mixpanel na mão (reinventa fila, identidade e erros); Segment/GTM (camada a mais que ninguém pediu).

## Chave (token) e ambientes
- **Decision**: variável `MIXPANEL_TOKEN` (no build do front, `VITE_MIXPANEL_TOKEN`). Vazio = medição desligada. Existe só o projeto Radar Escala (id 4084146); sem projeto de homologação, dev/local ficam sem token.
- **Rationale**: evita poluir os números reais. O token do Mixpanel é de uso público no navegador, mas a regra do projeto é não versionar chaves.
- **Alternatives**: token no código (viola a constituição); projeto Mixpanel de teste (a pessoa decide criar depois; o serviço já aceita).

## Propriedade `ambiente`
- **Decision**: `producao` quando for build de produção, `desenvolvimento` caso contrário.
- **Rationale**: permite filtrar no Mixpanel caso alguém ligue com token em dev.

## Identidade
- **Decision**: `identify(ID)` + perfil do usuário (nome, e-mail, perfil) no perfil do Mixpanel; `reset()` na saída. Só com login do Radar (`sessao.sso`); modo demonstração não mede.
- **Rationale**: sem pessoa real não há nome/e-mail honestos. O ID já existe no servidor (`radarUsuarioId`) mas hoje não vai para a tela: acrescentar `id` em `usuario` na sessão.
- **Perfil**: muda ao trocar de grupo; o serviço atualiza a propriedade quando muda.

## Privacidade e recursos desligados
- **Decision**: sem captura automática de cliques, sem gravação de sessão, sem mapa de calor. Só eventos do catálogo.
- **Rationale**: spec pede eventos definidos; captura automática pegaria texto de tela (valores de folha).
- **Defesa extra**: o serviço descarta qualquer propriedade que não esteja na lista permitida do evento.

## Falhas
- **Decision**: todo o serviço roda dentro de `try/catch`; envio assíncrono do SDK; sem mensagens ao usuário.
- **Rationale**: spec FR-007 e SC-002.

## Região do Mixpanel
- **Decision**: endereço padrão (EUA). Confirmado em 2026-11-16: eventos enviados ao endereço padrão chegaram ao projeto Radar Escala (4084146). `VITE_MIXPANEL_API_HOST` fica só para o caso de o projeto mudar de região.
- **Rationale**: dado enviado para a região errada não aparece no projeto.
