import { describe, expect, it } from "vitest";
import { estadoVisual, faixaDosDias, rotuloDoStatus, ROTULOS_DE_STATUS, textoContratar, textoDaVariacao, textoDoTotal, textoIndisponivel } from "./linha-regras.js";

const dia = (d, abre, fecha) => ({ dia: d, aberto: !!abre, abre: abre ?? null, fecha: fecha ?? null });
const semana = (...faixas) => faixas.map((f, i) => dia(i, ...(f ?? [])));

describe("variação em % da venda e do custo", () => {
  it("sempre com seta e sinal, e o menos é o tipográfico", () => {
    expect(textoDaVariacao(1.7, "ok", "venda")).toEqual({ texto: "▲ +1,7%", tom: "sucesso", apoio: null });
    expect(textoDaVariacao(-9.7, "ok", "venda")).toEqual({ texto: "▼ −9,7%", tom: "perigo", apoio: null });
    expect(textoDaVariacao(0, "ok", "venda").texto).toBe("● 0%");
    expect(textoDaVariacao(-9.7, "ok", "venda").texto).toContain("−");
  });
  it("venda: para cima verde, para baixo vermelha; custo: para cima neutro, para baixo verde", () => {
    expect(textoDaVariacao(3.6, "ok", "custo").tom).toBe("neutro");
    expect(textoDaVariacao(-2, "ok", "custo").tom).toBe("sucesso");
    expect(textoDaVariacao(0, "ok", "custo").tom).toBe("neutro");
  });
  it("sem cálculo: traço; sem venda por hora: Não estimada; sem salários: traço com a frase", () => {
    expect(textoDaVariacao(null, "sem_calculo", "venda")).toEqual({ texto: "—", tom: "neutro", apoio: null });
    expect(textoDaVariacao(null, "nao_estimada", "venda")).toEqual({ texto: "Não estimada", tom: "mudo", apoio: null });
    expect(textoDaVariacao(null, "sem_salarios", "custo")).toEqual({ texto: "—", tom: "neutro", apoio: "Informe os salários para ver a variação do custo." });
  });
  it("um valor muito pequeno vira zero, nunca ▲ +0%", () => {
    expect(textoDaVariacao(0.04, "ok", "venda").texto).toBe("● 0%");
  });
});

describe("total de horas e faixa dos 7 dias", () => {
  it("total com a mudança em horas", () => {
    expect(textoDoTotal(103, 9)).toEqual({ principal: "103h por semana", mudanca: "(+9h)", tom: "sucesso" });
    expect(textoDoTotal(85, -9)).toEqual({ principal: "85h por semana", mudanca: "(−9h)", tom: "perigo" });
    expect(textoDoTotal(94, 0)).toEqual({ principal: "94h por semana", mudanca: "sem mudança", tom: "neutro" });
  });
  const hoje = semana(["08:00", "22:00"], ["08:00", "22:00"], ["08:00", "22:00"], ["08:00", "22:00"], ["08:00", "22:00"], ["08:00", "22:00"], ["08:00", "22:00"]);
  it("sem mudança: as horas abertas, nunca um traço, em todos os dias", () => {
    const f = faixaDosDias(hoje, hoje);
    expect(f).toHaveLength(7);
    for (const d of f) expect(d).toMatchObject({ tipo: "igual", principal: "14h", diferenca: null });
  });
  it("aumento, redução e dia fechado", () => {
    const novos = semana(["08:00", "22:00"], ["08:00", "22:00"], ["08:00", "22:00"], ["08:00", "22:00"], ["08:00", "22:00"], ["08:00", "03:00"], null);
    novos[5] = dia(5, "08:00", "23:00"); // sábado: +1h
    novos[4] = dia(4, "08:00", "17:00"); // sexta: −5h
    const f = faixaDosDias(novos, hoje);
    expect(f[5]).toMatchObject({ tipo: "aumento", principal: "15h", diferenca: "+1h" });
    expect(f[4]).toMatchObject({ tipo: "reducao", principal: "9h", diferenca: "−5h" });
    expect(f[6]).toMatchObject({ tipo: "fechado", principal: "Fechado", diferenca: "−14h" });
    expect(f[0].tipo).toBe("igual");
  });
  it("dia que já era fechado continua Fechado, em cinza, sem diferença", () => {
    const antes = semana(["08:00", "22:00"], null, null, null, null, null, null);
    const f = faixaDosDias(antes, antes);
    expect(f[3]).toMatchObject({ tipo: "igual", principal: "Fechado", diferenca: null });
  });
  it("meia hora aparece com vírgula", () => {
    const novos = semana(["08:00", "22:30"]);
    const f = faixaDosDias(novos, semana(["08:00", "22:00"]));
    expect(f[0]).toMatchObject({ principal: "14,5h", diferenca: "+0,5h" });
  });
});

describe("contratar", () => {
  it("inteiras, parcial e nenhuma", () => {
    expect(textoContratar([{ funcao: "Farmacêutico", inteiras: 0, parcialHoras: 20 }])).toEqual(["1 farmacêutico · parcial"]);
    expect(textoContratar([{ funcao: "Atendimento", inteiras: 1, parcialHoras: 18 }, { funcao: "Caixa", inteiras: 2, parcialHoras: 0 }])).toEqual(["1 atendente", "1 atendente · parcial", "2 caixas"]);
    expect(textoContratar([])).toEqual(["Nenhuma contratação"]);
  });
});

describe("status e estado visual", () => {
  it("cada status tem pill curta (até 4 palavras, uma linha), ícone e tom", () => {
    expect(Object.keys(ROTULOS_DE_STATUS)).toHaveLength(7);
    for (const r of Object.values(ROTULOS_DE_STATUS)) {
      expect(r.texto.split(" ").length).toBeLessThanOrEqual(4);
      expect(r.icone).toBeTruthy();
    }
    expect(rotuloDoStatus("nao_resolve")).toMatchObject({ texto: "Não resolve sozinho", tom: "perigo" });
    expect(rotuloDoStatus("vende_mais").tom).toBe("sucesso");
    expect(rotuloDoStatus(null)).toBeNull();
  });
  it("estado visual: indisponível, rebaixado ou normal (nenhum cenário é destacado como sugerido)", () => {
    expect(estadoVisual({ indisponivel: { motivo: "custos" }, status: null })).toBe("indisponivel");
    for (const s of ["inviavel", "nao_resolve", "nao_recomendado"]) expect(estadoVisual({ status: s })).toBe("rebaixado");
    expect(estadoVisual({ status: "vende_mais" })).toBe("normal");
  });
  it("texto de indisponível por perfil", () => {
    expect(textoIndisponivel({ dono: true })).toBe("Informe as vendas por dia ou por hora e os salários para calcular este cenário.");
    expect(textoIndisponivel({ dono: false })).toBe("O dono ainda não informou os custos.");
  });
});
