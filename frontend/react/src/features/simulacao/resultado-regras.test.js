import { describe, expect, it } from "vitest";
import { apoioDaVenda, blocoDoHorarioEstendido, apoioDoCusto, diasDaSimulacao, linhaDaTabela, tabelaDoResultado, textoContratarSimulacao, totalDeContratacoes } from "./resultado-regras.js";
import { faixaDosDias } from "../diagnostico/cartao/linha-regras.js";

describe("horário da simulação para a faixa dos 7 dias", () => {
  const horario = {
    dias: [0, 1, 2, 3, 4, 5, 6].map((dia) => ({ dia, aberta: dia !== 6, abre: dia !== 6 ? "08:00" : null, fecha: dia === 5 ? "18:00" : dia !== 6 ? "22:00" : null, horas: 0, alterado: false })),
    cadastro: [0, 1, 2, 3, 4, 5, 6].map((dia) => ({ aberta: true, abre: "08:00", fecha: "22:00" })),
  };
  it("troca aberta por aberto e mantém o horário", () => {
    const { novos, antes } = diasDaSimulacao(horario);
    expect(novos[0]).toEqual({ dia: 0, aberto: true, abre: "08:00", fecha: "22:00" });
    expect(novos[6]).toEqual({ dia: 6, aberto: false, abre: null, fecha: null });
    expect(antes).toHaveLength(7);
    expect(antes[3]).toEqual({ dia: 3, aberto: true, abre: "08:00", fecha: "22:00" });
  });
  it("alimenta a faixa: sábado reduz e domingo fecha, com as horas de cada dia", () => {
    const { novos, antes } = diasDaSimulacao(horario);
    const f = faixaDosDias(novos, antes);
    expect(f[0]).toMatchObject({ tipo: "igual", principal: "14h" });
    expect(f[5]).toMatchObject({ tipo: "reducao", principal: "10h", diferenca: "−4h" });
    expect(f[6]).toMatchObject({ tipo: "fechado", principal: "Fechado", diferenca: "−14h" });
  });
  it("sem horário devolve listas vazias", () => {
    expect(diasDaSimulacao(undefined)).toEqual({ novos: [], antes: [] });
  });
});

describe("tabela Hoje × Simulação × Mudança", () => {
  it("mais é verde, menos é vermelho e igual diz sem mudança", () => {
    expect(linhaDaTabela("Pessoas", 12, 14, "")).toEqual({ rotulo: "Pessoas", hoje: "12", simulacao: "14", mudanca: "+2", tom: "sucesso" });
    expect(linhaDaTabela("Horas abertas", 99, 90, "h")).toEqual({ rotulo: "Horas abertas", hoje: "99h", simulacao: "90h", mudanca: "−9h", tom: "perigo" });
    expect(linhaDaTabela("Horas abertas", 99, 99, "h").mudanca).toBe("sem mudança");
    expect(linhaDaTabela("Horas contratadas", 480, 480.5, "h")).toMatchObject({ simulacao: "480,5h", mudanca: "+0,5h" });
  });
  const e = (p = {}) => ({ horasAbertas: { hoje: 99, simulacao: 99 }, pessoas: { hoje: 12, simulacao: 14 }, horasContratadas: { hoje: 480, simulacao: 534 }, horaExtraH: 0, ...p });
  it("as quatro linhas, na ordem", () => {
    const t = tabelaDoResultado(e());
    expect(t.map((l) => l.rotulo)).toEqual(["Horas abertas", "Pessoas", "Horas contratadas", "Hora extra"]);
    expect(t[3]).toMatchObject({ simulacao: "0h", mudanca: "não precisa", tom: "mudo" });
  });
  it("hora extra com falta aparece em horas", () => {
    expect(tabelaDoResultado(e({ horaExtraH: 6 }))[3]).toEqual({ rotulo: "Hora extra", hoje: "0h", simulacao: "6h", mudanca: "+6h", tom: "perigo" });
  });
});

