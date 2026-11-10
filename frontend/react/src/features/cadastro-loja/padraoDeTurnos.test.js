import { describe, expect, it } from "vitest";
import { baseDaConfiguracao } from "./configuracao.js";

const horarios = { versao: 2, dias: Array.from({ length: 7 }, (_, i) => (i < 6 ? { aberta: true, abre: "08:00", fecha: "22:00" } : { aberta: false })) };
const minimos = { Farmacêutico: 2, Atendimento: 1, Caixa: 0 };

describe("modo padrão do mínimo de pessoas", () => {
  it("loja sem turnos guardados abre em Por turnos, com os turnos iniciais copiados do mínimo atual", () => {
    const b = baseDaConfiguracao({ minimos, convencao8h24: false, modoMinimo: "turnos", turnos: null }, horarios);
    expect(b.modoMinimo).toBe("turnos");
    expect(b.turnos).toHaveLength(1);
    expect(b.turnos[0]).toMatchObject({ inicio: "08:00", fim: "22:00" });
    expect(b.turnos[0].minimos).toMatchObject({ Farmacêutico: 2, Atendimento: 1 });
  });
  it("o ponto de partida é determinístico: salvo e rascunho nascem iguais (nada de alteração pendente ao abrir)", () => {
    const cfg = { minimos, modoMinimo: "turnos", turnos: null };
    expect(baseDaConfiguracao(cfg, horarios)).toEqual(baseDaConfiguracao(cfg, horarios));
  });
  it("quem guardou Mínimo único do dia (turnos guardados com esse modo) continua nele", () => {
    const turnos = [{ nome: "Dia", inicio: "08:00", fim: "22:00", minimos: { Farmacêutico: 1 } }];
    expect(baseDaConfiguracao({ minimos, modoMinimo: "unico", turnos }, horarios).modoMinimo).toBe("unico");
  });
  it("quem guardou turnos e Por turnos mantém os turnos guardados", () => {
    const turnos = [{ nome: "Manhã", inicio: "08:00", fim: "14:00", minimos: { Farmacêutico: 1 } }, { nome: "Tarde", inicio: "14:00", fim: "22:00", minimos: { Farmacêutico: 1 } }];
    const b = baseDaConfiguracao({ minimos, modoMinimo: "turnos", turnos }, horarios);
    expect(b.modoMinimo).toBe("turnos");
    expect(b.turnos).toBe(turnos);
  });
});
