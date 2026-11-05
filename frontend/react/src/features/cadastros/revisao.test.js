import { describe, expect, it } from "vitest";
import { linhasDaRevisao, totaisDoBotao, totalAGravar } from "./revisao.js";

const rev = { lojas: { atualiza: 12, novas: 0, comErro: 1 }, funcionarios: { atualiza: 30, novas: 18, comErro: 2 } };

describe("revisão da importação", () => {
  it("mostra a linha de lojas só para quem importa lojas", () => {
    expect(linhasDaRevisao(rev, true).map((l) => l.rotulo)).toEqual(["Lojas", "Funcionários"]);
    expect(linhasDaRevisao(rev, false).map((l) => l.rotulo)).toEqual(["Funcionários"]);
  });
  it("o total a gravar não conta as linhas com erro", () => {
    expect(totalAGravar(rev, true)).toBe(60);
    expect(totalAGravar(rev, false)).toBe(48);
    expect(totalAGravar({ lojas: { atualiza: 0, novas: 0, comErro: 3 }, funcionarios: { atualiza: 0, novas: 0, comErro: 0 } }, true)).toBe(0);
  });
  it("os totais do botão zeram as lojas de quem não as importa", () => {
    expect(totaisDoBotao(rev, false).lojas).toEqual({ atualiza: 0, novas: 0, comErro: 0 });
    expect(totaisDoBotao(rev, true).lojas.atualiza).toBe(12);
  });
});
