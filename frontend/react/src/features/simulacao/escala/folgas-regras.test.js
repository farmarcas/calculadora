import { describe, expect, it } from "vitest";
import { textoDoEsticamento, turnoEsticado, turnosParaGravar } from "./escala-regras.js";
import { esticarTurnos, ajustarJornada, pessoasParaFolgar, sugerirFolgas, textoDoRodizio } from "./folgas-regras.js";

const horas = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
const abas = (n = 7) => Array.from({ length: n }, (_, dia) => ({ dia, abre: 8, fecha: 18 }));
const t = (matricula, dia, entrada = 8, saida = 18) => ({ matricula, dia, entrada, saida, iniIntervalo: null, fimIntervalo: null });
const semana = (m, n = 7) => Array.from({ length: n }, (_, d) => t(m, d));
const gente = (...ms) => ms.map((m) => ({ matricula: m, nome: m, funcao: "Caixa", cargaH: 44 }));
// Cobertura exigida por dia e função: `minimo` pessoas em todas as horas (a cobertura "de antes" tem pessoas já contadas).
const cob = (turnos, quadro, minimo, n = 7) =>
  Object.fromEntries(Array.from({ length: n }, (_, d) => [d, [{ funcao: "Caixa", porHora: horas.map((hora) => ({ hora, pessoas: turnos.filter((x) => x.dia === d && quadro.some((p) => p.matricula === x.matricula) && x.entrada <= hora && x.saida >= hora + 1).length, exigido: minimo, ok: true })) }]]));
const r44 = { dias: 6 };
const r42 = { dias: 5 };

describe("pessoasParaFolgar", () => {
  it("só entra quem passa do limite, sem vaga nem desligado", () => {
    const q = [...gente("A", "B"), { matricula: "V", nome: "V", funcao: "Caixa", cargaH: 16, vaga: true }, { matricula: "X", nome: "X", funcao: "Caixa", cargaH: 44, desligado: true }];
    const ts = [...semana("A"), ...semana("B", 6), ...semana("V"), ...semana("X")];
    expect(pessoasParaFolgar({ quadro: q, turnos: ts, limiteDias: 6 })).toEqual([{ matricula: "A", funcao: "Caixa", folgas: 1 }]);
  });
});

describe("sugerirFolgas", () => {
  it("regra de 44h tira 1 dia e a de 42h tira 2", () => {
    const q = gente("A", "B", "C");
    const ts = ["A", "B", "C"].flatMap((m) => semana(m));
    const c = cob(ts, q, 1);
    const a = sugerirFolgas({ quadro: q, turnos: ts, cobertura: c, abas: abas(), regra: r44 });
    expect(["A", "B", "C"].map((m) => a.turnos.filter((x) => x.matricula === m).length)).toEqual([6, 6, 6]);
    const b = sugerirFolgas({ quadro: q, turnos: ts, cobertura: c, abas: abas(), regra: r42 });
    expect(["A", "B", "C"].map((m) => b.turnos.filter((x) => x.matricula === m).length)).toEqual([5, 5, 5]);
  });

  it("quem já está no limite não muda e vaga não entra", () => {
    const q = [...gente("A"), { matricula: "V", nome: "V", funcao: "Caixa", cargaH: 16, vaga: true }];
    const ts = [...semana("A", 6), ...semana("V")];
    const r = sugerirFolgas({ quadro: q, turnos: ts, cobertura: cob(ts, q, 0), abas: abas(), regra: r44 });
    expect(r.turnos).toHaveLength(ts.length);
    expect(r.retirados).toEqual([]);
  });

  it("pessoas da mesma função folgam em dias diferentes quando dá", () => {
    const q = gente("A", "B");
    const ts = ["A", "B"].flatMap((m) => semana(m));
    const r = sugerirFolgas({ quadro: q, turnos: ts, cobertura: cob(ts, q, 1), abas: abas(), regra: r44 });
    const dias = r.retirados.map((x) => x.dia);
    expect(new Set(dias).size).toBe(dias.length);
  });

  it("mantém o horário e o intervalo dos turnos que sobram", () => {
    const q = gente("A");
    const ts = Array.from({ length: 7 }, (_, d) => ({ matricula: "A", dia: d, entrada: 8, saida: 17, iniIntervalo: 12, fimIntervalo: 13 }));
    const r = sugerirFolgas({ quadro: q, turnos: ts, cobertura: cob(ts, q, 0), abas: abas(), regra: r44 });
    expect(r.turnos.every((x) => x.entrada === 8 && x.iniIntervalo === 12)).toBe(true);
  });

  it("domingo: ceil(n/3) pessoas por função folgam", () => {
    const q = gente("A", "B", "C", "D", "E", "F");
    const ts = q.flatMap((p) => semana(p.matricula));
    const r = sugerirFolgas({ quadro: q, turnos: ts, cobertura: cob(ts, q, 1), abas: abas(), regra: r44 });
    const folgamDomingo = q.filter((p) => !r.turnos.some((x) => x.matricula === p.matricula && x.dia === 6));
    expect(folgamDomingo).toHaveLength(2);
    expect(r.domingoSugerido).toBe(true);
  });

  it("loja fechada no domingo: o domingo não entra na conta", () => {
    const q = gente("A", "B", "C");
    const ts = q.flatMap((p) => semana(p.matricula, 6));
    const r = sugerirFolgas({ quadro: q, turnos: ts, cobertura: cob(ts, q, 1, 6), abas: abas(6), regra: r42 });
    expect(r.domingoSugerido).toBe(false);
    expect(r.turnos.every((x) => x.dia < 6)).toBe(true);
  });

  it("função com 1 pessoa e mínimo 1: domingo não é forçado e o aviso aparece", () => {
    const q = gente("A");
    const ts = semana("A");
    const r = sugerirFolgas({ quadro: q, turnos: ts, cobertura: cob(ts, q, 1), abas: abas(), regra: r44 });
    expect(r.avisos.some((a) => a.startsWith("Domingo:"))).toBe(true);
    expect(r.turnos.some((x) => x.dia === 6)).toBe(true);
  });

  it("falta inevitável vira aviso por dia e função", () => {
    const q = gente("A");
    const ts = semana("A");
    const r = sugerirFolgas({ quadro: q, turnos: ts, cobertura: cob(ts, q, 1), abas: abas(), regra: r44 });
    expect(r.avisos.some((a) => /vai faltar caixa das 8h às 17h/.test(a))).toBe(true);
  });
});

