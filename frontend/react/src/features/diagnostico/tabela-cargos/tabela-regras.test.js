import { describe, expect, it } from "vitest";
import { equipeToda, linhasPorCargo, statusDoCargo, textoFolga, textoHoras } from "./tabela-regras.js";

const f = (funcao, extra = {}) => ({ funcao, pessoas: 2, capacidadeH: 84, necessidadeH: 105, gapH: 0, saldoH: 0, saldoT: 0, contratar: 0, sugestao: null, ...extra });
const regra = (funcoes, saldoHoras = -24) => ({ funcoes, resumo: { saldoHoras, contratar: 0 } });

describe("tabela por cargo", () => {
  it("farmacêutico é sempre obrigatório; outro cargo só é desejável quando há contratação", () => {
    expect(statusDoCargo(f("Farmacêutico"))).toBe("obrigatorio");
    expect(statusDoCargo(f("Atendimento", { contratar: 1 }))).toBe("desejavel");
    expect(statusDoCargo(f("Caixa"))).toBe("sem_falta");
  });

  it("mostra hoje → com a sugestão por cargo e na ordem de sempre", () => {
    const r = regra([
      f("Caixa", { capacidadeH: 84, saldoH: 6 }),
      f("Farmacêutico", { gapH: 21, saldoT: -4, contratar: 1, sugestao: { horasContratadas: 42 } }),
      f("Atendimento", { pessoas: 3, capacidadeH: 126, gapH: 9, contratar: 1, sugestao: { horasContratadas: 42 } }),
    ]);
    const l = linhasPorCargo(r);
    expect(l.map((x) => x.funcao)).toEqual(["Farmacêutico", "Atendimento", "Caixa"]);
    expect(l[0]).toMatchObject({ pessoas: { hoje: 2, depois: 3 }, horas: { hoje: 84, depois: 126 }, falta: { hoje: 21, depois: 0 }, turnosAcobrir: 4 });
    expect(l[1]).toMatchObject({ status: "desejavel", pessoas: { hoje: 3, depois: 4 }, falta: { hoje: 9, depois: 0 } });
    expect(l[2]).toMatchObject({ status: "sem_falta", falta: { hoje: 0, depois: 0 }, sobraH: 6 });
  });

  it("cargo que não existe na loja não gera linha (o farmacêutico sempre aparece)", () => {
    const l = linhasPorCargo(regra([f("Farmacêutico"), f("Caixa", { pessoas: 0, capacidadeH: 0 })]));
    expect(l.map((x) => x.funcao)).toEqual(["Farmacêutico"]);
  });

  it("equipe toda soma pessoas e horas e leva a folga para depois da sugestão", () => {
    const r = regra(
      [f("Farmacêutico", { gapH: 21, contratar: 1, sugestao: { horasContratadas: 42 } }), f("Atendimento", { pessoas: 3, capacidadeH: 126, contratar: 1, sugestao: { horasContratadas: 42 } })],
      -24,
    );
    const e = equipeToda(r, linhasPorCargo(r));
    expect(e.pessoas).toEqual({ hoje: 5, depois: 7 });
    expect(e.horas).toEqual({ hoje: 210, depois: 294 });
    expect(e.folga).toEqual({ hoje: -24, depois: 60 });
    expect(textoFolga(e.folga)).toBe("−24h → +60h");
    expect(textoHoras(e.horas)).toBe("210h → 294h");
  });
});
