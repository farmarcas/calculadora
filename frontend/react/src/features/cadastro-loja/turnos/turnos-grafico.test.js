import { describe, expect, it } from "vitest";
import { alcasDosTurnos, eixoDaJanela, faturamentoDoTurno, horasDeMaiorFaturamento, horasDoTurno, moverLimite, sugerirTurnos } from "./turnos-grafico.js";

const janela = { abre: 7, fecha: 22 };
const t = (nome, inicio, fim, minimos = { Farmacêutico: 1 }) => ({ nome, inicio, fim, minimos });
// Venda por hora (7h a 21h): manhã fraca, pico às 10h e às 17h–18h.
const valores = { 7: 420, 8: 780, 9: 1150, 10: 1320, 11: 1180, 12: 980, 13: 860, 14: 790, 15: 850, 16: 1010, 17: 1290, 18: 1410, 19: 1120, 20: 760, 21: 430 };
const total = Object.values(valores).reduce((s, v) => s + v, 0);
const serieDono = Object.entries(valores).map(([h, v]) => ({ hora: Number(h), valor: v, participacao: v / total }));
const serieSemValor = serieDono.map(({ valor: _v, ...r }) => r);
const turnos = [t("Manhã", "07:00", "10:00"), t("Intermediário", "10:00", "16:00"), t("Tarde", "16:00", "22:00")];

describe("eixo e horas do turno", () => {
  it("uma coluna por hora de funcionamento (07h a 21h = 15 colunas)", () => {
    expect(eixoDaJanela(janela)).toHaveLength(15);
    expect(eixoDaJanela(janela)[0]).toBe(7);
    expect(eixoDaJanela(janela).at(-1)).toBe(21);
    expect(eixoDaJanela(null)).toEqual([]);
  });
  it("horas do turno dentro do horário da loja, inclusive o que passa do horário", () => {
    expect(horasDoTurno(turnos[0], janela)).toEqual([7, 8, 9]);
    expect(horasDoTurno(t("Noite", "20:00", "02:00"), janela)).toEqual([20, 21]);
    expect(horasDoTurno(t("Antes", "05:00", "08:00"), janela)).toEqual([7]);
  });
  it("as 3 horas de maior faturamento: 18h, 10h e 17h", () => {
    expect([...horasDeMaiorFaturamento(serieDono, janela)].sort((a, b) => a - b)).toEqual([10, 17, 18]);
  });
});

describe("faturamento do turno", () => {
  it("soma, média, pico e % do dia à mão (manhã: 420 + 780 + 1150)", () => {
    const f = faturamentoDoTurno(turnos[0], serieDono, janela);
    expect(f.valor).toBe(2350);
    expect(f.media).toBe(783);
    expect(f.pico).toMatchObject({ hora: 9, valor: 1150 });
    expect(f.pctDoDia).toBe(Math.round((2350 / total) * 100));
  });
  it("os três turnos somam o dia inteiro", () => {
    const soma = turnos.reduce((s, x) => s + faturamentoDoTurno(x, serieDono, janela).valor, 0);
    expect(soma).toBe(total);
  });
  it("sem valores (gestor): só a participação; nenhum valor em reais", () => {
    const f = faturamentoDoTurno(turnos[1], serieSemValor, janela);
    expect(f).not.toHaveProperty("valor");
    expect(f).not.toHaveProperty("media");
    expect(f.pctDoDia).toBeGreaterThan(0);
    expect(f.pico.hora).toBe(10);
  });
  it("turno sem horas na janela devolve zeros e nenhum pico", () => {
    const f = faturamentoDoTurno(t("Fora", "23:00", "23:30"), serieDono, janela);
    expect(f.horas).toEqual([]);
    expect(f.pico).toBeNull();
  });
});

