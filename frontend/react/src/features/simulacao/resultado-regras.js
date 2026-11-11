// Regras de exibição do card "Resultado da simulação" (spec 038), puras e sem React. A tela só desenha o que sai daqui.
import { MENOS, horasTxt, nomeDaFuncao, textoDaFolha } from "../diagnostico/cartao/linha-regras.js";

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
const MILHAR = (n) => Math.round(n).toLocaleString("pt-BR");

// Spec 052: o bloco "Folha no faturamento" (dono) ou "Custo de pessoal" (gestor e consulta) do card. É o mesmo texto da coluna
// Folha dos Cenários (`textoDaFolha`): o servidor manda o peso (só o dono) e o sentido do custo (todos).
export const pesoDaSimulacao = (r, dono) => {
  const e = r.emHoras ?? {};
  const c = r.custoDoDono;
  return textoDaFolha(
    {
      custoSentido: e.custoSentido ?? null,
      custoEstado: dono && c ? c.estado : e.custoEstado,
      custoPctFaturamento: dono && c ? c.peso : null,
    },
    dono,
  );
};

// A lista "O QUE MUDA": cada item tem nome e variação em cima e "antes → depois" embaixo. Cores: âmbar (folha que sobe), verde
// (folha que cai; pessoas e horas que sobem), neutra (pessoas e horas que caem) e cinza ("igual"). Nunca só a cor: o sinal ou a
// palavra vão junto.
const tomDoNumero = (dif) => (dif > 0.005 ? "verde" : dif < -0.005 ? "neutro" : "mudo");
const variacaoNumero = (dif, unidade) => {
  if (Math.abs(dif) < 0.005) return "igual";
  const v = Math.abs(dif);
  return `${dif > 0 ? "+" : MENOS}${unidade === "h" ? horasTxt(v) : v}`;
};
const itemNumero = (chave, rotulo, hoje, depois, unidade) => {
  const dif = arred(depois - hoje);
  const txt = (v) => (unidade === "h" ? horasTxt(v) : String(v));
  return { chave, rotulo, variacao: variacaoNumero(dif, unidade), tom: tomDoNumero(dif), antesDepois: `${txt(hoje)} → ${txt(depois)}` };
};

export const listaOQueMuda = (r, dono) => {
  const e = r.emHoras;
  const c = r.custoDoDono;
  const itens = [];
  if (dono && c && c.folhaHoje != null && c.folhaDepois != null) {
    const dif = c.peso ? c.peso.aumentoMensal : c.folhaDepois - c.folhaHoje;
    const s = e.custoSentido;
    itens.push({
      chave: "folha",
      rotulo: "Folha por mês",
      variacao: s === "aumenta" ? `+R$ ${MILHAR(Math.abs(dif))}` : s === "diminui" ? `${MENOS}R$ ${MILHAR(Math.abs(dif))}` : "igual",
      tom: s === "aumenta" ? "ambar" : s === "diminui" ? "verde" : "mudo",
      antesDepois: `R$ ${MILHAR(c.folhaHoje)} → R$ ${MILHAR(c.folhaDepois)}`,
    });
  }
  itens.push(itemNumero("pessoas", "Pessoas", e.pessoas.hoje, e.pessoas.simulacao, ""));
  itens.push(itemNumero("horas", "Horas contratadas", e.horasContratadas.hoje, e.horasContratadas.simulacao, "h"));
  if (e.horaExtraH > 0.005) {
    itens.push({ chave: "hora-extra", rotulo: "Hora extra", variacao: `+${horasTxt(e.horaExtraH)}`, tom: "ambar", antesDepois: `0h → ${horasTxt(e.horaExtraH)}` });
  }
  return { itens, semHoraExtra: !(e.horaExtraH > 0.005) };
};

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
export const apoioDaVenda = (pct, estado) => {
  if (estado === "nao_estimada") return "sem venda hora a hora";
  if (pct == null || Math.abs(pct) < 0.05) return "sem mudança";
  return "em relação a hoje";
};

// ---- Resultado do horário estendido (spec 049) -----------------------------------------------------------------------------

const brlInteiro = (n) => `${n < 0 ? MENOS : ""}R$ ${Math.round(Math.abs(n)).toLocaleString("pt-BR")}`;
const pctTxt = (n) => `${String(Math.round(n * 10) / 10).replace(".", ",")}%`;

const AVISO_DO_ESTADO = {
  sem_cmv: "Informe o custo da mercadoria da loja para calcular o lucro bruto.",
  sem_salarios: "Informe os salários para calcular o aumento de folha.",
  sem_venda: "Envie a base comercial para estimar a venda das horas novas.",
};

