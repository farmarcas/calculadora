import { describe, expect, it } from "vitest";
import { darFolga, escalarNoDia } from "./folga-livre-regras.js";

const t = (matricula, dia, entrada = 8, saida = 17, ini = 12, fim = 13) => ({ matricula, dia, entrada, saida, iniIntervalo: ini, fimIntervalo: fim });
const regra = { dias: 5, maxDia: 8.4, teto: 42 };
const aba = (dia) => ({ dia, abre: 7, fecha: 22 });

describe("darFolga", () => {
  it("tira só o turno daquela pessoa naquele dia", () => {
    const ts = [t("A", 0), t("A", 1), t("B", 1)];
    expect(darFolga(ts, "A", 1)).toEqual([t("A", 0), t("B", 1)]);
  });
  it("não mexe em nada quando a pessoa já está de folga nesse dia", () => {
    const ts = [t("A", 0)];
    expect(darFolga(ts, "A", 3)).toBe(ts);
  });
  it("aceita dar a semana toda de folga (a pessoa fica sem turnos)", () => {
    let ts = [t("A", 0), t("A", 1), t("A", 2), t("B", 0)];
    for (const d of [0, 1, 2]) ts = darFolga(ts, "A", d);
    expect(ts).toEqual([t("B", 0)]);
  });
  it("vale também para uma contratação simulada", () => {
    const ts = [t("VAGA-1", 0), t("VAGA-1", 1)];
    expect(darFolga(ts, "VAGA-1", 0)).toEqual([t("VAGA-1", 1)]);
  });
});

describe("escalarNoDia", () => {
  it("cria o turno habitual da pessoa no dia de folga, sem mexer nos outros", () => {
    const ts = [t("A", 0), t("A", 1), t("B", 3)];
    const r = escalarNoDia({ turnos: ts, matricula: "A", dia: 3, aba: aba(3), regra });
    expect(r).toHaveLength(4);
    expect(r.slice(0, 3)).toEqual(ts);
    expect(r[3]).toMatchObject({ matricula: "A", dia: 3, entrada: 8, saida: 17, iniIntervalo: 12, fimIntervalo: 13 });
  });
  it("sem histórico, abre na abertura do dia com a jornada da regra", () => {
    const r = escalarNoDia({ turnos: [], matricula: "A", dia: 2, aba: aba(2), regra });
    expect(r).toHaveLength(1);
    expect(r[0].entrada).toBe(7);
    expect(r[0].saida).toBeLessThanOrEqual(22);
  });
  it("não duplica o turno de quem já trabalha nesse dia", () => {
    const ts = [t("A", 1)];
    expect(escalarNoDia({ turnos: ts, matricula: "A", dia: 1, aba: aba(1), regra })).toBe(ts);
  });
  it("com a loja fechada no dia (sem aba), nada muda", () => {
    const ts = [t("A", 1)];
    expect(escalarNoDia({ turnos: ts, matricula: "A", dia: 6, aba: undefined, regra })).toBe(ts);
  });
  it("dar e escalar de novo devolve o mesmo turno", () => {
    const ts = [t("A", 0), t("A", 1)];
    const sem = darFolga(ts, "A", 1);
    const volta = escalarNoDia({ turnos: sem, matricula: "A", dia: 1, aba: aba(1), regra });
    expect(volta.find((x) => x.dia === 1)).toMatchObject({ entrada: 8, saida: 17, iniIntervalo: 12, fimIntervalo: 13 });
  });
});