describe("textoDoRodizio", () => {
  it("explica o rodízio e a pendência do jurídico", () => {
    expect(textoDoRodizio()).toMatch(/1 em cada 3/);
    expect(textoDoRodizio()).toMatch(/jurídico/);
  });
});

describe("ajustarJornada", () => {
  const regra = { dias: 5, maxDia: 8, teto: 42 };
  it("corta o fim do turno que passa do máximo do dia e do teto da semana", () => {
    const q = gente("A");
    const ts = semana("A", 5).map((x) => ({ ...x, entrada: 8, saida: 17 })); // 9 h por dia, 5 dias
    const r = ajustarJornada(ts, q, regra);
    expect(r.every((x) => x.entrada === 8 && x.saida - x.entrada <= 8)).toBe(true);
    expect(r.reduce((s, x) => s + (x.saida - x.entrada), 0)).toBeLessThanOrEqual(40);
  });
  it("não mexe em quem já cabe e em vagas simuladas", () => {
    const q = [...gente("A"), { matricula: "V", nome: "V", funcao: "Caixa", cargaH: 16, vaga: true }];
    const ts = [...semana("A", 5).map((x) => ({ ...x, saida: 16 })), ...semana("V", 2).map((x) => ({ ...x, matricula: "V", saida: 19 }))];
    expect(ajustarJornada(ts, q, regra)).toEqual(ts);
  });
});

describe("esticarTurnos (spec 046)", () => {
  const regra = { dias: 5, maxDia: 8.4, teto: 42 };
  const abas = [0, 1, 2, 3, 4].map((dia) => ({ dia, abre: 7, fecha: 22 }));
  const q = [{ matricula: "A", nome: "A", funcao: "Farmacêutico", cargaH: 44 }];
  const ts = [0, 1, 2, 3, 4].map((dia) => ({ matricula: "A", dia, entrada: 7, saida: 15, iniIntervalo: 11, fimIntervalo: 12 }));
  const horas = Array.from({ length: 15 }, (_, i) => 7 + i);
  const cobertura = Object.fromEntries(abas.map((a) => [a.dia, [{ funcao: "Farmacêutico", porHora: horas.map((hora) => ({ hora, pessoas: hora >= 7 && hora < 15 ? 1 : 0, ok: hora < 15, exigido: 1 })) }]]));
  const liquida = (t) => t.saida - t.entrada - (t.fimIntervalo - t.iniIntervalo);
  it("estica o fim onde falta cobertura, guarda o antes e não passa do máximo do dia nem do limite da semana", () => {
    const r = esticarTurnos({ turnos: ts, quadro: q, cobertura, abas, regra });
    for (const t of r) {
      expect(t.saida).toBeGreaterThan(15);
      expect(liquida(t)).toBeLessThanOrEqual(8.4 + 1e-9);
      expect(t.antes).toEqual({ entrada: 7, saida: 15 });
    }
    expect(r.reduce((s, t) => s + liquida(t), 0)).toBeLessThanOrEqual(42 + 1e-9);
  });
  it("vagas e quem já está no limite não mudam; sem falta, nada muda", () => {
    // com B cobrindo das 15h às 22h não há falta, e A não cresce
    const qB = [...q, { matricula: "B", nome: "B", funcao: "Farmacêutico", cargaH: 44 }];
    const tsB = [...ts, ...[0, 1, 2, 3, 4].map((dia) => ({ matricula: "B", dia, entrada: 15, saida: 22, iniIntervalo: 18, fimIntervalo: 19 }))];
    expect(esticarTurnos({ turnos: tsB, quadro: qB, cobertura, abas, regra })).toEqual(tsB);
    const vaga = [{ ...q[0], vaga: true }];
    expect(esticarTurnos({ turnos: ts, quadro: vaga, cobertura, abas, regra })).toEqual(ts);
    const noLimite = [{ ...q[0], cargaH: 35 }];
    expect(esticarTurnos({ turnos: ts, quadro: noLimite, cobertura, abas, regra })).toEqual(ts);
  });
  it("turnoEsticado e o texto da dica; turnosParaGravar leva o antes só quando é diferente", () => {
    const t = { matricula: "A", dia: 0, entrada: 7, saida: 16, iniIntervalo: 11, fimIntervalo: 12, antes: { entrada: 7, saida: 15 } };
    expect(turnoEsticado(t)).toBe(true);
    expect(textoDoEsticamento(t, 42)).toBe("Turno aumentado de 07h–15h para 07h–16h para cobrir a falta, dentro do limite de 42h");
    expect(turnosParaGravar([t])[0].antes).toEqual({ entrada: 7, saida: 15 });
    expect(turnosParaGravar([{ ...t, saida: 15 }])[0].antes).toBeUndefined();
    expect(turnoEsticado({ ...t, antes: undefined })).toBe(false);
  });
});
