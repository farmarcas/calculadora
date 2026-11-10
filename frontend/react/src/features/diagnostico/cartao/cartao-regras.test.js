import { describe, expect, it } from "vitest";
import {
  NOTA_VENDA_ESTIMADA, alertasParaExibir, brl, comparacaoComCenario1, linhaDeResultado, diasAlterados, diferencaPorDia, estadoDaFolha, estadoDaVenda, estadoDoSaldo,
  faixaTxt, horasOciosasDe, linhasDeContratacao, linhasDoHorario, sentidoDoHorario, statusDoCartao, textoDaDiferenca,
  tomDaDiferenca, totaisDaSemana, totalContratado,
} from "./cartao-regras.js";

const n = (t) => t.replace(/ /g, " "); // espaço sem quebra do formato de moeda
const dia = (d, abre, fecha) => ({ dia: d, aberto: !!abre, abre: abre ?? null, fecha: fecha ?? null });
// Antes: seg a sáb 07h–22h, domingo fechado = 90h (o exemplo do desenho).
const ANTES = [0, 1, 2, 3, 4, 5].map((d) => dia(d, "07:00", "22:00")).concat([dia(6)]);
const C2 = [dia(0, "08:00", "18:00"), dia(1, "08:00", "18:00"), dia(2, "08:00", "18:00"), dia(3, "07:00", "22:00"), dia(4, "07:00", "22:00"), dia(5, "07:00", "22:00"), dia(6)];
const C3_REDUZ = [dia(0, "08:00", "20:00"), dia(1, "08:00", "20:00"), dia(2, "08:00", "20:00"), dia(3, "08:00", "20:00"), dia(4, "08:00", "21:00"), dia(5, "07:00", "21:00"), dia(6)];
const C3_AMPLIA = [dia(0, "07:00", "22:00"), dia(1, "07:00", "22:00"), dia(2, "07:00", "22:00"), dia(3, "07:00", "22:00"), dia(4, "07:00", "23:00"), dia(5, "07:00", "23:00"), dia(6, "08:00", "14:00")];

describe("saldo e colunas dos quatro exemplos do desenho", () => {
  const c1 = { saldoOperacaoMensal: -6480, folhaAdicionalMensal: 6480, faturamentoPerdidoMensal: 0, vendaAdicionalMensal: 0 };
  const c2 = { saldoOperacaoMensal: -64968, folhaAdicionalMensal: 0, faturamentoPerdidoMensal: 64968, faturamentoPerdidoPct: 16.5, vendaAdicionalMensal: 0 };
  const c3r = { saldoOperacaoMensal: -32213, folhaAdicionalMensal: 1013, faturamentoPerdidoMensal: 31200, faturamentoPerdidoPct: 7.9, vendaAdicionalMensal: 0 };
  const c3a = { saldoOperacaoMensal: 29280, folhaAdicionalMensal: 8920, faturamentoPerdidoMensal: 0, vendaAdicionalMensal: 38200, vendaAdicionalPct: 9.7 };

  it("saldo com sinal tipográfico, cor e R$ 0 neutro", () => {
    expect(n(estadoDoSaldo(c1).texto)).toBe("− R$ 6.480");
    expect(estadoDoSaldo(c1).tom).toBe("perigo");
    expect(n(estadoDoSaldo(c3a).texto)).toBe("+ R$ 29.280");
    expect(estadoDoSaldo(c3a).tom).toBe("sucesso");
    expect(n(estadoDoSaldo({ saldoOperacaoMensal: 0 }).texto)).toBe("R$ 0");
    expect(estadoDoSaldo({ saldoOperacaoMensal: 0 }).tom).toBe("neutro");
    expect(estadoDoSaldo({ saldoOperacaoMensal: null })).toBeNull();
    expect(estadoDoSaldo({})).toBeNull();
  });
  it("coluna da folha: custo, zero e economia", () => {
    expect(estadoDaFolha(c1)).toMatchObject({ rotulo: "CUSTO DE FOLHA", apoio: "a mais por mês", tom: "perigo" });
    expect(n(estadoDaFolha(c1).valor)).toBe("R$ 6.480");
    expect(estadoDaFolha(c2)).toMatchObject({ rotulo: "CUSTO DE FOLHA", apoio: "sem custo extra", tom: "neutro" });
    expect(n(estadoDaFolha(c2).valor)).toBe("R$ 0");
    expect(estadoDaFolha({ folhaAdicionalMensal: -2140 })).toMatchObject({ rotulo: "ECONOMIA DE FOLHA", apoio: "a menos por mês", tom: "sucesso" });
    expect(estadoDaFolha({})).toMatchObject({ valor: "—", tom: "neutro" });
  });
  it("coluna da venda: perde, estimada e nenhuma", () => {
    expect(estadoDaVenda(c2)).toMatchObject({ rotulo: "VENDA QUE DEIXA DE ENTRAR", apoio: "16,5% por mês", tom: "perigo" });
    expect(n(estadoDaVenda(c3r).valor)).toBe("R$ 31.200");
    expect(estadoDaVenda(c3r).apoio).toBe("7,9% por mês");
    expect(estadoDaVenda(c3a)).toMatchObject({ rotulo: "VENDA ESTIMADA", apoio: "+9,7% por mês", tom: "sucesso" });
    expect(n(estadoDaVenda(c3a).valor)).toBe("R$ 38.200");
    expect(estadoDaVenda(c1)).toMatchObject({ valor: "Nenhuma", apoio: "sem perda de venda", tom: "neutro" });
    expect(estadoDaVenda({ semVendaHoraria: true })).toMatchObject({ valor: "Não estimada", tom: "neutro" });
  });
  it("perda e venda estimada juntas viram o líquido, com cor e palavra", () => {
    expect(estadoDaVenda({ vendaAdicionalMensal: 5000, faturamentoPerdidoMensal: 2000 })).toMatchObject({ rotulo: "VENDA ESTIMADA", tom: "sucesso" });
    expect(estadoDaVenda({ vendaAdicionalMensal: 1000, faturamentoPerdidoMensal: 3000 })).toMatchObject({ rotulo: "VENDA QUE DEIXA DE ENTRAR", tom: "perigo" });
  });
});

