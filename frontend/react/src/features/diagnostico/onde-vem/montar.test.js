import { describe, expect, it } from "vitest";
import { buildObservacaoPico, isHoraPico, janelaDaLoja, lerTurno, montarCobertura, montarEquipe, montarOito24, montarRegras, montarSecao, segmentosDoTurno, turnosDaGrade } from "./montar.js";

// ---- Fixture com os números do desenho (Sumaré - Centro) --------------------------------------------------------------
const dia = { aberta: true, abre: "08:00", fecha: "21:00" };
const horarios = { versao: 2, dias: [dia, dia, dia, dia, dia, { aberta: true, abre: "08:00", fecha: "20:00" }, dia] };
const vendasPorHora = { 6: 197, 7: 3482, 8: 10044, 9: 17504, 10: 24094, 11: 26164, 12: 20258, 13: 18148, 14: 18757, 15: 16626, 16: 16181, 17: 15399, 18: 9777, 19: 9163, 20: 4921, 21: 2609 };
const atend = { 8: 4, 9: 5, 10: 5, 11: 5, 12: 5, 13: 8, 14: 8, 15: 8, 16: 5, 17: 4, 18: 3, 19: 3, 20: 3 };
const farma = { 8: 1, 9: 2, 10: 2, 11: 2, 12: 2, 13: 2, 14: 3, 15: 2, 16: 2, 17: 2, 18: 1, 19: 1, 20: 1 };
const horasAbertas = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const funcaoCob = (funcao, valores, exigido) => ({ funcao, minimo: exigido, porHora: horasAbertas.map((hora) => ({ hora, pessoas: valores[hora], ok: valores[hora] >= exigido, exigido })) });
const fun = (o) => ({ pessoas: 3, minimo: 0, obrigatorio: false, origemMeta: "nivel_de_hoje", metaH: 0, necessidadeH: 0, necessidadeT: 0, capacidadeH: 0, capacidadeT: 0, saldoH: 0, saldoT: 0, okH: true, okT: true, gapH: 0, ...o });
const regra = (id, nome, vigencia, descricao, farmaceutico, atendimento) => ({ id, nome, vigencia, descricao, funcoes: [fun({ funcao: "Farmacêutico", obrigatorio: true, origemMeta: "lei", ...farmaceutico }), fun({ funcao: "Atendimento", pessoas: 8, ...atendimento })] });
const diag = (extra = {}) => ({
  loja: { id: "L1", codigo: "1099", nome: "Sumaré - Centro", horarios },
  config: { convencao8h24: false, modoMinimo: "turnos", turnos: [{ nome: "1", inicio: "08:00", fim: "17:00" }, { nome: "2", inicio: "17:00", fim: "21:00" }] },
  fontes: { base: { arquivo: "base.csv (média por dia)" } },
  cobertura: { horas: horasAbertas, funcoes: [funcaoCob("Farmacêutico", farma, 1), funcaoCob("Atendimento", atend, 0)] },
  vendas: { periodo: {}, horas: Object.entries(vendasPorHora).map(([h, v]) => ({ hora: Number(h), vendaMedia: v, participacao: v / 200000 })) },
  regras: [
    regra("atual", "44h (regra atual)", "hoje", "6 dias · até 8h por dia · teto 44h", { pessoas: 3, necessidadeH: 77, necessidadeT: 12, capacidadeH: 132, capacidadeT: 18, saldoH: 55, saldoT: 6 }, { capacidadeH: 352, metaH: 352, necessidadeH: 352, saldoH: 0 }),
    regra("r42", "42h", "16/12/2026", "Sem convenção que permita 8h24: na prática 40h (5 × 8h)", { necessidadeH: 77, necessidadeT: 12, capacidadeH: 120, capacidadeT: 15, saldoH: 43, saldoT: 3 }, { capacidadeH: 320, metaH: 352, necessidadeH: 352, saldoH: -32, okH: false, gapH: 32 }),
    regra("r40", "40h", "01/12/2027", "5 dias · até 8h por dia · teto 40h", { necessidadeH: 77, necessidadeT: 12, capacidadeH: 120, capacidadeT: 15, saldoH: 43, saldoT: 3 }, { capacidadeH: 320, metaH: 352, necessidadeH: 352, saldoH: -32, okH: false, gapH: 32 }),
  ].map((r) => ({ ...r, funcoes: r.funcoes })),
  quadro: [{ funcao: "Atendimento", pessoas: 8, cargaTotalH: 352 }, { funcao: "Farmacêutico", pessoas: 3, cargaTotalH: 132 }],
  colaboradores: [
    { matricula: "262", nome: "Eliane", funcao: "Farmacêutico", dias: "Seg a Dom", turno: "07:00–15:00", intervalo: "sem intervalo", cargaH: 44, status: "ok" },
    { matricula: "484", nome: "Alda", funcao: "Atendimento", dias: "Seg a Dom", turno: "08:00–17:00", intervalo: "sem intervalo", cargaH: 44, status: "ok" },
    { matricula: "111", nome: "Gilberto", funcao: "Atendimento", dias: "Seg a Dom", turno: "13:00–22:00", intervalo: "sem intervalo", cargaH: 44, status: "ok" },
    { matricula: "9", nome: "Silvio", funcao: null, dias: "—", turno: "—", intervalo: "—", cargaH: 0, status: "fora_calculo" },
  ],
  ...extra,
});
// Com 8h24 o atendimento teria 336h e faltariam 16h em vez de 32h.
const comOito24 = () => {
  const d = diag();
  d.regras[1].com8h24 = { funcoes: [{ funcao: "Farmacêutico", capacidadeH: 126, necessidadeH: 77, saldoH: 49, gapH: 0 }, { funcao: "Atendimento", capacidadeH: 336, necessidadeH: 352, saldoH: -16, gapH: 16 }] };
  return d;
};

