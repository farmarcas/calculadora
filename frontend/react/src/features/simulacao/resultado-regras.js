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
