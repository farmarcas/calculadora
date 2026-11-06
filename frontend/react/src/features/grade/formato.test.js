import { describe, expect, it } from "vitest";
import { horas, horasPorSemana, reais, reaisComSinal, tipoTexto } from "./formato.js";

describe("reais", () => {
  it("sem sinal para valores positivos e com o sinal de menos (U+2212) para negativos", () => {
    expect(reais(2299)).toBe("R$ 2.299");
    expect(reais(-2299)).toBe("−R$ 2.299");
    expect(reais(0)).toBe("R$ 0");
    expect(reais(null)).toBe("—");
  });
  it("com sinal: + para positivo, − para negativo, nada para zero", () => {
    expect(reaisComSinal(4900)).toBe("+R$ 4.900");
    expect(reaisComSinal(-40275)).toBe("−R$ 40.275");
    expect(reaisComSinal(0)).toBe("R$ 0");
    expect(reaisComSinal(0.4)).toBe("R$ 0");
    expect(reaisComSinal(undefined)).toBe("—");
  });
});

describe("horas e tipo", () => {
  it("horas por semana", () => {
    expect(horas(89)).toBe("89h");
    expect(horasPorSemana(98)).toBe("98h por semana");
    expect(horas(null)).toBe("—");
  });
  it("tipo do cenário", () => {
    expect(tipoTexto("mantem")).toBe("Mantém horários");
    expect(tipoTexto("reduz")).toBe("Reduz horários");
    expect(tipoTexto("amplia")).toBe("Amplia horários");
    expect(tipoTexto("x")).toBe("");
  });
});
