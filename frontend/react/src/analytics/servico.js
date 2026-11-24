// Único ponto de contato com o Mixpanel. Telas e ações só chamam `registrar`; nenhuma importa `mixpanel-browser`.
// Sem token a medição fica desligada, e qualquer falha daqui é engolida: a calculadora nunca depende da medição.
import mixpanel from "mixpanel-browser";
import { propriedadesDaPessoa, propriedadesPermitidas } from "./catalogo.js";

export { regraEmHoras } from "./catalogo.js";

let ativo = false;
let ambiente = "desenvolvimento";
let idAtual = null;
let dadosAtuais = null;
let percentual = 100;
let gravando = false;
let sorteio = Math.random;
let flagsPermitidas = true;
let flagsAtivas = false;
let versaoFlags = 0;
const ouvintesFlags = new Set();

// Vazio = ligado; `0` ou `false` desliga. Só vale quando há token e pessoa identificada.
export const flagsLigadas = (valor) => !["0", "false"].includes(String(valor ?? "").trim().toLowerCase());

// 0 a 100. Vazio = todas as sessões; valor inválido ou fora da faixa = 0 (na dúvida, não grava).
export const percentualDeGravacao = (valor) => {
  const texto = String(valor ?? "").trim();
  if (texto === "") return 100;
  const n = Number(texto);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : 0;
};

const avisarFlags = () => {
  versaoFlags += 1;
  ouvintesFlags.forEach((ouvinte) => seguro(ouvinte));
};

const seguro = (fn) => {
  try {
    return fn();
  } catch {
    return undefined;
  }
};

export const iniciar = (config = {}) =>
  seguro(() => {
    const env = import.meta.env ?? {};
    const token = (config.token ?? env.VITE_MIXPANEL_TOKEN ?? "").trim();
    ativo = false;
    idAtual = null;
    dadosAtuais = null;
    gravando = false;
    flagsAtivas = false;
    flagsPermitidas = flagsLigadas(config.flags ?? env.VITE_MIXPANEL_FLAGS);
    sorteio = config.sorteio ?? Math.random;
    percentual = percentualDeGravacao(config.replayPercent ?? env.VITE_MIXPANEL_REPLAY_PERCENT);
    if (!token) return;
    ambiente = config.ambiente ?? (env.PROD ? "producao" : "desenvolvimento");
    const apiHost = (config.apiHost ?? env.VITE_MIXPANEL_API_HOST ?? "").trim();
    mixpanel.init(token, {
      // Só os eventos do catálogo: sem captura automática de cliques/telas.
      autocapture: false,
      track_pageview: false,
      // A gravação (e com ela o mapa de calor) só começa depois da identificação, em `identificar`: nunca no init.
      record_sessions_percent: 0,
      record_heatmap_data: true,
      // Tudo coberto na gravação: texto e campos. O console e a rede podem carregar dados, então ficam de fora.
      record_mask_all_text: true,
      record_mask_inputs: true,
      record_console: false,
      record_network: false,
      record_canvas: false,
      record_max_ms: 60 * 60 * 1000,
      // Flags e experimentos ficam desligados no init: só ligam depois da identificação, em `ligarFlags`.
      flags: false,
      persistence: "localStorage",
      ...(apiHost ? { api_host: apiHost } : {}),
    });
    ativo = true;
  });

// Grava (replay + mapa de calor) só depois de a pessoa estar identificada e se a sessão for sorteada.
const comecarAGravar = () => {
  if (gravando || percentual <= 0 || sorteio() * 100 >= percentual) return;
  mixpanel.start_session_recording();
  gravando = true;
};

// Liga as flags com as propriedades da pessoa como contexto e busca. Antes disso (e em modo demonstração) tudo vale o padrão.
const ligarFlags = (propriedades) => {
  const contexto = { custom_properties: propriedades };
  if (!flagsAtivas) {
    mixpanel.set_config({ flags: { context: contexto } });
    flagsAtivas = true;
    return;
  }
  mixpanel.flags.update_context(contexto).then(avisarFlags, () => {});
};

// Liga os eventos à pessoa logada. Repetir com os mesmos dados não reenvia nada.
// Além de ID, nome e e-mail, só passam as propriedades listadas em PROPRIEDADES_DA_PESSOA.
export const identificar = ({ id, nome, email, ...resto } = {}) =>
  seguro(() => {
    if (!ativo || id == null || id === "") return;
    const novoId = String(id);
    const propriedades = { $name: nome, $email: email, ...propriedadesDaPessoa(resto) };
    const dados = JSON.stringify(propriedades);
    if (idAtual === novoId && dadosAtuais === dados) return;
    const trocouDePessoa = idAtual !== novoId;
    const contextoDasFlags = propriedadesDaPessoa(resto);
    // As flags ligam antes do identify: o SDK rebusca sozinho quando o id muda.
    if (flagsPermitidas) ligarFlags(contextoDasFlags);
    if (trocouDePessoa) mixpanel.identify(novoId);
    idAtual = novoId;
    dadosAtuais = dados;
    mixpanel.people.set(propriedades);
    if (flagsPermitidas && trocouDePessoa) mixpanel.flags.load_flags().then(avisarFlags, () => {});
    if (trocouDePessoa) comecarAGravar();
  });

export const registrar = (evento, props) =>
  seguro(() => {
    // Sem pessoa identificada (modo demonstração) não se mede; só o login acontece antes da identificação.
    if (!ativo || (!idAtual && evento !== "login_concluido")) return;
    const permitidas = propriedadesPermitidas(evento, props);
    if (!permitidas) return;
    mixpanel.track(evento, { ...permitidas, ambiente });
  });

// Na saída: a próxima pessoa que entrar neste navegador não se mistura com esta.
export const limpar = () =>
  seguro(() => {
    if (!ativo) return;
    if (gravando) mixpanel.stop_session_recording();
    gravando = false;
    // Desliga as flags antes do reset: o SDK rebusca flags no reset e não pode fazer isso para pessoa anônima.
    if (flagsAtivas) {
      mixpanel.set_config({ flags: false });
      flagsAtivas = false;
    }
    idAtual = null;
    dadosAtuais = null;
    mixpanel.reset();
    avisarFlags();
  });

// Flags e experimentos. Sempre devolvem o padrão quando algo não está pronto, falha ou a flag não existe.
export const flagLigada = (nome) => (flagsAtivas ? seguro(() => mixpanel.flags.is_enabled_sync(nome, false)) === true : false);

export const variante = (nome, padrao) => {
  if (!flagsAtivas) return padrao;
  const valor = seguro(() => mixpanel.flags.get_variant_value_sync(nome, padrao));
  return valor === undefined ? padrao : valor;
};

// Para o gancho React: avisa quando as flags chegam ou saem.
export const aoMudarFlags = (ouvinte) => {
  ouvintesFlags.add(ouvinte);
  return () => ouvintesFlags.delete(ouvinte);
};
export const versaoDasFlags = () => versaoFlags;
