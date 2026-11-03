import { describe, expect, it } from "vitest";
import { consequencias, faltaCurta, textoDaFalta, visaoDosCartoes } from "./comparativo-regras.js";

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
  it("reduzindo horário, mostra a venda e a margem perdidas (só o dono vê os valores)", () => {
    const c = { faltaPorFuncao: [], semFarmaceuticoH: 0, faturamentoPerdidoMensal: 3095, margemMes: -773 };
    expect(consequencias(c, { dono: true, brl, horasAMenos: 5 })[0]).toContain("R$ 3095 por mês em vendas (margem de R$ 773)");
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
