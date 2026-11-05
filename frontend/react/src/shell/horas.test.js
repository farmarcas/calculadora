import { describe, expect, it } from "vitest";
import { horasDeFuncionamento, textoDeHoras } from "./horas.js";

const dia = (abre, fecha) => ({ aberta: true, abre, fecha });
const fechado = { aberta: false };

describe("horas de funcionamento por semana", () => {
  it("Sumaré - Centro: 5 dias de 08–21, sábado 08–20, domingo fechado = 77h", () => {
    const h = { versao: 2, dias: [dia("08:00", "21:00"), dia("08:00", "21:00"), dia("08:00", "21:00"), dia("08:00", "21:00"), dia("08:00", "21:00"), dia("08:00", "20:00"), fechado] };
    expect(horasDeFuncionamento(h)).toBe(77);
    expect(textoDeHoras(77)).toBe("77h");
  });
  it("aceita meia hora", () => {
    expect(horasDeFuncionamento({ dias: [dia("08:00", "12:30")] })).toBe(4.5);
    expect(textoDeHoras(4.5)).toBe("4,5h");
  });
  it("loja 24h conta 24 por dia", () => {
    expect(horasDeFuncionamento({ dias: [dia("00:00", "24:00")] })).toBe(24);
  });
  it("sem horário válido não mostra número", () => {
    expect(horasDeFuncionamento(null)).toBeNull();
    expect(horasDeFuncionamento({ dias: [] })).toBeNull();
    expect(horasDeFuncionamento({ dias: [fechado, fechado] })).toBeNull();
    expect(horasDeFuncionamento({ dias: [dia("abc", "21:00")] })).toBeNull();
    expect(horasDeFuncionamento({ dias: [dia("21:00", "08:00")] })).toBeNull();
  });
});
