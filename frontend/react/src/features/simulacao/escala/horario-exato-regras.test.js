import { describe, expect, it } from "vitest";
import { horasCobertas, totalDaSemana, textoDoIntervalo, textoDoTurno, turnosParaGravar } from "./escala-regras.js";
import { horarioMudou, horarioTexto, lerHorario, turnoDeValores, validarHorario, valoresDoTurno } from "./horario-exato-regras.js";

const janela = { abre: 7, fecha: 22 };
const ok = { entrada: "07:32", iniIntervalo: "12:17", fimIntervalo: "13:17", saida: "16:24" };
const turno = { matricula: "A", dia: 1, entrada: 7 + 32 / 60, saida: 16 + 24 / 60, iniIntervalo: 12 + 17 / 60, fimIntervalo: 13 + 17 / 60 };

describe("lerHorario e horarioTexto", () => {
  it("lê HH:mm com qualquer minuto de 00 a 59", () => {
    expect(lerHorario("07:32")).toBeCloseTo(7 + 32 / 60, 9);
    expect(lerHorario("7:05")).toBeCloseTo(7 + 5 / 60, 9);
    expect(lerHorario("00:00")).toBe(0);
    expect(lerHorario("23:59")).toBeCloseTo(23 + 59 / 60, 9);
    expect(lerHorario("24:00")).toBe(24);
  });
  it("recusa o que não é horário", () => {
    for (const t of ["25:00", "12:60", "24:01", "7:5", "", "  ", "ab", "7h32", "12:3", null, undefined]) expect(lerHorario(t)).toBeNull();
  });
  it("ida e volta sem perder o minuto", () => {
    for (let m = 0; m < 24 * 60; m += 7) expect(lerHorario(horarioTexto(m / 60))).toBeCloseTo(m / 60, 9);
    expect(horarioTexto(7 + 32 / 60)).toBe("07:32");
    expect(horarioTexto(16.4)).toBe("16:24");
    expect(horarioTexto(22)).toBe("22:00");
  });
});

describe("valoresDoTurno", () => {
  it("devolve os quatro campos, com o intervalo vazio quando não há", () => {
    expect(valoresDoTurno(turno)).toEqual(ok);
    expect(valoresDoTurno({ ...turno, iniIntervalo: null, fimIntervalo: null })).toEqual({ entrada: "07:32", iniIntervalo: "", fimIntervalo: "", saida: "16:24" });
  });
});

describe("validarHorario", () => {
  it("aceita um horário certo, com e sem intervalo", () => {
    expect(validarHorario(ok, janela)).toEqual({ ok: true, erros: {} });
    expect(validarHorario({ ...ok, iniIntervalo: "", fimIntervalo: "" }, janela).ok).toBe(true);
  });
  it("campo obrigatório vazio ou ilegível", () => {
    const r = validarHorario({ ...ok, entrada: "", saida: "25:70" }, janela);
    expect(r.erros.entrada).toBe("Informe um horário válido, como 07:32.");
    expect(r.erros.saida).toBe("Informe um horário válido, como 07:32.");
    expect(r.ok).toBe(false);
  });
  it("saída igual ou antes da entrada", () => {
    expect(validarHorario({ ...ok, iniIntervalo: "", fimIntervalo: "", saida: "06:00" }, janela).erros.saida).toBe("A saída precisa ser depois da entrada.");
    expect(validarHorario({ ...ok, iniIntervalo: "", fimIntervalo: "", saida: "07:32" }, janela).erros.saida).toBe("A saída precisa ser depois da entrada.");
  });
  it("fora do funcionamento do dia, nos dois extremos", () => {
    const msg = "A loja funciona das 07:00 às 22:00 neste dia.";
    expect(validarHorario({ ...ok, entrada: "06:59" }, janela).erros.entrada).toBe(msg);
    expect(validarHorario({ ...ok, saida: "22:01" }, janela).erros.saida).toBe(msg);
    expect(validarHorario({ ...ok, entrada: "07:00", saida: "22:00", iniIntervalo: "", fimIntervalo: "" }, janela).ok).toBe(true);
  });
  it("só um campo do intervalo", () => {
    expect(validarHorario({ ...ok, fimIntervalo: "" }, janela).erros.fimIntervalo).toBe("Preencha o início e o fim do intervalo, ou deixe os dois vazios.");
    expect(validarHorario({ ...ok, iniIntervalo: "" }, janela).erros.iniIntervalo).toBe("Preencha o início e o fim do intervalo, ou deixe os dois vazios.");
  });
  it("intervalo fora do turno", () => {
    expect(validarHorario({ ...ok, iniIntervalo: "07:00", fimIntervalo: "08:00" }, janela).erros.iniIntervalo).toBe("O intervalo precisa ficar dentro do turno.");
    expect(validarHorario({ ...ok, iniIntervalo: "15:30", fimIntervalo: "17:00" }, janela).erros.fimIntervalo).toBe("O intervalo precisa ficar dentro do turno.");
  });
  it("início do intervalo depois (ou igual) ao fim", () => {
    expect(validarHorario({ ...ok, iniIntervalo: "13:17", fimIntervalo: "12:17" }, janela).erros.fimIntervalo).toBe("O início do intervalo precisa ser antes do fim.");
    expect(validarHorario({ ...ok, iniIntervalo: "12:17", fimIntervalo: "12:17" }, janela).erros.fimIntervalo).toBe("O início do intervalo precisa ser antes do fim.");
  });
  it("intervalo ilegível", () => {
    expect(validarHorario({ ...ok, iniIntervalo: "xx" }, janela).erros.iniIntervalo).toBe("Informe um horário válido, como 07:32.");
  });
  it("um campo ilegível não puxa erro dos que dependem dele", () => {
    const r = validarHorario({ ...ok, entrada: "", iniIntervalo: "", fimIntervalo: "" }, janela);
    expect(Object.keys(r.erros)).toEqual(["entrada"]);
  });
  it("sem janela do dia, só valida o resto", () => {
    expect(validarHorario({ ...ok, saida: "23:59" }, null).ok).toBe(true);
  });
});

