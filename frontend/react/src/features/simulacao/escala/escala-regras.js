// Regras da "Escala por hora" (spec 039), puras e sem React: horas do dia, tons de venda e clientes, cobertura por função,
// faixa de aviso, sugestão e efeito de uma contratação. A tela só desenha o que sai daqui.
import { horasLiquidas } from "../../grade/tempo.js";

export const NOMES_DIA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const COM_ARTIGO = ["na segunda", "na terça", "na quarta", "na quinta", "na sexta", "no sábado", "no domingo"];
const EPS = 1e-9;
export const LIMITE_PARCIAL_H = 30;
export const MIN_VAGA_H = 4;
const HORAS_SEM_INTERVALO = 6;

const arred = (n) => Math.round(n * 100) / 100;
const virgula = (n) => String(arred(n)).replace(".", ",");

// ---- Dias e horas ----------------------------------------------------------------------------------------------------

// As abas: os dias que a simulação abre, em ordem, com o horário de cada um.
export const diasDasAbas = (diasAbertos = []) =>
  [...diasAbertos].sort((a, b) => a.dia - b.dia).map((d) => ({ dia: d.dia, nome: NOMES_DIA[d.dia], abre: d.abre, fecha: d.fecha }));

// As horas inteiras abertas do dia (07, 08 … 21), uma coluna cada.
export const horasDoDia = (d) => {
  if (!d) return [];
  const horas = [];
  for (let h = Math.floor(d.abre); h < Math.ceil(d.fecha - EPS); h++) horas.push(h);
  return horas;
};
export const rotuloHora = (h) => `${String(h).padStart(2, "0")}h`;
const horaCurta = (h) => `${h}h`;

// "07h–15h" (ou "07h30–15h").
const hhTexto = (x) => {
  const h = Math.floor(x + EPS);
  const m = Math.round((x - h) * 60);
  return `${String(h).padStart(2, "0")}h${m ? String(m).padStart(2, "0") : ""}`;
};
export const textoDoTurno = (t) => `${hhTexto(t.entrada)}–${hhTexto(t.saida)}`;

// ---- Venda e clientes por hora ---------------------------------------------------------------------------------------

// Os três cortes dos quatro tons (do mais claro ao mais escuro), só com as horas que têm movimento.
export const quartis = (valores = []) => {
  const v = valores.filter((x) => x > 0).sort((a, b) => a - b);
  if (v.length === 0) return [0, 0, 0];
  return [0.25, 0.5, 0.75].map((p) => v[Math.min(v.length - 1, Math.floor(v.length * p))]);
};
// 0 (claro, pouco movimento) a 3 (escuro, muito).
export const tomDoQuartil = (valor, qs) => (!(valor > 0) || valor < qs[0] ? 0 : valor < qs[1] ? 1 : valor < qs[2] ? 2 : 3);
export const mediaDoDia = (valores = []) => (valores.length ? Math.round(valores.reduce((s, v) => s + (v ?? 0), 0) / valores.length) : 0);

// ---- Pessoas e turnos ------------------------------------------------------------------------------------------------

export const turnoDoDia = (turnos, matricula, dia) => turnos.find((t) => t.matricula === matricula && t.dia === dia) ?? null;

// "40h · 5 dias" (ou "Folga na semana").
export const totalDaSemana = (turnos, matricula) => {
  const meus = turnos.filter((t) => t.matricula === matricula);
  const horas = arred(meus.reduce((s, t) => s + horasLiquidas(t), 0));
  const dias = new Set(meus.map((t) => t.dia)).size;
  return { horas, dias, texto: dias ? `${virgula(horas)}h · ${dias} ${dias === 1 ? "dia" : "dias"}` : "sem turnos" };
};

const presente = (t, h) =>
  t.entrada <= h + EPS && t.saida >= h + 1 - EPS &&
  !(t.iniIntervalo != null && t.fimIntervalo != null && t.iniIntervalo < h + 1 - EPS && t.fimIntervalo > h + EPS);

// ---- Cobertura -------------------------------------------------------------------------------------------------------

// A cobertura de uma função depois de mudar os turnos dela no dia (a conta da avaliação, na tela, para responder enquanto
// se arrasta): pessoas presentes em cada hora contra o exigido.
export const recalcularCobertura = (cobFuncao, turnosDaFuncaoNoDia) => ({
  ...cobFuncao,
  porHora: cobFuncao.porHora.map((c) => {
    const pessoas = turnosDaFuncaoNoDia.filter((t) => presente(t, c.hora)).length;
    return { ...c, pessoas, ok: pessoas >= c.exigido };
  }),
});

// As células da linha-resumo: o número de pessoas e, abaixo do mínimo, "N !". `reforcadas` são as horas em que a contratação
// simulada está presente (borda tracejada azul).
export const celulasDaFuncao = (cobFuncao, reforcadas = new Set()) =>
  cobFuncao.porHora.map((c) => ({
    hora: c.hora,
    pessoas: c.pessoas,
    exigido: c.exigido,
    ok: c.ok,
    texto: c.ok ? String(c.pessoas) : `${c.pessoas} !`,
    reforcada: reforcadas.has(c.hora),
  }));

