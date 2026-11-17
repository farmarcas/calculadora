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

describe("arrastar para a direita e para a esquerda (turno com minutos quebrados, spec 047)", () => {
  const quebrado = { matricula: "A", dia: 0, entrada: 14, saida: 14 + 7 + 38 / 60, iniIntervalo: null, fimIntervalo: null }; // 14h–21h38

  it("para a direita, o fim do turno nunca passa da hora de fechar", () => {
    const m = moverTurno(quebrado, 9, janela);
    expect(m.saida).toBeLessThanOrEqual(22 + 1e-9);
    expect(m.saida).toBeCloseTo(22, 9); // encosta no fechamento, não fica 6 minutos para trás nem passa dele
  });
  it("um turno que já está no limite da direita fica onde está ao arrastar para a direita (não recua)", () => {
    const noLimite = { matricula: "A", dia: 0, entrada: 12.6, saida: 22, iniIntervalo: 16, fimIntervalo: 17 }; // 12h36–22h, "ajustado"
    for (const d of [0.05, 0.25, 1, 5]) {
      expect(moverTurno(noLimite, d, janela)).toMatchObject({ entrada: 12.6, saida: 22, iniIntervalo: 16, fimIntervalo: 17 });
    }
    // e para a esquerda ele anda normalmente
    expect(moverTurno(noLimite, -1, janela).saida).toBeLessThan(22);
  });
  it("um turno que já está no limite da esquerda fica onde está ao arrastar para a esquerda", () => {
    const noInicio = { matricula: "A", dia: 0, entrada: 7, saida: 16.4, iniIntervalo: null, fimIntervalo: null };
    expect(moverTurno(noInicio, -3, janela)).toMatchObject({ entrada: 7, saida: 16.4 });
  });
  it("mantém a duração do turno ao mover, nos dois sentidos", () => {
    const dur = quebrado.saida - quebrado.entrada;
    for (const d of [-9, -1, -0.25, 0.25, 0.3, 1, 9]) {
      const m = moverTurno(quebrado, d, janela);
      expect(m.saida - m.entrada).toBeCloseTo(dur, 9);
    }
  });
  it("para a esquerda, a entrada nunca passa da hora de abrir", () => {
    const cedo = { ...quebrado, entrada: 7.2, saida: 7.2 + 8 };
    expect(moverTurno(cedo, -9, janela).entrada).toBe(7);
  });
  it("nenhum movimento, para nenhum lado, sai das horas do dia (varredura de minutos)", () => {
    for (let e = 7; e <= 20; e += 17 / 60) {
      for (let len = 1; len <= 9; len += 23 / 60) {
        const t = { matricula: "A", dia: 0, entrada: Math.round(e * 60) / 60, saida: Math.round((e + len) * 60) / 60, iniIntervalo: null, fimIntervalo: null };
        if (t.saida > 22) continue;
        for (const d of [-9, -1, -0.4, -0.25, 0.1, 0.25, 0.4, 1, 9]) {
          for (const modo of ["mover", "esq", "dir"]) {
            const r = aplicarMovimento(t, modo, d, janela);
            expect(r.entrada).toBeGreaterThanOrEqual(7 - 1e-9);
            expect(r.saida).toBeLessThanOrEqual(22 + 1e-9);
          }
        }
      }
    }
  });
  it("esticar a borda mantém o mínimo de 1 hora mesmo com o arredondamento", () => {
    const t = { matricula: "A", dia: 0, entrada: 7, saida: 8.13, iniIntervalo: null, fimIntervalo: null };
    const r = redimensionarTurno(t, "esq", 3, janela);
    expect(r.saida - r.entrada).toBeGreaterThanOrEqual(1 - 1e-9);
  });
  it("mover à direita e voltar à esquerda devolve o turno ao lugar (turno inteiro, sem tocar nas bordas)", () => {
    const t = { matricula: "A", dia: 0, entrada: 8, saida: 16, iniIntervalo: 12, fimIntervalo: 13 };
    for (const d of [0.25, 0.5, 1, 3]) {
      const ida = moverTurno(t, d, janela);
      expect(moverTurno(ida, -d, janela)).toMatchObject({ entrada: 8, saida: 16, iniIntervalo: 12, fimIntervalo: 13 });
    }
  });
});
