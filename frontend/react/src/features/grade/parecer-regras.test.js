import { describe, expect, it } from "vitest";
import { AVISO_DE_ESTIMATIVA, AVISO_MONTADO_AGORA, AVISO_SO_DONO, MENSAGEM_ERRO_PDF, corDaMudanca, estiloDoChip, linhasDoSubtitulo, nomeDoArquivoPdf, papelDeQuemSalvou, temParecer, textoDoStatus, tituloDoParecer } from "./parecer-regras.js";

describe("parecer do cenário, layout novo (spec 057)", () => {
  const p = { loja: "Cosmópolis", regra: "Regra de 42h", numeroCenario: 5, salvoEm: "2026-11-11T12:00:00.000Z", salvoPor: "TENANT_ADMIN" };

  it("o título tem a grafia da loja, com acento", () => {
    expect(tituloDoParecer(p)).toBe("Parecer do cenário · Cosmópolis");
  });
  it("o subtítulo tem duas linhas: loja, regra e cenário; data e papel", () => {
    expect(linhasDoSubtitulo(p)).toEqual(["Cosmópolis · Regra de 42h · Cenário 5", "Salvo em 11/11/2026 pelo dono"]);
    expect(linhasDoSubtitulo({ ...p, salvoPor: "SCHEDULE_VIEWER" })[1]).toBe("Salvo em 11/11/2026 pela consulta");
    expect(linhasDoSubtitulo({ ...p, salvoPor: "SCHEDULE_MANAGER" })[1]).toBe("Salvo em 11/11/2026 pelo gestor");
  });
  it("sem número de cenário ou sem papel, a linha só perde o pedaço que falta", () => {
    expect(linhasDoSubtitulo({ ...p, numeroCenario: null, salvoPor: null })).toEqual(["Cosmópolis · Regra de 42h", "Salvo em 11/11/2026"]);
    expect(papelDeQuemSalvou("x")).toBeNull();
  });
  it("o nome do arquivo: loja em minúsculas sem acento e o número do cenário, como no servidor", () => {
    expect(nomeDoArquivoPdf("Cosmópolis", 5)).toBe("parecer-cosmopolis-cenario-5.pdf");
    expect(nomeDoArquivoPdf("1099 · Sumaré - Centro", 12)).toBe("parecer-1099-sumare-centro-cenario-12.pdf");
    expect(nomeDoArquivoPdf("Cosmópolis", null)).toBe("parecer-cosmopolis.pdf");
    expect(nomeDoArquivoPdf("///", 1)).toBe("parecer-loja-cenario-1.pdf");
  });
  it("o chip de status leva um símbolo, e a cor nunca vai sozinha", () => {
    expect(textoDoStatus({ texto: "Cobre o horário", tom: "verde" })).toBe("✓ Cobre o horário");
    expect(textoDoStatus({ texto: "Não recomendado", tom: "vermelho" })).toBe("✕ Não recomendado");
    expect(textoDoStatus({ texto: "Perde venda", tom: "ambar" })).toBe("! Perde venda");
    expect(textoDoStatus({ texto: "folha igual", tom: "neutro" })).toBe("folha igual");
  });
  it("cada tom tem fundo, texto e borda dos tokens do chip; a mudança tem cor por tom", () => {
    for (const tom of ["verde", "ambar", "vermelho", "neutro"]) expect(Object.keys(estiloDoChip(tom))).toEqual(["background", "color", "borderColor"]);
    expect(estiloDoChip("ambar").color).toBe("var(--chip-aumenta-texto)");
    expect(estiloDoChip("verde").color).toBe("var(--chip-diminui-texto)");
    expect(corDaMudanca("verde")).toBe("var(--chip-diminui-texto)");
    expect(corDaMudanca("neutro")).toBe("var(--text-secondary)");
    expect(estiloDoChip("x")).toEqual({});
  });
  it("só cenário salvo tem parecer", () => {
    expect(temParecer({ status: "gravada" })).toBe(true);
    expect(temParecer({ status: "rascunho" })).toBe(false);
    expect(temParecer({ status: "descartada" })).toBe(false);
    expect(temParecer(null)).toBe(false);
  });
  it("as frases fixas", () => {
    expect(AVISO_DE_ESTIMATIVA).toBe("Estimativa feita com os dados importados da loja. Não altera o Cadastro.");
    expect(AVISO_SO_DONO).toBe("Valores em reais aparecem só para o dono do grupo.");
    expect(AVISO_MONTADO_AGORA).toBe("Cenário salvo antes do parecer: texto montado agora.");
    expect(MENSAGEM_ERRO_PDF).toBe("Não foi possível baixar o PDF. Tente de novo.");
  });
});
