import { describe, expect, it } from "vitest";
import { destinoDoItem, folhaAtual, folhas, itemDaFolha, itensDoMenu, telaTemFaixa } from "./menu.js";

const ids = (perfil) => itensDoMenu(perfil).map((i) => i.id);

describe("menu por perfil", () => {
  it("o operador vê Minhas Lojas, Parâmetros legais, Escala e Grupos, todos diretos (sem submenu)", () => {
    expect(ids("PLATFORM_OPERATOR")).toEqual(["lojas", "parametros", "escala", "grupos"]);
    for (const i of itensDoMenu("PLATFORM_OPERATOR")) expect(i.filhos).toBeUndefined();
  });
  it.each(["TENANT_ADMIN", "SCHEDULE_MANAGER", "SCHEDULE_VIEWER"])("%s vê só Minhas Lojas e Escala, diretos", (p) => {
    expect(ids(p)).toEqual(["lojas", "escala"]);
  });
  it("Diagnóstico e Simulações não são itens do menu: ficam nas abas da Escala", () => {
    expect(folhas("TENANT_ADMIN").map((f) => f.id)).not.toContain("escala-diagnostico");
    expect(folhas("TENANT_ADMIN").map((f) => f.id)).not.toContain("escala-simulacoes");
  });
});

describe("item atual", () => {
  it("acha o item pela tela e seção", () => {
    expect(folhaAtual("TENANT_ADMIN", "cadastros", "lojas").id).toBe("lojas");
    expect(folhaAtual("PLATFORM_OPERATOR", "cadastros", "parametros").id).toBe("parametros");
    expect(folhaAtual("PLATFORM_OPERATOR", "grupos", null).id).toBe("grupos");
  });
  it("a Escala fica destacada nas duas abas (Diagnóstico e Simulações)", () => {
    expect(folhaAtual("TENANT_ADMIN", "escala", "diagnostico").id).toBe("escala");
    expect(folhaAtual("TENANT_ADMIN", "escala", "grade").id).toBe("escala");
  });
  it("seção que o perfil não vê cai no item da tela; tela que o perfil não vê cai no primeiro item", () => {
    expect(folhaAtual("TENANT_ADMIN", "cadastros", "parametros").id).toBe("lojas");
    expect(folhaAtual("TENANT_ADMIN", "grupos", null).id).toBe("lojas");
  });
  it("o item de primeiro nível é o próprio item", () => {
    const f = folhaAtual("TENANT_ADMIN", "escala", "grade");
    expect(itemDaFolha("TENANT_ADMIN", f).id).toBe("escala");
  });
  it("clicar num item leva a ele mesmo; a Escala abre no Diagnóstico", () => {
    const escala = itensDoMenu("TENANT_ADMIN").find((i) => i.id === "escala");
    expect(destinoDoItem(escala)).toMatchObject({ id: "escala", tela: "escala", secao: "diagnostico" });
  });
  it("as folhas seguem a ordem do menu", () => {
    expect(folhas("PLATFORM_OPERATOR").map((f) => f.id)).toEqual(["lojas", "parametros", "escala", "grupos"]);
  });
});

describe("faixa de contexto", () => {
  it("só nas telas da Escala", () => {
    expect(telaTemFaixa("escala")).toBe(true);
    expect(telaTemFaixa("cadastros")).toBe(false);
    expect(telaTemFaixa("grupos")).toBe(false);
  });
});
