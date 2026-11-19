import { describe, expect, it } from "vitest";
import { textoDoEsticamento, turnoEsticado, turnosParaGravar } from "./escala-regras.js";
import { esticarTurnos, ajustarJornada, pessoasParaFolgar, sugerirFolgas, textoDoRodizio } from "./folgas-regras.js";

const horas = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
const abas = (n = 7) => Array.from({ length: n }, (_, dia) => ({ dia, abre: 8, fecha: 18 }));
const t = (matricula, dia, entrada = 8, saida = 18) => ({ matricula, dia, entrada, saida, iniIntervalo: null, fimIntervalo: null });
const semana = (m, n = 7) => Array.from({ length: n }, (_, d) => t(m, d));
const gente = (...ms) => ms.map((m) => ({ matricula: m, nome: m, funcao: "Caixa", cargaH: 44 }));
// Cobertura exigida por dia e função: `minimo` pessoas em todas as horas (a cobertura "de antes" tem pessoas já contadas).
const cob = (turnos, quadro, minimo, n = 7) =>
  Object.fromEntries(Array.from({ length: n }, (_, d) => [d, [{ funcao: "Caixa", porHora: horas.map((hora) => ({ hora, pessoas: turnos.filter((x) => x.dia === d && quadro.some((p) => p.matricula === x.matricula) && x.entrada <= hora && x.saida >= hora + 1).length, exigido: minimo, ok: true })) }]]));
const r44 = { dias: 6 };
const r42 = { dias: 5 };

describe("pessoasParaFolgar", () => {
  it("só entra quem passa do limite, sem vaga nem desligado", () => {
    const q = [...gente("A", "B"), { matricula: "V", nome: "V", funcao: "Caixa", cargaH: 16, vaga: true }, { matricula: "X", nome: "X", funcao: "Caixa", cargaH: 44, desligado: true }];
    const ts = [...semana("A"), ...semana("B", 6), ...semana("V"), ...semana("X")];
    expect(pessoasParaFolgar({ quadro: q, turnos: ts, limiteDias: 6 })).toEqual([{ matricula: "A", funcao: "Caixa", folgas: 1 }]);
  });
});

describe("sugerirFolgas", () => {
  it("regra de 44h tira 1 dia e a de 42h tira 2", () => {
    const q = gente("A", "B", "C");
    const ts = ["A", "B", "C"].flatMap((m) => semana(m));
    const c = cob(ts, q, 1);
    const a = sugerirFolgas({ quadro: q, turnos: ts, cobertura: c, abas: abas(), regra: r44 });
    expect(["A", "B", "C"].map((m) => a.turnos.filter((x) => x.matricula === m).length)).toEqual([6, 6, 6]);
    const b = sugerirFolgas({ quadro: q, turnos: ts, cobertura: c, abas: abas(), regra: r42 });
    expect(["A", "B", "C"].map((m) => b.turnos.filter((x) => x.matricula === m).length)).toEqual([5, 5, 5]);
  });

  it("quem já está no limite não muda e vaga não entra", () => {
    const q = [...gente("A"), { matricula: "V", nome: "V", funcao: "Caixa", cargaH: 16, vaga: true }];
    const ts = [...semana("A", 6), ...semana("V")];
    const r = sugerirFolgas({ quadro: q, turnos: ts, cobertura: cob(ts, q, 0), abas: abas(), regra: r44 });
    expect(r.turnos).toHaveLength(ts.length);
    expect(r.retirados).toEqual([]);
  });

  it("pessoas da mesma função folgam em dias diferentes quando dá", () => {
    const q = gente("A", "B");
    const ts = ["A", "B"].flatMap((m) => semana(m));
    const r = sugerirFolgas({ quadro: q, turnos: ts, cobertura: cob(ts, q, 1), abas: abas(), regra: r44 });
    const dias = r.retirados.map((x) => x.dia);
    expect(new Set(dias).size).toBe(dias.length);
  });

  it("mantém o horário e o intervalo dos turnos que sobram", () => {
    const q = gente("A");
    const ts = Array.from({ length: 7 }, (_, d) => ({ matricula: "A", dia: d, entrada: 8, saida: 17, iniIntervalo: 12, fimIntervalo: 13 }));
    const r = sugerirFolgas({ quadro: q, turnos: ts, cobertura: cob(ts, q, 0), abas: abas(), regra: r44 });
    expect(r.turnos.every((x) => x.entrada === 8 && x.iniIntervalo === 12)).toBe(true);
  });

  it("domingo: ceil(n/3) pessoas por função folgam", () => {
    const q = gente("A", "B", "C", "D", "E", "F");
    const ts = q.flatMap((p) => semana(p.matricula));
    const r = sugerirFolgas({ quadro: q, turnos: ts, cobertura: cob(ts, q, 1), abas: abas(), regra: r44 });
    const folgamDomingo = q.filter((p) => !r.turnos.some((x) => x.matricula === p.matricula && x.dia === 6));
    expect(folgamDomingo).toHaveLength(2);
    expect(r.domingoSugerido).toBe(true);
  });

  it("loja fechada no domingo: o domingo não entra na conta", () => {
    const q = gente("A", "B", "C");
    const ts = q.flatMap((p) => semana(p.matricula, 6));
    const r = sugerirFolgas({ quadro: q, turnos: ts, cobertura: cob(ts, q, 1, 6), abas: abas(6), regra: r42 });
    expect(r.domingoSugerido).toBe(false);
    expect(r.turnos.every((x) => x.dia < 6)).toBe(true);
  });

  it("função com 1 pessoa e mínimo 1: domingo não é forçado e o aviso aparece", () => {
    const q = gente("A");
    const ts = semana("A");
    const r = sugerirFolgas({ quadro: q, turnos: ts, cobertura: cob(ts, q, 1), abas: abas(), regra: r44 });
    expect(r.avisos.some((a) => a.startsWith("Domingo:"))).toBe(true);
    expect(r.turnos.some((x) => x.dia === 6)).toBe(true);
  });

  it("falta inevitável vira aviso por dia e função", () => {
    const q = gente("A");
    const ts = semana("A");
    const r = sugerirFolgas({ quadro: q, turnos: ts, cobertura: cob(ts, q, 1), abas: abas(), regra: r44 });
    expect(r.avisos.some((a) => /vai faltar caixa das 8h às 17h/.test(a))).toBe(true);
  });
});