describe("turnoDeValores e horarioMudou", () => {
  it("monta o turno com as horas exatas e tira o 'ajustado'", () => {
    const t = turnoDeValores({ ...turno, antes: { entrada: 7, saida: 16 } }, ok);
    expect(t.entrada).toBeCloseTo(7 + 32 / 60, 9);
    expect(t.saida).toBeCloseTo(16 + 24 / 60, 9);
    expect(t.iniIntervalo).toBeCloseTo(12 + 17 / 60, 9);
    expect(t.fimIntervalo).toBeCloseTo(13 + 17 / 60, 9);
    expect(t.antes).toBeUndefined();
    expect(t.matricula).toBe("A");
  });
  it("sem intervalo digitado, o turno fica sem intervalo", () => {
    const t = turnoDeValores(turno, { ...ok, iniIntervalo: "", fimIntervalo: "" });
    expect(t.iniIntervalo).toBeNull();
    expect(t.fimIntervalo).toBeNull();
  });
  it("detecta se mudou", () => {
    expect(horarioMudou(turno, turnoDeValores(turno, ok))).toBe(false);
    expect(horarioMudou(turno, turnoDeValores(turno, { ...ok, saida: "16:25" }))).toBe(true);
    expect(horarioMudou(turno, turnoDeValores(turno, { ...ok, iniIntervalo: "", fimIntervalo: "" }))).toBe(true);
  });
});

describe("horasCobertas (a mesma regra da cobertura: hora cheia)", () => {
  it("07:32–16:24 com 1 h de intervalo: cobre de 08h a 16h (o intervalo de até 2 h não tira)", () => {
    expect(horasCobertas(turno)).toBe("08h a 16h");
  });
  it("intervalo de mais de 2 h tira as horas dele", () => {
    expect(horasCobertas({ ...turno, entrada: 8, saida: 18, iniIntervalo: 12, fimIntervalo: 15 })).toBe("08h a 12h e 15h a 18h");
  });
  it("sem nenhuma hora cheia, mostra traço", () => {
    expect(horasCobertas({ ...turno, entrada: 7.5, saida: 8.4, iniIntervalo: null, fimIntervalo: null })).toBe("—");
    expect(horasCobertas(null)).toBe("—");
  });
});

describe("os minutos exatos aparecem e são gravados (US3)", () => {
  it("texto do turno e do intervalo", () => {
    expect(textoDoTurno(turno)).toBe("07h32–16h24");
    expect(textoDoIntervalo(turno)).toBe("12h17–13h17");
  });
  it("o total da semana soma os minutos reais", () => {
    // (16:24 − 07:32) − 1 h = 7 h 52 min = 7,87 h
    expect(totalDaSemana([turno], "A").horas).toBeCloseTo(7.87, 2);
  });
  it("turnosParaGravar preserva os minutos (não vira quarto de hora)", () => {
    const [g] = turnosParaGravar([turno]);
    expect(Math.round(g.entrada * 60)).toBe(7 * 60 + 32);
    expect(Math.round(g.saida * 60)).toBe(16 * 60 + 24);
    expect(Math.round(g.iniIntervalo * 60)).toBe(12 * 60 + 17);
    expect(Math.round(g.fimIntervalo * 60)).toBe(13 * 60 + 17);
  });
});
