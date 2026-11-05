import { describe, expect, it } from "vitest";
import { destinoDoItem, folhaAtual, folhas, itemDaFolha, itensDoMenu, telaTemFaixa } from "./menu.js";

const ids = (perfil) => itensDoMenu(perfil).map((i) => i.id);
const filhos = (perfil, id) => itensDoMenu(perfil).find((i) => i.id === id).filhos?.map((f) => f.id);

describe("menu por perfil", () => {
  it("o operador vê Grupos e Parâmetros legais", () => {
    expect(ids("PLATFORM_OPERATOR")).toEqual(["lojas", "escala", "grupos"]);
    expect(filhos("PLATFORM_OPERATOR", "lojas")).toEqual(["lojas-lista", "lojas-parametros"]);
  });
  it.each(["TENANT_ADMIN", "SCHEDULE_MANAGER", "SCHEDULE_VIEWER"])("%s não vê Grupos nem Parâmetros legais", (p) => {
    expect(ids(p)).toEqual(["lojas", "escala"]);
    expect(filhos(p, "lojas")).toEqual(["lojas-lista"]);
  });
  it("Escala traz Diagnóstico e Simulações, nesta ordem", () => {
    expect(filhos("TENANT_ADMIN", "escala")).toEqual(["escala-diagnostico", "escala-simulacoes"]);
  });
});

describe("item atual", () => {
  it("acha a folha pela tela e seção", () => {
    expect(folhaAtual("TENANT_ADMIN", "escala", "grade").id).toBe("escala-simulacoes");
    expect(folhaAtual("TENANT_ADMIN", "cadastros", "lojas").id).toBe("lojas-lista");
    expect(folhaAtual("PLATFORM_OPERATOR", "grupos", null).id).toBe("grupos");
  });
  it("seção que o perfil não vê cai na primeira da tela; tela que o perfil não vê cai no primeiro item", () => {
    expect(folhaAtual("TENANT_ADMIN", "cadastros", "parametros").id).toBe("lojas-lista");
    expect(folhaAtual("TENANT_ADMIN", "grupos", null).id).toBe("lojas-lista");
  });
  it("o item de primeiro nível que contém a folha é o que fica aberto", () => {
    const f = folhaAtual("TENANT_ADMIN", "escala", "diagnostico");
    expect(itemDaFolha("TENANT_ADMIN", f).id).toBe("escala");
  });
  it("clicar num item com subitens leva ao primeiro subitem", () => {
    const escala = itensDoMenu("TENANT_ADMIN").find((i) => i.id === "escala");
    expect(destinoDoItem(escala).id).toBe("escala-diagnostico");
  });
  it("as folhas seguem a ordem do menu", () => {
    expect(folhas("PLATFORM_OPERATOR").map((f) => f.id)).toEqual(["lojas-lista", "lojas-parametros", "escala-diagnostico", "escala-simulacoes", "grupos"]);
  });
});

describe("faixa de contexto", () => {
  it("só nas telas da Escala", () => {
    expect(telaTemFaixa("escala")).toBe(true);
    expect(telaTemFaixa("cadastros")).toBe(false);
    expect(telaTemFaixa("grupos")).toBe(false);
  });
});
