import { describe, expect, it } from "vitest";
import {
  cargaDaContratacao, celulasDaFuncao, contratacoesSimuladas, diasDasAbas, efeitoDaContratacao, erroDoFormulario, faixaDeAviso,
  faltasDaFuncao, horasDoDia, horasReforcadas, mediaDoDia, minimoDaFuncao, quartis, recalcularCobertura, sugerirContratacao,
  textoDoEfeito, textoDoTurno, tomDoQuartil, totalDaSemana, turnosDoFormulario,
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
