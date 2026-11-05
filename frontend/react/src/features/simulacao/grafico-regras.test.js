import { describe, expect, it } from "vitest";
import { apoioDoGrafico, estadosDoDia, horasDoGrafico, legenda, resumoDoDia, rotuloDaBarra } from "./grafico-regras.js";

const aberto = (abre, fecha) => ({ aberta: true, abre, fecha });
const fechado = { aberta: false, abre: null, fecha: null };
const zeros = () => Array.from({ length: 7 }, () => new Array(24).fill(false));
const matriz = () => Array.from({ length: 7 }, () => new Array(24).fill(0));

// Segunda: Cadastro 08–21. Venda: 300 às 8h, 1900 às 18h (pico), 600 nas demais horas abertas.
const venda = () => {
  const m = matriz();
  for (let h = 8; h < 21; h++) m[0][h] = 600;
  m[0][8] = 300;
  m[0][18] = 1900;
  return m;
};
const cadastro = [aberto("08:00", "21:00"), ...Array(6).fill(fechado)];
const resultado = (dia0, { fechadas = zeros(), novas = zeros(), estimada = null, v = venda() } = {}) => ({
  horario: { dias: [dia0, ...Array(6).fill(fechado)], cadastro },
  vendaPorHora: { venda: v, fechadas, novas, estimada },
});

describe("horas do gráfico", () => {
  it("padrão de 06h a 21h", () => {
    const h = horasDoGrafico(cadastro.map(() => fechado), [], null);
    expect(h[0]).toBe(6);
    expect(h[h.length - 1]).toBe(21);
  });
  it("amplia para antes das 6h e depois das 21h quando a loja abre assim", () => {
    const h = horasDoGrafico([aberto("05:00", "23:30")], [], null);
    expect(h[0]).toBe(5);
    expect(h[h.length - 1]).toBe(23);
  });
  it("considera o horário da simulação e qualquer hora com venda", () => {
    expect(horasDoGrafico(cadastro, [aberto("07:00", "22:00")], null).slice(-1)[0]).toBe(21);
    const m = matriz();
    m[2][22] = 10;
    expect(horasDoGrafico(cadastro, [], m).slice(-1)[0]).toBe(22);
  });
});

describe("estado de cada barra", () => {
  const horas = [7, 8, 9, 18, 20, 21, 22];
  it("aberta, pico (maior entre as abertas) e fechada", () => {
    const fechadas = zeros();
    fechadas[0][20] = true;
    const r = resultado(aberto("08:00", "21:00"), { fechadas });
    const e = estadosDoDia({ dia: 0, horas, resultado: r, serie: venda()[0] });
    expect(e).toEqual(["fechada", "aberta", "aberta", "pico", "aberta", "fechada", "fechada"].map((x, i) => (i === 4 ? "aberta" : x)));
  });
  it("horas fechadas e novas nunca são o pico", () => {
    const v = venda();
    v[0][22] = 99999;
    const novas = zeros();
    novas[0][22] = true;
    const r = resultado(aberto("08:00", "23:00"), { novas, v });
    const e = estadosDoDia({ dia: 0, horas, resultado: r, serie: v[0] });
    expect(e[horas.indexOf(22)]).toBe("nova");
    expect(e[horas.indexOf(18)]).toBe("pico");
  });
  it("hora fora do horário original que continua fechada fica listrada, como a fechada", () => {
    const r = resultado(aberto("08:00", "21:00"));
    expect(estadosDoDia({ dia: 0, horas, resultado: r, serie: venda()[0] })[0]).toBe("fechada");
  });
  it("dia fechado nos dois: nenhuma barra aberta e sem pico", () => {
    const r = resultado(fechado);
    const e = estadosDoDia({ dia: 3, horas, resultado: r, serie: matriz()[3] });
    expect(e.every((x) => x === "fechada")).toBe(true);
  });
});