describe("status e comparação", () => {
  it("textos do status por situação", () => {
    expect(statusDoCartao({ status: "viavel", faturamentoPerdidoMensal: 0, vendaAdicionalMensal: 0 })).toEqual({ tom: "ok", texto: "Cobre o horário sem perder venda" });
    expect(statusDoCartao({ status: "viavel", faturamentoPerdidoMensal: 100 })).toEqual({ tom: "atencao", texto: "Deixa de vender" });
    expect(statusDoCartao({ status: "viavel", vendaAdicionalMensal: 100, faturamentoPerdidoMensal: 0 })).toEqual({ tom: "ok", texto: "Vende mais" });
    expect(statusDoCartao({ status: "nao_resolve" }).texto).toBe("Não resolve sozinho");
    expect(statusDoCartao({ status: "viavel", faltaPorFuncao: [{ funcao: "Atendimento", horasSemana: 8 }] }).tom).toBe("atencao");
  });
  it("comparação com o Cenário 1", () => {
    expect(comparacaoComCenario1({}, { ehReferencia: true, dono: true })).toBe("Referência para comparar os outros");
    expect(n(comparacaoComCenario1({ economiaFolhaMensal: 5467 }, { ehReferencia: false, dono: true }))).toBe("R$ 5.467 a menos de folha que Manter horários");
    expect(n(comparacaoComCenario1({ economiaFolhaMensal: -2440 }, { ehReferencia: false, dono: true }))).toBe("R$ 2.440 a mais de folha que Manter horários");
    expect(comparacaoComCenario1({ economiaFolhaMensal: 0 }, { ehReferencia: false, dono: true })).toBe("Mesma folha de Manter horários");
    expect(comparacaoComCenario1({ economiaFolhaMensal: 5467 }, { ehReferencia: false, dono: false })).toBe("");
  });
  it("moeda em reais sem centavos", () => {
    expect(n(brl(6480))).toBe("R$ 6.480");
  });
});

