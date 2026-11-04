import { describe, expect, it } from "vitest";
import { composicaoDoSaldo, consequencias, faltaCurta, linhaDeVendaPerdida, rotuloDoMelhor, textoDaFalta, veredictoDoSaldo, visaoDosCartoes } from "./comparativo-regras.js";

const brl = (n) => `R$ ${n}`;
const faltas = [{ funcao: "Atendimento", horasSemana: 32 }, { funcao: "Apoio", horasSemana: 4 }];

describe("texto da falta", () => {
  it("diz as horas por função e explica que é abaixo do nível de hoje", () => {
    expect(textoDaFalta(faltas)).toBe("Atendimento 32 h por semana abaixo do nível de hoje · Apoio 4 h");
  });
  it("preço da economia na comparação", () => {
    expect(faltaCurta(faltas)).toBe("32 h de atendimento e 4 h de apoio a menos");
    expect(faltaCurta([faltas[0]])).toBe("32 h de atendimento a menos");
    expect(faltaCurta([])).toBe("");
  });
});

describe("faixa amarela", () => {
  it("sem reduzir horário, mostra a falta por função e nenhuma venda perdida", () => {
    const l = consequencias({ faltaPorFuncao: faltas, semFarmaceuticoH: 0, faturamentoPerdidoMensal: 0 }, { dono: true, brl, horasAMenos: 0 });
    expect(l.join(" ")).toContain("Atendimento 32 h por semana abaixo do nível de hoje");
    expect(l.join(" ")).toContain("O farmacêutico cobre todo o horário");
    expect(l.join(" ")).not.toMatch(/vendas|R\$/);
  });
  it("reduzindo horário, mostra a venda que deixa de entrar (só o dono vê o valor)", () => {
    const c = { faltaPorFuncao: [], semFarmaceuticoH: 0, faturamentoPerdidoMensal: 3095 };
    expect(consequencias(c, { dono: true, brl, horasAMenos: 5 })[0]).toBe("Reduz 5 h por semana abertas: deixam de entrar R$ 3095 por mês em vendas.");
    expect(consequencias(c, { dono: false, brl, horasAMenos: 5 })[0]).toBe("Reduz 5 h por semana abertas.");
  });
  it("farmacêutico ausente é o risco para a venda", () => {
    const l = consequencias({ faltaPorFuncao: [], semFarmaceuticoH: 6 }, { dono: true, brl, horasAMenos: 0 });
    expect(l).toEqual(["A loja fica 6 h por semana aberta sem farmacêutico: risco para a venda."]);
  });
  it("sem falta nenhuma, não mostra nada", () => {
    expect(consequencias({ faltaPorFuncao: [], semFarmaceuticoH: 0 }, { dono: true, brl, horasAMenos: 0 })).toEqual([]);
  });
});

describe("quais cartões aparecem", () => {
  const cols = (equilibrio = {}) => ({
    lojaCobreTudo: false,
    cenarios: [{ id: "manter", nome: "Manter horários" }, { id: "economia", nome: "Foco em economia" }, { id: "equilibrio", nome: "Equilíbrio", ...equilibrio }],
  });
  it("mostra os três quando são diferentes", () => {
    expect(visaoDosCartoes(cols()).visiveis).toHaveLength(3);
  });
  it("recolhe o Cenário 3 igual ao 1 ou ao 2", () => {
    const v = visaoDosCartoes(cols({ recolher: "manter" }));
    expect(v.visiveis.map((c) => c.id)).toEqual(["manter", "economia"]);
    expect(v.recolhido).toEqual({ id: "equilibrio", nome: "Equilíbrio", de: 1 });
    expect(visaoDosCartoes(cols({ recolher: "economia" })).recolhido.de).toBe(2);
  });
  it("loja que cobre tudo mostra só a frase", () => {
    expect(visaoDosCartoes({ ...cols(), lojaCobreTudo: true })).toEqual({ cobreTudo: true, visiveis: [], recolhido: null });
  });
});

describe("saldo: selo, composição e veredito", () => {
  it("o selo do melhor cenário fala em saldo", () => {
    expect(rotuloDoMelhor()).toBe("Melhor saldo");
  });
  it("composição do cenário 1: custo de folha contra a folha atual", () => {
    expect(composicaoDoSaldo({ folhaAdicionalMensal: 3592 }, { brl, ehBase: true })).toBe("Custo adicional de folha R$ 3592 em relação à folha atual");
    expect(composicaoDoSaldo({ folhaAdicionalMensal: null }, { brl, ehBase: true })).toBe("Informe os custos para ver o custo de folha");
  });
  it("composição dos outros: economia de folha − venda perdida, e venda adicional quando estende", () => {
    expect(composicaoDoSaldo({ economiaFolhaMensal: 8000, faturamentoPerdidoMensal: 10000 }, { brl, ehBase: false })).toBe("Economia de folha R$ 8000 − venda perdida R$ 10000");
    expect(composicaoDoSaldo({ economiaFolhaMensal: -500, faturamentoPerdidoMensal: 0, vendaAdicionalMensal: 619 }, { brl, ehBase: false })).toBe("Economia de folha −R$ 500 − venda perdida R$ 0 + venda adicional estimada R$ 619");
  });
  it("sem venda hora a hora ou sem custos, a composição diz o que falta (e nunca R$ 0)", () => {
    expect(composicaoDoSaldo({ semVendaHoraria: true }, { brl, ehBase: false })).toBe("Sem venda hora a hora, não é possível estimar a venda perdida");
    expect(composicaoDoSaldo({ economiaFolhaMensal: null, semVendaHoraria: false }, { brl, ehBase: false })).toBe("Informe os custos para ver a economia de folha");
  });
  it("veredito em palavras: compensa, custa mais, empata, referência; nulo sem saldo", () => {
    expect(veredictoDoSaldo(300, false)).toBe("Este cenário compensa");
    expect(veredictoDoSaldo(-2000, false)).toBe("Este cenário custa mais do que economiza");
    expect(veredictoDoSaldo(0, false)).toBe("Este cenário empata com manter os horários");
    expect(veredictoDoSaldo(0, true)).toBe("Referência para comparar os outros cenários");
    expect(veredictoDoSaldo(null, false)).toBeNull();
  });
  it("linha da venda perdida por dia alterado", () => {
    expect(linhaDeVendaPerdida({ dia: 5, ate: 16, vendaMes: 3095 }, brl)).toBe("Sáb até 16h: R$ 3095 por mês");
    expect(linhaDeVendaPerdida({ dia: 6, ate: null, vendaMes: 5000 }, brl)).toBe("Dom fechado: R$ 5000 por mês");
    expect(linhaDeVendaPerdida({ dia: 5, ate: 16 }, brl)).toBe("Sáb até 16h");
  });
});
