import { describe, expect, it } from "vitest";
import { AVISO_MONTADO_AGORA, FRASE_FINAL, linhasDoCabecalho, nomeDoArquivoPdf, rotuloDoPerfil, temParecer, tituloDoParecer } from "./parecer-regras.js";

describe("parecer do cenário (spec 056)", () => {
  const p = { nome: "Plano reforço", loja: "Cosmópolis", regra: "Regra de 42h", salvoEm: "2026-11-11T12:00:00.000Z", salvoPor: "TENANT_ADMIN" };
  it("título e cabeçalho: nome, loja, regra, data e quem salvou", () => {
    expect(tituloDoParecer(p)).toBe("Parecer: Plano reforço");
    expect(linhasDoCabecalho(p)).toEqual(["Loja: Cosmópolis · Regra: Regra de 42h", "Salvo em 11/11/2026 por Dono"]);
    expect(linhasDoCabecalho({ ...p, salvoPor: null })[1]).toBe("Salvo em 11/11/2026");
  });
  it("o perfil vira Dono, Gestor ou Consulta", () => {
    expect([rotuloDoPerfil("TENANT_ADMIN"), rotuloDoPerfil("SCHEDULE_MANAGER"), rotuloDoPerfil("SCHEDULE_VIEWER"), rotuloDoPerfil("x")]).toEqual(["Dono", "Gestor", "Consulta", null]);
  });
  it("o nome do arquivo não tem acento nem caracteres inválidos", () => {
    expect(nomeDoArquivoPdf("Plano reforço sábado!")).toBe("parecer-plano-reforco-sabado.pdf");
    expect(nomeDoArquivoPdf("///")).toBe("parecer-cenario.pdf");
  });
  it("só cenário salvo tem parecer", () => {
    expect(temParecer({ status: "gravada" })).toBe(true);
    expect(temParecer({ status: "rascunho" })).toBe(false);
    expect(temParecer({ status: "descartada" })).toBe(false);
    expect(temParecer(null)).toBe(false);
  });
  it("as frases fixas", () => {
    expect(FRASE_FINAL).toBe("Esta é uma estimativa e não altera o Cadastro.");
    expect(AVISO_MONTADO_AGORA).toBe("Cenário salvo antes do parecer: texto montado agora.");
  });
});
