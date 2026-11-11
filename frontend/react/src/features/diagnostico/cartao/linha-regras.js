// Regras de exibição da linha de cenário (spec 037), puras e sem React. A tela só desenha o que sai daqui.

export const MENOS = "−"; // sinal de menos tipográfico (U+2212)
const NOMES_DIA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const ZERO = 0.005;

const virgula = (n) => String(Math.round(n * 10) / 10).replace(".", ",");
export const horasTxt = (n) => `${virgula(n)}h`;

// ---- Venda e custo de pessoal, em % ----------------------------------------------------------------------------------

export const APOIO_SEM_SALARIOS = "Informe os salários para ver a variação do custo.";

// "▲ +1,7%", "▼ −9,7%", "● 0%", "—" ou "Não estimada". `tipo` é "venda" (para cima é bom) ou "custo" (para cima é neutro,
// para baixo é bom). O tom é o da cor do texto; a seta e o sinal acompanham sempre, então a cor nunca vai sozinha.
export const textoDaVariacao = (pct, estado, tipo) => {
  if (estado === "nao_estimada") return { texto: "Não estimada", tom: "mudo", apoio: null };
  if (pct == null || (estado && estado !== "ok")) {
    return { texto: "—", tom: "neutro", apoio: estado === "sem_salarios" ? APOIO_SEM_SALARIOS : null };
  }
  const n = Math.abs(pct) < 0.05 ? 0 : pct;
  if (n === 0) return { texto: "● 0%", tom: "neutro", apoio: null };
  const sobe = n > 0;
  const texto = `${sobe ? "▲ +" : `▼ ${MENOS}`}${virgula(Math.abs(n))}%`;
  const tom = tipo === "venda" ? (sobe ? "sucesso" : "perigo") : sobe ? "neutro" : "sucesso";
  return { texto, tom, apoio: null };
};

// Spec 050: a coluna "Folha no faturamento" (layout A3). Dono: peso depois (grande), "hoje X,X%", chip da variação (a diferença dos
// pesos já arredondados, em "%": 9,7 − 8,0 = +1,7%) e os reais por mês. Gestor e consulta: só o chip "Aumenta", "Igual" ou
// "Diminui". Sem dados: uma frase, sem números. A cor nunca vai sozinha (o chip traz sinal ou texto) e há `ariaLabel` completo.
const MILHAR = (n) => Math.round(n).toLocaleString("pt-BR");
const umaCasa = (n) => n.toFixed(1).replace(".", ",");
export const FRASE_SEM_SALARIOS = "Informe os salários para ver o custo de pessoal.";
export const FRASE_SEM_FATURAMENTO = "Informe o faturamento para ver o peso da folha.";
export const FRASE_SEM_DADOS = "Dados do custo ainda não informados.";

export const cabecalhoDaFolha = (dono) => (dono ? "Folha no faturamento" : "Custo de pessoal");

export const textoDaFolha = (linha, dono) => {
  const sentido = linha.custoSentido;
  const faltaSalarios = linha.custoEstado === "sem_salarios";
  const faltaFaturamento = linha.custoEstado === "sem_faturamento";
  if (!dono) {
    if (!sentido || faltaSalarios || linha.custoEstado === "sem_calculo") return { tipo: "falta", frase: FRASE_SEM_DADOS };
    const chip = { aumenta: { texto: "Aumenta", tom: "aumenta" }, igual: { texto: "Igual", tom: "igual" }, diminui: { texto: "Diminui", tom: "diminui" } }[sentido];
    return { tipo: "chip", chip, ariaLabel: `Custo de pessoal ${sentido === "aumenta" ? "aumenta" : sentido === "diminui" ? "diminui" : "igual"}` };
  }
  if (faltaSalarios) return { tipo: "falta", frase: FRASE_SEM_SALARIOS };
  if (faltaFaturamento) return { tipo: "falta", frase: FRASE_SEM_FATURAMENTO };
  const c = linha.custoPctFaturamento;
  if (!c || !sentido) return { tipo: "falta", frase: FRASE_SEM_SALARIOS };
  const base = { tipo: "dono", peso: `${umaCasa(c.depois)}%`, hoje: `hoje ${umaCasa(c.hoje)}%` };
  const de = `de ${umaCasa(c.hoje)}% para ${umaCasa(c.depois)}% do faturamento`;
  if (sentido === "aumenta") {
    const v = Math.abs(c.aumentoPp);
    return { ...base, chip: { texto: `+${umaCasa(v)}%`, tom: "aumenta" }, reais: `R$ ${MILHAR(c.aumentoMensal)} a mais por mês`, ariaLabel: `Folha sobe ${umaCasa(v)} ponto percentual, ${de}` };
  }
  if (sentido === "diminui") {
    const v = Math.abs(c.aumentoPp);
    return { ...base, chip: { texto: `${MENOS}${umaCasa(v)}%`, tom: "diminui" }, reais: `R$ ${MILHAR(Math.abs(c.aumentoMensal))} a menos por mês`, ariaLabel: `Folha cai ${umaCasa(v)} ponto percentual, ${de}` };
  }
  // Igual: a folha em reais não muda; o peso só sobe quando a venda cai.
  return { ...base, chip: { texto: "folha igual", tom: "igual" }, reais: c.depois > c.hoje ? "Sobe só porque a venda cai." : null, ariaLabel: `Folha igual em reais, ${de}` };
};

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
const arred = (n) => Math.round(n * 100) / 100;