describe("hora de pico e janela da loja", () => {
  it("pico = venda ≥ 75% do maior valor: reproduz 10h, 11h e 12h do desenho", () => {
    const max = 26164;
    const picos = Object.entries(vendasPorHora).filter(([, v]) => isHoraPico(v, max)).map(([h]) => Number(h));
    expect(picos).toEqual([10, 11, 12]);
    expect(isHoraPico(0, 0)).toBe(false);
  });
  it("janela da loja: do primeiro horário aberto ao último", () => {
    expect(janelaDaLoja(horarios)).toMatchObject({ abre: 8, fecha: 21, texto: "08:00 às 21:00" });
    expect(janelaDaLoja({ dias: [{ aberta: false }] })).toBeNull();
  });
});

describe("aba 1 — cobertura e vendas", () => {
  const c = montarCobertura(diag());
  it("o eixo junta o horário da loja e as horas com venda: 06h a 21h", () => {
    expect(c.eixo[0]).toBe(6);
    expect(c.eixo[c.eixo.length - 1]).toBe(21);
    expect(c.eixo).toHaveLength(16);
  });
  it("horas fora do horário viram células 'fora', sem número e sem mínimo", () => {
    const f = c.funcoes.find((x) => x.funcao === "Farmacêutico");
    const por = Object.fromEntries(f.celulas.map((x) => [x.hora, x]));
    expect(por[6]).toMatchObject({ pessoas: null, estado: "fora", exigido: 0 });
    expect(por[21].estado).toBe("fora");
    expect(por[8]).toMatchObject({ pessoas: 1, estado: "atende", exigido: 1 });
    expect(f.rotuloMinimo).toBe("mínimo 1 pessoa");
    expect(c.funcoes.find((x) => x.funcao === "Atendimento").rotuloMinimo).toBe("sem mínimo por hora");
  });
  it("célula abaixo do mínimo: estado 'abaixo'", () => {
    const d = diag();
    d.cobertura.funcoes[0].porHora[2] = { hora: 10, pessoas: 0, ok: false, exigido: 1 };
    const f = montarCobertura(d).funcoes[0];
    expect(f.celulas.find((x) => x.hora === 10).estado).toBe("abaixo");
  });
  it("vendas: picos marcados e as horas fora do horário (06h, 07h, 21h) apontadas", () => {
    const picos = c.vendas.horas.filter((h) => h.pico).map((h) => h.hora);
    expect(picos).toEqual([10, 11, 12]);
    expect(c.vendasForaDoHorario).toEqual({ horas: [6, 7, 21], janela: "08:00 às 21:00" });
    expect(c.vendas.emReais).toBe(true);
  });
  it("quem não é dono não recebe R$: o valor vira a participação do dia", () => {
    const d = diag();
    d.vendas.horas = d.vendas.horas.map(({ vendaMedia: _, ...resto }) => resto);
    const v = montarCobertura(d).vendas;
    expect(v.emReais).toBe(false);
    expect(v.horas.find((h) => h.hora === 11).valor).toBeCloseTo(26164 / 200000, 5);
  });
  it("sem vendas: sem linha de vendas, sem observação e sem 'vendas fora do horário'", () => {
    const m = montarCobertura(diag({ vendas: null }));
    expect(m.vendas).toBeNull();
    expect(m.observacao).toBeNull();
    expect(m.vendasForaDoHorario).toBeNull();
  });
  it("turnos recortados ao horário da loja; fonte das vendas é o arquivo da base", () => {
    expect(c.turnos.lanes.flat().map((t) => [t.rotulo, t.faixas])).toEqual([["Turno 1 · 08:00–17:00", [{ de: 8, ate: 17 }]], ["Turno 2 · 17:00–21:00", [{ de: 17, ate: 21 }]]]);
    expect(c.fonteVendas).toBe("base.csv (média por dia)");
  });
  it("turnos sobrepostos e que passam do horário: todos visíveis, recortados, em linhas separadas", () => {
    const d = diag({ config: { modoMinimo: "turnos", turnos: [{ nome: "1", inicio: "07:00", fim: "15:00" }, { nome: "2", inicio: "12:00", fim: "22:00" }] } });
    const t = montarCobertura(d).turnos;
    expect(t.sobrepoe).toBe(true);
    expect(t.lanes).toHaveLength(2);
    const [a, b] = t.lanes.flat();
    expect(a.faixas).toEqual([{ de: 8, ate: 15 }]); // começa 07:00, antes da abertura: só vale a partir das 08h
    expect(b.faixas).toEqual([{ de: 12, ate: 21 }]); // termina 22:00, depois do fechamento: só vale até as 21h
    expect(a.rotulo).toContain("07:00–15:00"); // o texto mostra o horário real do turno
  });
  it("sem turnos ou no modo 'unico': nada de linha de turnos", () => {
    expect(turnosDaGrade({ modoMinimo: "turnos", turnos: [] }, new Set([8]))).toBeNull();
    expect(turnosDaGrade({ modoMinimo: "unico", turnos: [{ nome: "1", inicio: "08:00", fim: "17:00" }] }, new Set([8]))).toBeNull();
  });
});

