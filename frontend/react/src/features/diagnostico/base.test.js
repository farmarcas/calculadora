import { describe, expect, it } from "vitest";
import { podeEnviar, resumoDoEnvio, textoLojasNaoCadastradas } from "./base.js";

describe("modal da base comercial", () => {
  it("resume o envio: lojas que receberam e linhas que ficaram de fora", () => {
    const res = { lojas: [{ situacao: "Importada", rejeitadas: 2 }, { situacao: "Importada", rejeitadas: 0 }, { situacao: "Loja não cadastrada: cadastre antes de importar", rejeitadas: 5 }], totalErros: 3 };
    expect(resumoDoEnvio(res)).toEqual({ lojas: 2, naoGravadas: 8 });
    expect(resumoDoEnvio(null)).toEqual({ lojas: 0, naoGravadas: 0 });
  });
  it("só envia quando há ao menos uma loja cadastrada", () => {
    expect(podeEnviar({ lojas: 14 })).toBe(true);
    expect(podeEnviar({ lojas: 0 })).toBe(false);
    expect(podeEnviar(null)).toBe(false);
  });
  it("aviso das lojas não cadastradas", () => {
    expect(textoLojasNaoCadastradas([])).toBeNull();
    expect(textoLojasNaoCadastradas(["099"])).toBe("A loja 099 não está cadastrada e fica de fora. Cadastre antes de enviar.");
    expect(textoLojasNaoCadastradas(["1", "2", "3", "4", "5", "6", "7"])).toContain("7 lojas do arquivo não estão cadastradas e ficam de fora: 1, 2, 3, 4, 5 e mais 2.");
  });
});