// "mín. 1", "mín. 2 + reforço" (o mínimo muda ao longo do dia) ou "sem mínimo".
export const minimoDaFuncao = (porHora = []) => {
  const ex = porHora.map((c) => c.exigido);
  const max = Math.max(0, ...ex);
  if (max === 0) return "sem mínimo";
  const base = Math.min(...ex);
  if (base === max) return `mín. ${max}`;
  return base > 0 ? `mín. ${base} + reforço` : `mín. ${max} em parte do dia`;
};

// As faixas de horas seguidas abaixo do mínimo: [{ de, ate, horas }] (as horas são as colunas, de 19h a 21h).
export const faltasDaFuncao = (cobFuncao) => {
  const faltas = cobFuncao.porHora.filter((c) => !c.ok).map((c) => c.hora);
  const faixas = [];
  for (const h of faltas) {
    const ultima = faixas[faixas.length - 1];
    if (ultima && h === ultima.ate + 1) {
      ultima.ate = h;
      ultima.horas += 1;
    } else faixas.push({ de: h, ate: h, horas: 1 });
  }
  return faixas;
};

const faixaTxt = (f) => (f.de === f.ate ? `às ${horaCurta(f.de)}` : `das ${horaCurta(f.de)} às ${horaCurta(f.ate)}`);

// A faixa amarela do dia: quantas horas faltam, de qual função e em que faixa. Nula quando a cobertura fecha.
export const faixaDeAviso = (coberturaDoDia = [], dia) => {
  const frases = coberturaDoDia.flatMap((f) => {
    const faixas = faltasDaFuncao(f);
    if (!faixas.length) return [];
    const total = faixas.reduce((s, x) => s + x.horas, 0);
    return [`Faltam ${total} h de ${f.funcao.toLowerCase()} ${COM_ARTIGO[dia]}, ${faixas.map(faixaTxt).join(" e ")}.`];
  });
  return frases.length ? `${frases.join(" ")} Contratar na linha da função resolve.` : null;
};

// ---- Contratação -----------------------------------------------------------------------------------------------------

const tetoEfetivo = (regra) => Math.min(regra.teto, regra.dias * regra.maxDia);

// Os turnos que o formulário gera: o mesmo horário em cada dia escolhido, com 1 h de intervalo no meio quando passa de 6 h.
export const turnosDoFormulario = ({ dias, entra, sai }) =>
  [...dias].sort((a, b) => a - b).map((dia) => {
    const comIntervalo = sai - entra > HORAS_SEM_INTERVALO + EPS;
    const ini = comIntervalo ? entra + Math.floor((sai - entra) / 2) : null;
    return { dia, entrada: entra, saida: sai, iniIntervalo: ini, fimIntervalo: ini == null ? null : ini + 1 };
  });

// Horas semanais da vaga: integral = a jornada cheia da regra; parcial = a soma dos turnos (para cima, em horas inteiras).
export const cargaDaContratacao = ({ tipo, turnos, regra }) =>
  tipo === "integral" ? Math.min(44, Math.floor(tetoEfetivo(regra))) : Math.ceil(turnos.reduce((s, t) => s + horasLiquidas(t), 0) - EPS);

// A primeira mensagem de erro do formulário, ou nulo quando dá para adicionar.
export const erroDoFormulario = ({ tipo, dias, entra, sai, regra }) => {
  if (!dias.length) return "Escolha ao menos um dia.";
  if (!(sai > entra + EPS)) return "A saída precisa ser depois da entrada.";
  const turnos = turnosDoFormulario({ dias, entra, sai });
  const liquidas = horasLiquidas(turnos[0]);
  if (liquidas > regra.maxDia + EPS) return `Esta regra vai até ${virgula(regra.maxDia)}h por dia.`;
  if (tipo === "integral") return dias.length > regra.dias ? `Esta regra permite até ${regra.dias} dias por semana.` : null;
  const carga = cargaDaContratacao({ tipo, turnos, regra });
  if (carga > LIMITE_PARCIAL_H) return `O parcial vai até ${LIMITE_PARCIAL_H} horas por semana.`;
  if (carga < MIN_VAGA_H) return `A contratação precisa ter ao menos ${MIN_VAGA_H} horas por semana.`;
  return null;
};

