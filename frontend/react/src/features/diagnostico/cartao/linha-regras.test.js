import { describe, expect, it } from "vitest";
import { estadoVisual, faixaDosDias, rotuloDoStatus, ROTULOS_DE_STATUS, textoContratar, textoDaVariacao, textoDaFolha, cabecalhoDaFolha, textoDoTotal, textoIndisponivel, partesDaExplicacao } from "./linha-regras.js";

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
    expect(textoContratar([{ funcao: "Atendimento", inteiras: 1, parcialHoras: 18 }, { funcao: "Caixa", inteiras: 2, parcialHoras: 0 }])).toEqual(["1 atendente · desejável", "1 atendente · parcial · desejável", "2 caixas · desejável"]);
    expect(textoContratar([{ funcao: "Farmacêutico", inteiras: 1, parcialHoras: 0 }, { funcao: "Atendimento", inteiras: 1, parcialHoras: 0 }])).toEqual(["1 farmacêutico", "1 atendente · desejável"]);
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

describe("textoDaFolha (spec 050, layout A3)", () => {
  const dono = (sentido, c) => ({ custoEstado: "ok", custoSentido: sentido, custoPctFaturamento: c });
  it("Cosmópolis, Manter horários: 9,7% (hoje 8,0%), chip +1,7% e R$ 7.659 a mais por mês", () => {
    const t = textoDaFolha(dono("aumenta", { hoje: 8, depois: 9.7, aumentoPp: 1.7, aumentoMensal: 7659 }), true);
    expect(t).toMatchObject({ tipo: "dono", peso: "9,7%", hoje: "hoje 8,0%", chip: { texto: "+1,7%", tom: "aumenta" }, reais: "R$ 7.659 a mais por mês" });
    expect(t.ariaLabel).toBe("Folha sobe 1,7 ponto percentual, de 8,0% para 9,7% do faturamento");
  });
  it("Cosmópolis, Sem contratações: chip neutro 'folha igual' e 'Sobe só porque a venda cai.'", () => {
    const t = textoDaFolha(dono("igual", { hoje: 8, depois: 8.2, aumentoPp: 0.2, aumentoMensal: 0 }), true);
    expect(t).toMatchObject({ peso: "8,2%", chip: { texto: "folha igual", tom: "igual" }, reais: "Sobe só porque a venda cai." });
    expect(JSON.stringify(t)).not.toMatch(/p\.p\.|R\$ 0/);
  });
  it("igual sem o peso subir: sem a frase da venda", () => {
    expect(textoDaFolha(dono("igual", { hoje: 8, depois: 8, aumentoPp: 0, aumentoMensal: 0 }), true).reais).toBeNull();
  });
  it("reduz equipe: chip verde −0,6% (sinal U+2212) e R$ 2.340 a menos por mês", () => {
    const t = textoDaFolha(dono("diminui", { hoje: 8, depois: 7.4, aumentoPp: -0.6, aumentoMensal: -2340 }), true);
    expect(t).toMatchObject({ peso: "7,4%", chip: { texto: "−0,6%", tom: "diminui" }, reais: "R$ 2.340 a menos por mês" });
    expect(t.chip.texto.charCodeAt(0)).toBe(0x2212);
    expect(t.ariaLabel).toBe("Folha cai 0,6 ponto percentual, de 8,0% para 7,4% do faturamento");
  });
  it("Paulínia, Manter horários: 14,7% (hoje 10,3%), +4,4% e R$ 11.112 a mais por mês", () => {
    const t = textoDaFolha(dono("aumenta", { hoje: 10.3, depois: 14.7, aumentoPp: 4.4, aumentoMensal: 11112 }), true);
    expect(t).toMatchObject({ peso: "14,7%", hoje: "hoje 10,3%", chip: { texto: "+4,4%" }, reais: "R$ 11.112 a mais por mês" });
  });
  it("o chip bate com a diferença dos pesos exibidos", () => {
    const t = textoDaFolha(dono("aumenta", { hoje: 8, depois: 9.7, aumentoPp: 1.7, aumentoMensal: 7659 }), true);
    expect(Number(t.peso.replace(",", ".").replace("%", "")) - Number(t.hoje.replace("hoje ", "").replace(",", ".").replace("%", ""))).toBeCloseTo(Number(t.chip.texto.replace("+", "").replace(",", ".").replace("%", "")), 9);
  });
  it("gestor e consulta: só Aumenta, Igual e Diminui, sem nenhum número", () => {
    for (const [s, txt] of [["aumenta", "Aumenta"], ["igual", "Igual"], ["diminui", "Diminui"]]) {
      const t = textoDaFolha({ custoEstado: "ok", custoSentido: s }, false);
      expect(t).toMatchObject({ tipo: "chip", chip: { texto: txt } });
      expect(JSON.stringify(t)).not.toMatch(/\d/);
    }
  });
  it("dados que faltam: as frases do dono e a do gestor, sem números", () => {
    expect(textoDaFolha({ custoEstado: "sem_salarios" }, true)).toEqual({ tipo: "falta", frase: "Informe os salários para ver o custo de pessoal." });
    expect(textoDaFolha({ custoEstado: "sem_faturamento", custoSentido: "aumenta" }, true)).toEqual({ tipo: "falta", frase: "Informe o faturamento para ver o peso da folha." });
    expect(textoDaFolha({ custoEstado: "sem_salarios" }, false)).toEqual({ tipo: "falta", frase: "Dados do custo ainda não informados." });
  });
  it("cabeçalho por perfil", () => {
    expect(cabecalhoDaFolha(true)).toBe("Folha no faturamento");
    expect(cabecalhoDaFolha(false)).toBe("Custo de pessoal");
  });
});

describe("partesDaExplicacao (spec 051)", () => {
  it("devolve os trechos e o texto corrido, com o negrito preservado", () => {
    const r = partesDaExplicacao({ explicacao: { partes: [{ texto: "Sem contratar ninguém. " }, { texto: "Mesmo assim, ainda faltariam 17 h de farmacêutico por semana.", negrito: true }, { texto: " Entre em Analisar." }] } });
    expect(r.partes[1].negrito).toBe(true);
    expect(r.texto).toBe("Sem contratar ninguém. Mesmo assim, ainda faltariam 17 h de farmacêutico por semana. Entre em Analisar.");
  });
  it("sem frase (ou com trechos vazios) devolve nulo", () => {
    expect(partesDaExplicacao({})).toBeNull();
    expect(partesDaExplicacao({ explicacao: null })).toBeNull();
    expect(partesDaExplicacao({ explicacao: { partes: [{ texto: "" }] } })).toBeNull();
  });
  it("a frase não usa p.p., pontos nem Personalizar", () => {
    const r = partesDaExplicacao({ explicacao: { partes: [{ texto: "Entre em Analisar para escolher quais." }] } });
    expect(r.texto).not.toMatch(/p\.p\.|pontos|Personalizar/);
  });
});
