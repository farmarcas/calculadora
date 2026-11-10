import { describe, expect, it } from "vitest";
import { apoioDaVenda, apoioDoCusto, diasDaSimulacao, linhaDaTabela, tabelaDoResultado, textoContratarSimulacao, totalDeContratacoes } from "./resultado-regras.js";
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
