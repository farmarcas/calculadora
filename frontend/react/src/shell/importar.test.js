import { describe, expect, it } from "vitest";
import { itensDoMenuImportar, proximoItem } from "./importar.js";

describe("menu Importar", () => {
  it("dono e gestor importam lojas e funcionários e a base; o operador só lojas e funcionários; consulta nada", () => {
    expect(itensDoMenuImportar("TENANT_ADMIN").map((i) => i.rotulo)).toEqual(["Importar lojas e funcionários", "Vendas hora a hora"]);
    expect(itensDoMenuImportar("SCHEDULE_MANAGER").map((i) => i.id)).toEqual(["cadastro", "base"]);
    expect(itensDoMenuImportar("PLATFORM_OPERATOR").map((i) => i.id)).toEqual(["cadastro"]);
    expect(itensDoMenuImportar("SCHEDULE_VIEWER")).toEqual([]);
  });
  it("setas circulam entre os itens; Home e End vão às pontas", () => {
    expect(proximoItem(-1, 2, "ArrowDown")).toBe(0);
    expect(proximoItem(1, 2, "ArrowDown")).toBe(0);
    expect(proximoItem(0, 2, "ArrowUp")).toBe(1);
    expect(proximoItem(-1, 2, "ArrowUp")).toBe(1);
    expect(proximoItem(1, 3, "Home")).toBe(0);
    expect(proximoItem(0, 3, "End")).toBe(2);
    expect(proximoItem(0, 0, "ArrowDown")).toBe(-1);
  });
});

describe("acesso a parte das lojas do grupo", () => {
  it("não oferece importação, que vale para o grupo inteiro", () => {
    expect(itensDoMenuImportar("TENANT_ADMIN", false)).toEqual([]);
  });
});
