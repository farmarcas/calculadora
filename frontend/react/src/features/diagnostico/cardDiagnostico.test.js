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

describe("calculoDaRegra · hora extra (spec 063)", () => {
  it("a falta do card é a bruta; a hora extra que cobre vem à parte e a contratação some", () => {
    // 1 h faltando, a hora extra de quem já está escalado cobre tudo: `gapH` (o que sobra para contratar) fica em 0.
    const c = calculoDaRegra(regra([f("Farmacêutico", 0, { faltaH: 1, gapH: 0, horaExtraH: 1 }), f("Atendimento", 0)], 0));
    expect(c.gap).toBe(1);
    expect(c.contratacoes).toBe(0);
    expect(c.horaExtra).toEqual([{ funcao: "Farmacêutico", horasSemana: 1 }]);
  });
  it("sem hora extra a lista fica vazia e o gap segue o de sempre", () => {
    const c = calculoDaRegra(regra([f("Farmacêutico", 1, { gapH: 5 })], 1));
    expect(c.gap).toBe(5);
    expect(c.horaExtra).toEqual([]);
  });
});