describe("textoDoRodizio", () => {
  it("explica o rodízio e a pendência do jurídico", () => {
    expect(textoDoRodizio()).toMatch(/1 em cada 3/);
    expect(textoDoRodizio()).toMatch(/jurídico/);
  });
});

describe("ajustarJornada", () => {
  const regra = { dias: 5, maxDia: 8, teto: 42 };
  it("corta o fim do turno que passa do máximo do dia e do teto da semana", () => {
    const q = gente("A");
    const ts = semana("A", 5).map((x) => ({ ...x, entrada: 8, saida: 17 })); // 9 h por dia, 5 dias
    const r = ajustarJornada(ts, q, regra);
    expect(r.every((x) => x.entrada === 8 && x.saida - x.entrada <= 8)).toBe(true);
    expect(r.reduce((s, x) => s + (x.saida - x.entrada), 0)).toBeLessThanOrEqual(40);
  });
  it("não mexe em quem já cabe e em vagas simuladas", () => {
    const q = [...gente("A"), { matricula: "V", nome: "V", funcao: "Caixa", cargaH: 16, vaga: true }];
    const ts = [...semana("A", 5).map((x) => ({ ...x, saida: 16 })), ...semana("V", 2).map((x) => ({ ...x, matricula: "V", saida: 19 }))];
    expect(ajustarJornada(ts, q, regra)).toEqual(ts);
  });
});

