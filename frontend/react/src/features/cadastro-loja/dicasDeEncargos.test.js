import { describe, expect, it } from "vitest";
import { DICAS_DE_ENCARGOS } from "./dicasDeEncargos.js";

describe("textos de ajuda dos encargos", () => {
  it("só resta a explicação da composição: RAT, FAP e rescisão por loja saíram da tela", () => {
    expect(DICAS_DE_ENCARGOS.composicao).toBe("Veja item a item o que compõe o custo de cada funcionário além do salário.");
    expect(Object.keys(DICAS_DE_ENCARGOS)).toEqual(["composicao"]);
  });
});
