import { describe, expect, it } from "vitest";
import { pessoasParaFolgar, sugerirFolgas, textoDoRodizio } from "./folgas-regras.js";

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