describe("esticarTurnos (spec 046)", () => {
  const regra = { dias: 5, maxDia: 8.4, teto: 42 };
  const abas = [0, 1, 2, 3, 4].map((dia) => ({ dia, abre: 7, fecha: 22 }));
  const q = [{ matricula: "A", nome: "A", funcao: "Farmacêutico", cargaH: 44 }];
  const ts = [0, 1, 2, 3, 4].map((dia) => ({ matricula: "A", dia, entrada: 7, saida: 15, iniIntervalo: 11, fimIntervalo: 12 }));
  const horas = Array.from({ length: 15 }, (_, i) => 7 + i);
  const cobertura = Object.fromEntries(abas.map((a) => [a.dia, [{ funcao: "Farmacêutico", porHora: horas.map((hora) => ({ hora, pessoas: hora >= 7 && hora < 15 ? 1 : 0, ok: hora < 15, exigido: 1 })) }]]));
  const liquida = (t) => t.saida - t.entrada - (t.fimIntervalo - t.iniIntervalo);
  it("estica o fim onde falta cobertura, guarda o antes e não passa do máximo do dia nem do limite da semana", () => {
    const r = esticarTurnos({ turnos: ts, quadro: q, cobertura, abas, regra });
    for (const t of r) {
      expect(t.saida).toBeGreaterThan(15);
      expect(liquida(t)).toBeLessThanOrEqual(8.4 + 1e-9);
      expect(t.antes).toEqual({ entrada: 7, saida: 15 });
    }
    expect(r.reduce((s, t) => s + liquida(t), 0)).toBeLessThanOrEqual(42 + 1e-9);
  });
  it("vagas e quem já está na jornada cheia não mudam; sem falta, a jornada ainda completa o turno (8h24)", () => {
    // sem falta (B cobre 15h–22h), A é completado até 8h24 líquidas e B também
    const qB = [...q, { matricula: "B", nome: "B", funcao: "Farmacêutico", cargaH: 44 }];
    const tsB = [...ts, ...[0, 1, 2, 3, 4].map((dia) => ({ matricula: "B", dia, entrada: 15, saida: 22, iniIntervalo: 18, fimIntervalo: 19 }))];
    const r = esticarTurnos({ turnos: tsB, quadro: qB, cobertura, abas, regra });
    for (const t of r) expect(liquida(t)).toBeCloseTo(8.4, 6);
    // já na jornada cheia: nada muda
    const cheio = ts.map((t) => ({ ...t, saida: 16.4 }));
    expect(esticarTurnos({ turnos: cheio, quadro: q, cobertura, abas, regra })).toEqual(cheio);
    // vaga simulada não é esticada
    const vaga = [{ ...q[0], vaga: true }];
    expect(esticarTurnos({ turnos: ts, quadro: vaga, cobertura, abas, regra })).toEqual(ts);
    // a carga contratada de 35 h é o limite: nada muda
    const noLimite = [{ ...q[0], cargaH: 35 }];
    expect(esticarTurnos({ turnos: ts, quadro: noLimite, cobertura, abas, regra })).toEqual(ts);
  });
  it("turnoEsticado e o texto da dica; turnosParaGravar leva o antes só quando é diferente", () => {
    const t = { matricula: "A", dia: 0, entrada: 7, saida: 16, iniIntervalo: 11, fimIntervalo: 12, antes: { entrada: 7, saida: 15 } };
    expect(turnoEsticado(t)).toBe(true);
    expect(textoDoEsticamento(t, 42)).toBe("Turno aumentado de 07h–15h para 07h–16h para cobrir a falta e completar a jornada, dentro do limite de 42h");
    expect(turnosParaGravar([t])[0].antes).toEqual({ entrada: 7, saida: 15 });
    expect(turnosParaGravar([{ ...t, saida: 15 }])[0].antes).toBeUndefined();
    expect(turnoEsticado({ ...t, antes: undefined })).toBe(false);
  });
});

