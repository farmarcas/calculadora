import { describe, expect, it } from "vitest";
import { GRUPOS, contarMudancas, diferenca, gruposDisponiveis, gruposVisiveis, mudou, remover, textoDoValor, totalDeMetricas, trocarBase } from "./comparacao.js";

const m = (chave) => GRUPOS.flatMap((g) => g.metricas).find((x) => x.chave === chave);
const sim = (o = {}) => ({
  saldoMensal: -2299, folhaExtra: 2299, vendaEstimada: 0, vendaQueSai: 0, horasAbertas: 89,
  indicadores: { erros: 66, avisos: 2, semFarmaceutico: false, coberturaPct: 100, horasFalta: 0, horasSobra: 7, pessoas: 7, horasPlanejadas: 301, horasContratadas: 252, folgasPorPessoa: 2 },
  ...o,
});

describe("cor da diferença pelo efeito no resultado (não pelo sinal)", () => {
  it("saldo e venda estimada: aumento é bom, queda é ruim", () => {
    expect(diferenca(m("saldo"), 4900, -2299)).toMatchObject({ tom: "bom", seta: "▲", texto: "+R$ 7.199" });
    expect(diferenca(m("saldo"), -40275, -2299)).toMatchObject({ tom: "ruim", seta: "▼", texto: "−R$ 37.976" });
    expect(diferenca(m("venda"), 9100, 0)).toMatchObject({ tom: "bom", texto: "+R$ 9.100" });
  });
  it("folha extra, venda que deixa de entrar, erros, avisos e horas que faltam: aumento é ruim, queda é boa", () => {
    expect(diferenca(m("folha"), 4200, 2299)).toMatchObject({ tom: "ruim", seta: "▲", texto: "+R$ 1.901" });
    expect(diferenca(m("folha"), 0, 2299)).toMatchObject({ tom: "bom", seta: "▼" });
    expect(diferenca(m("vendaSai"), 100, 0).tom).toBe("ruim");
    expect(diferenca(m("erros"), 70, 66)).toMatchObject({ tom: "ruim", texto: "+4" });
    expect(diferenca(m("avisos"), 0, 2).tom).toBe("bom");
    expect(diferenca(m("faltam"), 3, 0)).toMatchObject({ tom: "ruim", texto: "+3h" });
  });
  it("horas abertas, sobram, pessoas, planejadas, contratadas, folgas e cobertura: neutras", () => {
    for (const k of ["horasAbertas", "sobram", "pessoas", "planejadas", "contratadas", "folgas", "cobertura"])
      expect(diferenca(m(k), 10, 5).tom).toBe("neutro");
    expect(diferenca(m("horasAbertas"), 98, 89)).toMatchObject({ seta: "▲", texto: "+9h" });
  });
  it("igual: sem seta e sem cor; sem valor num dos lados, também", () => {
    expect(diferenca(m("saldo"), 100, 100)).toMatchObject({ igual: true, seta: null });
    expect(diferenca(m("saldo"), null, 100)).toMatchObject({ igual: true });
    expect(diferenca(m("saldo"), 100, undefined)).toMatchObject({ igual: true });
  });
  it("a marca do farmacêutico: mudou ou não, sem número", () => {
    expect(diferenca(m("farmaceutico"), false, false).igual).toBe(true);
    expect(diferenca(m("farmaceutico"), true, false)).toMatchObject({ igual: false, tom: "ruim", texto: "Falta" });
    expect(diferenca(m("farmaceutico"), false, true)).toMatchObject({ igual: false, tom: "bom", texto: "Cobre tudo" });
  });
});

describe("células", () => {
  it("valores formatados", () => {
    expect(textoDoValor(m("saldo"), -2299)).toBe("−R$ 2.299");
    expect(textoDoValor(m("horasAbertas"), 89)).toBe("89h");
    expect(textoDoValor(m("cobertura"), 100)).toBe("100%");
    expect(textoDoValor(m("farmaceutico"), false)).toBe("Cobre tudo");
    expect(textoDoValor(m("saldo"), null)).toBe("—");
  });
});

describe("grupos, contagem e filtro", () => {
  const base = sim();
  const outra = sim({ saldoMensal: 4900, folhaExtra: 4200, vendaEstimada: 9100, horasAbertas: 98, indicadores: { ...sim().indicadores, horasSobra: 12, pessoas: 9, horasPlanejadas: 343, horasContratadas: 294 } });
  it("o dono vê as 15 métricas em 4 grupos; sem valores em reais são 11", () => {
    const g = gruposDisponiveis([base, outra]);
    expect(g.map((x) => x.titulo)).toEqual(["Resultado por mês", "Conformidade", "Atendimento", "Pessoas"]);
    expect(totalDeMetricas(g)).toBe(15);
    const semReais = [base, outra].map(({ saldoMensal, folhaExtra, vendaEstimada, vendaQueSai, ...resto }) => resto);
    expect(totalDeMetricas(gruposDisponiveis(semReais))).toBe(11);
    expect(gruposDisponiveis(semReais)[0].metricas.map((x) => x.chave)).toEqual(["horasAbertas"]);
  });
  it("conta quantos itens mudaram frente à base (8 de 15 no exemplo do board)", () => {
    const g = gruposDisponiveis([base, outra]);
    expect(contarMudancas([base, outra], g)).toEqual({ mudaram: 8, total: 15 });
    expect(mudou(m("erros"), [base, outra])).toBe(false);
    expect(mudou(m("saldo"), [base, outra])).toBe(true);
  });
  it("com três colunas, mudou se qualquer uma difere da base", () => {
    const terceira = sim({ indicadores: { ...sim().indicadores, erros: 70 } });
    expect(mudou(m("erros"), [base, outra, terceira])).toBe(true);
    expect(mudou(m("erros"), [base, outra])).toBe(false);
  });
  it("'só o que mudou' esconde as linhas iguais e os grupos vazios", () => {
    const g = gruposDisponiveis([base, outra]);
    const v = gruposVisiveis(g, [base, outra], true);
    expect(v.map((x) => x.titulo)).toEqual(["Resultado por mês", "Atendimento", "Pessoas"]);
    expect(v.find((x) => x.chave === "atendimento").metricas.map((x) => x.chave)).toEqual(["sobram"]);
    expect(totalDeMetricas(v)).toBe(8);
    expect(gruposVisiveis(g, [base, outra], false)).toBe(g);
  });
  it("tudo igual à base: nenhum item mudou e nenhum grupo aparece com o filtro", () => {
    const g = gruposDisponiveis([base, base]);
    expect(contarMudancas([base, base], g).mudaram).toBe(0);
    expect(gruposVisiveis(g, [base, base], true)).toEqual([]);
  });
});

describe("base e colunas", () => {
  it("usar como base move a escolhida para a frente e mantém a ordem das outras", () => {
    expect(trocarBase(["a", "b", "c"], "c")).toEqual(["c", "a", "b"]);
    expect(trocarBase(["a", "b", "c"], "a")).toEqual(["a", "b", "c"]);
    expect(trocarBase(["a", "b"], "z")).toEqual(["a", "b"]);
  });
  it("remover tira a coluna", () => {
    expect(remover(["a", "b", "c"], "b")).toEqual(["a", "c"]);
  });
});