describe("rótulos", () => {
  it("máscara de reais: R$ mil com uma casa a partir de mil e R$ inteiro abaixo", () => {
    expect(rotuloDaBarra(1300)).toBe("R$ 1,3 mil");
    expect(rotuloDaBarra(1900)).toBe("R$ 1,9 mil");
    expect(rotuloDaBarra(2300)).toBe("R$ 2,3 mil");
    expect(rotuloDaBarra(848)).toBe("R$ 848");
    expect(rotuloDaBarra(0)).toBe("R$ 0");
  });
  it("hora nova com +", () => {
    expect(rotuloDaBarra(300, { nova: true })).toBe("+R$ 300");
    expect(rotuloDaBarra(1200, { nova: true })).toBe("+R$ 1,2 mil");
  });
  it("clientes em número inteiro, sem R$", () => {
    expect(rotuloDaBarra(12.4, { metrica: "clientes" })).toBe("12");
  });
});

describe("resumos do dia", () => {
  it("dia sem hora nova: horas abertas, venda estimada e venda que deixa de entrar", () => {
    const fechadas = zeros();
    fechadas[0][19] = true;
    fechadas[0][20] = true;
    const r = resumoDoDia({ dia: 0, resultado: resultado(aberto("08:00", "19:00"), { fechadas }) });
    expect(r.horasAbertas).toEqual({ valor: 11, apoio: "antes 13h" });
    expect(r.temNova).toBe(false);
    expect(r.vendaQueDeixaDeEntrar.tom).toBe("perigo");
    expect(r.vendaQueDeixaDeEntrar.apoio).toBe("nas horas fechadas");
    expect(r.vendaEstimadaNasHorasNovas).toBeNull();
  });
  it("sem alteração: 'sem alteração' e venda que deixa de entrar neutra em R$ 0", () => {
    const r = resumoDoDia({ dia: 0, resultado: resultado(aberto("08:00", "21:00")) });
    expect(r.horasAbertas.apoio).toBe("sem alteração");
    expect(r.vendaQueDeixaDeEntrar.tom).toBe("neutro");
  });
  it("dia com hora nova: venda estimada nas horas novas em verde, 'por abrir mais neste dia'", () => {
    const novas = zeros();
    novas[0][7] = true;
    novas[0][21] = true;
    const estimada = matriz();
    estimada[0][7] = 300;
    estimada[0][21] = 400;
    const r = resumoDoDia({ dia: 0, resultado: resultado(aberto("07:00", "22:00"), { novas, estimada }) });
    expect(r.temNova).toBe(true);
    expect(r.horasAbertas).toEqual({ valor: 15, apoio: "antes 13h" });
    expect(r.vendaEstimadaNasHorasNovas.texto.replace(/ /g, " ")).toBe("+R$ 700");
    expect(r.vendaEstimadaNasHorasNovas.apoio).toBe("por abrir mais neste dia");
  });
  it("sem valores em reais (não dono) os resumos de venda ficam nulos", () => {
    const r = resumoDoDia({ dia: 0, resultado: resultado(aberto("08:00", "21:00"), { v: null }) });
    expect(r.vendaEstimadaNoDia).toBeNull();
    expect(r.vendaQueDeixaDeEntrar).toBeNull();
  });
});

describe("legenda e apoio", () => {
  it("'Hora nova · venda estimada' só com hora nova", () => {
    expect(legenda({ temNova: false }).map((x) => x[1])).toEqual(["Pico", "Demais horas", "Fechada na simulação"]);
    expect(legenda({ temNova: true }).map((x) => x[1])).toEqual(["Pico", "Demais horas", "Hora nova · venda estimada", "Fechada na simulação"]);
  });
  it("apoio do gráfico acrescenta as horas novas só quando existem", () => {
    expect(apoioDoGrafico({ temNova: false })).toBe("Venda por hora, em R$ · dados do sistema de vendas");
    expect(apoioDoGrafico({ temNova: true })).toBe("Venda por hora, em R$ · dados do sistema de vendas · horas novas em verde, com venda estimada");
  });
});
