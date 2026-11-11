import { describe, expect, it } from "vitest";
import { aplicarMovimento, moverTurno, movimentoPorTecla, redimensionarTurno } from "./movimento-regras.js";

const janela = { min: 7, max: 22 };
const turno = { matricula: "A", dia: 0, entrada: 8, saida: 16, iniIntervalo: 12, fimIntervalo: 13 };

describe("mover o turno", () => {
  it("de 15 em 15 minutos, levando o intervalo junto", () => {
    const m = moverTurno(turno, 1.1, janela);
    expect(m).toMatchObject({ entrada: 9, saida: 17, iniIntervalo: 13, fimIntervalo: 14 });
    expect(moverTurno(turno, 0.2, janela).entrada).toBe(8.25);
  });
  it("não sai das horas do dia", () => {
    expect(moverTurno(turno, -5, janela).entrada).toBe(7);
    expect(moverTurno(turno, 9, janela)).toMatchObject({ entrada: 14, saida: 22 });
  });
});

describe("redimensionar o turno", () => {
  it("a borda da esquerda mexe na entrada e a da direita na saída", () => {
    expect(redimensionarTurno(turno, "esq", 1, janela)).toMatchObject({ entrada: 9, saida: 16 });
    expect(redimensionarTurno(turno, "dir", -2, janela)).toMatchObject({ entrada: 8, saida: 14 });
  });
  it("tem ao menos 1 hora e respeita a janela", () => {
    expect(redimensionarTurno(turno, "esq", 20, janela).entrada).toBe(15);
    expect(redimensionarTurno(turno, "dir", -20, janela).saida).toBe(9);
    expect(redimensionarTurno(turno, "dir", 20, janela).saida).toBe(22);
    expect(redimensionarTurno(turno, "esq", -20, janela).entrada).toBe(7);
  });
  it("o intervalo que fica fora do turno some", () => {
    const r = redimensionarTurno(turno, "dir", -6, janela);
    expect(r).toMatchObject({ saida: 10, iniIntervalo: null, fimIntervalo: null });
    expect(redimensionarTurno(turno, "dir", 1, janela)).toMatchObject({ iniIntervalo: 12, fimIntervalo: 13 });
  });
});

describe("teclado", () => {
  it("as setas movem 15 minutos e Shift mexe na saída", () => {
    expect(movimentoPorTecla("ArrowRight")).toEqual({ modo: "mover", delta: 0.25 });
    expect(movimentoPorTecla("ArrowLeft", true)).toEqual({ modo: "dir", delta: -0.25 });
    expect(movimentoPorTecla("Enter")).toBeNull();
  });
  it("aplica o movimento certo", () => {
    expect(aplicarMovimento(turno, "mover", 1, janela).entrada).toBe(9);
    expect(aplicarMovimento(turno, "esq", 1, janela).entrada).toBe(9);
    expect(aplicarMovimento(turno, "dir", 1, janela).saida).toBe(17);
  });
});

describe("turno com minutos inteiros (spec 047)", () => {
  it("mover mantém a duração e o intervalo, sem arredondar a saída (14h38, 15h24)", () => {
    const t = { matricula: "A", dia: 0, entrada: 7, saida: 15.4, iniIntervalo: 11, fimIntervalo: 12 };
    const m = moverTurno(t, 0.25, { min: 7, max: 22 });
    expect(m.entrada).toBe(7.25);
    expect(m.saida - m.entrada).toBeCloseTo(8.4, 9);
    expect(m.iniIntervalo).toBeCloseTo(11.25, 9);
  });
});
