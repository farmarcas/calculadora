import { describe, expect, it } from "vitest";
import { capitalizada, ehMargem, fraseDaRegua, maiusculas, palavraDaRegua } from "./regua.js";

describe("régua do cálculo", () => {
  it("margem troca a palavra; venda, sem régua e régua desconhecida ficam em venda", () => {
    expect(palavraDaRegua({ tipo: "margem" })).toBe("margem");
    expect(maiusculas({ tipo: "margem" })).toBe("MARGEM");
    expect(capitalizada({ tipo: "margem" })).toBe("Margem");
    expect(palavraDaRegua({ tipo: "venda", motivo: "sem_margem" })).toBe("venda");
    expect(palavraDaRegua(null)).toBe("venda");
    expect(palavraDaRegua(undefined)).toBe("venda");
    expect(ehMargem({ tipo: "margem" })).toBe(true);
    expect(ehMargem(null)).toBe(false);
  });
  it("a frase diz margem ou o motivo de voltar à venda; nada sem régua", () => {
    expect(fraseDaRegua({ tipo: "margem" })).toMatch(/margem bruta/);
    expect(fraseDaRegua({ tipo: "venda", motivo: "margem_incoerente" })).toMatch(/maior que a venda/);
    expect(fraseDaRegua({ tipo: "venda", motivo: "sem_margem" })).toMatch(/não traz margem/);
    expect(fraseDaRegua({ tipo: "venda", motivo: "margem_parcial" })).toMatch(/poucas horas/);
    expect(fraseDaRegua(null)).toBeNull();
  });
});
