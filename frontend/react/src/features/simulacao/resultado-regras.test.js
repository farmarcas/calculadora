import { describe, expect, it } from "vitest";
import { apoioDaVenda, blocoDoHorarioEstendido, diasDaSimulacao, listaOQueMuda, pesoDaSimulacao, quandoAbreMais, textoContratarSimulacao, totalDeContratacoes } from "./resultado-regras.js";
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

// Resultados do card, no formato que o servidor manda (spec 052). Cosmópolis, Manter horários: folha R$ 36.020 → R$ 43.679.
const resultado = (over = {}, emHoras = {}) => ({
  emHoras: { custoSentido: "aumenta", custoEstado: "ok", pessoas: { hoje: 8, simulacao: 9 }, horasContratadas: { hoje: 352, simulacao: 394 }, horaExtraH: 0, ...emHoras },
  custoDoDono: { estado: "ok", peso: { hoje: 8, depois: 9.7, aumentoPp: 1.7, aumentoMensal: 7659 }, folhaHoje: 36020, folhaDepois: 43679 },
  ...over,
});

describe("pesoDaSimulacao (spec 052)", () => {
  it("Cosmópolis, dono: 9,7%, chip +1,7%, hoje 8,0% e os reais", () => {
    const t = pesoDaSimulacao(resultado(), true);
    expect(t).toMatchObject({ tipo: "dono", peso: "9,7%", hoje: "hoje 8,0%", reais: "R$ 7.659 a mais por mês", chip: { texto: "+1,7%", tom: "aumenta" } });
    expect(t.ariaLabel).toBe("Folha sobe 1,7 ponto percentual, de 8,0% para 9,7% do faturamento");
  });
  it("sem contratação: chip folha igual e a frase da venda", () => {
    const r = resultado({ custoDoDono: { estado: "ok", peso: { hoje: 8, depois: 8.2, aumentoPp: 0.2, aumentoMensal: 0 }, folhaHoje: 36020, folhaDepois: 36020 } }, { custoSentido: "igual" });
    expect(pesoDaSimulacao(r, true)).toMatchObject({ chip: { texto: "folha igual", tom: "igual" }, reais: "Sobe só porque a venda cai." });
  });
  it("reduz equipe: chip verde com o sinal de menos", () => {
    const r = resultado({ custoDoDono: { estado: "ok", peso: { hoje: 8, depois: 7.4, aumentoPp: -0.6, aumentoMensal: -2340 }, folhaHoje: 36020, folhaDepois: 33680 } }, { custoSentido: "diminui" });
    expect(pesoDaSimulacao(r, true)).toMatchObject({ chip: { texto: "−0,6%", tom: "diminui" }, reais: "R$ 2.340 a menos por mês" });
  });
  it("gestor e consulta: só o chip, sem números", () => {
    const t = pesoDaSimulacao({ emHoras: { custoSentido: "aumenta", custoEstado: "ok" } }, false);
    expect(t).toMatchObject({ tipo: "chip", chip: { texto: "Aumenta", tom: "aumenta" } });
    expect(JSON.stringify(t)).not.toMatch(/R\$|%/);
  });
  it("dados que faltam: a frase certa, sem número", () => {
    expect(pesoDaSimulacao(resultado({ custoDoDono: { estado: "sem_salarios", peso: null, folhaHoje: null, folhaDepois: null } }), true)).toEqual({ tipo: "falta", frase: "Informe os salários para ver o custo de pessoal." });
    expect(pesoDaSimulacao(resultado({ custoDoDono: { estado: "sem_faturamento", peso: null, folhaHoje: 1, folhaDepois: 1 } }), true)).toEqual({ tipo: "falta", frase: "Informe o faturamento para ver o peso da folha." });
    expect(pesoDaSimulacao({ emHoras: { custoSentido: null, custoEstado: "sem_salarios" } }, false)).toEqual({ tipo: "falta", frase: "Dados do custo ainda não informados." });
  });
  it("nenhum texto usa p.p. nem pontos como unidade da variação", () => {
    const t = pesoDaSimulacao(resultado(), true);
    expect([t.peso, t.hoje, t.reais, t.chip.texto].join(" ")).not.toMatch(/p\.p\.|pontos/);
  });
});

