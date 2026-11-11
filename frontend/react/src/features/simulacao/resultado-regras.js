// Regras de exibição do card "Resultado da simulação" (spec 038), puras e sem React. A tela só desenha o que sai daqui.
import { MENOS, horasTxt, nomeDaFuncao } from "../diagnostico/cartao/linha-regras.js";

// Adapta o horário da simulação (`horario.dias` e `horario.cadastro`, com `aberta`) ao formato da faixa dos 7 dias
// (`faixaDosDias`, com `aberto`): `novos` é o horário simulado e `antes` o do Cadastro.
export const diasDaSimulacao = (horario) => {
  const dias = horario?.dias ?? [];
  const cadastro = horario?.cadastro ?? [];
  return {
    novos: dias.map((d) => ({ dia: d.dia, aberto: !!d.aberta, abre: d.abre ?? null, fecha: d.fecha ?? null })),
    antes: cadastro.map((c, dia) => ({ dia, aberto: !!c.aberta, abre: c.abre ?? null, fecha: c.fecha ?? null })),
  };
};

const arred = (n) => Math.round(n * 100) / 100;
const mudancaTxt = (dif, unidade) => `${dif > 0 ? "+" : MENOS}${unidade === "h" ? horasTxt(Math.abs(dif)) : Math.abs(dif)}`;

// Uma linha da tabela Hoje × Simulação × Mudança. Mais é verde e menos é vermelho; igual diz "sem mudança".
export const linhaDaTabela = (rotulo, hoje, simulacao, unidade) => {
  const dif = arred(simulacao - hoje);
  const txt = (v) => (unidade === "h" ? horasTxt(v) : String(v));
  if (Math.abs(dif) < 0.005) return { rotulo, hoje: txt(hoje), simulacao: txt(simulacao), mudanca: "sem mudança", tom: "mudo" };
  return { rotulo, hoje: txt(hoje), simulacao: txt(simulacao), mudanca: mudancaTxt(dif, unidade), tom: dif > 0 ? "sucesso" : "perigo" };
};

// A tabela do card: horas abertas, pessoas, horas contratadas e hora extra (em horas por semana).
export const tabelaDoResultado = (e) => [
  linhaDaTabela("Horas abertas", e.horasAbertas.hoje, e.horasAbertas.simulacao, "h"),
  linhaDaTabela("Pessoas", e.pessoas.hoje, e.pessoas.simulacao, ""),
  linhaDaTabela("Horas contratadas", e.horasContratadas.hoje, e.horasContratadas.simulacao, "h"),
  e.horaExtraH > 0.005
    ? { rotulo: "Hora extra", hoje: "0h", simulacao: horasTxt(e.horaExtraH), mudanca: `+${horasTxt(e.horaExtraH)}`, tom: "perigo" }
    : { rotulo: "Hora extra", hoje: "0h", simulacao: "0h", mudanca: "não precisa", tom: "mudo" },
];

// "1 atendente", "2 caixas", "1 farmacêutico · parcial de 20h". Sem contratação: "Nenhuma contratação".
export const textoContratarSimulacao = (contratar = []) => {
  const linhas = contratar.flatMap((c) => [
    ...(c.inteiras > 0 ? [`${c.inteiras} ${nomeDaFuncao(c.funcao)}${c.inteiras > 1 ? "s" : ""}`] : []),
    ...(c.parciaisHoras ?? []).map((h) => `1 ${nomeDaFuncao(c.funcao)} · parcial de ${horasTxt(h)}`),
  ]);
  return linhas.length ? linhas : ["Nenhuma contratação"];
};

// Quantas vagas a simulação cria: o apoio do número de custo de pessoal ("2 contratações").
export const totalDeContratacoes = (contratar = []) => contratar.reduce((s, c) => s + c.inteiras + (c.parciaisHoras?.length ?? 0), 0);
export const apoioDoCusto = (contratar) => {
  const n = totalDeContratacoes(contratar);
  return n === 0 ? "sem contratação" : `${n} ${n === 1 ? "contratação" : "contratações"}`;
};
export const apoioDaVenda = (pct, estado) => {
  if (estado === "nao_estimada") return "sem venda hora a hora";
  if (pct == null || Math.abs(pct) < 0.05) return "sem mudança";
  return "em relação a hoje";
};

