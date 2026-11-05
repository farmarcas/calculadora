import { describe, expect, it } from "vitest";
import { estadoDosCampos, pendenciasDoRascunho, podePreencher, tituloDoPainel } from "./pendencias.js";

// Os mesmos casos de backend/.../situacao.test.ts, sobre o rascunho (textos que a tela edita).
const dia = (aberta = true) => (aberta ? { aberta: true, h24: false, abre: "08:00", fecha: "21:00" } : { aberta: false, h24: false, abre: "", fecha: "" });
const semana = (abertos = [0, 1, 2, 3, 4, 5]) => ({ versao: 2, dias: Array.from({ length: 7 }, (_, i) => dia(abertos.includes(i))) });
const fat = (dias = ["20000", "15000", "17000", "18000", "20000", "11000", ""], extra = {}) => ({ dias, mensal: "", ...extra });
const ok = { nome: "Centro", cidade: "Sumaré", uf: "SP", regimeTributario: "real", horarios: semana(), faturamento: fat() };
const equipe = { farmaceuticos: 1, funcoesNaEquipe: ["Farmacêutico", "Atendimento"] };
const custos = { salarioMedio: { Farmacêutico: "9000", Atendimento: "2500", Caixa: "" } };
const ids = (a) => a.itens.filter((i) => !i.feito).map((i) => i.id);
const dono = (extra = {}) => pendenciasDoRascunho({ loja: ok, custos, equipe, dono: true, perfil: "TENANT_ADMIN", ...extra });

