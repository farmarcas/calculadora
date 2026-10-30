// Regras de apresentação do card "Diagnóstico da escala" (sem cálculo novo: só lê o que o servidor já devolve).
const MESES_DIA = 24 * 60 * 60 * 1000;

// Hoje no fuso de São Paulo, como AAAA-MM-DD.
export const hojeSP = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });

// "16/12/2026" → "2026-12-16"; "hoje" ou qualquer outra coisa → null (regra já em vigor).
export const isoDeVigencia = (txt) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(txt ?? "");
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
};

const utc = (iso) => {
  const [a, m, d] = iso.split("-").map(Number);
  return Date.UTC(a, m - 1, d);
};

// Até 60 dias: "daqui a N dias" (1 = "amanhã", 0 = "hoje"); depois: meses inteiros, arredondado para baixo.
export const prazoAte = (isoVigencia, hoje = hojeSP()) => {
  const dias = Math.round((utc(isoVigencia) - utc(hoje)) / MESES_DIA);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "amanhã";
  if (dias <= 60) return `daqui a ${dias} dias`;
  const [ah, mh, dh] = hoje.split("-").map(Number);
  const [av, mv, dv] = isoVigencia.split("-").map(Number);
  let meses = (av - ah) * 12 + (mv - mh);
  if (dv < dh) meses -= 1;
  return `daqui a ${meses} ${meses === 1 ? "mês" : "meses"}`;
};

export const emVigor = (isoVigencia, hoje = hojeSP()) => !isoVigencia || isoVigencia <= hoje;

// O que o card mostra de cada regra: o gap de farmacêutico, os turnos e o resto, ou nulo quando não há cálculo.
export const calculoDaRegra = (regra) => {
  const farm = regra?.funcoes?.find((f) => f.funcao === "Farmacêutico");
  if (!farm) return null;
  return {
    gap: farm.gapH,
    turnosAcobrir: Math.max(0, -farm.saldoT),
    saldoHoras: regra.resumo.saldoHoras,
    contratacoes: regra.resumo.contratar,
  };
};

export const horas = (n) => `${String(Math.round(n * 100) / 100).replace(".", ",")}h`;
export const saldoTxt = (n) => (n < 0 ? `−${horas(Math.abs(n))}` : n > 0 ? `+${horas(n)}` : "0h");

const ATENCAO = "var(--func-attention-100)";
const ALERTA = "var(--func-warning-50)";
const OK = "var(--func-success-100)";
const MUDO = "var(--surface-muted)";

// Pill, título e apoio de cada estado do card. `regras` traz as três regras com `jornada`, `iso`, `calculo`.
export const estadoDoCard = (selecionada, regras, hoje = hojeSP()) => {
  const N = selecionada.jornada;
  const c = selecionada.calculo;
  const r44 = regras.find((r) => r.jornada === 44);
  const r42 = regras.find((r) => r.jornada === 42);
  if (!c)
    return {
      pill: "Sem cálculo",
      fundo: MUDO,
      titulo: `Não foi possível calcular a regra de ${N}h`,
      apoio: "Confira a escala e os colaboradores e tente de novo.",
      falta: false,
    };
  if (c.gap === 0)
    return {
      pill: `Cobertura completa na regra de ${N}h`,
      fundo: OK,
      titulo: "A loja cobre todo o horário com farmacêutico",
      apoio: `Na regra de ${N}h não faltam horas de farmacêutico. Confira abaixo as pendências de cadastro.`,
      falta: false,
    };
  const titulo = `Faltam ${horas(c.gap)} de farmacêutico por semana`;
  if (N === 44) {
    const g42 = r42?.calculo?.gap;
    return {
      pill: "Já falta cobertura hoje",
      fundo: ATENCAO,
      titulo,
      apoio:
        "Esta é a regra em vigor." +
        (g42 != null ? ` Na regra de 42h, a partir de ${r42.vigenciaTxt}, ${g42 > 0 ? `faltarão ${horas(g42)} por semana.` : "a loja cobrirá todo o horário."}` : ""),
      falta: true,
    };
  }
  const vigor = emVigor(selecionada.iso, hoje);
  const g44 = r44?.calculo?.gap;
  const hojeFrase = g44 == null ? "" : g44 > 0 ? ` Hoje, na regra de 44h, já faltam ${horas(g44)} por semana.` : " Hoje, na regra de 44h, a loja cobre todo o horário.";
  return {
    pill: `Falta cobertura na regra de ${N}h`,
    fundo: ALERTA,
    titulo,
    apoio: vigor
      ? "Esta regra já está em vigor."
      : `A partir de ${selecionada.vigenciaTxt}, ${prazoAte(selecionada.iso, hoje)}, a loja deixa de cobrir todo o horário com farmacêutico.${hojeFrase}`,
    falta: true,
  };
};