describe("alças e mover limite", () => {
  it("há alça onde o fim de um turno é o início do outro", () => {
    expect(alcasDosTurnos(turnos)).toEqual([{ de: 0, para: 1, hora: 10 }, { de: 1, para: 2, hora: 16 }]);
    expect(alcasDosTurnos([t("A", "07:00", "10:00"), t("B", "11:00", "16:00")])).toEqual([]);
  });
  it("arrasta o limite: fim de um e início do próximo mudam juntos, sem alterar a entrada", () => {
    const antes = JSON.stringify(turnos);
    const r = moverLimite(turnos, 0, 1, 11);
    expect(r[0].fim).toBe("11:00");
    expect(r[1].inicio).toBe("11:00");
    expect(r[2]).toEqual(turnos[2]);
    expect(JSON.stringify(turnos)).toBe(antes);
  });
  it("passo de 1 hora (arredonda) e mínimo de 1 hora em cada turno", () => {
    expect(moverLimite(turnos, 0, 1, 10.4)).toBe(turnos); // volta ao mesmo limite: sem efeito
    expect(moverLimite(turnos, 0, 1, 7)).toBe(turnos); // deixaria o turno da manhã com 0 h
    expect(moverLimite(turnos, 0, 1, 8)[0].fim).toBe("08:00"); // 1 h: vale
    expect(moverLimite(turnos, 0, 1, 15)[1].inicio).toBe("15:00"); // o do meio fica com 1 h (15 a 16)
    expect(moverLimite(turnos, 0, 1, 16)).toBe(turnos); // o do meio ficaria com 0 h
  });
  it("o último turno que termina à meia-noite mantém o fim 00:00", () => {
    const c = [t("A", "12:00", "18:00"), t("B", "18:00", "00:00")];
    expect(moverLimite(c, 0, 1, 20)[1].fim).toBe("00:00");
    expect(moverLimite(c, 0, 1, 20)[0].fim).toBe("20:00");
  });
  it("turno que vira a noite não tem alça", () => {
    expect(alcasDosTurnos([t("A", "20:00", "02:00"), t("B", "02:00", "08:00")])).toEqual([]);
  });
});

describe("sugerir turnos pelo movimento", () => {
  it("divide o dia em partes iguais do movimento: manhã longa e fraca, pico curto", () => {
    const r = sugerirTurnos(serieDono, janela, turnos);
    expect(r).toHaveLength(3);
    expect(r[0].inicio).toBe("07:00");
    expect(r.at(-1).fim).toBe("22:00");
    // trechos emendados e sem buraco
    expect(r[0].fim).toBe(r[1].inicio);
    expect(r[1].fim).toBe(r[2].inicio);
    // cada turno carrega perto de um terço do faturamento do dia
    const partes = r.map((x) => faturamentoDoTurno(x, serieDono, janela).participacao);
    for (const p of partes) expect(Math.abs(p - 1 / 3)).toBeLessThan(0.1);
  });
  it("mantém nomes e mínimos dos turnos atuais por ordem e Farmacêutico no mínimo 1", () => {
    const atuais = [t("Manhã", "07:00", "12:00", { Farmacêutico: 2, Atendimento: 1 }), t("Dia", "12:00", "22:00", { Farmacêutico: 0 })];
    const r = sugerirTurnos(serieDono, janela, atuais);
    expect(r).toHaveLength(3);
    expect(r[0]).toMatchObject({ nome: "Manhã", minimos: { Farmacêutico: 2, Atendimento: 1 } });
    expect(r[1].minimos.Farmacêutico).toBe(1);
    expect(r[2].nome).toBe("Turno 3");
  });
  it("é determinístico e não altera a entrada", () => {
    const antes = JSON.stringify(turnos);
    expect(sugerirTurnos(serieDono, janela, turnos)).toEqual(sugerirTurnos(serieDono, janela, turnos));
    expect(JSON.stringify(turnos)).toBe(antes);
  });
  it("usa a participação quando não há valores em reais, com o mesmo resultado", () => {
    expect(sugerirTurnos(serieSemValor, janela, turnos)).toEqual(sugerirTurnos(serieDono, janela, turnos));
  });
  it("sem janela não sugere; com poucas horas respeita o número de horas", () => {
    expect(sugerirTurnos(serieDono, null, turnos)).toBeNull();
    expect(sugerirTurnos(serieDono, { abre: 8, fecha: 10 }, turnos)).toHaveLength(2);
  });
});
