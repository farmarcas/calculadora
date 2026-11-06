import { describe, expect, it } from "vitest";
import { alternarSelecao, marcadasValidas, mostrarBarra, podeMarcar, textoDaBarra } from "./selecao.js";

describe("seleção para comparar", () => {
  it("marca na ordem de escolha e desmarca", () => {
    let r = alternarSelecao([], "a");
    r = alternarSelecao(r.marcadas, "b");
    expect(r.marcadas).toEqual(["a", "b"]);
    expect(alternarSelecao(r.marcadas, "a").marcadas).toEqual(["b"]);
  });
  it("a quinta não marca e avisa que foi barrada", () => {
    const quatro = ["a", "b", "c", "d"];
    expect(alternarSelecao(quatro, "e")).toEqual({ marcadas: quatro, barrada: true });
    expect(alternarSelecao(quatro, "d").barrada).toBe(false);
  });
  it("a barra só aparece com duas ou mais, e o texto diz que a primeira é a base", () => {
    expect(mostrarBarra(["a"])).toBe(false);
    expect(mostrarBarra(["a", "b"])).toBe(true);
    expect(textoDaBarra(2)).toBe("2 simulações selecionadas. A primeira escolhida é a base da comparação.");
  });
  it("descartada não marca e some da seleção", () => {
    expect(podeMarcar({ status: "descartada" })).toBe(false);
    expect(podeMarcar({ status: "gravada" })).toBe(true);
    expect(marcadasValidas(["a", "b", "z"], [{ id: "a", status: "gravada" }, { id: "b", status: "descartada" }])).toEqual(["a"]);
  });
});
