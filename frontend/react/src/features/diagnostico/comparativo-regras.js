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
// Reduz horários: a venda que deixa de entrar (o gerente vê as horas). Não reduz, mas deixa função abaixo do nível de hoje:
// a falta em horas, sem venda perdida. Farmacêutico ausente é o único risco para a venda.
export const consequencias = (c, { dono, brl, horasAMenos }) => {
  const linhas = [];
  if (horasAMenos > 0) {
    linhas.push(
      dono && c.faturamentoPerdidoMensal > 0
        ? `Reduz ${horasTxt(horasAMenos)} por semana abertas: deixam de entrar ${brl(c.faturamentoPerdidoMensal)} por mês em vendas.`
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

// Selo do cenário de maior saldo.
export const rotuloDoMelhor = () => "Melhor saldo";

const NOMES_DIA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

// "Sáb até 16h: R$ 3.095 por mês" · "Dom fechado: R$ 5.000 por mês" (o valor só vem para o dono).
export const linhaDeVendaPerdida = (d, brl) => {
  const quando = d.ate == null ? "fechado" : `até ${String(Math.floor(d.ate)).padStart(2, "0")}h`;
  return `${NOMES_DIA[d.dia]} ${quando}${d.vendaMes != null ? `: ${brl(d.vendaMes)} por mês` : ""}`;
};

// Como o saldo se forma. Cenário 1: o custo de folha em relação à folha atual (a base de comparação). Os outros: economia de
// folha − venda perdida (+ venda adicional das horas novas, que é estimativa).
export const composicaoDoSaldo = (c, { brl, ehBase }) => {
  if (ehBase) return c.folhaAdicionalMensal == null ? "Informe os custos para ver o custo de folha" : `Custo adicional de folha ${brl(c.folhaAdicionalMensal)} em relação à folha atual`;
  if (c.semVendaHoraria) return "Sem venda hora a hora, não é possível estimar a venda perdida";
  if (c.economiaFolhaMensal == null) return "Informe os custos para ver a economia de folha";
  // Economia pode ser negativa (o cenário custa mais de folha que o "manter horário"): sinal tipográfico, como no saldo.
  const com = (n) => (n < 0 ? `−${brl(-n)}` : brl(n));
  const base = `Economia de folha ${com(c.economiaFolhaMensal)} − venda perdida ${brl(c.faturamentoPerdidoMensal ?? 0)}`;
  return c.vendaAdicionalMensal > 0 ? `${base} + venda adicional estimada ${brl(c.vendaAdicionalMensal)}` : base;
};

// O que o sinal do saldo quer dizer, em palavras (nunca só a cor).
export const veredictoDoSaldo = (saldo, ehBase) => {
  if (saldo == null) return null;
  if (ehBase) return "Referência para comparar os outros cenários";
  if (saldo > 0.005) return "Este cenário compensa";
  if (saldo < -0.005) return "Este cenário custa mais do que economiza";
  return "Este cenário empata com manter os horários";
};
