// Contas e textos do cartão de cenário (spec 024), puros e sem React. A tela só desenha o que sai daqui.

export const MENOS = "−"; // sinal de menos tipográfico (U+2212)
const NOMES_DIA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
export const HORAS_BARRA = 42; // a barra de horas das contratações vale 42h = 100%

const virgula = (n) => String(Math.round(n * 10) / 10).replace(".", ",");
export const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
export const horasTxt = (n) => `${virgula(n)}h`;
const pctTxt = (n) => `${virgula(n)}%`;
const ZERO = 0.005;

// Diferença de horas com sinal: "−5h", "+1h", "–" quando não muda.
export const textoDaDiferenca = (n) => (Math.abs(n) < ZERO ? "–" : `${n < 0 ? MENOS : "+"}${horasTxt(Math.abs(n))}`);
export const tomDaDiferenca = (n) => (n < -ZERO ? "perigo" : n > ZERO ? "sucesso" : "neutro");

// ---- Faixa de resultado ---------------------------------------------------------------------------------------------

// Saldo da operação por mês: "+ R$ 29.280", "− R$ 6.480" ou "R$ 0". Nulo quando falta dado.
export const estadoDoSaldo = (c) => {
  const s = c.saldoOperacaoMensal;
  if (s == null) return null;
  if (s > ZERO) return { texto: `+ ${brl(s)}`, tom: "sucesso" };
  if (s < -ZERO) return { texto: `${MENOS} ${brl(-s)}`, tom: "perigo" };
  return { texto: brl(0), tom: "neutro" };
};

// Coluna da folha: custo (vermelho, "a mais por mês"), economia (verde, "a menos por mês") ou zero (preto).
export const estadoDaFolha = (c) => {
  const f = c.folhaAdicionalMensal;
  if (f == null) return { rotulo: "CUSTO DE FOLHA", valor: "—", apoio: "informe os custos", tom: "neutro" };
  if (f > ZERO) return { rotulo: "CUSTO DE FOLHA", valor: brl(f), apoio: "a mais por mês", tom: "perigo" };
  if (f < -ZERO) return { rotulo: "ECONOMIA DE FOLHA", valor: brl(-f), apoio: "a menos por mês", tom: "sucesso" };
  return { rotulo: "CUSTO DE FOLHA", valor: brl(0), apoio: "sem custo extra", tom: "neutro" };
};

// Coluna da venda: o que deixa de entrar (vermelho), a venda estimada das horas novas (verde) ou nada (preto).
export const estadoDaVenda = (c) => {
  if (c.semVendaHoraria) return { rotulo: "VENDA QUE DEIXA DE ENTRAR", valor: "Não estimada", apoio: "sem venda hora a hora", tom: "neutro" };
  const perdida = c.faturamentoPerdidoMensal ?? 0;
  const ganha = c.vendaAdicionalMensal ?? 0;
  if (ganha > ZERO && perdida > ZERO) {
    const liquida = ganha - perdida;
    return liquida >= 0
      ? { rotulo: "VENDA ESTIMADA", valor: brl(liquida), apoio: "por mês, já descontada a perda", tom: "sucesso", dica: NOTA_VENDA_ESTIMADA }
      : { rotulo: "VENDA QUE DEIXA DE ENTRAR", valor: brl(-liquida), apoio: "por mês, já com a venda estimada", tom: "perigo" };
  }
  if (ganha > ZERO)
    return { rotulo: "VENDA ESTIMADA", valor: brl(ganha), apoio: c.vendaAdicionalPct != null ? `+${pctTxt(c.vendaAdicionalPct)} por mês` : "a mais por mês", tom: "sucesso", dica: NOTA_VENDA_ESTIMADA };
  if (perdida > ZERO)
    return { rotulo: "VENDA QUE DEIXA DE ENTRAR", valor: brl(perdida), apoio: c.faturamentoPerdidoPct != null ? `${pctTxt(c.faturamentoPerdidoPct)} por mês` : "por mês", tom: "perigo" };
  return { rotulo: "VENDA QUE DEIXA DE ENTRAR", valor: "Nenhuma", apoio: "sem perda de venda", tom: "neutro" };
};

// ---- Status e comparação ---------------------------------------------------------------------------------------------

// Linha de status do cartão: ícone de "tudo certo" ou de atenção, e o texto.
export const statusDoCartao = (c) => {
  if (c.status === "inviavel") return { tom: "atencao", texto: "Inviável" };
  if (c.status === "nao_resolve") return { tom: "atencao", texto: "Não resolve sozinho" };
  if (c.status === "nao_recomendado") return { tom: "atencao", texto: "Não recomendado" };
  if ((c.vendaAdicionalMensal ?? 0) > ZERO && (c.faturamentoPerdidoMensal ?? 0) <= ZERO) return { tom: "ok", texto: "Vende mais" };
  if ((c.faturamentoPerdidoMensal ?? 0) > ZERO) return { tom: "atencao", texto: "Deixa de vender" };
  if (c.faltaPorFuncao?.length > 0 || c.semFarmaceuticoH > 0) return { tom: "atencao", texto: "Deixa a equipe abaixo do nível de hoje" };
  return { tom: "ok", texto: "Cobre o horário sem perder venda" };
};

