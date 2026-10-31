import { describe, expect, it } from "vitest";
import { coberturaDoHorario, duracaoDoTurno, errosDosTurnos, janelaDaLoja, janelaDoMinimo, pedacosDe, sobreposicoes, sobreposicoesNaJanela, turnosIniciais } from "./turnos.js";

const t = (nome, inicio, fim, minimos = { Farmacêutico: 1 }) => ({ nome, inicio, fim, minimos });
const dia = (abre, fecha) => ({ aberta: true, abre, fecha });
// Segunda a sexta 08–21, sábado 08–20, domingo fechado.
const semana = { dias: [dia("08:00", "21:00"), dia("08:00", "21:00"), dia("08:00", "21:00"), dia("08:00", "21:00"), dia("08:00", "21:00"), dia("08:00", "20:00"), { aberta: false }] };

describe("janela e duração", () => {
  it("janela da loja: do primeiro horário aberto ao último (08:00 a 21:00)", () => {
    expect(janelaDaLoja(semana)).toEqual({ abre: 8, fecha: 21 });
    expect(janelaDaLoja({ dias: [{ aberta: false }] })).toBeNull();
    expect(janelaDaLoja({ dias: [{ aberta: true, h24: true }] })).toEqual({ abre: 0, fecha: 24 });
  });
  it("duração: 07:00–15:00 = 8h; vira a noite 22:00–06:00 = 8h; fim 00:00 = meia-noite", () => {
    expect(duracaoDoTurno(t("A", "07:00", "15:00"))).toBe(8);
    expect(duracaoDoTurno(t("N", "22:00", "06:00"))).toBe(8);
    expect(duracaoDoTurno(t("T", "14:00", "00:00"))).toBe(10);
    expect(pedacosDe(t("N", "22:00", "06:00"))).toEqual([{ de: 22, ate: 24 }, { de: 0, ate: 6 }]);
  });
});

describe("janela do mínimo (turno ∩ horário da loja)", () => {
  const j = { abre: 8, fecha: 21 };
  it("turno 07:00–15:00 só vale a partir das 08:00; turno 12:00–22:00 só até as 21:00", () => {
    expect(janelaDoMinimo(t("1", "07:00", "15:00"), j)).toEqual([{ de: 8, ate: 15 }]);
    expect(janelaDoMinimo(t("2", "12:00", "22:00"), j)).toEqual([{ de: 12, ate: 21 }]);
  });
  it("turno inteiro fora do horário da loja não tem janela", () => {
    expect(janelaDoMinimo(t("X", "22:00", "23:00"), j)).toEqual([]);
    expect(janelaDoMinimo(t("X", "08:00", "10:00"), null)).toEqual([]);
  });
});

describe("sobreposição", () => {
  it("o exemplo do desenho: 07–15 e 12–22 se sobrepõem de 12:00 a 15:00 (3h)", () => {
    const ts = [t("1", "07:00", "15:00"), t("2", "12:00", "22:00")];
    expect(sobreposicoes(ts)).toEqual([{ de: 12, ate: 15 }]);
    expect(sobreposicoesNaJanela(ts, { abre: 8, fecha: 21 })).toEqual([{ de: 12, ate: 15 }]);
  });
  it("sem sobreposição quando um começa onde o outro termina; faixa fora do horário da loja é cortada", () => {
    expect(sobreposicoes([t("1", "08:00", "14:00"), t("2", "14:00", "20:00")])).toEqual([]);
    expect(sobreposicoesNaJanela([t("1", "06:00", "10:00"), t("2", "07:00", "09:00")], { abre: 8, fecha: 21 })).toEqual([{ de: 8, ate: 9 }]);
  });
});

describe("cobertura do horário", () => {
  it("coberto: sem faixa; os turnos do desenho (07–15 e 12–22) cobrem 08–21", () => {
    expect(coberturaDoHorario([t("1", "07:00", "15:00"), t("2", "12:00", "22:00")], semana)).toEqual([]);
  });
  it("buraco vira faixa sem turno: turnos 08–17 deixam 17:00–21:00 (e 17:00–20:00 no sábado)", () => {
    const r = coberturaDoHorario([t("1", "08:00", "17:00")], semana);
    expect(r).toEqual([
      { dias: [0, 1, 2, 3, 4], de: 17, ate: 21 },
      { dias: [5], de: 17, ate: 20 },
    ]);
  });
  it("buraco no meio: 08–12 e 13–21 deixam 12:00–13:00", () => {
    expect(coberturaDoHorario([t("1", "08:00", "12:00"), t("2", "13:00", "21:00")], { dias: [dia("08:00", "21:00")] })).toEqual([{ dias: [0], de: 12, ate: 13 }]);
  });
});

describe("turnos iniciais e erros", () => {
  it("ativar turnos parte do mínimo único atual, com farmacêutico ≥ 1", () => {
    const r = turnosIniciais({ abre: 8, fecha: 21 }, { Farmacêutico: 2, Atendimento: 1, Caixa: 0 });
    expect(r).toEqual([{ nome: "Turno 1", inicio: "08:00", fim: "21:00", minimos: { Farmacêutico: 2, Atendimento: 1 } }]);
    expect(turnosIniciais({ abre: 0, fecha: 24 }, {})).toHaveLength(2);
    expect(turnosIniciais({ abre: 8, fecha: 20 }, {})[0].minimos).toEqual({ Farmacêutico: 1 });
  });
  it("erros: nome vazio ou repetido, início = fim, farmacêutico 0, mais de 6 turnos; sobreposição e fora do horário NÃO são erro", () => {
    expect(errosDosTurnos([t("A", "07:00", "15:00"), t("B", "12:00", "22:00")])).toEqual([]);
    const campos = (ts) => errosDosTurnos(ts).map((e) => e.campo);
    expect(campos([t(" ", "08:00", "12:00")])).toContain("turno-0-nome");
    expect(campos([t("A", "08:00", "12:00"), t("a", "12:00", "20:00")])).toContain("turno-1-nome");
    expect(campos([t("A", "08:00", "08:00")])).toContain("turno-0-fim");
    expect(campos([t("A", "08:00", "12:00", { Farmacêutico: 0 })])).toContain("turno-0-farma");
    expect(campos(Array.from({ length: 7 }, (_, i) => t(`T${i}`, "08:00", "09:00")))).toContain("turnos");
  });
});
