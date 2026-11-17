import { describe, expect, it } from "vitest";
import { avisoDeExcluida, mensagemDeErroAoExcluir, podeExcluir, rotuloDoBotaoExcluir, textoDaExclusao, tituloDaExclusao } from "./exclusao-regras.js";

describe("excluir simulação", () => {
  it("só quem escreve exclui, e só o que ainda está na lista", () => {
    expect(podeExcluir({ status: "rascunho" }, true)).toBe(true);
    expect(podeExcluir({ status: "gravada" }, true)).toBe(true);
    expect(podeExcluir({ status: "descartada" }, true)).toBe(false);
    expect(podeExcluir({ status: "rascunho" }, false)).toBe(false);
    expect(podeExcluir(null, true)).toBe(false);
  });
  it("os textos dizem o que acontece, sem prometer apagar do sistema", () => {
    expect(tituloDaExclusao()).toBe("Excluir simulação");
    expect(textoDaExclusao("Plano A")).toBe('Excluir "Plano A"? Ela some da lista de simulações. Para vê-la de novo, marque "Mostrar descartadas". O Cadastro não muda.');
    expect(rotuloDoBotaoExcluir("Plano A")).toBe("Excluir Plano A");
    expect(avisoDeExcluida("Plano A")).toBe('"Plano A" excluída. Ela continua em "Mostrar descartadas".');
  });
  it("a mensagem de erro vem do servidor ou é uma frase simples", () => {
    expect(mensagemDeErroAoExcluir({ message: "Sem permissão" })).toBe("Sem permissão");
    expect(mensagemDeErroAoExcluir(null)).toBe("Não foi possível excluir a simulação. Tente de novo.");
  });
});