describe("listaOQueMuda (spec 052)", () => {
  it("Cosmópolis, dono: folha, pessoas, horas e Sem hora extra", () => {
    const l = listaOQueMuda(resultado(), true);
    expect(l.itens.map((i) => i.chave)).toEqual(["folha", "pessoas", "horas"]);
    expect(l.itens[0]).toEqual({ chave: "folha", rotulo: "Folha por mês", variacao: "+R$ 7.659", tom: "ambar", antesDepois: "R$ 36.020 → R$ 43.679" });
    expect(l.itens[1]).toEqual({ chave: "pessoas", rotulo: "Pessoas", variacao: "+1", tom: "verde", antesDepois: "8 → 9" });
    expect(l.itens[2]).toEqual({ chave: "horas", rotulo: "Horas contratadas", variacao: "+42h", tom: "verde", antesDepois: "352h → 394h" });
    expect(l.semHoraExtra).toBe(true);
  });
  it("sem contratação: tudo igual, em cinza", () => {
    const l = listaOQueMuda(resultado({ custoDoDono: { estado: "ok", peso: { hoje: 8, depois: 8.2, aumentoPp: 0.2, aumentoMensal: 0 }, folhaHoje: 36020, folhaDepois: 36020 } }, { custoSentido: "igual", pessoas: { hoje: 8, simulacao: 8 }, horasContratadas: { hoje: 352, simulacao: 352 } }), true);
    expect(l.itens.map((i) => [i.variacao, i.tom])).toEqual([["igual", "mudo"], ["igual", "mudo"], ["igual", "mudo"]]);
  });
  it("reduz equipe: −R$ 2.340 em verde; pessoas −1 e horas em cor neutra", () => {
    const l = listaOQueMuda(resultado({ custoDoDono: { estado: "ok", peso: { hoje: 8, depois: 7.4, aumentoPp: -0.6, aumentoMensal: -2340 }, folhaHoje: 36020, folhaDepois: 33680 } }, { custoSentido: "diminui", pessoas: { hoje: 8, simulacao: 7 }, horasContratadas: { hoje: 352, simulacao: 310 } }), true);
    expect(l.itens[0]).toMatchObject({ variacao: "−R$ 2.340", tom: "verde" });
    expect(l.itens[1]).toMatchObject({ variacao: "−1", tom: "neutro", antesDepois: "8 → 7" });
    expect(l.itens[2]).toMatchObject({ variacao: "−42h", tom: "neutro" });
  });
  it("hora extra maior que zero vira item e some a linha Sem hora extra", () => {
    const l = listaOQueMuda(resultado({}, { horaExtraH: 6 }), true);
    expect(l.itens.at(-1)).toMatchObject({ chave: "hora-extra", variacao: "+6h", antesDepois: "0h → 6h" });
    expect(l.semHoraExtra).toBe(false);
  });
  it("gestor e consulta: sem a linha de reais; sem salários o dono também fica sem ela", () => {
    expect(listaOQueMuda({ emHoras: resultado().emHoras }, false).itens.map((i) => i.chave)).toEqual(["pessoas", "horas"]);
    expect(listaOQueMuda(resultado({ custoDoDono: { estado: "sem_salarios", peso: null, folhaHoje: null, folhaDepois: null } }), true).itens.map((i) => i.chave)).toEqual(["pessoas", "horas"]);
  });
});

describe("contratar com as horas do parcial", () => {
  it("inteiras, parcial com horas e nenhuma", () => {
    expect(textoContratarSimulacao([{ funcao: "Farmacêutico", inteiras: 0, parciaisHoras: [20] }])).toEqual(["1 farmacêutico · parcial de 20h"]);
    expect(textoContratarSimulacao([{ funcao: "Atendimento", inteiras: 1, parciaisHoras: [18.5] }, { funcao: "Caixa", inteiras: 2, parciaisHoras: [] }])).toEqual(["1 atendente · desejável", "1 atendente · parcial de 18,5h · desejável", "2 caixas · desejável"]);
    // só o farmacêutico é obrigatório: ele não leva a marca
    expect(textoContratarSimulacao([{ funcao: "Farmacêutico", inteiras: 1, parciaisHoras: [] }, { funcao: "Atendimento", inteiras: 1, parciaisHoras: [] }])).toEqual(["1 farmacêutico", "1 atendente · desejável"]);
    expect(textoContratarSimulacao([])).toEqual(["Nenhuma contratação"]);
  });
  it("conta as vagas", () => {
    const c = [{ funcao: "Atendimento", inteiras: 1, parciaisHoras: [18] }, { funcao: "Caixa", inteiras: 0, parciaisHoras: [10] }];
    expect(totalDeContratacoes(c)).toBe(3);
  });
  it("apoio da venda", () => {
    expect(apoioDaVenda(0, "ok")).toBe("sem mudança");
    expect(apoioDaVenda(-2.9, "ok")).toBe("em relação a hoje");
    expect(apoioDaVenda(null, "nao_estimada")).toBe("sem venda hora a hora");
  });
});

