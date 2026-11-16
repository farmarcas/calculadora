// Catálogo oficial de eventos de medição (specs/059-mixpanel-servico-central/contracts/catalogo-eventos.md).
// Evento fora daqui não é enviado. Propriedade fora da lista do evento, ou com valor fora do permitido, é descartada.
// Lista de valores = só esses passam; SLUG = texto curto de letras minúsculas, números, "_" ou "-" (nunca texto livre).
export const SLUG = "slug";

export const CATALOGO = {
  login_concluido: {},
  tela_vista: { tela: ["cadastros", "escala", "grupos"], secao: SLUG },
  loja_trocada: {},
  simulacao_criada: { regra_horas: [40, 42, 44], origem: SLUG },
  cenario_salvo: {},
  importacao_concluida: { tipo: ["cadastro", "base"], resultado: ["sucesso", "erro"] },
  parametros_salvos: { tipo: ["encargos", "regime"] },
  exportacao_feita: { tipo: ["modelo", "erros", "parecer"] },
};

const PADRAO_SLUG = /^[a-z0-9_-]{1,40}$/;

export const valorPermitido = (regra, valor) =>
  regra === SLUG ? typeof valor === "string" && PADRAO_SLUG.test(valor) : Array.isArray(regra) && regra.includes(valor);

// Devolve só as propriedades permitidas do evento; `null` se o evento não existe no catálogo.
export const propriedadesPermitidas = (evento, props = {}) => {
  const permitidas = CATALOGO[evento];
  if (!permitidas) return null;
  return Object.fromEntries(Object.entries(props ?? {}).filter(([chave, valor]) => chave in permitidas && valorPermitido(permitidas[chave], valor)));
};

// Id da regra do servidor ("r42") em horas por semana (42), como o catálogo espera.
export const regraEmHoras = (id) => Number(String(id ?? "").replace(/\D/g, "")) || undefined;

// Propriedades da pessoa no Mixpanel (só estas passam). Texto curto em minúsculas, sim/não ou número inteiro.
export const PROPRIEDADES_DA_PESSOA = {
  perfil: "texto",
  papel_radar: "texto",
  operador: "sim_nao",
  quantidade_grupos: "numero",
  quantidade_lojas: "numero",
  acesso_total: "sim_nao",
};

const textoCurto = (v) => typeof v === "string" && /^[a-z0-9_ -]{1,40}$/i.test(v);
const VALIDADORES = {
  texto: textoCurto,
  sim_nao: (v) => typeof v === "boolean",
  numero: (v) => Number.isInteger(v) && v >= 0 && v <= 1_000_000,
};

export const propriedadesDaPessoa = (dados = {}) =>
  Object.fromEntries(Object.entries(PROPRIEDADES_DA_PESSOA).flatMap(([chave, tipo]) => (VALIDADORES[tipo](dados?.[chave]) ? [[chave, dados[chave]]] : [])));
