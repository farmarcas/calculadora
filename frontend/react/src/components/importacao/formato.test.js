import { describe, expect, it } from "vitest";
import {
  apoioDaBase, dataBR, erroDoArquivo, linhaDeErro, listaDeErrosCsv, periodoTexto, sucessoDaBase, sucessoDoCadastro,
  tamanhoLegivel, textoDeSubstituicao, textoGravar,
} from "./formato.js";
import { proximoIndice } from "./useArmadilhaDeFoco.js";

describe("tamanho e datas", () => {
  it("tamanho em KB e MB com vírgula", () => {
    expect(tamanhoLegivel(124 * 1024)).toBe("124 KB");
    expect(tamanhoLegivel(100)).toBe("1 KB");
    expect(tamanhoLegivel(3.2 * 1024 * 1024)).toBe("3,2 MB");
    expect(tamanhoLegivel(10 * 1024 * 1024)).toBe("10 MB");
  });
  it("datas e período", () => {
    expect(dataBR("2026-10-01")).toBe("01/10/2026");
    expect(dataBR(undefined)).toBe("");
    expect(periodoTexto({ inicio: "2026-10-01", fim: "2026-10-31" })).toBe("01/10/2026 a 31/10/2026");
    expect(periodoTexto(null)).toBe("");
  });
  it("apoio do quadro da base: tamanho, lojas e período", () => {
    expect(apoioDaBase({ bytes: 3.2 * 1024 * 1024, lojas: 14, periodo: { inicio: "2026-10-01", fim: "2026-10-31" } })).toBe("3,2 MB · 14 lojas · 01/10/2026 a 31/10/2026");
    expect(apoioDaBase({ bytes: 2048, lojas: 1, periodo: null })).toBe("2 KB · 1 loja");
  });
});

describe("erro do arquivo escolhido", () => {
  it("formato errado e arquivo acima do limite", () => {
    expect(erroDoArquivo({ name: "a.pdf", size: 10 })).toContain("não é .xlsx nem .csv");
    expect(erroDoArquivo({ name: "a.XLSX", size: 10 })).toBeNull();
    expect(erroDoArquivo({ name: "a.csv", size: 11 * 1024 * 1024 })).toContain("mais de 10 MB");
    expect(erroDoArquivo(null)).toBeNull();
  });
});

describe("substituição da base comercial", () => {
  it("sem envio anterior não há aviso", () => expect(textoDeSubstituicao([])).toBeNull());
  it("uma data só, no plural e no singular", () => {
    const um = textoDeSubstituicao([{ codigo: "1", desde: "2026-10-28" }]);
    expect(um).toEqual({ titulo: "Este envio substitui o de 28/10/2026.", apoio: "A loja passa a usar a nova planilha. A anterior fica no histórico." });
    const varios = textoDeSubstituicao([{ codigo: "1", desde: "2026-10-28" }, { codigo: "2", desde: "2026-10-28" }]);
    expect(varios.apoio).toBe("As 2 lojas passam a usar a nova planilha. A anterior fica no histórico.");
  });
  it("datas diferentes viram um intervalo", () => {
    const r = textoDeSubstituicao([{ codigo: "1", desde: "2026-10-30" }, { codigo: "2", desde: "2026-10-01" }]);
    expect(r.titulo).toBe("Este envio substitui envios de 01/10/2026 a 30/10/2026.");
  });
});

describe("mensagens de sucesso e botão de gravar", () => {
  it("cadastro, com e sem linhas recusadas", () => {
    const r = { lojas: { novos: 0, atualizados: 12 }, funcionarios: { novos: 18, atualizados: 30 }, erros: [] };
    expect(sucessoDoCadastro(r)).toBe("12 lojas e 48 funcionários gravados.");
    expect(sucessoDoCadastro({ ...r, erros: [{}, {}] })).toBe("12 lojas e 48 funcionários gravados. 2 linhas não foram gravadas.");
    expect(sucessoDoCadastro({ lojas: { novos: 0, atualizados: 1 }, funcionarios: { novos: 1, atualizados: 0 }, erros: [{}] })).toBe("1 loja e 1 funcionário gravados. 1 linha não foi gravada.");
  });
  it("base comercial", () => {
    expect(sucessoDaBase({ lojas: 14 })).toBe("Base comercial enviada para 14 lojas.");
    expect(sucessoDaBase({ lojas: 1, naoGravadas: 3 })).toBe("Base comercial enviada para 1 loja. 3 linhas não foram gravadas.");
  });
  it("texto do botão usa os totais reais", () => {
    expect(textoGravar({ lojas: { atualiza: 12, novas: 0 }, funcionarios: { atualiza: 30, novas: 18 } })).toBe("Gravar 12 lojas e 48 funcionários");
    expect(textoGravar({ lojas: { atualiza: 1, novas: 0 }, funcionarios: { atualiza: 0, novas: 1 } })).toBe("Gravar 1 loja e 1 funcionário");
  });
});

describe("lista de erros", () => {
  it("linha no formato 'Lojas, linha 14: motivo.'", () => {
    expect(linhaDeErro({ aba: "Lojas", linha: 14, motivo: "CNPJ não encontrado entre as lojas do grupo" })).toBe("Lojas, linha 14: CNPJ não encontrado entre as lojas do grupo.");
    expect(linhaDeErro({ aba: "Funcionários", linha: 2, motivo: "Matrícula vazia." })).toBe("Funcionários, linha 2: Matrícula vazia.");
  });
  it("CSV com BOM, separador ; e aspas escapadas", () => {
    const csv = listaDeErrosCsv([{ aba: "Lojas", linha: 14, motivo: 'Disse "oi"' }]);
    expect(csv.startsWith("﻿Aba;Linha;Motivo\r\n")).toBe(true);
    expect(csv).toContain('"Lojas";14;"Disse ""oi"""');
  });
});

describe("foco preso", () => {
  it("Tab no último volta ao primeiro; Shift+Tab no primeiro vai ao último", () => {
    expect(proximoIndice(3, 2, false)).toBe(0);
    expect(proximoIndice(3, 0, true)).toBe(2);
  });
  it("no meio da lista o navegador segue o caminho normal", () => {
    expect(proximoIndice(3, 1, false)).toBeNull();
    expect(proximoIndice(3, 1, true)).toBeNull();
  });
  it("foco fora da janela entra pelo primeiro ou pelo último", () => {
    expect(proximoIndice(3, -1, false)).toBe(0);
    expect(proximoIndice(3, -1, true)).toBe(2);
    expect(proximoIndice(0, -1, false)).toBeNull();
  });
});