// A janela e os dias que cobrem as horas sem cobertura da função (a sugestão que já vem preenchida). `coberturaPorDia` é
// { dia: cobertura da função }. Parcial: janela de até 6 h; integral: a jornada cheia nos dias que a regra permite.
export const sugerirContratacao = ({ funcao: _funcao, coberturaPorDia, abas, tipo = "parcial", regra, diaPreferido }) => {
  if (!abas.length) return null;
  const faltas = abas.map((a) => ({
    dia: a.dia,
    abre: a.abre,
    fecha: a.fecha,
    horas: (coberturaPorDia[a.dia]?.porHora ?? []).filter((c) => !c.ok).map((c) => c.hora),
  }));
  const semFalta = faltas.every((f) => f.horas.length === 0);
  const minAbre = Math.floor(Math.min(...abas.map((a) => a.abre)));
  const maxFecha = Math.ceil(Math.max(...abas.map((a) => a.fecha)));

  const liquidaPorDia = tipo === "integral" ? Math.min(regra.maxDia, tetoEfetivo(regra) / regra.dias) : HORAS_SEM_INTERVALO;
  let L = tipo === "integral" ? liquidaPorDia + (liquidaPorDia > HORAS_SEM_INTERVALO ? 1 : 0) : liquidaPorDia;
  L = Math.min(L, maxFecha - minAbre);

  const noMeio = (f, s) => f.horas.filter((h) => h >= s && h < s + L).length;
  let inicio = null;
  let melhor = 0;
  for (let s = minAbre; s + L <= maxFecha + EPS; s++) {
    const pontos = faltas.reduce((acc, f) => acc + noMeio(f, s), 0);
    if (pontos >= melhor && pontos > 0) {
      melhor = pontos;
      inicio = s;
    }
  }
  const preferido = abas.find((a) => a.dia === diaPreferido) ?? abas[0];
  if (inicio === null) inicio = Math.floor(preferido.abre);

  let dias;
  if (tipo === "integral") {
    const ordenados = [...faltas].sort((a, b) => noMeio(b, inicio) - noMeio(a, inicio) || a.dia - b.dia);
    dias = ordenados.slice(0, regra.dias).map((f) => f.dia);
  } else {
    dias = faltas.filter((f) => noMeio(f, inicio) > 0).sort((a, b) => noMeio(b, inicio) - noMeio(a, inicio) || a.dia - b.dia).map((f) => f.dia);
    if (dias.length === 0) dias = [preferido.dia];
    const maxDias = Math.max(1, Math.floor(LIMITE_PARCIAL_H / L));
    dias = dias.slice(0, maxDias);
    if (dias.length * L < MIN_VAGA_H) L = MIN_VAGA_H;
  }
  dias.sort((a, b) => a - b);
  const entra = inicio;
  const sai = Math.min(entra + L, maxFecha);
  const turnos = turnosDoFormulario({ dias, entra, sai });
  const cargaH = cargaDaContratacao({ tipo, turnos, regra });
  return { tipo, dias, entra, sai, cargaH, turnos, semFalta };
};

// O efeito na semana: quantas horas sem cobertura a contratação cobre (a hora passa a atingir o mínimo) e quantas ainda faltam.
export const efeitoDaContratacao = ({ coberturaPorDia, turnos }) => {
  let cobertas = 0;
  let restantes = 0;
  for (const [diaTxt, cob] of Object.entries(coberturaPorDia)) {
    const dia = Number(diaTxt);
    const doDia = turnos.filter((t) => t.dia === dia);
    for (const c of cob.porHora) {
      if (c.ok) continue;
      const reforco = doDia.filter((t) => presente(t, c.hora)).length;
      if (c.pessoas + reforco >= c.exigido) cobertas += 1;
      else restantes += 1;
    }
  }
  return { horasCobertas: cobertas, horasRestantes: restantes };
};

// "cobre 3h sem farmacêutico · horário da loja sem mudança".
export const textoDoEfeito = ({ funcao, horasCobertas }) => {
  const alvo = funcao === "Farmacêutico" ? "sem farmacêutico" : `abaixo do mínimo de ${funcao.toLowerCase()}`;
  return `${horasCobertas > 0 ? `cobre ${horasCobertas}h ${alvo}` : "não cobre horas sem cobertura"} · horário da loja sem mudança`;
};

// As horas em que a contratação simulada está presente no dia (a borda tracejada azul das células).
export const horasReforcadas = (turnosDasVagas, dia) => {
  const horas = new Set();
  for (const t of turnosDasVagas.filter((x) => x.dia === dia))
    for (let h = Math.floor(t.entrada + EPS); h < Math.ceil(t.saida - EPS); h++) if (presente(t, h)) horas.add(h);
  return horas;
};

// As contratações simuladas de uma função: "Farmacêutico · 16h parcial".
export const contratacoesSimuladas = (quadro, turnos, funcao) =>
  quadro
    .filter((p) => p.vaga && !p.desligado && p.funcao === funcao)
    .map((p) => ({
      matricula: p.matricula,
      nome: p.nome,
      cargaH: p.cargaH,
      texto: `${funcao} · ${p.cargaH}h ${p.cargaH > LIMITE_PARCIAL_H ? "integral" : "parcial"}`,
      turnos: turnos.filter((t) => t.matricula === p.matricula),
    }));