// Spec 052: "sábado até 23h" a partir do horário simulado e do Cadastro. Só os dias em que a simulação abre horas a mais.
const NOME_DO_DIA = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];
const hhmmParaTxt = (t) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(t ?? ""));
  if (!m) return "";
  return m[2] === "00" ? `${String(Number(m[1])).padStart(2, "0")}h` : `${String(Number(m[1])).padStart(2, "0")}h${m[2]}`;
};
const minutosDe = (t) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(t ?? ""));
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
export const quandoAbreMais = (horario) => {
  const partes = (horario?.dias ?? []).flatMap((d) => {
    if (!d.aberta) return [];
    const c = horario.cadastro?.[d.dia];
    const nome = NOME_DO_DIA[d.dia];
    if (!c?.aberta) return [{ nome, quando: `das ${hhmmParaTxt(d.abre)} às ${hhmmParaTxt(d.fecha)}` }];
    const fechaMais = minutosDe(d.fecha) > minutosDe(c.fecha);
    const abreMais = minutosDe(d.abre) < minutosDe(c.abre);
    if (fechaMais && abreMais) return [{ nome, quando: `das ${hhmmParaTxt(d.abre)} às ${hhmmParaTxt(d.fecha)}` }];
    if (fechaMais) return [{ nome, quando: `até ${hhmmParaTxt(d.fecha)}` }];
    if (abreMais) return [{ nome, quando: `a partir das ${hhmmParaTxt(d.abre)}` }];
    return [];
  });
  if (partes.length === 0) return null;
  const quandos = new Set(partes.map((p) => p.quando));
  if (quandos.size === 1) {
    const nomes = partes.map((p) => p.nome);
    const lista = nomes.length > 1 ? `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}` : nomes[0];
    return `${lista} ${partes[0].quando}`;
  }
  return partes.map((p) => `${p.nome} ${p.quando}`).join(" · ");
};

// O bloco e o modal "Como calculamos": venda adicional − custo da mercadoria = lucro bruto; lucro bruto − aumento de folha =
// resultado. Verde e "Recomendado" quando o resultado é maior ou igual a zero; vermelho e "Não recomendado" quando é menor.
export const blocoDoHorarioEstendido = (h, horario) => {
  if (!h) return null;
  const ok = h.estado === "ok";
  const origem = h.origemCmv === "hora" ? "o de cada hora da base comercial" : h.origemCmv === "media" ? "a média da loja" : null;
  const quando = quandoAbreMais(horario);
  return {
    titulo: quando ? `Horário a mais: ${quando}` : "Horário a mais",
    aviso: AVISO_DO_ESTADO[h.estado] ?? null,
    selo: ok ? (h.recomendado ? { texto: "Recomendado", tom: "verde" } : { texto: "Não recomendado", tom: "vermelho" }) : null,
    linhas: [
      { rotulo: "Venda adicional", valor: h.vendaAdicionalMensal == null ? "—" : brlInteiro(h.vendaAdicionalMensal) },
      { rotulo: h.cmvPct == null ? "Custo da mercadoria" : `Custo da mercadoria (${pctTxt(h.cmvPct)})`, valor: h.cmvMensal == null ? "—" : `${MENOS}${brlInteiro(h.cmvMensal)}` },
      { rotulo: "Lucro bruto", valor: h.lucroBrutoMensal == null ? "—" : brlInteiro(h.lucroBrutoMensal) },
      { rotulo: "Aumento de folha", valor: h.aumentoFolhaMensal == null ? "—" : `${MENOS}${brlInteiro(h.aumentoFolhaMensal)}` },
      { rotulo: "Resultado", valor: h.resultadoMensal == null ? "—" : brlInteiro(h.resultadoMensal), destaque: true },
    ],
    resultado: h.resultadoMensal,
    tom: !ok ? "neutro" : h.recomendado ? "verde" : "vermelho",
    passos: ok
      ? [
          `As ${h.horasNovasSemana} horas a mais por semana devem vender cerca de ${brlInteiro(h.vendaAdicionalMensal)} por mês (hora sem venda registrada vale 50% da hora vizinha).`,
          `Dessa venda, ${pctTxt(h.cmvPct)} é custo da mercadoria (${origem}): ${brlInteiro(h.cmvMensal)}.`,
          `Lucro bruto: ${brlInteiro(h.vendaAdicionalMensal)} − ${brlInteiro(h.cmvMensal)} = ${brlInteiro(h.lucroBrutoMensal)}.`,
          `Aumento de folha desta simulação (contratações e horas extras): ${brlInteiro(h.aumentoFolhaMensal)}.`,
          `Resultado: ${brlInteiro(h.lucroBrutoMensal)} − ${brlInteiro(h.aumentoFolhaMensal)} = ${brlInteiro(h.resultadoMensal)} por mês. ${h.recomendado ? "O lucro bruto paga a folha a mais." : "O lucro bruto não paga a folha a mais."}`,
        ]
      : [],
  };
};
