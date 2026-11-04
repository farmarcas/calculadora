import { describe, expect, it } from "vitest";
import { DICAS_DE_ENCARGOS, linhaComSeusValores } from "./dicasDeEncargos.js";

describe("textos de ajuda dos encargos", () => {
  it("os cinco textos existem, com o conteúdo pedido", () => {
    expect(DICAS_DE_ENCARGOS.rat).toMatch(/^Contribuição que a empresa paga sobre a folha/);
    expect(DICAS_DE_ENCARGOS.fap).toContain("Custo = RAT × FAP. Exemplo: 2% × 1,5 = 3% do salário.");
    expect(DICAS_DE_ENCARGOS.rescisao).toContain("8,33% do salário");
    expect(DICAS_DE_ENCARGOS.composicao).toBe("Veja item a item o que compõe o custo de cada funcionário além do salário.");
    expect(DICAS_DE_ENCARGOS.simples).toBe("No Simples Nacional, o RAT já está incluído no imposto (DAS). Este campo não altera o resultado.");
  });
});

describe("linha 'Com os seus valores'", () => {
  it("RAT × FAP com uma casa decimal e vírgula", () => {
    expect(linhaComSeusValores("2", "1.5")).toBe("Com os seus valores: 3,0% do salário");
    expect(linhaComSeusValores(2, 1)).toBe("Com os seus valores: 2,0% do salário");
    expect(linhaComSeusValores("1.5", "0.9")).toBe("Com os seus valores: 1,4% do salário");
    expect(linhaComSeusValores("3", "2")).toBe("Com os seus valores: 6,0% do salário");
  });
  it("sem RAT ou sem FAP preenchidos, não mostra a linha", () => {
    expect(linhaComSeusValores("", "1")).toBeNull();
    expect(linhaComSeusValores("2", "")).toBeNull();
    expect(linhaComSeusValores(null, undefined)).toBeNull();
    expect(linhaComSeusValores("abc", "1")).toBeNull();
  });
});