describe("blocoDoHorarioEstendido (specs 049 e 052)", () => {
  // Sábado até 23h: venda R$ 2.214, custo da mercadoria 56,4% = R$ 1.249, lucro bruto R$ 965, folha R$ 4.924, resultado −R$ 3.958.
  const sabado = { estado: "ok", horasNovasSemana: 2, origemCmv: "media", vendaAdicionalMensal: 2214, cmvPct: 56.4, cmvMensal: 1249, lucroBrutoMensal: 965, aumentoFolhaMensal: 4924, resultadoMensal: -3958, recomendado: false };
  const horario = {
    dias: [0, 1, 2, 3, 4, 5, 6].map((dia) => ({ dia, aberta: dia < 6, abre: "08:00", fecha: dia === 5 ? "23:00" : "21:00" })),
    cadastro: [0, 1, 2, 3, 4, 5, 6].map((dia) => ({ aberta: dia < 6, abre: "08:00", fecha: "21:00" })),
  };
  it("sábado até 23h: título, linhas na ordem do board, resultado vermelho e Não recomendado", () => {
    const b = blocoDoHorarioEstendido(sabado, horario);
    expect(b.titulo).toBe("Horário a mais: sábado até 23h");
    expect(b.selo).toEqual({ texto: "Não recomendado", tom: "vermelho" });
    expect(b.tom).toBe("vermelho");
    expect(b.linhas.map((l) => [l.rotulo, l.valor])).toEqual([
      ["Venda adicional", "R$ 2.214"],
      ["Custo da mercadoria (56,4%)", "−R$ 1.249"],
      ["Lucro bruto", "R$ 965"],
      ["Aumento de folha", "−R$ 4.924"],
      ["Resultado", "−R$ 3.958"],
    ]);
    expect(b.passos.join(" ")).toContain("R$ 965 − R$ 4.924 = −R$ 3.958");
  });
  it("resultado maior ou igual a zero é verde e Recomendado", () => {
    const b = blocoDoHorarioEstendido({ ...sabado, aumentoFolhaMensal: 600, resultadoMensal: 365, recomendado: true }, horario);
    expect(b.selo).toEqual({ texto: "Recomendado", tom: "verde" });
    expect(b.tom).toBe("verde");
  });
  it("nunca usa a sigla CMV na tela", () => {
    const b = blocoDoHorarioEstendido(sabado, horario);
    expect(JSON.stringify(b)).not.toMatch(/CMV/);
    const sem = blocoDoHorarioEstendido({ estado: "sem_cmv", horasNovasSemana: 2, vendaAdicionalMensal: 1000, cmvPct: null, cmvMensal: null, lucroBrutoMensal: null, aumentoFolhaMensal: 100, resultadoMensal: null, recomendado: null, origemCmv: null }, horario);
    expect(JSON.stringify(sem)).not.toMatch(/CMV/);
  });
  it("estados sem dado: aviso, sem selo e sem passos", () => {
    const b = blocoDoHorarioEstendido({ estado: "sem_cmv", horasNovasSemana: 2, vendaAdicionalMensal: 1000, cmvPct: null, cmvMensal: null, lucroBrutoMensal: null, aumentoFolhaMensal: 100, resultadoMensal: null, recomendado: null, origemCmv: null }, horario);
    expect(b.aviso).toBe("Informe o custo da mercadoria da loja para calcular o lucro bruto.");
    expect(b.selo).toBeNull();
    expect(b.passos).toEqual([]);
    expect(blocoDoHorarioEstendido(undefined)).toBeNull();
  });
});

describe("quandoAbreMais", () => {
  const cad = (fecha = "21:00") => ({ aberta: true, abre: "08:00", fecha });
  it("vários dias com o mesmo horário se juntam; horários diferentes ficam separados; sem mudança é nulo", () => {
    const dias = (f) => [0, 1, 2, 3, 4, 5, 6].map((dia) => ({ dia, aberta: true, abre: "08:00", fecha: f(dia) }));
    const cadastro = [0, 1, 2, 3, 4, 5, 6].map(() => cad());
    expect(quandoAbreMais({ dias: dias((d) => (d >= 5 ? "23:00" : "21:00")), cadastro })).toBe("sábado e domingo até 23h");
    expect(quandoAbreMais({ dias: dias((d) => (d === 5 ? "23:00" : d === 6 ? "22:30" : "21:00")), cadastro })).toBe("sábado até 23h · domingo até 22h30");
    expect(quandoAbreMais({ dias: dias(() => "21:00"), cadastro })).toBeNull();
  });
});
