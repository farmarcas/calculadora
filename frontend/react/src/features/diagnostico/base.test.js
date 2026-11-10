import { describe, expect, it } from "vitest";
import { ehPorCnpj, periodoPreenchido, podeEnviar, resumoDaConferenciaPorCnpj, resumoDoEnvio, textoCadastroPorCnpj, textoCnpjsSemLoja, textoDoAviso, textoDoPeriodoPorCnpj, textoLojasNaoCadastradas } from "./base.js";

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

describe("base comercial por CNPJ (totais de um período)", () => {
  const rev = { formato: "por_cnpj", lojas: 1791, substitui: 1787, mantidas: 23, precisaPeriodo: false, periodo: { inicio: "2026-07-01", fim: "2026-10-31", diasDaSemana: [17, 17, 18, 18, 18, 18, 17] }, totalCnpjsSemLoja: 43, cnpjsSemLoja: ["1", "2", "3", "4"], preencheCadastro: { faturamento: 1500, cmvPct: 1791, jaTinhamValor: 12 } };

  it("só envia com o período informado", () => {
    expect(ehPorCnpj(rev)).toBe(true);
    expect(podeEnviar(rev)).toBe(true);
    expect(podeEnviar({ ...rev, precisaPeriodo: true, periodo: null })).toBe(false);
    expect(podeEnviar({ ...rev, lojas: 0 })).toBe(false);
    expect(podeEnviar({ lojas: 5 })).toBe(true); // formato atual não pede período
  });
  it("o período só vale com as duas datas", () => {
    expect(periodoPreenchido("2026-07-01", "2026-10-31")).toBe(true);
    expect(periodoPreenchido("2026-07-01", "")).toBe(false);
    expect(periodoPreenchido("", "")).toBe(false);
  });
  it("explica a conta dos totais ou pede o período", () => {
    expect(textoDoPeriodoPorCnpj(rev)).toContain("segunda 17, terça 17, quarta 18");
    expect(textoDoPeriodoPorCnpj({ ...rev, periodo: null })).toContain("Informe o período");
  });
  it("resume as lojas trocadas e mantidas", () => {
    expect(resumoDaConferenciaPorCnpj(rev)).toEqual({ titulo: "1791 lojas terão a base trocada.", apoio: "1787 já tinham base: a anterior fica guardada. 23 lojas cadastradas não vêm no arquivo e ficam como estão." });
    expect(resumoDaConferenciaPorCnpj({ ...rev, lojas: 1, substitui: 0, mantidas: 1 })).toEqual({ titulo: "1 loja terá a base trocada.", apoio: "Nenhuma tinha base antes. 1 loja cadastrada não vem no arquivo e fica como está." });
  });
  it("lista os CNPJs sem loja e diz que nenhuma loja é criada", () => {
    expect(textoCnpjsSemLoja({ totalCnpjsSemLoja: 0 })).toBeNull();
    expect(textoCnpjsSemLoja(rev)).toBe("43 CNPJs do arquivo não têm loja cadastrada e ficam de fora: 1, 2, 3 e mais 40. Nenhuma loja é criada.");
  });
  it("diz o que o Cadastro recebe e o que não muda", () => {
    expect(textoCadastroPorCnpj(rev)).toBe("O Cadastro recebe o faturamento por dia da semana de 1500 lojas e o CMV médio de 1791 lojas, só onde estava vazio. 12 lojas já tinham valor digitado e ele não muda.");
    expect(textoCadastroPorCnpj({ preencheCadastro: { faturamento: 0, cmvPct: 0, jaTinhamValor: 0 } })).toBeNull();
  });
  it("avisos de qualidade", () => {
    expect(textoDoAviso({ tipo: "linha_zerada", quantidade: 62 })).toBe("62 linhas com faturamento zerado. Entram como estão.");
    expect(textoDoAviso({ tipo: "unidades_menores_que_clientes", quantidade: 1 })).toContain("1 linha tem menos unidades que clientes");
    expect(textoDoAviso({ tipo: "cmv_maior_que_venda", quantidade: 585 })).toContain("585 linhas têm CMV maior que a venda");
    expect(textoDoAviso({ tipo: "loja_com_poucos_dias", quantidade: 13 })).toContain("13 lojas têm menos de 6 dias");
  });
});
