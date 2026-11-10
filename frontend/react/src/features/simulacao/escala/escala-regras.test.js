import { describe, expect, it } from "vitest";
import {
  turnosParaGravar, avisosDaPessoa, novoTurnoNaFolga, semTurnoNoDia, sugerirTurnosDasVagas, turnoHabitual, turnosParaVaga, vagaSemTurnos,
  cargaDaContratacao, celulasDaFuncao, contratacoesSimuladas, diasDasAbas, efeitoDaContratacao, erroDoFormulario, faixaDeAviso,
  faltasDaFuncao, horasDoDia, horasReforcadas, mediaDoDia, minimoDaFuncao, quartis, recalcularCobertura, sugerirContratacao,
  diasPorExtenso, faixaDasFaltas, opcoesDeHora, textoDaSugestao, textoDoEfeito, textoDoTurno, tomDoQuartil, totalDaSemana, turnosDoFormulario,
} from "./escala-regras.js";

const REGRA = { teto: 42, dias: 5, maxDia: 8 }; // teto efetivo 40
const cel = (hora, pessoas, exigido = 1) => ({ hora, pessoas, exigido, ok: pessoas >= exigido });
const cob = (funcao, pares, exigido = 1) => ({ funcao, minimo: exigido, porHora: pares.map(([h, p]) => cel(h, p, exigido)) });
const horas = (de, ate, pessoas) => Array.from({ length: ate - de + 1 }, (_, i) => [de + i, typeof pessoas === "function" ? pessoas(de + i) : pessoas]);