describe("observação do pico", () => {
  const atendimento = montarCobertura(diag()).funcoes.find((f) => f.funcao === "Atendimento");
  const vendas = montarCobertura(diag()).vendas;
  it("mostra o texto do desenho: 5 atendentes no pico, 8 pessoas só entre 13h e 15h", () => {
    const o = buildObservacaoPico({ vendas, atendimento });
    expect(o).toMatchObject({ horaIni: 10, horaFim: 12, pessoasNoPico: 5, pessoasFora: 8, h1: 13, h2: 15 });
    expect(o.texto).toBe("No pico de vendas, das 10h às 12h, há 5 atendentes. As 8 pessoas só aparecem entre 13h e 15h, quando as vendas já são menores. Dá para testar outros horários em Personalizar.");
  });
  it("não aparece quando o pico já tem o maior número de pessoas", () => {
    const d = diag();
    d.cobertura.funcoes[1] = funcaoCob("Atendimento", { ...atend, 10: 8, 11: 8, 12: 8 }, 0);
    expect(montarCobertura(d).observacao).toBeNull();
  });
  it("não aparece sem vendas nem sem atendimento", () => {
    expect(buildObservacaoPico({ vendas: null, atendimento })).toBeNull();
    expect(buildObservacaoPico({ vendas, atendimento: null })).toBeNull();
  });
});