// "R$ 5.467 a menos de folha que Manter horários" (dono). No Cenário 1: a referência.
export const comparacaoComCenario1 = (c, { ehReferencia, dono }) => {
  if (ehReferencia) return "Referência para comparar os outros";
  if (!dono || c.economiaFolhaMensal == null) return "";
  const e = c.economiaFolhaMensal;
  if (Math.abs(e) < ZERO) return "Mesma folha de Manter horários";
  return e > 0 ? `${brl(e)} a menos de folha que Manter horários` : `${brl(-e)} a mais de folha que Manter horários`;
};

// ---- Contratações ----------------------------------------------------------------------------------------------------

const LETRA = { Farmacêutico: "F", Atendimento: "A", Caixa: "C", Apoio: "Ap" };
const NOME = { Farmacêutico: "Farmacêutico", Atendimento: "Atendente", Caixa: "Caixa", Apoio: "Apoio" };

// Uma linha por contratação: cada inteira é "integral" e o parcial é "parcial". A barra vale horas ÷ 42, no máximo 100%.
export const linhasDeContratacao = (contratacoes = []) =>
  contratacoes.flatMap((c) => {
    const parcialH = c.parcial?.horas ?? 0;
    const cheia = c.inteiras > 0 ? Math.round((c.horasContratadas - parcialH) / c.inteiras) : 0;
    const linha = (horas, tipo) => ({
      funcao: c.funcao,
      letra: LETRA[c.funcao] ?? c.funcao.slice(0, 2),
      nome: NOME[c.funcao] ?? c.funcao,
      horas,
      tipo,
      opcional: c.motivo === "meta",
      largura: Math.min(100, Math.round((horas / HORAS_BARRA) * 100)),
    });
    return [...Array.from({ length: c.inteiras }, () => linha(cheia, "integral")), ...(parcialH > 0 ? [linha(parcialH, "parcial")] : [])];
  });

export const totalContratado = (linhas) => linhas.reduce((s, l) => s + l.horas, 0);

// Horas ociosas por semana (soma das contratações).
export const horasOciosasDe = (contratacoes = []) => contratacoes.reduce((s, c) => s + (c.horasOciosas ?? 0), 0);

// ---- Horário ---------------------------------------------------------------------------------------------------------

const minutos = (t) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(t ?? ""));
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
export const horasDoDia = (d) => {
  if (!d?.aberto) return 0;
  const a = minutos(d.abre);
  const f = minutos(d.fecha);
  return a === null || f === null || f <= a ? 0 : (f - a) / 60;
};
const horaTxt = (t) => {
  const [h, m] = String(t).split(":");
  return `${h.padStart(2, "0")}h${m && m !== "00" ? m : ""}`;
};
export const faixaTxt = (d) => (d?.aberto && d.abre && d.fecha ? `${horaTxt(d.abre)}–${horaTxt(d.fecha)}` : "Fechado");

// Diferença de horas de um dia: novo menos antes (meia hora aceita; dia fechado vale 0).
export const diferencaPorDia = (novo, antes) => Math.round((horasDoDia(novo) - horasDoDia(antes)) * 100) / 100;

// Os sete dias do cenário contra os de antes. A faixa do cartão e o painel usam esta mesma lista.
export const linhasDoHorario = (novos = [], antes = []) =>
  NOMES_DIA.map((nome, dia) => {
    const n = novos.find((d) => d.dia === dia);
    const a = antes.find((d) => d.dia === dia);
    const diferenca = diferencaPorDia(n, a);
    const mudou = faixaTxt(n) !== faixaTxt(a);
    return { dia, nome, novo: faixaTxt(n), antes: faixaTxt(a), diferenca, alterado: mudou };
  });

export const totaisDaSemana = (novos = [], antes = []) => {
  const total = (ds) => Math.round(NOMES_DIA.reduce((s, _, dia) => s + horasDoDia(ds.find((d) => d.dia === dia)), 0) * 100) / 100;
  const novo = total(novos);
  const ant = total(antes);
  return { novo, antes: ant, diferenca: Math.round((novo - ant) * 100) / 100 };
};

export const diasAlterados = (linhas) => linhas.filter((l) => l.alterado).length;
// "reduzindo", "ampliando" ou (mudou mas as horas somam igual) "ajustando".
export const sentidoDoHorario = (totais) => (totais.diferenca < -ZERO ? "reduzindo" : totais.diferenca > ZERO ? "ampliando" : "ajustando");

// ---- Textos que não se repetem ---------------------------------------------------------------------------------------

// A linha em negrito de resultado só aparece quando explica algo que o resto do cartão não mostra. Quando ela descreve os
// cortes de horário ou as contratações, o bloco Horário e o bloco Contratações já dizem isso.
export const linhaDeResultado = (c) => {
  const r = (c.resultado ?? "").trim();
  if (!r) return "";
  if (c.ajustes?.length > 0 || c.diasFechar?.length > 0) return "";
  if (/\bcontrata\b/i.test(r)) return "";
  return r;
};

// A nota da venda estimada vai no ⓘ ao lado de "VENDA ESTIMADA" (não repete na lista de avisos).
export const NOTA_VENDA_ESTIMADA = "Venda das horas novas estimada: onde não há venda registrada, vale metade da hora vizinha.";
const REPETIDOS = new Set(["Usa contrato parcial para cobrir o que sobra.", "Venda das horas novas é estimada: onde não há venda registrada nessa hora, vale metade da venda da hora vizinha."]);

// Alertas do cenário sem o que o cartão já mostra: "parcial" está em cada linha de contratação e a nota da venda estimada fica no ⓘ.
export const alertasParaExibir = (alertas = []) => alertas.filter((a) => !REPETIDOS.has(a));
