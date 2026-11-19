# Research — Mapa de calor e replay

Conferido no código do `mixpanel-browser` 2.85 instalado.

## Mapa de calor depende da gravação
- **Finding**: `record_heatmap_data` só coleta quando há sessão gravada em andamento (`isRecordingHeatmapData` exige o id da gravação).
- **Decision**: ligar `record_heatmap_data: true` junto com a gravação; um único controle (`MIXPANEL_REPLAY_PERCENT`).
- **Alternatives**: captura automática de cliques (`autocapture`): descartada, ela envia texto de elementos e foge do catálogo da spec 059.

## Cobertura de conteúdo
- **Decision**: `record_mask_all_text: true` e campos sempre cobertos (`record_mask_inputs: true`, já o padrão); imagens, vídeo e áudio já bloqueados por padrão (`record_block_selector`). `record_console: false` e `record_network: false` (o console e a rede podem carregar dados).
- **Rationale**: as telas mostram folha, faturamento, nomes e CNPJs. Cobrir tudo não depende de marcar cada tela.
- **Alternatives**: cobrir só "o que parece dinheiro" (falha com nomes e CNPJs); liberar trechos com `record_unmask_text_selector` (fica para depois, se alguém pedir).

## Quando começar a gravar
- **Decision**: `init` com `record_sessions_percent: 0`; após `identificar`, sortear com o percentual configurado e chamar `start_session_recording()`. Nunca antes da identificação.
- **Rationale**: modo demonstração e telas de login não gravam. O SDK por conta própria sortearia já no `init`.

## Parcela gravada, duração e carga
- **Decision**: `VITE_MIXPANEL_REPLAY_PERCENT` (0 a 100; vazio = 100 quando há token). `record_max_ms` de 1 hora por gravação (padrão do SDK é 24 h) e `record_idle_timeout_ms` padrão de 30 min.
- **Rationale**: poucas pessoas; limite evita aba esquecida gerando volume.
- **Plano do Mixpanel**: precisa incluir Session Replay e heatmaps; não dá para conferir daqui. A quickstart valida no Mixpanel.

## Carga do gravador
- **Decision**: padrão do SDK (gravador carregado do CDN do Mixpanel sob demanda). Se o CDN for bloqueado, a gravação simplesmente não acontece.
- **Alternatives**: empacotar o gravador no build (`mixpanel-with-recorder`): aumenta o JS de toda a tela; só vale se o CDN for barrado por política de segurança do Radar.