// "94h por semana" e a mudança: "(+9h)" verde, "(−9h)" vermelho ou "sem mudança".
export const textoDoTotal = (horasSemana, diferenca) => {
  const principal = `${horasTxt(horasSemana)} por semana`;
  if (Math.abs(diferenca) < ZERO) return { principal, mudanca: "sem mudança", tom: "neutro" };
  return diferenca > 0
    ? { principal, mudanca: `(+${horasTxt(diferenca)})`, tom: "sucesso" }
    : { principal, mudanca: `(${MENOS}${horasTxt(-diferenca)})`, tom: "perigo" };
};

// Os sete dias com as horas abertas, nunca um traço: sem mudança (cinza), aumento (verde), redução (rosa) e dia fechado pelo
// cenário (rosa, "Fechado" e as horas perdidas). Dia que já é fechado hoje continua "Fechado", em cinza.
export const faixaDosDias = (novos = [], antes = []) =>
  NOMES_DIA.map((nome, dia) => {
    const n = novos.find((d) => d.dia === dia);
    const a = antes.find((d) => d.dia === dia);
    const horas = arred(horasDoDia(n));
    const horasAntes = arred(horasDoDia(a));
    const dif = arred(horas - horasAntes);
    if (horas === 0) {
      return horasAntes > 0
        ? { dia, nome, tipo: "fechado", principal: "Fechado", diferenca: `${MENOS}${horasTxt(horasAntes)}`, rotulo: `${nome}: fechado, ${MENOS}${horasTxt(horasAntes)}` }
        : { dia, nome, tipo: "igual", principal: "Fechado", diferenca: null, rotulo: `${nome}: fechado` };
    }
    if (dif > ZERO) return { dia, nome, tipo: "aumento", principal: horasTxt(horas), diferenca: `+${horasTxt(dif)}`, rotulo: `${nome}: ${horasTxt(horas)}, +${horasTxt(dif)}` };
    if (dif < -ZERO) return { dia, nome, tipo: "reducao", principal: horasTxt(horas), diferenca: `${MENOS}${horasTxt(-dif)}`, rotulo: `${nome}: ${horasTxt(horas)}, ${MENOS}${horasTxt(-dif)}` };
    return { dia, nome, tipo: "igual", principal: horasTxt(horas), diferenca: null, rotulo: `${nome}: ${horasTxt(horas)}, sem mudança` };
  });

// ---- Contratar -------------------------------------------------------------------------------------------------------

export const NOME_DA_FUNCAO = { Farmacêutico: "farmacêutico", Atendimento: "atendente", Caixa: "caixa", Apoio: "apoio" };
export const nomeDaFuncao = (f) => NOME_DA_FUNCAO[f] ?? String(f).toLowerCase();

// Uma linha por contratação: "1 atendente", "2 caixas", "1 farmacêutico · parcial". Sem contratação: "Nenhuma contratação".
export const textoContratar = (contratar = []) => {
  const linhas = contratar.flatMap((c) => [
    ...(c.inteiras > 0 ? [`${c.inteiras} ${nomeDaFuncao(c.funcao)}${c.inteiras > 1 ? "s" : ""}`] : []),
    ...(c.parcialHoras > 0 ? [`1 ${nomeDaFuncao(c.funcao)} · parcial`] : []),
  ]);
  return linhas.length ? linhas : ["Nenhuma contratação"];
};

// ---- Status e estado visual ------------------------------------------------------------------------------------

// Texto curto da pill, o tom e o ícone. A cor nunca vai sozinha: o ícone e o texto acompanham.
export const ROTULOS_DE_STATUS = {
  inviavel: { texto: "Inviável", tom: "perigo", icone: "x" },
  nao_resolve: { texto: "Não resolve sozinho", tom: "perigo", icone: "x" },
  nao_recomendado: { texto: "Não recomendado", tom: "perigo", icone: "x" },
  vende_mais: { texto: "Vende mais", tom: "sucesso", icone: "alta" },
  perde_venda: { texto: "Perde venda", tom: "atencao", icone: "baixa" },
  equipe_menor: { texto: "Equipe menor que hoje", tom: "atencao", icone: "alerta" },
  cobre: { texto: "Cobre o horário", tom: "sucesso", icone: "ok" },
};
export const rotuloDoStatus = (status) => ROTULOS_DE_STATUS[status] ?? null;

const REBAIXADOS = new Set(["inviavel", "nao_resolve", "nao_recomendado"]);

// "indisponivel" (sem dados), "rebaixado" (não resolve) ou "normal". Nenhum cenário é destacado como sugerido.
export const estadoVisual = (linha) => {
  if (linha.indisponivel) return "indisponivel";
  if (REBAIXADOS.has(linha.status)) return "rebaixado";
  return "normal";
};

export const textoIndisponivel = ({ dono }) =>
  dono ? "Informe as vendas por dia ou por hora e os salários para calcular este cenário." : "O dono ainda não informou os custos.";

// Spec 051: a frase explicativa do cenário. O servidor já a manda pronta, em trechos; aqui só se descarta o que vier vazio e se
// monta o texto corrido (para leitor de tela).
export const partesDaExplicacao = (linha) => {
  const partes = (linha?.explicacao?.partes ?? []).filter((p) => p && p.texto);
  if (partes.length === 0) return null;
  return { partes, texto: partes.map((p) => p.texto).join("") };
};