describe("sugerirFolgas: folgas intercaladas (spec 055)", () => {
  const r40 = { dias: 5 };
  const nomes = (...ms) => ms.map((m) => ({ matricula: m, nome: `Pessoa ${m}`, funcao: "Caixa", cargaH: 44 }));
  const rodar = (qtde, minimo, regra = r40, nomeDe = nomes) => {
    const q = nomeDe(...["A", "B", "C", "D", "E", "F"].slice(0, qtde));
    const ts = q.flatMap((p) => semana(p.matricula));
    return sugerirFolgas({ quadro: q, turnos: ts, cobertura: cob(ts, q, minimo), abas: abas(), regra });
  };
  const porPessoa = (retirados) => {
    const por = new Map();
    for (const r of retirados) por.set(r.matricula, [...(por.get(r.matricula) ?? []), r.dia].sort((a, b) => a - b));
    return por;
  };
  const vizinhos = (a, b) => Math.min(Math.abs(a - b), 7 - Math.abs(a - b)) === 1;

  it("5 atendentes, regra de 40h, 7 dias: nenhuma pessoa com folgas em dias seguidos (domingo e segunda contam) e em todos os dias", () => {
    const r = rodar(5, 1);
    const por = porPessoa(r.retirados);
    expect(por.size).toBe(5);
    for (const [, d] of por) {
      expect(d).toHaveLength(2);
      expect(vizinhos(d[0], d[1])).toBe(false);
    }
    expect(new Set(r.retirados.map((x) => x.dia)).size).toBeGreaterThanOrEqual(5);
    expect(r.avisos.filter((a) => a.includes("afastar"))).toEqual([]);
  });

  it("paridade com o servidor: as mesmas folgas, pessoa por pessoa, para a mesma entrada", () => {
    // O mesmo caso (5 caixas, mínimo 1, regra de 40h) em escala/semana-com-folgas.test.ts dá exatamente isto.
    const por = porPessoa(rodar(5, 1).retirados);
    expect(Object.fromEntries(por)).toEqual({ A: [2, 6], B: [3, 6], C: [3, 5], D: [1, 4], E: [2, 5] });
  });

  it("no máximo 2 pessoas folgam no mesmo dia e a mesma entrada dá sempre a mesma sugestão", () => {
    const a = rodar(5, 1);
    const c = new Map();
    for (const x of a.retirados) c.set(x.dia, (c.get(x.dia) ?? 0) + 1);
    expect(Math.max(...c.values())).toBeLessThanOrEqual(2);
    expect(rodar(5, 1).retirados).toEqual(a.retirados);
  });

  it("cobertura primeiro: 3 pessoas com mínimo 2 folgam em dias diferentes, sem abrir falta", () => {
    const r = rodar(3, 2);
    expect(r.avisos.filter((a) => a.includes("vai faltar"))).toEqual([]);
    const c = new Map();
    for (const x of r.retirados) c.set(x.dia, (c.get(x.dia) ?? 0) + 1);
    expect(Math.max(...c.values())).toBe(1);
  });

  it("sem alternativa sem faltar gente, as folgas ficam coladas e o aviso diz de quem é", () => {
    // B só trabalha segunda e terça: nos outros dias a folga de A abriria falta, então A folga seg e ter.
    const q = [{ matricula: "A", nome: "Cristina", funcao: "Caixa", cargaH: 44 }, { matricula: "B", nome: "Bruno", funcao: "Caixa", cargaH: 44 }];
    const ts = [...semana("A"), t("B", 0), t("B", 1)];
    const r = sugerirFolgas({ quadro: q, turnos: ts, cobertura: cob(ts, q, 1), abas: abas(), regra: r40 });
    expect(r.retirados.filter((x) => x.matricula === "A").map((x) => x.dia).sort()).toEqual([0, 1]);
    expect(r.avisos).toContain("Cristina: não deu para afastar as folgas sem faltar gente.");
    expect(r.avisos.filter((a) => a.includes("vai faltar"))).toEqual([]);
  });

  it("quem só recebe 1 folga continua escolhendo pelo dia que abre menos falta", () => {
    const r = rodar(3, 2, r44);
    for (const [, d] of porPessoa(r.retirados)) expect(d).toHaveLength(1);
    expect(r.avisos.filter((a) => a.includes("afastar"))).toEqual([]);
  });
});