describe("contratações", () => {
  const cs = [
    { funcao: "Farmacêutico", inteiras: 0, parcial: { turnos: 1, horas: 16 }, horasContratadas: 16, horasOciosas: 4 },
    { funcao: "Atendimento", inteiras: 1, parcial: null, horasContratadas: 42, horasOciosas: 0 },
    { funcao: "Caixa", inteiras: 0, parcial: { turnos: 1, horas: 16 }, horasContratadas: 16, horasOciosas: 2 },
  ];
  it("uma linha por contratação, com letra, nome, tipo e barra", () => {
    const l = linhasDeContratacao(cs);
    expect(l.map((x) => [x.letra, x.nome, x.horas, x.tipo, x.largura])).toEqual([["F", "Farmacêutico", 16, "parcial", 38], ["A", "Atendente", 42, "integral", 100], ["C", "Caixa", 16, "parcial", 38]]);
    expect(totalContratado(l)).toBe(74);
    expect(horasOciosasDe(cs)).toBe(6);
  });
  it("duas integrais da mesma função viram duas linhas; a barra nunca passa de 100%", () => {
    const l = linhasDeContratacao([{ funcao: "Atendimento", inteiras: 2, parcial: { turnos: 1, horas: 20 }, horasContratadas: 104, horasOciosas: 0 }]);
    expect(l.map((x) => [x.horas, x.tipo, x.largura])).toEqual([[42, "integral", 100], [42, "integral", 100], [20, "parcial", 48]]);
    expect(linhasDeContratacao([{ funcao: "Caixa", inteiras: 1, parcial: null, horasContratadas: 44, horasOciosas: 0 }])[0].largura).toBe(100);
  });
  it("sem contratação, nada", () => {
    expect(linhasDeContratacao([])).toEqual([]);
    expect(linhasDeContratacao(undefined)).toEqual([]);
  });
});

describe("horário por dia e totais", () => {
  it("diferença por dia: −5h, −3h, +1h, +6h (domingo fechado → aberto), meia hora e dia igual", () => {
    expect(diferencaPorDia(dia(0, "08:00", "18:00"), dia(0, "07:00", "22:00"))).toBe(-5);
    expect(diferencaPorDia(dia(0, "08:00", "20:00"), dia(0, "07:00", "22:00"))).toBe(-3);
    expect(diferencaPorDia(dia(4, "07:00", "23:00"), dia(4, "07:00", "22:00"))).toBe(1);
    expect(diferencaPorDia(dia(6, "08:00", "14:00"), dia(6))).toBe(6);
    expect(diferencaPorDia(dia(0, "08:00", "12:30"), dia(0, "08:00", "14:00"))).toBe(-1.5);
    expect(diferencaPorDia(dia(1, "07:00", "22:00"), dia(1, "07:00", "22:00"))).toBe(0);
    expect(diferencaPorDia(dia(6), dia(6))).toBe(0);
  });
  it("Cenário 2: 3 dias alterados, 75h contra 90h (−15h)", () => {
    const l = linhasDoHorario(C2, ANTES);
    expect(diasAlterados(l)).toBe(3);
    expect(l.map((x) => x.diferenca)).toEqual([-5, -5, -5, 0, 0, 0, 0]);
    expect(totaisDaSemana(C2, ANTES)).toEqual({ novo: 75, antes: 90, diferenca: -15 });
    expect(sentidoDoHorario(totaisDaSemana(C2, ANTES))).toBe("reduzindo");
    expect(l[0]).toMatchObject({ nome: "Seg", novo: "08h–18h", antes: "07h–22h", alterado: true });
    expect(l[6]).toMatchObject({ nome: "Dom", novo: "Fechado", antes: "Fechado", alterado: false });
  });
  it("Cenário 3 reduzindo: 6 dias alterados, 75h (−15h)", () => {
    const l = linhasDoHorario(C3_REDUZ, ANTES);
    expect(diasAlterados(l)).toBe(6);
    expect(l.map((x) => x.diferenca)).toEqual([-3, -3, -3, -3, -2, -1, 0]);
    expect(totaisDaSemana(C3_REDUZ, ANTES)).toEqual({ novo: 75, antes: 90, diferenca: -15 });
  });
  it("Cenário 3 ampliando: 3 dias alterados, 98h (+8h)", () => {
    const l = linhasDoHorario(C3_AMPLIA, ANTES);
    expect(diasAlterados(l)).toBe(3);
    expect(l.map((x) => x.diferenca)).toEqual([0, 0, 0, 0, 1, 1, 6]);
    expect(l[6]).toMatchObject({ novo: "08h–14h", antes: "Fechado", alterado: true });
    expect(totaisDaSemana(C3_AMPLIA, ANTES)).toEqual({ novo: 98, antes: 90, diferenca: 8 });
    expect(sentidoDoHorario(totaisDaSemana(C3_AMPLIA, ANTES))).toBe("ampliando");
  });
  it("Cenário 1: nada muda", () => {
    const l = linhasDoHorario(ANTES, ANTES);
    expect(diasAlterados(l)).toBe(0);
    expect(totaisDaSemana(ANTES, ANTES).diferenca).toBe(0);
  });
  it("texto e cor da diferença, com sinal tipográfico", () => {
    expect(textoDaDiferenca(-5)).toBe("−5h");
    expect(textoDaDiferenca(1)).toBe("+1h");
    expect(textoDaDiferenca(-1.5)).toBe("−1,5h");
    expect(textoDaDiferenca(0)).toBe("–");
    expect(tomDaDiferenca(-1)).toBe("perigo");
    expect(tomDaDiferenca(2)).toBe("sucesso");
    expect(tomDaDiferenca(0)).toBe("neutro");
  });
  it("faixa com meia hora e dia fechado", () => {
    expect(faixaTxt(dia(0, "08:30", "20:00"))).toBe("08h30–20h");
    expect(faixaTxt(dia(6))).toBe("Fechado");
  });
});

