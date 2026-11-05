import { describe, expect, it } from "vitest";
import { confirmarCampo, estadoDoDia, horarioPadraoAoAbrir, horasDoDia, lerHorario, passoDaAbertura, passoDoFechamento, totaisDaSemana } from "./horario-regras.js";

describe("passo de 1 hora", () => {
  it("abertura sobe e desce de 1 em 1 hora", () => {
    expect(passoDaAbertura("08:00", "21:00", 1)).toBe("09:00");
    expect(passoDaAbertura("08:00", "21:00", -1)).toBe("07:00");
  });
  it("fechamento sobe e desce de 1 em 1 hora e chega a 24:00", () => {
    expect(passoDoFechamento("08:00", "22:00", 1)).toBe("23:00");
    expect(passoDoFechamento("08:00", "23:00", 1)).toBe("24:00");
    expect(passoDoFechamento("08:00", "24:00", 1)).toBe("24:00");
    expect(passoDoFechamento("08:00", "21:00", -1)).toBe("20:00");
  });
  it("limites: abertura não vai abaixo de 00:00 nem passa do fechamento menos 1 h; fechamento não passa de 24:00 nem fica a menos de 1 h da abertura", () => {
    expect(passoDaAbertura("00:00", "21:00", -1)).toBe("00:00");
    expect(passoDaAbertura("20:00", "21:00", 1)).toBe("20:00");
    expect(passoDoFechamento("08:00", "09:00", -1)).toBe("09:00");
    expect(passoDoFechamento("08:00", "24:00", 1)).toBe("24:00");
  });
  it("horário quebrado que já veio do Cadastro anda de hora em hora a partir dele", () => {
    expect(passoDaAbertura("08:30", "21:00", 1)).toBe("09:30");
    expect(passoDoFechamento("08:00", "23:30", 1)).toBe("24:00");
  });
  it("valor ilegível não muda nada", () => {
    expect(passoDaAbertura("", "21:00", 1)).toBe("");
    expect(passoDoFechamento("08:00", "x", 1)).toBe("x");
  });
});

describe("ler o que se digita", () => {
  it("aceita 8:00 e 08:00", () => {
    expect(lerHorario("8:00")).toBe("08:00");
    expect(lerHorario("08:00")).toBe("08:00");
    expect(lerHorario(" 21:30 ")).toBe("21:30");
  });
  it("24:00 só como fechamento", () => {
    expect(lerHorario("24:00", true)).toBe("24:00");
    expect(lerHorario("24:00", false)).toBeNull();
    expect(lerHorario("24:30", true)).toBeNull();
  });
  it("recusa o inválido", () => {
    for (const t of ["25:99", "12:60", "abc", "", "1200", "12", null, undefined]) expect(lerHorario(t)).toBeNull();
  });
});

describe("confirmar o campo (valor inválido volta ao último válido)", () => {
  it("válido vale", () => {
    expect(confirmarCampo("9:00", { ehFechamento: false, ultimoValido: "08:00", outroLado: "21:00" })).toBe("09:00");
    expect(confirmarCampo("22:00", { ehFechamento: true, ultimoValido: "21:00", outroLado: "08:00" })).toBe("22:00");
  });
  it("ilegível volta ao último válido", () => {
    expect(confirmarCampo("25:99", { ehFechamento: true, ultimoValido: "21:00", outroLado: "08:00" })).toBe("21:00");
  });
  it("só vale hora cheia: 08:30 digitado volta ao último válido", () => {
    expect(confirmarCampo("08:30", { ehFechamento: false, ultimoValido: "08:00", outroLado: "21:00" })).toBe("08:00");
    expect(confirmarCampo("21:15", { ehFechamento: true, ultimoValido: "21:00", outroLado: "08:00" })).toBe("21:00");
    expect(confirmarCampo("8:00", { ehFechamento: false, ultimoValido: "07:00", outroLado: "21:00" })).toBe("08:00");
  });
  it("o horário quebrado que já estava no campo continua válido", () => {
    expect(confirmarCampo("08:30", { ehFechamento: false, ultimoValido: "08:30", outroLado: "21:00" })).toBe("08:30");
  });
  it("fechamento antes da abertura e abertura depois do fechamento voltam", () => {
    expect(confirmarCampo("07:00", { ehFechamento: true, ultimoValido: "21:00", outroLado: "08:00" })).toBe("21:00");
    expect(confirmarCampo("22:00", { ehFechamento: false, ultimoValido: "08:00", outroLado: "21:00" })).toBe("08:00");
    expect(confirmarCampo("21:00", { ehFechamento: false, ultimoValido: "08:00", outroLado: "21:00" })).toBe("08:00");
    expect(confirmarCampo("20:00", { ehFechamento: false, ultimoValido: "08:00", outroLado: "21:00" })).toBe("20:00");
  });
});

describe("horas do dia e estados", () => {
  it("horas do dia dos exemplos do desenho", () => {
    expect(horasDoDia("08:00", "21:00")).toBe(13);
    expect(horasDoDia("08:00", "16:00")).toBe(8);
    expect(horasDoDia("08:00", "12:00")).toBe(4);
    expect(horasDoDia("07:00", "22:00")).toBe(15);
    expect(horasDoDia("08:00", "12:30")).toBe(4.5);
    expect(horasDoDia("12:00", "08:00")).toBe(0);
  });
  const cad = { aberta: true, abre: "08:00", fecha: "21:00" };
  it("estados do dia", () => {
    expect(estadoDoDia({ aberta: true, abre: "08:00", fecha: "21:00" }, cad)).toEqual({ aberto: true, alterado: false, fechadoNaSimulacao: false, fechadoNoCadastro: false });
    expect(estadoDoDia({ aberta: true, abre: "08:00", fecha: "16:00" }, cad).alterado).toBe(true);
    expect(estadoDoDia({ aberta: false }, cad)).toMatchObject({ aberto: false, alterado: true, fechadoNaSimulacao: true, fechadoNoCadastro: false });
    expect(estadoDoDia({ aberta: false }, { aberta: false })).toMatchObject({ alterado: false, fechadoNaSimulacao: false, fechadoNoCadastro: true });
    expect(estadoDoDia({ aberta: true, abre: "08:00", fecha: "14:00" }, { aberta: false })).toMatchObject({ aberto: true, alterado: true });
  });
  it("abrir um dia fechado começa das 08:00 às 18:00", () => {
    expect(horarioPadraoAoAbrir()).toEqual({ abre: "08:00", fecha: "18:00" });
  });
  it("totais da semana: 77h abertas contra 85h do Cadastro", () => {
    const aberto = (a, f) => ({ aberta: true, abre: a, fecha: f });
    const cadastro = [...Array(5).fill(aberto("08:00", "21:00")), aberto("08:00", "24:00"), aberto("08:00", "12:00")];
    const dias = [...Array(5).fill(aberto("08:00", "21:00")), aberto("08:00", "16:00"), aberto("08:00", "12:00")];
    expect(totaisDaSemana(dias, cadastro)).toEqual({ horas: 77, antes: 85 });
    expect(totaisDaSemana([{ aberta: false }], cadastro).horas).toBe(0);
  });
});
