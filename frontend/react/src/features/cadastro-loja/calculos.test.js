import { describe, expect, it } from "vitest";
import { copiarHorarioDaSegunda, diaParaApi, diaParaTela, divergenciaMensal, errosDaLoja, faturamentoDaSemana, faturamentoParaApi, horasDaSemana, horasDoDia, lerHora, lojaEh24h, mensalDosDias, semana24h } from "./calculos.js";

const aberto = (abre, fecha) => ({ aberta: true, abre, fecha });
// Segunda a sexta 08–21 (13h), sábado 08–20 (12h), domingo fechado: o exemplo do desenho.
const semana = { versao: 2, dias: [aberto("08:00", "21:00"), aberto("08:00", "21:00"), aberto("08:00", "21:00"), aberto("08:00", "21:00"), aberto("08:00", "21:00"), aberto("08:00", "20:00"), { aberta: false }] };

describe("horas do dia e da semana", () => {
  it("fecha − abre: 08:00 a 21:00 = 13h; sábado 08:00 a 20:00 = 12h", () => {
    expect(horasDoDia(semana.dias[0])).toBe(13);
    expect(horasDoDia(semana.dias[5])).toBe(12);
  });
  it("dia fechado = 0; dia 24h = 24; meio-hora conta", () => {
    expect(horasDoDia({ aberta: false })).toBe(0);
    expect(horasDoDia({ aberta: true, h24: true })).toBe(24);
    expect(horasDoDia(aberto("08:30", "12:00"))).toBe(3.5);
  });
  it("fechamento 00:00 é a meia-noite do dia seguinte", () => {
    expect(horasDoDia(aberto("08:00", "00:00"))).toBe(16);
    expect(horasDoDia(aberto("00:00", "00:00"))).toBe(0); // sem o 24h marcado, é um dia vazio
    expect(horasDoDia(aberto("08:00", "24:00"))).toBe(16);
  });
  it("incompleto ou fechamento antes da abertura = 0", () => {
    expect(horasDoDia(aberto("", "20:00"))).toBe(0);
    expect(horasDoDia(aberto("20:00", "08:00"))).toBe(0);
  });
  it("soma semanal: 5 × 13 + 12 = 77h", () => {
    expect(horasDaSemana(semana)).toBe(77);
  });
  it("loja 24 horas: 7 × 24 = 168h", () => {
    expect(horasDaSemana(semana24h())).toBe(168);
    expect(lojaEh24h(semana24h())).toBe(true);
    expect(lojaEh24h(semana)).toBe(false);
  });
});

describe("faturamento semanal, mensal e divergência", () => {
  const dias = [20000, 15000, 17000, 18000, 20000, 11000, null];
  it("soma semanal só dos dias abertos: R$ 101.000", () => {
    expect(faturamentoDaSemana(semana, dias)).toBe(101000);
    // domingo fechado não entra, mesmo com valor digitado
    expect(faturamentoDaSemana(semana, [...dias.slice(0, 6), 5000])).toBe(101000);
  });
  it("mensal = soma × 52 ÷ 12: 101.000 → 437.667", () => {
    expect(mensalDosDias(101000)).toBe(437667);
  });
  it("divergência: 487.698 informado vs 437.667 é +11,4% (acima, passa de 10%)", () => {
    const d = divergenciaMensal(487698, 437667);
    expect(d.diverge).toBe(true);
    expect(d.direcao).toBe("acima");
    expect(d.pct).toBeCloseTo(0.1143, 3);
  });
  it("até 10% não diverge; abaixo de 10% também conta; sem mensal ou sem soma não compara", () => {
    expect(divergenciaMensal(470000, 437667).diverge).toBe(false); // +7,4%
    const abaixo = divergenciaMensal(380000, 437667);
    expect(abaixo.diverge).toBe(true);
    expect(abaixo.direcao).toBe("abaixo");
    expect(divergenciaMensal(null, 437667).diverge).toBe(false);
    expect(divergenciaMensal(400000, 0).diverge).toBe(false);
  });
});

describe("leitura de horas e conversão com a API", () => {
  it("aceita 8:00 e 08:00; 24:00 só no fechamento", () => {
    expect(lerHora("8:00")).toBe("08:00");
    expect(lerHora("24:00")).toBeNull();
    expect(lerHora("24:00", true)).toBe("24:00");
    expect(lerHora("25:00", true)).toBeNull();
    expect(lerHora("08:60")).toBeNull();
    expect(lerHora("")).toBeNull();
  });
  it("tela → API: fechamento 00:00 vira 24:00; dia 24h vira 00:00–24:00 com h24", () => {
    expect(diaParaApi({ aberta: true, abre: "08:00", fecha: "00:00" })).toEqual({ aberta: true, abre: "08:00", fecha: "24:00" });
    expect(diaParaApi({ aberta: true, h24: true, abre: "00:00", fecha: "00:00" })).toEqual({ aberta: true, h24: true, abre: "00:00", fecha: "24:00" });
    expect(diaParaApi({ aberta: false, abre: "08:00" })).toEqual({ aberta: false });
  });
  it("API → tela: 24:00 aparece como 00:00", () => {
    expect(diaParaTela({ aberta: true, abre: "08:00", fecha: "24:00" })).toEqual({ aberta: true, abre: "08:00", fecha: "00:00" });
    expect(diaParaTela({ aberta: true, h24: true, abre: "00:00", fecha: "24:00" })).toMatchObject({ h24: true });
  });
});

describe("copiar horário da segunda e validação", () => {
  it("copia só o horário, mantendo a segunda", () => {
    const base = { versao: 2, dias: [aberto("09:00", "18:00"), ...Array.from({ length: 6 }, () => ({ aberta: false }))] };
    const r = copiarHorarioDaSegunda(base);
    expect(r.dias.every((d) => d.aberta && d.abre === "09:00" && d.fecha === "18:00")).toBe(true);
    expect(r.dias).toHaveLength(7);
    expect(r).not.toHaveProperty("faturamento");
  });
  it("faturamento de dia fechado é descartado ao gravar; tudo vazio vira null", () => {
    const f = { dias: [100, "", "", "", "", "", 999], mensal: "", margemPct: "" };
    expect(faturamentoParaApi(f, semana)).toEqual({ dias: [100, null, null, null, null, null, null], mensal: null, margemPct: null });
    expect(faturamentoParaApi({ dias: ["", "", "", "", "", "", ""], mensal: "", margemPct: "" }, semana)).toBeNull();
  });
  it("erros: nome curto, fechamento antes da abertura, faturamento negativo, margem fora de 0–100", () => {
    const l = { nome: "A", horarios: { versao: 2, dias: [aberto("20:00", "08:00"), ...semana.dias.slice(1)] }, faturamento: { dias: [-1, 0, 0, 0, 0, 0, null], mensal: "", margemPct: 120 } };
    const campos = errosDaLoja(l, { dono: true }).map((e) => e.campo);
    expect(campos).toEqual(expect.arrayContaining(["nome", "dia-0", "fat-0", "margem"]));
    expect(errosDaLoja(l, { dono: false }).map((e) => e.campo)).not.toContain("margem");
    expect(errosDaLoja({ nome: "Centro", horarios: semana }, { dono: true })).toEqual([]);
  });
});
