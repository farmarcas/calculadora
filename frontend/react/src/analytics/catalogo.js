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