describe("contratar com as horas do parcial", () => {
  it("inteiras, parcial com horas e nenhuma", () => {
    expect(textoContratarSimulacao([{ funcao: "Farmacêutico", inteiras: 0, parciaisHoras: [20] }])).toEqual(["1 farmacêutico · parcial de 20h"]);
    expect(textoContratarSimulacao([{ funcao: "Atendimento", inteiras: 1, parciaisHoras: [18.5] }, { funcao: "Caixa", inteiras: 2, parciaisHoras: [] }])).toEqual(["1 atendente", "1 atendente · parcial de 18,5h", "2 caixas"]);
    expect(textoContratarSimulacao([])).toEqual(["Nenhuma contratação"]);
  });
  it("conta as vagas para o apoio do custo", () => {
    const c = [{ funcao: "Atendimento", inteiras: 1, parciaisHoras: [18] }, { funcao: "Caixa", inteiras: 0, parciaisHoras: [10] }];
    expect(totalDeContratacoes(c)).toBe(3);
    expect(apoioDoCusto(c)).toBe("3 contratações");
    expect(apoioDoCusto([{ funcao: "Caixa", inteiras: 1, parciaisHoras: [] }])).toBe("1 contratação");
    expect(apoioDoCusto([])).toBe("sem contratação");
  });
  it("apoio da venda", () => {
    expect(apoioDaVenda(0, "ok")).toBe("sem mudança");
    expect(apoioDaVenda(-2.9, "ok")).toBe("em relação a hoje");
    expect(apoioDaVenda(null, "nao_estimada")).toBe("sem venda hora a hora");
  });
});

describe("blocoDoHorarioEstendido (spec 049)", () => {
  const obrigatorio = { estado: "ok", horasNovasSemana: 3, origemCmv: "media", vendaAdicionalMensal: 9000, cmvPct: 57.8, cmvMensal: 5202, lucroBrutoMensal: 3798, aumentoFolhaMensal: 4680, resultadoMensal: -882, recomendado: false };
  it("caso obrigatório: CMV R$ 5.202, lucro bruto R$ 3.798, resultado −R$ 882, vermelho e Não recomendado", () => {
    const b = blocoDoHorarioEstendido(obrigatorio);
    expect(b.selo).toEqual({ texto: "Não recomendado", tom: "vermelho" });
    expect(b.tom).toBe("vermelho");
    const v = Object.fromEntries(b.linhas.map((l) => [l.rotulo, l.valor]));
    expect(v["Venda adicional estimada"]).toBe("R$ 9.000/mês");
    expect(v["CMV da venda adicional (57,8%)"]).toBe("−R$ 5.202/mês");
    expect(v["Lucro bruto"]).toBe("R$ 3.798/mês");
    expect(v["Aumento de folha"]).toBe("−R$ 4.680/mês");
    expect(v["Resultado"]).toBe("−R$ 882/mês");
    expect(b.passos.join(" ")).toContain("R$ 3.798 − R$ 4.680 = −R$ 882");
  });
  it("resultado maior ou igual a zero é azul e Recomendado", () => {
    const b = blocoDoHorarioEstendido({ ...obrigatorio, aumentoFolhaMensal: 3000, resultadoMensal: 798, recomendado: true });
    expect(b.selo).toEqual({ texto: "Recomendado", tom: "azul" });
    expect(b.tom).toBe("azul");
  });
  it("estados sem dado: aviso, sem selo e sem passos", () => {
    const b = blocoDoHorarioEstendido({ estado: "sem_cmv", horasNovasSemana: 2, vendaAdicionalMensal: 1000, cmvPct: null, cmvMensal: null, lucroBrutoMensal: null, aumentoFolhaMensal: 100, resultadoMensal: null, recomendado: null, origemCmv: null });
    expect(b.aviso).toBe("Informe o CMV da loja para calcular o lucro bruto.");
    expect(b.selo).toBeNull();
    expect(b.passos).toEqual([]);
    expect(blocoDoHorarioEstendido(undefined)).toBeNull();
  });
});
