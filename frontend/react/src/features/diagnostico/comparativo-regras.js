// Regras de exibição dos cartões de cenários (puras, sem React): o que cada cartão mostra e o que fica recolhido.

const horasTxt = (n) => `${String(Math.round(n * 100) / 100).replace(".", ",")} h`;
const minusculo = (t) => t.charAt(0).toLowerCase() + t.slice(1);

// "Atendimento 32 h por semana abaixo do nível de hoje · Apoio 4 h"
export const textoDaFalta = (faltas = []) =>
  faltas.map((f, i) => `${f.funcao} ${horasTxt(f.horasSemana)}${i === 0 ? " por semana abaixo do nível de hoje" : ""}`).join(" · ");

// "32 h de atendimento e 4 h de apoio a menos": o preço da economia na comparação com o Cenário 1.
export const faltaCurta = (faltas = []) => {
  const itens = faltas.map((f) => `${horasTxt(f.horasSemana)} de ${minusculo(f.funcao)}`);
  if (itens.length === 0) return "";
  const lista = itens.length === 1 ? itens[0] : `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
  return `${lista} a menos`;
};

// Linhas da faixa amarela do cartão (vazia quando não falta cobertura). `venda` só vem preenchida para o dono.
// Reduz horários: venda e margem perdidas (o gerente vê as horas). Não reduz, mas deixa função abaixo do nível de hoje:
// a falta em horas, sem venda perdida. Farmacêutico ausente é o único risco para a venda.
export const consequencias = (c, { dono, brl, horasAMenos }) => {
  const linhas = [];
  if (horasAMenos > 0) {
    linhas.push(
      dono && c.faturamentoPerdidoMensal > 0
        ? `Reduz ${horasTxt(horasAMenos)} por semana abertas: deixam de entrar ${brl(c.faturamentoPerdidoMensal)} por mês em vendas${c.margemMes ? ` (margem de ${brl(Math.abs(c.margemMes))})` : ""}.`
        : `Reduz ${horasTxt(horasAMenos)} por semana abertas.`,
    );
  }
  if (c.faltaPorFuncao?.length) {
    linhas.push(`${textoDaFalta(c.faltaPorFuncao)}.`);
    if (!(c.semFarmaceuticoH > 0)) linhas.push("O farmacêutico cobre todo o horário e o restante da equipe segue atendendo.");
  }
  if (c.semFarmaceuticoH > 0) linhas.push(`A loja fica ${horasTxt(c.semFarmaceuticoH)} por semana aberta sem farmacêutico: risco para a venda.`);
  return linhas;
};

// Quais cartões aparecem: a loja que já cobre tudo mostra uma frase só; o Cenário 3 igual ao 1 ou ao 2 fica recolhido.
export const visaoDosCartoes = (comparativo) => {
  const { cenarios, lojaCobreTudo } = comparativo;
  if (lojaCobreTudo) return { cobreTudo: true, visiveis: [], recolhido: null };
  const recolhido = cenarios.find((c) => c.recolher) ?? null;
  return {
    cobreTudo: false,
    visiveis: cenarios.filter((c) => c !== recolhido),
    recolhido: recolhido && { id: recolhido.id, nome: recolhido.nome, de: recolhido.recolher === "manter" ? 1 : 2 },
  };
};

// Selo do cenário de menor custo: "Melhor resultado" quando ele dá ganho (impacto positivo para o dono).
export const rotuloDoMelhor = (resultadoLiquidoMensal) => (resultadoLiquidoMensal > 0 ? "Melhor resultado" : "Menor custo");

// "Folha adicional R$ 3.592 + margem perdida R$ 0" · "Folha adicional R$ 800 − margem ganha R$ 1.000".
// `margemMes` vem negativo quando o cenário perde margem e positivo quando as horas novas rendem mais do que se perde.
export const composicaoDoImpacto = (c, brl) => {
  if (c.folhaAdicionalMensal == null) return "Informe os custos para ver a composição";
  const folha = `Folha adicional ${brl(c.folhaAdicionalMensal)}`;
  if (c.margemMes == null) return folha;
  return c.margemMes > 0 ? `${folha} − margem ganha ${brl(c.margemMes)}` : `${folha} + margem perdida ${brl(Math.abs(c.margemMes))}`;
};
