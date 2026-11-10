import { describe, expect, it } from "vitest";
import { TIPOS_DE_DIA, nomeDoTipo, reais, rotuloHora } from "./formato.js";

describe("formato do faturamento por hora", () => {
  it("reais inteiros com ponto de milhar", () => {
    expect(reais(5980)).toBe("R$ 5.980");
    expect(reais(997.4)).toBe("R$ 997");
    expect(reais(1320)).toBe("R$ 1.320");
  });
  it("hora e tipos de dia", () => {
    expect(rotuloHora(7)).toBe("07h");
    expect(rotuloHora(21)).toBe("21h");
    expect(TIPOS_DE_DIA.map(([, n]) => n)).toEqual(["Dias úteis", "Sábado", "Domingo"]);
    expect(nomeDoTipo("domingo")).toBe("Domingo");
    expect(nomeDoTipo("x")).toBe("Dias úteis");
  });
});