describe("pendências sobre o rascunho (dono)", () => {
  it("loja completa: nenhuma pendência, tudo feito", () => {
    const r = dono();
    expect(ids(r)).toEqual([]);
    expect(r.feitos).toBe(r.total);
  });

  it("tudo pendente, na ordem de verificação, com aba e quem preenche", () => {
    const r = pendenciasDoRascunho({
      loja: { nome: "", cidade: "", uf: "", regimeTributario: "", horarios: semana([]), faturamento: fat(["", "", "", "", "", "", ""]) },
      custos: { salarioMedio: { Farmacêutico: "" } },
      equipe: { farmaceuticos: 0, funcoesNaEquipe: [] },
      dono: true,
      perfil: "TENANT_ADMIN",
    });
    expect(ids(r)).toEqual(["dados", "funcionamento", "farmaceutico", "salario:Farmacêutico"]);
    expect(r.itens[0]).toMatchObject({ campos: ["nome", "cidade", "uf", "regime"], texto: "Falta: nome, cidade, UF e regime tributário.", titulo: "Dados da loja" });
  });

  it("2 ou 3 pendências em abas diferentes", () => {
    const r = dono({
      loja: { ...ok, faturamento: fat(["20000", "15000", "", "18000", "20000", "11000", ""]) },
      equipe: { farmaceuticos: 0, funcoesNaEquipe: ["Atendimento"] },
      custos: { salarioMedio: { Farmacêutico: "9000", Atendimento: "" } },
    });
    expect(ids(r)).toEqual(["farmaceutico", "faturamentoDia", "salario:Atendimento"]);
    expect(r.porAba).toEqual({ dados: 1, equipe: 1, regras: 1 });
  });

  it("faturamento por dia: só os dias abertos sem valor e o campo de cada um", () => {
    const r = dono({ loja: { ...ok, faturamento: fat(["20000", "15000", "", "18000", "20000", "", ""]) } });
    expect(r.itens.find((i) => i.id === "faturamentoDia")).toMatchObject({ texto: "Faltam 2 dias abertos: quarta e sábado.", campos: ["fat-2", "fat-5"] });
    const um = dono({ loja: { ...ok, faturamento: fat(["1", "1", "", "1", "1", "1", ""]) } });
    expect(um.itens.find((i) => i.id === "faturamentoDia").texto).toBe("Falta 1 dia aberto: quarta.");
    // dia fechado não exige
    expect(ids(dono({ loja: { ...ok, horarios: semana([0, 1, 2, 3, 4, 5]), faturamento: fat() } }))).toEqual([]);
  });

  it("divergência do mês: alerta, só com os dias completos", () => {
    const longe = { ...ok, faturamento: fat(undefined, { mensal: "487698" }) };
    expect(dono({ loja: longe }).itens.find((i) => i.id === "faturamentoMes")).toMatchObject({ alerta: true, campos: ["mensal"], feito: false });
    const perto = { ...ok, faturamento: fat(undefined, { mensal: "437667" }) };
    expect(ids(dono({ loja: perto }))).toEqual([]);
    const incompleto = { ...longe, faturamento: fat(["20000", "", "", "", "", "", ""], { mensal: "487698" }) };
    expect(ids(dono({ loja: incompleto }))).toEqual(["faturamentoDia"]);
  });

  it("um item de salário por função que conta; função sem gente não exige", () => {
    const r = dono({ equipe: { farmaceuticos: 1, funcoesNaEquipe: ["Farmacêutico", "Atendimento", "Caixa"] }, custos: { salarioMedio: { Farmacêutico: "", Atendimento: "2500", Caixa: "" } } });
    expect(ids(r)).toEqual(["salario:Farmacêutico", "salario:Caixa"]);
    expect(ids(dono({ equipe: { farmaceuticos: 1, funcoesNaEquipe: ["Farmacêutico"] } }))).toEqual([]);
  });

  it("preencher o campo tira a pendência antes de salvar, e esvaziar a devolve; o total não muda", () => {
    const sem = dono({ custos: { salarioMedio: { Farmacêutico: "", Atendimento: "2500" } } });
    expect(ids(sem)).toEqual(["salario:Farmacêutico"]);
    const com = dono({ custos: { salarioMedio: { Farmacêutico: "9000", Atendimento: "2500" } } });
    expect(ids(com)).toEqual([]);
    expect(com.itens.find((i) => i.id === "salario:Farmacêutico").feito).toBe(true);
    expect(com.total).toBe(sem.total);
    expect(com.feitos).toBe(sem.feitos + 1);
    expect(ids(dono({ custos: { salarioMedio: { Farmacêutico: "", Atendimento: "2500" } } }))).toEqual(["salario:Farmacêutico"]);
  });

  it("nenhum texto traz valores em reais", () => {
    const r = dono({ loja: { ...ok, faturamento: fat(undefined, { mensal: "999999" }) } });
    for (const i of r.itens) expect(`${i.titulo} ${i.texto} ${i.porque}`).not.toMatch(/R\$|\d{3}/);
  });
});

describe("pendências para quem não é dono", () => {
  // O gestor não recebe faturamento nem salários: os itens do dono vêm da lista do servidor, sem botão.
  const doServidor = [
    { id: "faturamentoDia", aba: "dados", titulo: "Faturamento por dia", texto: "Informe o faturamento de cada dia aberto.", porque: "x", campos: ["fat-2"], soDono: true },
    { id: "salario:Farmacêutico", aba: "regras", titulo: "Salário médio · Farmacêutico", texto: "Informe o salário médio sem premiação.", porque: "x", campos: ["salario-Farmacêutico"], soDono: true },
  ];
  const gestor = (extra = {}) => pendenciasDoRascunho({ servidor: doServidor, loja: { ...ok, faturamento: undefined }, equipe: { farmaceuticos: 0, funcoesNaEquipe: ["Farmacêutico"] }, dono: false, perfil: "SCHEDULE_MANAGER", ...extra });

  it("gestor: itens do dono continuam pendentes e sem botão; o resto ele pode resolver", () => {
    const r = gestor();
    expect(ids(r)).toEqual(["farmaceutico", "faturamentoDia", "salario:Farmacêutico"]);
    expect(r.voceResolve).toBe(1);
    expect(r.soDono).toBe(2);
    expect(podePreencher(r.itens.find((i) => i.id === "faturamentoDia"), "SCHEDULE_MANAGER")).toBe(false);
    expect(podePreencher(r.itens.find((i) => i.id === "farmaceutico"), "SCHEDULE_MANAGER")).toBe(true);
  });

  it("os contadores das abas contam só o que a pessoa resolve", () => {
    expect(gestor().porAba).toEqual({ dados: 0, equipe: 1, regras: 0 });
  });

  it("consulta não preenche nada", () => {
    const r = gestor({ perfil: "SCHEDULE_VIEWER" });
    expect(r.voceResolve).toBe(0);
    expect(r.porAba).toEqual({ dados: 0, equipe: 0, regras: 0 });
    expect(podePreencher({ aba: "dados", soDono: false }, "SCHEDULE_VIEWER")).toBe(false);
  });

  it("operador preenche dados e funcionamento, mas não o que é do dono", () => {
    expect(podePreencher({ aba: "dados", soDono: false }, "PLATFORM_OPERATOR")).toBe(true);
    expect(podePreencher({ aba: "dados", soDono: true }, "PLATFORM_OPERATOR")).toBe(false);
  });
});