describe("sugerirFolgas: evitar a segunda e espalhar o mesmo cargo (spec 061)", () => {
  const r40 = { dias: 5 };
  const pessoa = (matricula, nome, funcao = "Caixa") => ({ matricula, nome, funcao, cargaH: 44 });
  const equipe = (n, funcao = "Caixa", primeira = 65) => Array.from({ length: n }, (_, i) => pessoa(String.fromCharCode(primeira + i), `Pessoa ${String.fromCharCode(primeira + i)}`, funcao));
  // Cobertura por dia e função com o mínimo de cada função em todas as horas.
  const cobertura = (turnos, quadro, minimos, n = 7) =>
    Object.fromEntries(
      Array.from({ length: n }, (_, d) => [
        d,
        [...new Set(quadro.map((p) => p.funcao))].map((funcao) => ({
          funcao,
          porHora: horas.map((hora) => ({ hora, pessoas: turnos.filter((x) => x.dia === d && quadro.some((p) => p.matricula === x.matricula && p.funcao === funcao) && x.entrada <= hora && x.saida >= hora + 1).length, exigido: minimos[funcao] ?? 0, ok: true })),
        })),
      ]),
    );
  const rodar = ({ quadro, turnos, minimos = { Caixa: 1 }, regra = r40, abertos = abas() }) => sugerirFolgas({ quadro, turnos, cobertura: cobertura(turnos, quadro, minimos), abas: abertos, regra });
  const todosOsDias = (q) => q.flatMap((p) => semana(p.matricula));
  const diasDa = (retirados, m) => retirados.filter((r) => r.matricula === m).map((r) => r.dia).sort((a, b) => a - b);

  it("com sobra de cobertura, nenhuma folga cai na segunda", () => {
    const q = equipe(5);
    const r = rodar({ quadro: q, turnos: todosOsDias(q) });
    expect(r.retirados).toHaveLength(10);
    expect(r.retirados.filter((x) => x.dia === 0)).toEqual([]);
    expect(r.avisos.filter((a) => a.includes("segunda"))).toEqual([]);
  });

  it("só a segunda mantém a cobertura: a folga cai nela e o aviso diz de quem foi", () => {
    const q = [pessoa("A", "Cristina"), pessoa("B", "Bruno")];
    const r = rodar({ quadro: q, turnos: [...semana("A"), t("B", 0)] });
    expect(diasDa(r.retirados, "A")).toContain(0);
    expect(r.avisos).toContain("Cristina: só deu para folgar na segunda sem faltar gente.");
  });

  it("loja fechada na segunda: a regra da segunda não interfere (nem avisa)", () => {
    const q = equipe(5);
    const dias = [1, 2, 3, 4, 5, 6];
    const ts = q.flatMap((p) => dias.map((d) => t(p.matricula, d)));
    const r = rodar({ quadro: q, turnos: ts, abertos: dias.map((dia) => ({ dia, abre: 8, fecha: 18 })) });
    expect(r.retirados.length).toBeGreaterThan(0);
    expect(r.avisos.filter((a) => a.includes("segunda"))).toEqual([]);
  });

  it("o rodízio de domingo continua valendo", () => {
    const q = equipe(3);
    const r = rodar({ quadro: q, turnos: todosOsDias(q), regra: r44 });
    expect(r.domingoSugerido).toBe(true);
    expect(r.retirados.some((x) => x.dia === 6)).toBe(true);
    expect(r.retirados.filter((x) => x.dia === 0)).toEqual([]);
  });

  it("pessoas do mesmo cargo folgam em dias diferentes", () => {
    const q = equipe(3);
    const r = rodar({ quadro: q, turnos: todosOsDias(q), regra: r44 });
    const ds = r.retirados.map((x) => x.dia);
    expect(ds).toHaveLength(3);
    expect(new Set(ds).size).toBe(3);
    expect(ds).not.toContain(0);
  });

  it("cargos diferentes não atrapalham um ao outro: cada cargo espalha as suas", () => {
    const q = [...equipe(3, "Farmacêutico", 65), ...equipe(3, "Atendimento", 70)];
    const r = rodar({ quadro: q, turnos: todosOsDias(q), minimos: { Farmacêutico: 1, Atendimento: 1 }, regra: r44 });
    for (const cargo of [["A", "B", "C"], ["F", "G", "H"]]) {
      const ds = r.retirados.filter((x) => cargo.includes(x.matricula)).map((x) => x.dia);
      expect(new Set(ds).size).toBe(ds.length);
    }
  });

  it("conta as folgas que o colega já tem: ninguém folga no dia em que o colega já está de folga", () => {
    const q = [pessoa("A", "Ana"), pessoa("B", "Bruno"), pessoa("C", "Carla")];
    const ts = [...semana("A"), ...[0, 1, 3, 4, 5, 6].map((d) => t("B", d)), ...semana("C")];
    const r = rodar({ quadro: q, turnos: ts, regra: r44 });
    const ds = r.retirados.map((x) => x.dia);
    expect(ds).toHaveLength(2);
    expect(ds).not.toContain(2);
    expect(ds).not.toContain(0);
    expect(new Set(ds).size).toBe(2);
  });

  it("mais folgas do que dias: a diferença entre os dias do cargo é no máximo 1", () => {
    const q = equipe(5);
    const r = rodar({ quadro: q, turnos: todosOsDias(q) });
    const c = new Map();
    for (const x of r.retirados) c.set(x.dia, (c.get(x.dia) ?? 0) + 1);
    const de1a6 = [1, 2, 3, 4, 5, 6].map((d) => c.get(d) ?? 0);
    expect(Math.max(...de1a6) - Math.min(...de1a6)).toBeLessThanOrEqual(1);
  });

  it("só um dia mantém a cobertura: as folgas coincidem e o aviso do cargo aparece", () => {
    const q = [pessoa("A", "Ana"), pessoa("B", "Bia"), pessoa("C", "Cris"), pessoa("D", "Dani")];
    const ts = [...semana("A"), ...semana("B"), t("C", 3), t("D", 3)];
    const r = rodar({ quadro: q, turnos: ts, minimos: { Caixa: 2 }, regra: r44 });
    expect(diasDa(r.retirados, "A")).toEqual([3]);
    expect(diasDa(r.retirados, "B")).toEqual([3]);
    expect(r.avisos).toContain("Caixa: não deu para folgar em dias diferentes sem faltar gente.");
  });

  it("a mesma entrada dá sempre a mesma sugestão", () => {
    const q = equipe(5);
    const a = rodar({ quadro: q, turnos: todosOsDias(q) });
    const b = rodar({ quadro: q, turnos: todosOsDias(q) });
    expect(b.retirados).toEqual(a.retirados);
    expect(b.avisos).toEqual(a.avisos);
  });
});
