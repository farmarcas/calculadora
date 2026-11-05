import { describe, expect, it } from "vitest";
import { calculoDaRegra } from "./cardDiagnostico.js";

const regra = (funcoes, contratar) => ({ funcoes, resumo: { saldoHoras: -30, contratar } });
const f = (funcao, contratar, extra = {}) => ({ funcao, contratar, gapH: 0, saldoT: 0, ...extra });

describe("calculoDaRegra · contratar por função", () => {
  it("lista só as funções com contratação, na ordem do cálculo", () => {
    const c = calculoDaRegra(regra([f("Farmacêutico", 1, { saldoT: -4 }), f("Atendimento", 1), f("Caixa", 0)], 2));
    expect(c.contratacoes).toBe(2);
    expect(c.contratarPorFuncao).toEqual([{ funcao: "Farmacêutico", pessoas: 1 }, { funcao: "Atendimento", pessoas: 1 }]);
  });
  it("mais de uma pessoa na mesma função mostra a quantidade", () => {
    const c = calculoDaRegra(regra([f("Farmacêutico", 0), f("Atendimento", 2)], 2));
    expect(c.contratarPorFuncao).toEqual([{ funcao: "Atendimento", pessoas: 2 }]);
  });
  it("sem contratação, a lista fica vazia", () => {
    expect(calculoDaRegra(regra([f("Farmacêutico", 0)], 0)).contratarPorFuncao).toEqual([]);
  });
  it("regra sem farmacêutico não tem cálculo", () => {
    expect(calculoDaRegra(regra([f("Atendimento", 1)], 1))).toBeNull();
  });
});