// ---- Resultado do horário estendido (spec 049) -----------------------------------------------------------------------------

const brlInteiro = (n) => `${n < 0 ? MENOS : ""}R$ ${Math.round(Math.abs(n)).toLocaleString("pt-BR")}`;
const pctTxt = (n) => `${String(Math.round(n * 10) / 10).replace(".", ",")}%`;

const AVISO_DO_ESTADO = {
  sem_cmv: "Informe o CMV da loja para calcular o lucro bruto.",
  sem_salarios: "Informe os salários para calcular o aumento de folha.",
  sem_venda: "Envie a base comercial para estimar a venda das horas novas.",
};

// O bloco e o modal "Como calculamos": venda adicional − CMV = lucro bruto; lucro bruto − aumento de folha = resultado. Azul e
// "Recomendado" quando o resultado é maior ou igual a zero; vermelho e "Não recomendado" quando é menor.
export const blocoDoHorarioEstendido = (h) => {
  if (!h) return null;
  const ok = h.estado === "ok";
  const origem = h.origemCmv === "hora" ? "o CMV de cada hora da base comercial" : h.origemCmv === "media" ? "o CMV médio da loja" : null;
  return {
    titulo: "Resultado do horário estendido",
    aviso: AVISO_DO_ESTADO[h.estado] ?? null,
    selo: ok ? (h.recomendado ? { texto: "Recomendado", tom: "azul" } : { texto: "Não recomendado", tom: "vermelho" }) : null,
    linhas: [
      { rotulo: "Venda adicional estimada", valor: h.vendaAdicionalMensal == null ? "—" : `${brlInteiro(h.vendaAdicionalMensal)}/mês` },
      { rotulo: h.cmvPct == null ? "CMV da venda adicional" : `CMV da venda adicional (${pctTxt(h.cmvPct)})`, valor: h.cmvMensal == null ? "—" : `${MENOS}${brlInteiro(h.cmvMensal)}/mês` },
      { rotulo: "Lucro bruto", valor: h.lucroBrutoMensal == null ? "—" : `${brlInteiro(h.lucroBrutoMensal)}/mês` },
      { rotulo: "Aumento de folha", valor: h.aumentoFolhaMensal == null ? "—" : `${MENOS}${brlInteiro(h.aumentoFolhaMensal)}/mês` },
      { rotulo: "Resultado", valor: h.resultadoMensal == null ? "—" : `${brlInteiro(h.resultadoMensal)}/mês`, destaque: true },
    ],
    resultado: h.resultadoMensal,
    tom: !ok ? "neutro" : h.recomendado ? "azul" : "vermelho",
    passos: ok
      ? [
          `As ${h.horasNovasSemana} horas a mais por semana devem vender cerca de ${brlInteiro(h.vendaAdicionalMensal)} por mês (hora sem venda registrada vale 50% da hora vizinha).`,
          `Dessa venda, ${pctTxt(h.cmvPct)} é CMV (${origem}): ${brlInteiro(h.cmvMensal)}.`,
          `Lucro bruto: ${brlInteiro(h.vendaAdicionalMensal)} − ${brlInteiro(h.cmvMensal)} = ${brlInteiro(h.lucroBrutoMensal)}.`,
          `Aumento de folha desta simulação (contratações e horas extras): ${brlInteiro(h.aumentoFolhaMensal)}.`,
          `Resultado: ${brlInteiro(h.lucroBrutoMensal)} − ${brlInteiro(h.aumentoFolhaMensal)} = ${brlInteiro(h.resultadoMensal)} por mês. ${h.recomendado ? "O lucro bruto paga a folha a mais." : "O lucro bruto não paga a folha a mais."}`,
        ]
      : [],
  };
};
