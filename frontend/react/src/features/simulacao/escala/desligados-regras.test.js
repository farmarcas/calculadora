import { describe, expect, it } from "vitest";
import { desligadosDoQuadro, faixaDeDesligados, listaAposDesligar, listaAposReligar, podeDesligar, rotuloDoBotao, tituloDaFaixa } from "./desligados-regras.js";

const quadro = [
  { matricula: "A", nome: "Ana", funcao: "Farmacêutico", cargaH: 44 },
  { matricula: "B", nome: "Bia", funcao: "Atendimento", cargaH: 44, desligado: true },
  { matricula: "C", nome: "Caio", funcao: "Atendimento", cargaH: 44, desligado: true },
  { matricula: "VAGA-1", nome: "Vaga 1", funcao: "Caixa", cargaH: 40, vaga: true },
];

describe("desligados (spec 054)", () => {
  it("lista só funcionário existente desligado, na ordem do quadro", () => {
    expect(desligadosDoQuadro(quadro).map((p) => p.matricula)).toEqual(["B", "C"]);
    expect(desligadosDoQuadro([{ matricula: "VAGA-2", vaga: true, desligado: true }])).toEqual([]);
  });
  it("depois de desligar, a lista é a completa (as de antes mais a nova), sem repetir", () => {
    expect(listaAposDesligar(quadro, "A")).toEqual(["B", "C", "A"]);
    expect(listaAposDesligar(quadro, "B")).toEqual(["B", "C"]);
    expect(listaAposDesligar([], "A")).toEqual(["A"]);
  });
  it("depois de religar, a lista é a completa sem a pessoa", () => {
    expect(listaAposReligar(quadro, "B")).toEqual(["C"]);
    expect(listaAposReligar(quadro, "C")).toEqual(["B"]);
    expect(listaAposReligar([{ matricula: "A", nome: "Ana" }], "A")).toEqual([]);
  });
  it("só se desliga funcionário existente, que ainda está na simulação, com a simulação editável", () => {
    expect(podeDesligar(quadro[0], true)).toBe(true);
    expect(podeDesligar(quadro[0], false)).toBe(false);
    expect(podeDesligar(quadro[1], true)).toBe(false);
    expect(podeDesligar(quadro[3], true)).toBe(false);
    expect(podeDesligar(null, true)).toBe(false);
  });
  it("a faixa: título com a contagem, um Religar por nome e nada sem desligados", () => {
    const f = faixaDeDesligados(quadro, true);
    expect(f.titulo).toBe("Desligados na simulação (2)");
    expect(f.pessoas.map((p) => [p.nome, p.funcao, p.rotulo])).toEqual([
      ["Bia", "Atendimento", "Religar Bia"],
      ["Caio", "Atendimento", "Religar Caio"],
    ]);
    expect(f.podeReligar).toBe(true);
    expect(faixaDeDesligados(quadro, false).podeReligar).toBe(false);
    expect(faixaDeDesligados([quadro[0]], true)).toBeNull();
  });
  it("textos em pt-BR simples, sem p.p. nem pontos", () => {
    expect(tituloDaFaixa(1)).toBe("Desligados na simulação (1)");
    expect(rotuloDoBotao("desligar", "Ana Souza")).toBe("Desligar Ana Souza");
    expect(rotuloDoBotao("religar", "Ana Souza")).toBe("Religar Ana Souza");
    expect(`${tituloDaFaixa(2)} ${rotuloDoBotao("desligar", "A")}`).not.toMatch(/p\.p\.|pontos/);
  });
});
