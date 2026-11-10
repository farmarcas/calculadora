// Regras puras do modal "Enviar base comercial".

// Resultado do envio (`POST /cargas/base`) → { lojas: quantas lojas receberam a base, naoGravadas: linhas que ficaram de fora }.
export const resumoDoEnvio = (res) => ({
  lojas: (res?.lojas ?? []).filter((l) => l.situacao === "Importada").length,
  naoGravadas: (res?.totalErros ?? 0) + (res?.lojas ?? []).reduce((s, l) => s + (l.situacao === "Importada" ? 0 : l.rejeitadas), 0),
});

// Arquivo por CNPJ e dia da semana (totais de um período): a revisão traz `formato: "por_cnpj"`.
export const ehPorCnpj = (revisao) => revisao?.formato === "por_cnpj";

// Se a revisão permite enviar: precisa haver ao menos uma loja cadastrada no arquivo e, no formato por CNPJ, o período.
export const podeEnviar = (revisao) => !!revisao && revisao.lojas > 0 && !(ehPorCnpj(revisao) && revisao.precisaPeriodo);

// Os dois campos de data formam um período que vale enviar para o servidor conferir.
export const periodoPreenchido = (inicio, fim) => /^\d{4}-\d{2}-\d{2}$/.test(inicio ?? "") && /^\d{4}-\d{2}-\d{2}$/.test(fim ?? "");

// Aviso das lojas do arquivo que não estão cadastradas (nulo quando todas estão).
export const textoLojasNaoCadastradas = (codigos = []) => {
  if (!codigos.length) return null;
  const lista = codigos.slice(0, 5).join(", ") + (codigos.length > 5 ? ` e mais ${codigos.length - 5}` : "");
  return codigos.length === 1
    ? `A loja ${lista} não está cadastrada e fica de fora. Cadastre antes de enviar.`
    : `${codigos.length} lojas do arquivo não estão cadastradas e ficam de fora: ${lista}. Cadastre antes de enviar.`;
};

const n = (v, um, varios) => `${v} ${v === 1 ? um : varios}`;
const DIAS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];

// O arquivo traz totais do período: explica a conta (ou pede o período enquanto não vier).
export const textoDoPeriodoPorCnpj = (rev) => {
  if (rev?.periodo?.diasDaSemana) {
    const vezes = rev.periodo.diasDaSemana.map((v, i) => `${DIAS[i]} ${v}`).join(", ");
    return `Os valores do arquivo são totais do período. Vamos guardar a média de um dia, dividindo pelas vezes que cada dia da semana aparece: ${vezes}.`;
  }
  return "Informe o período que o arquivo cobre. Os valores dele são totais, e precisamos dele para calcular a média de um dia.";
};

// { titulo, apoio } do que vai acontecer com as lojas.
export const resumoDaConferenciaPorCnpj = (rev) => ({
  titulo: `${n(rev.lojas, "loja terá", "lojas terão")} a base trocada.`,
  apoio: [
    rev.substitui ? `${n(rev.substitui, "já tinha base", "já tinham base")}: a anterior fica guardada.` : "Nenhuma tinha base antes.",
    rev.mantidas ? `${n(rev.mantidas, "loja cadastrada não vem", "lojas cadastradas não vêm")} no arquivo e ${rev.mantidas === 1 ? "fica como está" : "ficam como estão"}.` : "",
  ].filter(Boolean).join(" "),
});

// CNPJs do arquivo sem loja cadastrada (nulo quando todos têm).
export const textoCnpjsSemLoja = (rev) => {
  const total = rev?.totalCnpjsSemLoja ?? 0;
  if (!total) return null;
  const lista = (rev.cnpjsSemLoja ?? []).slice(0, 3).join(", ");
  const resto = total > 3 ? ` e mais ${total - 3}` : "";
  return `${n(total, "CNPJ do arquivo não tem loja cadastrada e fica", "CNPJs do arquivo não têm loja cadastrada e ficam")} de fora: ${lista}${resto}. Nenhuma loja é criada.`;
};

// O que será preenchido no Cadastro das lojas (só onde está vazio); nulo se nada.
export const textoCadastroPorCnpj = (rev) => {
  const c = rev?.preencheCadastro;
  if (!c || (!c.faturamento && !c.cmvPct && !c.jaTinhamValor)) return null;
  const partes = [];
  if (c.faturamento) partes.push(`o faturamento por dia da semana de ${n(c.faturamento, "loja", "lojas")}`);
  if (c.cmvPct) partes.push(`o CMV médio de ${n(c.cmvPct, "loja", "lojas")}`);
  const preenche = partes.length ? `O Cadastro recebe ${partes.join(" e ")}, só onde estava vazio.` : "";
  const mantem = c.jaTinhamValor ? `${n(c.jaTinhamValor, "loja já tinha valor digitado e ele não muda", "lojas já tinham valor digitado e ele não muda")}.` : "";
  return [preenche, mantem].filter(Boolean).join(" ");
};

// Avisos de qualidade do arquivo (só informam; não impedem o envio).
export const textoDoAviso = ({ tipo, quantidade: q }) => {
  switch (tipo) {
    case "linha_zerada": return `${n(q, "linha com faturamento zerado", "linhas com faturamento zerado")}. Entram como estão.`;
    case "unidades_menores_que_clientes": return `${n(q, "linha tem", "linhas têm")} menos unidades que clientes. Entram como estão.`;
    case "cmv_maior_que_venda": return `${n(q, "linha tem", "linhas têm")} CMV maior que a venda (lucro negativo na hora). Entram como estão.`;
    case "loja_com_poucos_dias": return `${n(q, "loja tem", "lojas têm")} menos de 6 dias da semana no arquivo. Só os dias que vieram são gravados.`;
    default: return "";
  }
};
