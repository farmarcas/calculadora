import { describe, expect, it } from "vitest";
import { acessoTotalNoGrupo, faseDaFalha, grupoInicial, perfilNoGrupo } from "./sessao.js";

describe("falhas no retorno", () => {
  it.each([
    ["SEM_ACESSO", "sem-acesso"],
    ["LOGIN_INVALIDO", "login-invalido"],
    ["VALIDATION_ERROR", "login-invalido"],
    ["RADAR_INDISPONIVEL", "indisponivel"],
    [undefined, "indisponivel"],
  ])("%s mostra %s", (code, fase) => {
    expect(faseDaFalha(code)).toBe(fase);
  });
});

describe("grupo e papel da sessão", () => {
  const sessao = {
    sso: true,
    operador: false,
    grupos: [
      { id: "a", perfil: "TENANT_ADMIN", acessoTotal: true },
      { id: "b", perfil: "SCHEDULE_VIEWER", acessoTotal: false },
    ],
  };

  it("mantém o grupo guardado que ainda é da pessoa", () => {
    expect(grupoInicial("b", sessao.grupos)).toBe("b");
  });
  it("cai no primeiro quando o guardado não é mais da pessoa", () => {
    expect(grupoInicial("x", sessao.grupos)).toBe("a");
  });
  it("mantém o guardado quando não há grupos", () => {
    expect(grupoInicial("x", [])).toBe("x");
  });
  it("o papel depende do grupo escolhido", () => {
    expect(perfilNoGrupo(sessao, "a")).toBe("TENANT_ADMIN");
    expect(perfilNoGrupo(sessao, "b")).toBe("SCHEDULE_VIEWER");
    expect(perfilNoGrupo(sessao, "x")).toBe("SCHEDULE_VIEWER");
  });
  it("o operador é operador em qualquer grupo", () => {
    expect(perfilNoGrupo({ ...sessao, operador: true }, "x")).toBe("PLATFORM_OPERATOR");
  });
  it("acesso parcial vale por grupo, e o login desligado não restringe", () => {
    expect(acessoTotalNoGrupo(sessao, "a")).toBe(true);
    expect(acessoTotalNoGrupo(sessao, "b")).toBe(false);
    expect(acessoTotalNoGrupo({ sso: false }, "b")).toBe(true);
    expect(acessoTotalNoGrupo({ ...sessao, operador: true }, "b")).toBe(true);
  });
});
