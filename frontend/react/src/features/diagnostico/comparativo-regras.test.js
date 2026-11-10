import { describe, expect, it } from "vitest";
import { consequencias, faltaCurta, textoDaFalta, numeroDoCenario, ordenarCenarios } from "./comparativo-regras.js";

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

describe("ordem dos cartões na tela", () => {
  const colunas = [{ id: "manter" }, { id: "economia" }, { id: "equilibrio" }];
  it("Equilíbrio, Manter horários e Sem contratações, nesta ordem", () => {
    expect(ordenarCenarios(colunas).map((c) => c.id)).toEqual(["equilibrio", "manter", "economia"]);
  });
  it("não altera a lista original e mantém a ordem de um id desconhecido no fim", () => {
    const antes = JSON.stringify(colunas);
    ordenarCenarios(colunas);
    expect(JSON.stringify(colunas)).toBe(antes);
    expect(ordenarCenarios([{ id: "x" }, ...colunas]).map((c) => c.id)).toEqual(["equilibrio", "manter", "economia", "x"]);
    expect(ordenarCenarios()).toEqual([]);
  });
  it("o número do cenário não muda com a ordem: 1 Manter, 2 Sem contratações, 3 Equilíbrio", () => {
    expect([numeroDoCenario("manter"), numeroDoCenario("economia"), numeroDoCenario("equilibrio")]).toEqual([1, 2, 3]);
  });
});