describe("antes de a aba abrir, vale a lista do servidor", () => {
  it("sem rascunho da loja nem dos custos, as pendências do servidor ficam como vieram", () => {
    const servidor = [{ id: "dados", aba: "dados", titulo: "Dados da loja", texto: "Falta: cidade.", porque: "x", campos: ["cidade"], soDono: false }];
    const r = pendenciasDoRascunho({ servidor, equipe, dono: true, perfil: "TENANT_ADMIN" });
    expect(r.itens.find((i) => i.id === "dados")).toMatchObject({ feito: false, texto: "Falta: cidade." });
  });
});

describe("título da faixa", () => {
  it("singular e plural", () => {
    expect(tituloDoPainel(1)).toBe("Falta 1 item para o cadastro ficar completo");
    expect(tituloDoPainel(3)).toBe("Faltam 3 itens para o cadastro ficar completo");
  });
});

describe("estado de cada campo (destaque)", () => {
  const dono = (loja, custosX = custos) => pendenciasDoRascunho({ loja, custos: custosX, equipe, dono: true, perfil: "TENANT_ADMIN" });
  const semSalario = { salarioMedio: { Farmacêutico: "", Atendimento: "2500" } };
  const aoAbrir = dono(ok, semSalario).itens.filter((i) => !i.feito);

  it("campo pendente fica pendente, com a frase do porquê", () => {
    expect(estadoDosCampos(dono(ok, semSalario), aoAbrir)["salario-Farmacêutico"]).toMatchObject({ estado: "pendente", porque: "Sem o salário, não dá para calcular o custo de contratar." });
  });
  it("campo preenchido (ainda sem salvar) vira 'preenchido'; esvaziar volta a pendente", () => {
    expect(estadoDosCampos(dono(ok), aoAbrir)["salario-Farmacêutico"].estado).toBe("preenchido");
    expect(estadoDosCampos(dono(ok, semSalario), aoAbrir)["salario-Farmacêutico"].estado).toBe("pendente");
  });
  it("campo que nunca esteve pendente não aparece, e o que se apaga depois aparece como pendente", () => {
    expect(estadoDosCampos(dono(ok), [])["salario-Farmacêutico"]).toBeUndefined();
    expect(estadoDosCampos(dono(ok, semSalario), [])["salario-Farmacêutico"].estado).toBe("pendente");
  });
  it("dados da loja: só os campos que faltam ficam pendentes, cada um com a sua frase", () => {
    const m = estadoDosCampos(dono({ ...ok, cidade: "", uf: "" }), []);
    expect(Object.keys(m).sort()).toEqual(["cidade", "uf"]);
    expect(m.cidade.porque).toBe("Informe a cidade.");
    expect(m.uf.porque).toBe("Escolha o estado.");
  });
  it("faturamento por dia: só os dias sem valor", () => {
    const m = estadoDosCampos(dono({ ...ok, faturamento: fat(["1", "1", "", "1", "1", "", ""]) }), []);
    expect(Object.keys(m).sort()).toEqual(["fat-2", "fat-5"]);
  });
});