describe("dias e horas", () => {
  it("as abas seguem os dias abertos, em ordem, com o nome", () => {
    expect(diasDasAbas([{ dia: 5, abre: 8, fecha: 20 }, { dia: 0, abre: 7, fecha: 22 }]).map((a) => [a.dia, a.nome])).toEqual([[0, "Seg"], [5, "Sáb"]]);
    expect(diasDasAbas([{ dia: 6, abre: 8, fecha: 14 }])[0].nome).toBe("Dom");
  });
  it("as horas abertas do dia, incluindo meia hora no fechamento", () => {
    expect(horasDoDia({ abre: 7, fecha: 22 })).toHaveLength(15);
    expect(horasDoDia({ abre: 8, fecha: 20.5 })).toEqual([8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(horasDoDia(null)).toEqual([]);
  });
  it("texto do turno", () => {
    expect(textoDoTurno({ entrada: 7, saida: 15 })).toBe("07h–15h");
    expect(textoDoTurno({ entrada: 7.5, saida: 15.25 })).toBe("07h30–15h15");
  });
});

describe("venda e clientes: quatro tons por quartil do dia", () => {
  const v = [420, 780, 1150, 1320, 1180, 980, 860, 790, 850, 1010, 1290, 1410, 1120, 760, 430];
  it("o mais baixo é o tom 0 e o mais alto é o tom 3", () => {
    const qs = quartis(v);
    expect(tomDoQuartil(420, qs)).toBe(0);
    expect(tomDoQuartil(1410, qs)).toBe(3);
    expect(new Set(v.map((x) => tomDoQuartil(x, qs))).size).toBe(4);
  });
  it("sem movimento, tudo é o tom mais claro", () => {
    expect(quartis([0, 0])).toEqual([0, 0, 0]);
    expect(tomDoQuartil(0, [0, 0, 0])).toBe(0);
  });
  it("média do dia", () => {
    expect(mediaDoDia([100, 200, 300])).toBe(200);
    expect(mediaDoDia([])).toBe(0);
  });
});

describe("pessoas e turnos", () => {
  const turnos = [
    { matricula: "A", dia: 0, entrada: 7, saida: 15, iniIntervalo: null, fimIntervalo: null },
    { matricula: "A", dia: 1, entrada: 7, saida: 16, iniIntervalo: 11, fimIntervalo: 12 },
  ];
  it("total da semana descontando o intervalo", () => {
    expect(totalDaSemana(turnos, "A")).toEqual({ horas: 16, dias: 2, texto: "16h · 2 dias" });
    expect(totalDaSemana(turnos, "B").texto).toBe("sem turnos");
  });
});

describe("cobertura", () => {
  it("abaixo do mínimo aparece com N !; reforçada marca a borda", () => {
    const c = cob("Farmacêutico", horas(18, 21, (h) => (h >= 19 ? 0 : 1)));
    const cels = celulasDaFuncao(c, new Set([20]));
    expect(cels.map((x) => x.texto)).toEqual(["1", "0 !", "0 !", "0 !"]);
    expect(cels.find((x) => x.hora === 20).reforcada).toBe(true);
    expect(cels.find((x) => x.hora === 19).reforcada).toBe(false);
  });
  it("mínimo da função: único, com reforço ou sem", () => {
    expect(minimoDaFuncao(cob("F", horas(8, 12, 1)).porHora)).toBe("mín. 1");
    expect(minimoDaFuncao([cel(8, 2, 2), cel(9, 2, 5), cel(10, 2, 2)])).toBe("mín. 2 + reforço");
    expect(minimoDaFuncao([cel(8, 0, 0), cel(9, 0, 0)])).toBe("sem mínimo");
    expect(minimoDaFuncao([cel(8, 1, 0), cel(9, 1, 2)])).toBe("mín. 2 em parte do dia");
  });
  it("recalcula pessoas e ok quando os turnos mudam", () => {
    const c = cob("Farmacêutico", horas(8, 12, 0));
    const r = recalcularCobertura(c, [{ entrada: 9, saida: 11, iniIntervalo: null, fimIntervalo: null }]);
    expect(r.porHora.map((x) => [x.hora, x.pessoas, x.ok])).toEqual([[8, 0, false], [9, 1, true], [10, 1, true], [11, 0, false], [12, 0, false]]);
    const comIntervalo = recalcularCobertura(c, [{ entrada: 8, saida: 12, iniIntervalo: 10, fimIntervalo: 11 }]);
    expect(comIntervalo.porHora.map((x) => x.pessoas)).toEqual([1, 1, 0, 1, 0]);
  });
});

describe("faixa de aviso", () => {
  it("diz quantas horas faltam, de qual função, em que dia e faixa", () => {
    const dia = [cob("Farmacêutico", horas(18, 21, (h) => (h >= 19 ? 0 : 1))), cob("Atendimento", horas(18, 21, 2), 2)];
    expect(faixaDeAviso(dia, 5)).toBe("Faltam 3 h de farmacêutico no sábado, das 19h às 21h. Contratar na linha da função resolve.");
    expect(faixaDeAviso(dia, 0)).toContain("na segunda");
  });
  it("várias faixas e várias funções", () => {
    const dia = [cob("Farmacêutico", [[8, 0], [9, 1], [10, 0]]), cob("Caixa", [[9, 0], [10, 0]])];
    expect(faixaDeAviso(dia, 2)).toBe("Faltam 2 h de farmacêutico na quarta, às 8h e às 10h. Faltam 2 h de caixa na quarta, das 9h às 10h. Contratar na linha da função resolve.");
  });
  it("some quando a cobertura fecha", () => {
    expect(faixaDeAviso([cob("Farmacêutico", horas(8, 12, 1))], 1)).toBeNull();
  });
  it("faixas seguidas", () => {
    expect(faltasDaFuncao(cob("F", [[8, 0], [9, 0], [10, 1], [11, 0]]))).toEqual([{ de: 8, ate: 9, horas: 2 }, { de: 11, ate: 11, horas: 1 }]);
  });
});

describe("contratação: turnos, carga e erros", () => {
  it("gera o mesmo horário nos dias escolhidos, com intervalo no meio quando passa de 6 h", () => {
    expect(turnosDoFormulario({ dias: [5, 4], entra: 16, sai: 22 })).toEqual([
      { dia: 4, entrada: 16, saida: 22, iniIntervalo: null, fimIntervalo: null },
      { dia: 5, entrada: 16, saida: 22, iniIntervalo: null, fimIntervalo: null },
    ]);
    expect(turnosDoFormulario({ dias: [0], entra: 8, sai: 17 })[0]).toMatchObject({ iniIntervalo: 12, fimIntervalo: 13 });
  });
  it("carga: integral é a jornada cheia; parcial é a soma dos turnos", () => {
    expect(cargaDaContratacao({ tipo: "integral", turnos: [], regra: REGRA })).toBe(40);
    expect(cargaDaContratacao({ tipo: "integral", turnos: [], regra: { teto: 44, dias: 6, maxDia: 8 } })).toBe(44);
    expect(cargaDaContratacao({ tipo: "parcial", turnos: turnosDoFormulario({ dias: [4, 5], entra: 16, sai: 22 }), regra: REGRA })).toBe(12);
  });
  it("erros do formulário", () => {
    const base = { tipo: "parcial", dias: [4, 5], entra: 16, sai: 22, regra: REGRA };
    expect(erroDoFormulario(base)).toBeNull();
    expect(erroDoFormulario({ ...base, dias: [] })).toBe("Escolha ao menos um dia.");
    expect(erroDoFormulario({ ...base, entra: 22, sai: 16 })).toBe("A saída precisa ser depois da entrada.");
    expect(erroDoFormulario({ ...base, dias: [0, 1, 2, 3, 4, 5], entra: 8, sai: 14 })).toBe("O parcial vai até 30 horas por semana.");
    expect(erroDoFormulario({ ...base, dias: [4], entra: 16, sai: 18 })).toBe("A contratação precisa ter ao menos 4 horas por semana.");
    expect(erroDoFormulario({ ...base, dias: [4], entra: 8, sai: 20 })).toBe("Esta regra vai até 8h por dia.");
    expect(erroDoFormulario({ ...base, tipo: "integral", dias: [0, 1, 2, 3, 4, 5], entra: 8, sai: 17 })).toBe("Esta regra permite até 5 dias por semana.");
  });
});

describe("sugestão de contratação", () => {
  const abas = [4, 5].map((dia) => ({ dia, abre: 8, fecha: 22 }));
  const semFalta = Object.fromEntries(abas.map((a) => [a.dia, cob("Farmacêutico", horas(8, 21, 1))]));

  it("cobre as horas sem cobertura: 16h–22h na sexta e no sábado", () => {
    const faltaTarde = cob("Farmacêutico", horas(8, 21, (h) => (h >= 19 ? 0 : 1)));
    const s = sugerirContratacao({ funcao: "Farmacêutico", coberturaPorDia: { 4: faltaTarde, 5: faltaTarde }, abas, tipo: "parcial", regra: REGRA });
    expect(s).toMatchObject({ tipo: "parcial", dias: [4, 5], entra: 16, sai: 22, cargaH: 12, semFalta: false });
    expect(efeitoDaContratacao({ coberturaPorDia: { 4: faltaTarde, 5: faltaTarde }, turnos: s.turnos })).toEqual({ horasCobertas: 6, horasRestantes: 0 });
  });
  it("só os dias com falta entram na sugestão", () => {
    const faltaSab = cob("Farmacêutico", horas(8, 21, (h) => (h >= 19 ? 0 : 1)));
    const s = sugerirContratacao({ funcao: "Farmacêutico", coberturaPorDia: { 4: semFalta[4], 5: faltaSab }, abas, tipo: "parcial", regra: REGRA });
    expect(s.dias).toEqual([5]);
  });
  it("sem falta alguma: uma sugestão simples no dia preferido, marcada como sem falta", () => {
    const s = sugerirContratacao({ funcao: "Atendimento", coberturaPorDia: semFalta, abas, tipo: "parcial", regra: REGRA, diaPreferido: 5 });
    expect(s).toMatchObject({ semFalta: true, dias: [5], entra: 8, sai: 14 });
  });
  it("o parcial nunca passa de 30 horas e respeita o mínimo de 4", () => {
    const abasSemana = [0, 1, 2, 3, 4, 5].map((dia) => ({ dia, abre: 8, fecha: 22 }));
    const falta = cob("Farmacêutico", horas(8, 21, (h) => (h < 14 ? 0 : 1)));
    const todas = Object.fromEntries(abasSemana.map((a) => [a.dia, falta]));
    const s = sugerirContratacao({ funcao: "Farmacêutico", coberturaPorDia: todas, abas: abasSemana, tipo: "parcial", regra: REGRA });
    expect(s.cargaH).toBeLessThanOrEqual(30);
    expect(s.cargaH).toBeGreaterThanOrEqual(4);
  });
  it("integral: a jornada cheia nos dias que a regra permite, com intervalo", () => {
    const abasSemana = [0, 1, 2, 3, 4, 5].map((dia) => ({ dia, abre: 8, fecha: 22 }));
    const falta = cob("Farmacêutico", horas(8, 21, (h) => (h < 14 ? 0 : 1)));
    const s = sugerirContratacao({ funcao: "Farmacêutico", coberturaPorDia: Object.fromEntries(abasSemana.map((a) => [a.dia, falta])), abas: abasSemana, tipo: "integral", regra: REGRA });
    expect(s.cargaH).toBe(40);
    expect(s.dias).toHaveLength(5);
    expect(s.turnos[0].iniIntervalo).not.toBeNull();
  });
});

describe("efeito e contratações simuladas", () => {
  it("conta as horas cobertas e as que ainda faltam", () => {
    const c = cob("Farmacêutico", horas(18, 21, 0));
    expect(efeitoDaContratacao({ coberturaPorDia: { 5: c }, turnos: [{ dia: 5, entrada: 19, saida: 21, iniIntervalo: null, fimIntervalo: null }] })).toEqual({ horasCobertas: 2, horasRestantes: 2 });
  });
  it("texto do efeito", () => {
    expect(textoDoEfeito({ funcao: "Farmacêutico", horasCobertas: 3 })).toBe("cobre 3h sem farmacêutico · horário da loja sem mudança");
    expect(textoDoEfeito({ funcao: "Atendimento", horasCobertas: 2 })).toBe("cobre 2h abaixo do mínimo de atendimento · horário da loja sem mudança");
    expect(textoDoEfeito({ funcao: "Caixa", horasCobertas: 0 })).toBe("não cobre horas sem cobertura · horário da loja sem mudança");
  });
  it("horas reforçadas e lista de contratações simuladas", () => {
    const t = { matricula: "VAGA-1", dia: 5, entrada: 16, saida: 22, iniIntervalo: null, fimIntervalo: null };
    expect([...horasReforcadas([t], 5)]).toEqual([16, 17, 18, 19, 20, 21]);
    expect(horasReforcadas([t], 4).size).toBe(0);
    const lista = contratacoesSimuladas([{ matricula: "VAGA-1", nome: "Vaga 1", funcao: "Farmacêutico", cargaH: 16, vaga: true }, { matricula: "A", nome: "Ana", funcao: "Farmacêutico", cargaH: 44 }], [t], "Farmacêutico");
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({ texto: "Farmacêutico · 16h parcial", matricula: "VAGA-1" });
  });
});

describe("texto da sugestão e opções de hora", () => {
  const falta = cob("Farmacêutico", horas(8, 21, (h) => (h >= 19 ? 0 : 1)));
  const cobPorDia = { 4: falta, 5: falta };
  it("faixa das faltas e texto da sugestão", () => {
    expect(faixaDasFaltas(cobPorDia, [4, 5])).toBe("19h às 21h");
    expect(faixaDasFaltas({ 5: cob("F", [[8, 0], [9, 1]]) }, [5])).toBe("às 8h");
    expect(faixaDasFaltas({ 5: cob("F", [[8, 1]]) }, [5])).toBeNull();
    const sugestao = { dias: [4, 5], entra: 16, sai: 22, semFalta: false };
    expect(textoDaSugestao({ sugestao, funcao: "Farmacêutico", coberturaPorDia: cobPorDia })).toBe("Sugestão: 16h–22h na sexta e no sábado cobre as horas sem farmacêutico (19h às 21h).");
    expect(textoDaSugestao({ sugestao, funcao: "Caixa", coberturaPorDia: cobPorDia })).toContain("abaixo do mínimo de caixa");
    expect(textoDaSugestao({ sugestao: { ...sugestao, semFalta: true }, funcao: "Caixa", coberturaPorDia: cobPorDia })).toContain("Nenhuma hora está abaixo do mínimo");
  });
  it("a faixa da sugestão conta só as horas que o turno novo cobre", () => {
    const duas = { 5: cob("Farmacêutico", [[10, 0], [11, 1], [17, 0], [18, 1]]) };
    expect(faixaDasFaltas(duas, [5])).toBe("10h às 17h");
    expect(faixaDasFaltas(duas, [5], { de: 16, ate: 22 })).toBe("às 17h");
    expect(faixaDasFaltas(duas, [5], { de: 12, ate: 16 })).toBeNull();
  });
  it("dias por extenso: intervalos de 3 ou mais e listas", () => {
    expect(diasPorExtenso([0, 1, 2, 3, 4])).toBe("de segunda a sexta");
    expect(diasPorExtenso([4, 5])).toBe("na sexta e no sábado");
    expect(diasPorExtenso([0, 1, 2, 5])).toBe("de segunda a quarta e no sábado");
    expect(diasPorExtenso([1, 3, 5])).toBe("na terça, na quinta e no sábado");
    expect(diasPorExtenso([6])).toBe("no domingo");
  });
  it("opções de hora de 15 em 15 minutos", () => {
    const o = opcoesDeHora(7, 9);
    expect(o.map((x) => x.texto)).toEqual(["07:00", "07:15", "07:30", "07:45", "08:00", "08:15", "08:30", "08:45", "09:00"]);
    expect(o[1].valor).toBe(7.25);
  });
});

describe("turnos sugeridos para as vagas (spec 040)", () => {
  const abas = [0, 1, 2, 3, 4, 5].map((dia) => ({ dia, abre: 8, fecha: 22 }));
  const faltaTarde = (de) => cob("Farmacêutico", horas(8, 21, (h) => (h >= de ? 0 : 1)));
  const todasAsFaltas = (cobDia) => Object.fromEntries(abas.map((a) => [a.dia, cobDia]));

  it("parcial: o menor número de dias com até 6 h por dia, sobre as horas sem cobertura", () => {
    // 12 h por semana = 2 dias de 6 h; falta das 16h às 21h na sexta e no sábado
    const porDia = { ...todasAsFaltas(cob("Farmacêutico", horas(8, 21, 1))), 4: faltaTarde(16), 5: faltaTarde(16) };
    const t = turnosParaVaga({ cargaH: 12, coberturaPorDia: porDia, abas, regra: REGRA });
    expect(t.map((x) => x.dia)).toEqual([4, 5]);
    expect(t.every((x) => x.entrada === 16 && x.saida === 22 && x.iniIntervalo === null)).toBe(true);
  });
  it("as horas semanais dos turnos batem com as da vaga (15 h = 3 dias de 5 h)", () => {
    const t = turnosParaVaga({ cargaH: 15, coberturaPorDia: todasAsFaltas(faltaTarde(14)), abas, regra: REGRA });
    expect(t).toHaveLength(3);
    expect(t.reduce((s, x) => s + (x.saida - x.entrada), 0)).toBe(15);
  });
  it("integral: a jornada cheia da regra nos dias que ela permite, com intervalo", () => {
    const t = turnosParaVaga({ cargaH: 40, coberturaPorDia: todasAsFaltas(faltaTarde(10)), abas, regra: REGRA });
    expect(t).toHaveLength(5);
    expect(t[0].saida - t[0].entrada).toBe(9); // 8 h líquidas + 1 h de intervalo
    expect(t[0].fimIntervalo - t[0].iniIntervalo).toBe(1);
  });
  it("sem falta alguma, começa na abertura do primeiro dia", () => {
    const t = turnosParaVaga({ cargaH: 6, coberturaPorDia: todasAsFaltas(cob("Farmacêutico", horas(8, 21, 1))), abas, regra: REGRA });
    expect(t).toHaveLength(1);
    expect(t[0]).toMatchObject({ dia: 0, entrada: 8, saida: 14 });
  });
  it("vaga que não cabe nos dias abertos usa os dias que existem e sobe as horas por dia até o máximo", () => {
    const poucos = [{ dia: 5, abre: 8, fecha: 20 }, { dia: 6, abre: 8, fecha: 14 }];
    const t = turnosParaVaga({ cargaH: 28, coberturaPorDia: {}, abas: poucos, regra: REGRA });
    expect(t.length).toBeLessThanOrEqual(2);
    for (const x of t) expect(x.saida - x.entrada).toBeLessThanOrEqual(9);
  });

  const quadro = [
    { matricula: "A", nome: "Ana", funcao: "Farmacêutico", cargaH: 40 },
    { matricula: "VAGA-1", nome: "Vaga 1", funcao: "Farmacêutico", cargaH: 12, vaga: true },
    { matricula: "VAGA-2", nome: "Vaga 2", funcao: "Farmacêutico", cargaH: 12, vaga: true },
    { matricula: "VAGA-3", nome: "Vaga 3", funcao: "Caixa", cargaH: 12, vaga: true, desligado: true },
  ];
  it("vagas sem turno: só as simuladas e ativas que não têm nenhum", () => {
    expect(vagaSemTurnos(quadro, [{ matricula: "VAGA-1", dia: 0 }]).map((v) => v.matricula)).toEqual(["VAGA-2"]);
  });
  it("`somente` sugere só para uma vaga, contando os turnos que já existem", () => {
    const cobertura = Object.fromEntries(abas.map((a) => [a.dia, [{ funcao: "Farmacêutico", minimo: 1, porHora: horas(8, 21, (h) => (h >= 16 ? 0 : 1)).map(([hora, p]) => cel(hora, p, 1)) }]]));
    const turnosDaAna = abas.map((x) => ({ matricula: "A", dia: x.dia, entrada: 8, saida: 16, iniIntervalo: null, fimIntervalo: null }));
    const so2 = sugerirTurnosDasVagas({ quadro, turnos: turnosDaAna, cobertura, abas, regra: REGRA, somente: "VAGA-2" });
    expect(so2.length).toBeGreaterThan(0);
    expect(so2.every((t) => t.matricula === "VAGA-2")).toBe(true);
  });
  it("duas vagas da mesma função: a segunda cobre o que a primeira deixou", () => {
    const cobertura = Object.fromEntries(abas.map((a) => [a.dia, [{ funcao: "Farmacêutico", minimo: 1, porHora: horas(8, 21, (h) => (h >= 16 ? 0 : 1)).map(([hora, p]) => cel(hora, p, 1)) }]]));
    // Ana cobre das 8h às 16h em todos os dias; sobram 16h–22h por cobrir
    const turnosDaAna = abas.map((x) => ({ matricula: "A", dia: x.dia, entrada: 8, saida: 16, iniIntervalo: null, fimIntervalo: null }));
    const novos = sugerirTurnosDasVagas({ quadro, turnos: turnosDaAna, cobertura, abas, regra: REGRA });
    const v1 = novos.filter((t) => t.matricula === "VAGA-1");
    const v2 = novos.filter((t) => t.matricula === "VAGA-2");
    expect(v1.length).toBeGreaterThan(0);
    expect(v2.length).toBeGreaterThan(0);
    // a primeira cobre 16h–22h em 2 dias; a segunda vai para outros dias que ainda faltam
    const diasV1 = new Set(v1.map((t) => t.dia));
    expect(v2.some((t) => !diasV1.has(t.dia))).toBe(true);
    expect(novos.every((t) => t.matricula !== "VAGA-3")).toBe(true);
  });
});

describe("folga, tirar do dia e avisos (spec 040)", () => {
  const T = (matricula, dia, entrada = 8, saida = 16, ini = null, fim = null) => ({ matricula, dia, entrada, saida, iniIntervalo: ini, fimIntervalo: fim });
  const aba = { dia: 5, abre: 8, fecha: 20 };
  it("turno habitual: o mais repetido nos outros dias; sem histórico, nulo", () => {
    const turnos = [T("A", 0, 8, 16), T("A", 1, 8, 16), T("A", 2, 10, 18), T("A", 5, 7, 11)];
    expect(turnoHabitual(turnos, "A", 5)).toMatchObject({ entrada: 8, saida: 16 });
    expect(turnoHabitual([T("A", 5)], "A", 5)).toBeNull();
    expect(turnoHabitual(turnos, "B", 5)).toBeNull();
  });
  it("folga clicável: o habitual cortado nas horas do dia", () => {
    const turnos = [T("A", 0, 7, 19, 12, 13)];
    expect(novoTurnoNaFolga({ turnos, matricula: "A", dia: 5, aba, regra: REGRA })).toEqual({ matricula: "A", dia: 5, entrada: 8, saida: 19, iniIntervalo: 12, fimIntervalo: 13 });
    expect(novoTurnoNaFolga({ turnos: [T("A", 0, 8, 19, 9, 10)], matricula: "A", dia: 5, aba: { dia: 5, abre: 11, fecha: 20 }, regra: REGRA }).iniIntervalo).toBeNull();
  });
  it("folga sem histórico: a abertura do dia com a jornada diária da regra", () => {
    expect(novoTurnoNaFolga({ turnos: [], matricula: "A", dia: 5, aba, regra: REGRA })).toMatchObject({ entrada: 8, saida: 17, iniIntervalo: 12, fimIntervalo: 13 });
    expect(novoTurnoNaFolga({ turnos: [], matricula: "A", dia: 5, aba: { dia: 5, abre: 8, fecha: 12 }, regra: REGRA }).saida).toBe(12);
  });
  it("tirar do dia remove só o turno daquele dia", () => {
    const turnos = [T("A", 0), T("A", 1), T("B", 1)];
    expect(semTurnoNoDia(turnos, "A", 1).map((t) => [t.matricula, t.dia])).toEqual([["A", 0], ["B", 1]]);
  });
  it("avisos da pessoa: só os dela e sem cobertura", () => {
    const av = {
      erros: [{ matricula: "A", regra: "jornada-semanal", texto: "A: 56h na semana" }, { matricula: "A", regra: "cobertura", texto: "x" }, { matricula: "B", regra: "folgas", texto: "B: 7 dias" }],
      avisos: [{ matricula: "A", regra: "intervalo-descoberto", texto: "A sozinho" }],
    };
    expect(avisosDaPessoa(av, "A")).toEqual(["A: 56h na semana", "A sozinho"]);
    expect(avisosDaPessoa(undefined, "A")).toEqual([]);
  });
});

describe("turnos para gravar", () => {
  it("mantém só os campos que o servidor aceita, com intervalo nulo quando não há", () => {
    expect(turnosParaGravar([{ id: "x", matricula: "A", dia: 1, entrada: 8, saida: 16, extra: 1 }])).toEqual([{ matricula: "A", dia: 1, entrada: 8, saida: 16, iniIntervalo: null, fimIntervalo: null }]);
  });
});
