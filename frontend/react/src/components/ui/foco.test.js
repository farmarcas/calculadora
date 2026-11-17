import { describe, expect, it } from "vitest";
import { focoPreso } from "./foco.js";

describe("foco preso na janela (spec 057)", () => {
  const a = { id: "a" };
  const b = { id: "b" };
  const c = { id: "c" };
  const lista = [a, b, c];

  it("Tab no último volta ao primeiro; Shift+Tab no primeiro vai ao último", () => {
    expect(focoPreso(lista, c, false)).toBe(a);
    expect(focoPreso(lista, a, true)).toBe(c);
  });
  it("no meio da janela o navegador segue sozinho", () => {
    expect(focoPreso(lista, a, false)).toBeNull();
    expect(focoPreso(lista, b, false)).toBeNull();
    expect(focoPreso(lista, b, true)).toBeNull();
    expect(focoPreso(lista, c, true)).toBeNull();
  });
  it("com o foco fora da lista (ou na própria janela), entra pelo primeiro ou pelo último", () => {
    expect(focoPreso(lista, { id: "fora" }, false)).toBe(a);
    expect(focoPreso(lista, { id: "fora" }, true)).toBe(c);
  });
  it("sem nada focável não há para onde ir", () => {
    expect(focoPreso([], null, false)).toBeNull();
  });
  it("um só elemento: Tab e Shift+Tab ficam nele", () => {
    expect(focoPreso([a], a, false)).toBe(a);
    expect(focoPreso([a], a, true)).toBe(a);
  });
});