describe("aba 2 — resultado por regra", () => {
  it("cabeçalhos: 'Atende' só quando tudo atende; 'Falta atendimento' quando a meta não fecha; vigência e resumo", () => {
    const { colunas } = montarRegras(diag(), "r42");
    expect(colunas.map((c) => [c.nome, c.statusTexto, c.vigencia])).toEqual([
      ["Hoje · 44h", "Atende", "Em vigor"],
      ["42h", "Falta atendimento", "A partir de 16/12/2026"],
      ["40h", "Falta atendimento", "A partir de 01/12/2027"],
    ]);
    expect(colunas[1].resumo).toBe("5 dias · até 8h por dia. Sem 8h24, na prática 40h");
    expect(colunas[2].resumo).toBe("5 dias · até 8h por dia · teto de 40h");
    expect(colunas[0].resumo).toBe("6 dias · até 8h por dia · teto de 44h");
  });
  it("a regra escolhida no topo é a destacada; com 8h24 o texto de 42h muda", () => {
    expect(montarRegras(diag(), "r42").colunas.map((c) => c.destacada)).toEqual([false, true, false]);
    const d = diag();
    d.config.convencao8h24 = true;
    expect(montarRegras(d, "atual").colunas[1].resumo).toBe("5 dias · até 8h24 por dia · teto de 42h");
  });
  it("linhas: saldos em texto (sobram/faltam/atinge a meta), sem parênteses com sinal", () => {
    const { linhas } = montarRegras(diag(), "r42");
    const f = linhas.find((l) => l.funcao === "Farmacêutico");
    const a = linhas.find((l) => l.funcao === "Atendimento");
    expect(f.precisaTexto).toBe("Precisa de 77h por semana e 12 turnos");
    expect(f.celulas[0]).toMatchObject({ capacidadeH: 132, ok: true, pessoasTexto: "3 pessoas × 44h · sobram 55h", turnosTexto: "18 turnos · sobram 6" });
    expect(f.celulas[1].pessoasTexto).toBe("3 pessoas × 40h · sobram 43h");
    expect(a.precisaTexto).toBe("Precisa de 352h por semana");
    expect(a.celulas[0].pessoasTexto).toBe("8 pessoas × 44h · atinge a meta");
    expect(a.celulas[1]).toMatchObject({ ok: false, pessoasTexto: "8 pessoas × 40h · faltam 32h" });
    expect(a.celulas[1].turnosTexto).toBeNull();
    expect(JSON.stringify(linhas)).not.toMatch(/\(−|\(\+/);
  });
  it("barras com escala comum por função: o traço do que precisa e a parte que falta", () => {
    const a = montarRegras(diag(), "r42").linhas.find((l) => l.funcao === "Atendimento");
    expect(a.celulas[0].barra).toEqual({ capacidade: 1, precisa: 1, falta: false });
    expect(a.celulas[1].barra.capacidade).toBeCloseTo(320 / 352, 5);
    expect(a.celulas[1].barra).toMatchObject({ precisa: 1, falta: true });
  });
  it("mais de uma função em falta: 'Faltam 2 funções'", () => {
    const d = diag();
    d.regras[2].funcoes[0] = { ...d.regras[2].funcoes[0], okH: false, saldoH: -5, okT: true };
    expect(montarRegras(d, "r40").colunas[2].statusTexto).toBe("Faltam 2 funções");
  });
});

describe("8h24", () => {
  it("aparece quando a convenção está desligada e a estimativa reduz o que falta: 336h, faltariam 16h em vez de 32h", () => {
    const o = montarOito24(comOito24());
    expect(o).toMatchObject({ funcao: "Atendimento", comH: 336, faltariaH: 16, faltaHoje: 32 });
    expect(o.texto).toContain("O atendimento teria 336h e faltariam 16h em vez de 32h");
  });
  it("não aparece com a convenção ligada, sem o campo do servidor ou sem melhora", () => {
    const ligada = comOito24();
    ligada.config.convencao8h24 = true;
    expect(montarOito24(ligada)).toBeNull();
    expect(montarOito24(diag())).toBeNull();
    const igual = comOito24();
    igual.regras[1].com8h24.funcoes[1] = { funcao: "Atendimento", capacidadeH: 320, necessidadeH: 352, saldoH: -32, gapH: 32 };
    expect(montarOito24(igual)).toBeNull();
  });
  it("se resolve de vez, diz que não faltaria nada", () => {
    const d = comOito24();
    d.regras[1].com8h24.funcoes[1] = { funcao: "Atendimento", capacidadeH: 352, necessidadeH: 352, saldoH: 0, gapH: 0 };
    expect(montarOito24(d).texto).toContain("não faltaria nada");
  });
});

describe("aba 3 — equipe", () => {
  const e = montarEquipe(diag());
  it("totais e grupos por função, com 'Sem função de escala' no fim", () => {
    expect(e.noCalculo).toBe(3);
    expect(e.foraDoCalculo).toBe(1);
    expect(e.grupos.map((g) => [g.titulo, g.pessoas])).toEqual([["Farmacêutico", 3], ["Atendimento", 8], ["Sem função de escala", 1]]);
    expect(e.grupos[0].horas).toBe(132);
    expect(e.grupos[1].horas).toBe(352);
  });
  it("dias com 'a' minúsculo e situação em texto; fora do cálculo com traços e o motivo", () => {
    const eliane = e.grupos[0].linhas[0];
    expect(eliane).toMatchObject({ dias: "Seg a dom", turnoTexto: "07:00–15:00", situacao: "No cálculo", cargaH: 44 });
    const silvio = e.grupos[2].linhas[0];
    expect(silvio).toMatchObject({ dias: "—", turnoTexto: "—", intervalo: "—", cargaH: null, situacao: "Fora do cálculo", motivo: "Sem função de escala, não entra no cálculo" });
  });
  it("linha do tempo: 07:00–15:00 com a loja abrindo às 08h tem a parte das 07h fora e o resto dentro", () => {
    const seg = e.grupos[0].linhas[0].segmentos;
    expect(seg).toEqual([{ de: 7, ate: 8, dentro: false }, { de: 8, ate: 15, dentro: true }]);
  });
  it("turno que passa do fechamento: 13:00–22:00 com a loja fechando às 21h tem a última hora fora", () => {
    const seg = e.grupos[1].linhas.find((l) => l.matricula === "111").segmentos;
    expect(seg).toEqual([{ de: 13, ate: 21, dentro: true }, { de: 21, ate: 22, dentro: false }]);
  });
  it("eixo: de 06h a 22h, ampliado se alguém passar disso", () => {
    expect(e.eixo).toEqual({ ini: 6, fim: 22 });
    const d = diag();
    d.colaboradores[1] = { ...d.colaboradores[1], turno: "05:00–23:00" };
    expect(montarEquipe(d).eixo).toEqual({ ini: 5, fim: 23 });
  });
  it("lê o turno em texto e ignora o que não tem turno", () => {
    expect(lerTurno("07:00–16:00")).toMatchObject({ inicio: "07:00", fim: "16:00", de: 7, ate: 16 });
    expect(lerTurno("—")).toBeNull();
    expect(segmentosDoTurno(null, { abre: 8, fecha: 21 })).toEqual([]);
  });
});

describe("montarSecao", () => {
  it("monta as três abas de uma vez; sem regras, a aba 2 fica vazia", () => {
    const s = montarSecao(diag(), "r42");
    expect(s.cobertura).not.toBeNull();
    expect(s.regras.colunas).toHaveLength(3);
    expect(s.equipe.total).toBe(4);
    expect(montarSecao(diag({ regras: [] }), "r42").regras).toBeNull();
  });
});