describe("textos que não se repetem", () => {
  it("a linha de resultado some quando só repete os cortes de horário ou as contratações", () => {
    expect(linhaDeResultado({ resultado: "Contrata 2 pessoas: farmacêutico e atendimento", ajustes: [], diasFechar: [] })).toBe("");
    expect(linhaDeResultado({ resultado: "Domingo fecha 7 h mais cedo (de 08h–20h para 08h–13h)", ajustes: [{ dia: 6 }], diasFechar: [] })).toBe("");
    expect(linhaDeResultado({ resultado: "Sábado fecha", ajustes: [], diasFechar: [5] })).toBe("");
    expect(linhaDeResultado({ resultado: "Sábado fecha 3 h mais tarde; contrata 2 pessoas: farmacêutico", ajustes: [{ dia: 5 }], diasFechar: [] })).toBe("");
  });
  it("a linha de resultado fica quando explica algo que o cartão não mostra", () => {
    expect(linhaDeResultado({ resultado: "Nenhum horário pode mudar", ajustes: [], diasFechar: [] })).toBe("Nenhum horário pode mudar");
    expect(linhaDeResultado({ resultado: "Igual a Manter horários", ajustes: [] })).toBe("Igual a Manter horários");
    expect(linhaDeResultado({ resultado: "Faltam as vendas por dia da semana para calcular os cortes", ajustes: [] })).toBe("Faltam as vendas por dia da semana para calcular os cortes");
    expect(linhaDeResultado({ resultado: "Não é possível sem contratar", ajustes: [] })).toBe("Não é possível sem contratar");
  });
  it("sem resultado, nada", () => {
    expect(linhaDeResultado({})).toBe("");
    expect(linhaDeResultado({ resultado: "  " })).toBe("");
  });
  it("alertas: some o contrato parcial e a nota da venda estimada (ela vai no ⓘ)", () => {
    const r = alertasParaExibir([
      "Usa contrato parcial para cobrir o que sobra.",
      "Venda das horas novas é estimada: onde não há venda registrada nessa hora, vale metade da venda da hora vizinha.",
      "Só mexer no fim de semana não resolve: ainda faltam 3 h de cobertura. Veja o Equilíbrio.",
    ]);
    expect(r).toEqual(["Só mexer no fim de semana não resolve: ainda faltam 3 h de cobertura. Veja o Equilíbrio."]);
    expect(alertasParaExibir(undefined)).toEqual([]);
  });
  it("a coluna VENDA ESTIMADA traz a nota para o ⓘ; as outras não", () => {
    expect(estadoDaVenda({ vendaAdicionalMensal: 5378, vendaAdicionalPct: 1.9 }).dica).toBe(NOTA_VENDA_ESTIMADA);
    expect(NOTA_VENDA_ESTIMADA).toBe("Venda das horas novas estimada: onde não há venda registrada, vale metade da hora vizinha.");
    expect(estadoDaVenda({ faturamentoPerdidoMensal: 100 }).dica).toBeUndefined();
    expect(estadoDaVenda({}).dica).toBeUndefined();
  });
});
