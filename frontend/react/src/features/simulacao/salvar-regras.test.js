import { describe, expect, it } from "vitest";
import { contagemDaObservacao, corpoParaGravar, erroDaObservacao, erroDoNome, mensagemDoErroAoSalvar, nomeSugerido } from "./salvar-regras.js";

describe("salvar o cenário com nome e observação (spec 056)", () => {
  it("o nome sugerido é Cenário N", () => {
    expect(nomeSugerido(5)).toBe("Cenário 5");
    expect(nomeSugerido(undefined)).toBe("Cenário");
  });
  it("nome vazio, só com espaços ou com mais de 60 caracteres tem erro; nome normal não", () => {
    expect(erroDoNome("")).toBe("Dê um nome ao cenário.");
    expect(erroDoNome("   ")).toBe("Dê um nome ao cenário.");
    expect(erroDoNome("x".repeat(61))).toBe("O nome pode ter até 60 caracteres.");
    expect(erroDoNome("x".repeat(60))).toBeNull();
    expect(erroDoNome("Plano reforço")).toBeNull();
  });
  it("a observação tem contagem e limite de 1000", () => {
    expect(contagemDaObservacao("abc")).toBe("3/1000");
    expect(contagemDaObservacao(undefined)).toBe("0/1000");
    expect(erroDaObservacao("y".repeat(1000))).toBeNull();
    expect(erroDaObservacao("y".repeat(1001))).toBe("A observação pode ter até 1000 caracteres.");
  });
  it("o corpo leva o nome sem espaços nas pontas e só leva a observação quando ela existe", () => {
    expect(corpoParaGravar({ nome: "  Plano A ", observacao: "  " })).toEqual({ comoCenario: true, nome: "Plano A" });
    expect(corpoParaGravar({ nome: "Plano A", observacao: " Aprovado. " })).toEqual({ comoCenario: true, nome: "Plano A", observacao: "Aprovado." });
  });
  it("a mensagem do nome repetido é simples; as outras vêm do servidor", () => {
    expect(mensagemDoErroAoSalvar({ code: "NOME_REPETIDO", message: "x" })).toBe("Já existe um cenário com esse nome nesta loja. Escolha outro nome.");
    expect(mensagemDoErroAoSalvar({ message: "Dados inválidos" })).toBe("Dados inválidos");
    expect(mensagemDoErroAoSalvar(null)).toBe("Não foi possível salvar. Tente de novo.");
  });
});
