# Research: Feature flags e experimentos

## Decisão 1: usar as flags do próprio `mixpanel-browser`
- Decisão: usar `mixpanel.flags` (já no SDK 2.85): `is_enabled_sync`, `get_variant_value_sync`, `update_context`, `load_flags`.
- Motivo: sem biblioteca nova, e o SDK já registra `$experiment_started` com o nome e a versão.
- Alternativas: pacote próprio de flags (mais código a manter); flag fixa em variável de ambiente (exige publicar para mudar, perde o ponto do pedido).

## Decisão 2: ligar só depois de identificar
- Decisão: iniciar o SDK com `flags` desligado e ligá-lo em `identificar`.
- Motivo: se ligado no `init`, o SDK busca flags já com a pessoa anônima (e em modo demonstração), contra a regra da spec e da medição. Também o `reset` do SDK rebusca flags; por isso `limpar` desliga antes.
- Alternativa: ligar no `init` e ignorar o resultado (consulta desnecessária, fere FR-001).

## Decisão 3: leitura síncrona com padrão
- Decisão: as telas usam as versões síncronas, que devolvem o padrão enquanto as flags não chegaram.
- Motivo: a tela nunca espera rede. O gancho `useFlag` reavalia quando `load_flags()` termina.
- Alternativa: versões assíncronas (a tela precisaria de estado de "carregando" em cada uso).

## Decisão 4: contexto para regras de quem recebe
- Decisão: passar ao contexto das flags as propriedades da pessoa já enviadas à medição.
- Motivo: permite regras por perfil ou papel sem criar nada novo (FR-004).
- A verificar na implementação: o nome exato da chave de contexto que o Mixpanel usa para regras por propriedade da pessoa (a documentação cita `custom_properties`); validar com uma flag de teste real.

## Decisão 5: plano do Mixpanel
- Conferido em 2026-11-24: o projeto Radar Escala já lista flags e experimentos (existem uma flag `teste`, uma `teste-D3G3eepc` e um experimento `teste`, todos desligados/rascunho, criados em 16–17/11). Logo o plano inclui o recurso.
- Esses itens de teste são da pessoa dona do projeto e não serão alterados; a validação usa uma flag nova própria, apagada no fim.

## Decisão 6: chave de desligar
- Decisão: `VITE_MIXPANEL_FLAGS` (`0`/`false` desliga; vazio liga), igual ao padrão de `MIXPANEL_REPLAY_PERCENT`.
- Motivo: recuo rápido sem mexer em tela.

## Resultado da validação (2026-11-24, ambiente local, token real)
- Flag de teste `teste_064_flags` criada, lida como ligada depois de identificar e como desligada antes; nome inexistente vale desligado; após `limpar` volta ao padrão.
- A chamada de flags saiu com `custom_properties` (perfil, operador, quantidade_lojas) e sem nome nem e-mail.
- `$experiment_started` chegou ao Mixpanel (2 eventos, com ~1 minuto de atraso de ingestão) com o nome da flag.
- Flag de teste desativada e arquivada. A pessoa fictícia `teste-local-064` ficou no projeto (apagar manualmente).
- Ainda a conferir na tela do Mixpanel: que uma regra por propriedade da pessoa (ex.: perfil) enxerga `custom_properties`. A criação de regras por propriedade só existe na tela do Mixpanel.
