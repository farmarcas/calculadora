import { describe, expect, it } from "vitest";
import { celulaDoDia, montarSemana, passaDaJornada, semEscala } from "./semana-regras.js";

const abertos = [0, 1, 2, 3, 4, 5].map((dia) => ({ dia, abre: 7, fecha: 22 })); // domingo fechado
const t = (matricula, dia, entrada, saida, iniIntervalo = null, fimIntervalo = null) => ({ matricula, dia, entrada, saida, iniIntervalo, fimIntervalo });
const quadro = [
  { matricula: "A", nome: "Lívia", funcao: "Farmacêutico", cargaH: 44 },
  { matricula: "B", nome: "Diego", funcao: "Caixa", cargaH: 44 },
  { matricula: "V", nome: "Vaga", funcao: "Farmacêutico", cargaH: 16, vaga: true },
  { matricula: "X", nome: "Saiu", funcao: "Caixa", cargaH: 44, desligado: true },
  { matricula: "C", nome: "Ana", funcao: "Atendimento", cargaH: 44 },
];
const turnos = [
  ...[0, 1, 2, 3].map((d) => t("A", d, 7, 15, 11, 12)),
  ...[4, 5].map((d) => t("V", d, 7, 15)),
  t("B", 0, 7, 15),
];

describe("celulaDoDia", () => {
  it("domingo fechado, folga e turno com intervalo", () => {
    const ab = new Set([0, 1]);
    expect(celulaDoDia([], "A", 6, ab).estado).toBe("fechada");
    expect(celulaDoDia([], "A", 1, ab).estado).toBe("folga");
    const c = celulaDoDia([t("A", 0, 7, 15, 11, 12)], "A", 0, ab);
    expect(c).toMatchObject({ estado: "turno", texto: "07h–15h", intervalo: "11h–12h" });
  });
  it("sem intervalo cadastrado, o intervalo fica vazio", () => {
    expect(celulaDoDia([t("B", 0, 7, 15)], "B", 0, new Set([0])).intervalo).toBe("");
  });
});

describe("montarSemana", () => {
  const grupos = montarSemana({ quadro, turnos, diasAbertos: abertos });
  it("agrupa por função na ordem do produto e ignora desligados", () => {
    expect(grupos.map((g) => g.funcao)).toEqual(["Farmacêutico", "Atendimento", "Caixa"]);
    expect(grupos[2].linhas.map((l) => l.nome)).toEqual(["Diego"]);
  });
  it("a Contratação simulada vem no fim do grupo, com folga nos dias não cobertos", () => {
    const farm = grupos[0].linhas;
    expect(farm.map((l) => l.simulada)).toEqual([false, true]);
    expect(farm[1].celulas.map((c) => c.estado)).toEqual(["folga", "folga", "folga", "folga", "turno", "turno", "fechada"]);
  });
  it("o total é a soma das células, com o intervalo descontado", () => {
    const livia = grupos[0].linhas[0];
    expect(livia.total.horas).toBe(28); // 4 dias de 8h menos 1h de intervalo cada
    expect(livia.total.dias).toBe(4);
    expect(livia.total.texto).toBe("28h · 4 dias");
    expect(grupos[0].linhas[1].total.texto).toBe("16h · 2 dias");
  });
  it("pessoa sem turno mostra 0h · 0 dias", () => {
    expect(grupos[1].linhas[0].total.texto).toBe("0h · 0 dias");
  });
});

describe("jornada e estado vazio", () => {
  it("só destaca quando passa da carga", () => {
    expect(passaDaJornada(45, 44)).toBe(true);
    expect(passaDaJornada(44, 44)).toBe(false);
    expect(passaDaJornada(10, 0)).toBe(false);
  });
  it("sem turnos não há escala", () => {
    expect(semEscala([])).toBe(true);
    expect(semEscala(turnos)).toBe(false);
  });
});
