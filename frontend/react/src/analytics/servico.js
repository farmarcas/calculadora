// Único ponto de contato com o Mixpanel. Telas e ações só chamam `registrar`; nenhuma importa `mixpanel-browser`.
// Sem token a medição fica desligada, e qualquer falha daqui é engolida: a calculadora nunca depende da medição.
import mixpanel from "mixpanel-browser";
import { propriedadesPermitidas } from "./catalogo.js";

export { regraEmHoras } from "./catalogo.js";

let ativo = false;
let ambiente = "desenvolvimento";
let idAtual = null;
let dadosAtuais = null;

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
    if (!token) return;
    ambiente = config.ambiente ?? (env.PROD ? "producao" : "desenvolvimento");
    const apiHost = (config.apiHost ?? env.VITE_MIXPANEL_API_HOST ?? "").trim();
    mixpanel.init(token, {
      // Só os eventos do catálogo: sem captura automática de cliques/telas e sem gravação de sessão.
      autocapture: false,
      track_pageview: false,
      record_sessions_percent: 0,
      persistence: "localStorage",
      ...(apiHost ? { api_host: apiHost } : {}),
    });
    ativo = true;
  });

// Liga os eventos à pessoa logada. Repetir com os mesmos dados não reenvia nada.
export const identificar = ({ id, nome, email, perfil } = {}) =>
  seguro(() => {
    if (!ativo || id == null || id === "") return;
    const novoId = String(id);
    const dados = JSON.stringify([nome, email, perfil]);
    if (idAtual === novoId && dadosAtuais === dados) return;
    if (idAtual !== novoId) mixpanel.identify(novoId);
    idAtual = novoId;
    dadosAtuais = dados;
    mixpanel.people.set({ $name: nome, $email: email, perfil });
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
    idAtual = null;
    dadosAtuais = null;
    mixpanel.reset();
  });
