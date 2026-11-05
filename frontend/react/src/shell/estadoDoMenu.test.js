import { describe, expect, it } from "vitest";
import { CHAVE_MENU, gravarRecolhido, lerRecolhido, padraoPorLargura } from "./estadoDoMenu.js";

const memoria = () => {
  const d = {};
  return { getItem: (k) => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = v; } };
};
const quebrado = { getItem: () => { throw new Error("bloqueado"); }, setItem: () => { throw new Error("bloqueado"); } };

describe("preferência do menu", () => {
  it("padrão: aberto em tela larga, recolhido em tela estreita", () => {
    expect(padraoPorLargura(1200)).toBe(false);
    expect(padraoPorLargura(768)).toBe(false);
    expect(padraoPorLargura(767)).toBe(true);
  });
  it("sem nada guardado usa o padrão da largura", () => {
    expect(lerRecolhido(1200, memoria())).toBe(false);
    expect(lerRecolhido(400, memoria())).toBe(true);
  });
  it("a escolha guardada vale, qualquer que seja a largura", () => {
    const m = memoria();
    gravarRecolhido(true, m);
    expect(m.getItem(CHAVE_MENU)).toBe("1");
    expect(lerRecolhido(1200, m)).toBe(true);
    gravarRecolhido(false, m);
    expect(lerRecolhido(400, m)).toBe(false);
  });
  it("armazenamento bloqueado não derruba: usa o padrão e ignora a gravação", () => {
    expect(() => gravarRecolhido(true, quebrado)).not.toThrow();
    expect(lerRecolhido(400, quebrado)).toBe(true);
    expect(lerRecolhido(1200, quebrado)).toBe(false);
  });
  it("valor desconhecido guardado cai no padrão", () => {
    const m = memoria();
    m.setItem(CHAVE_MENU, "talvez");
    expect(lerRecolhido(1200, m)).toBe(false);
  });
});
