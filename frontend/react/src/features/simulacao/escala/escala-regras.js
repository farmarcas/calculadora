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

// Intervalo que não precisa de cobertura (spec 045): até 2 horas a pessoa segue contando como presente; acima disso desconta.
// É o mesmo limite do servidor (regras/intervalo.ts). Regra de referência: o jurídico confirma.
export const LIMITE_INTERVALO_SEM_COBERTURA_H = 2;
export const intervaloSemCobertura = (t) => !!t && t.iniIntervalo != null && t.fimIntervalo != null && t.fimIntervalo - t.iniIntervalo <= LIMITE_INTERVALO_SEM_COBERTURA_H + EPS;
const intervaloDesconta = (t) => t.iniIntervalo != null && t.fimIntervalo != null && !intervaloSemCobertura(t);

const presente = (t, h) =>
  t.entrada <= h + EPS && t.saida >= h + 1 - EPS &&
  !(intervaloDesconta(t) && t.iniIntervalo < h + 1 - EPS && t.fimIntervalo > h + EPS);

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
export const sugerirContratacao = ({ funcao: _funcao, coberturaPorDia, abas, tipo = "integral", regra, diaPreferido }) => {
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

// As contratações simuladas de uma função: "Farmacêutico · 40h".
export const contratacoesSimuladas = (quadro, turnos, funcao) =>
  quadro
    .filter((p) => p.vaga && !p.desligado && p.funcao === funcao)
    .map((p) => ({
      matricula: p.matricula,
      nome: p.nome,
      cargaH: p.cargaH,
      texto: `${funcao} · ${p.cargaH}h`,
      turnos: turnos.filter((t) => t.matricula === p.matricula),
    }));

const NOMES_LONGOS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];

// "na sexta e no sábado" ou "de segunda a sexta" (3 dias seguidos ou mais viram um intervalo).
export const diasPorExtenso = (dias) => {
  const ord = [...dias].sort((a, b) => a - b);
  const partes = [];
  for (let i = 0; i < ord.length; ) {
    let j = i;
    while (j + 1 < ord.length && ord[j + 1] === ord[j] + 1) j++;
    if (j - i >= 2) partes.push(`de ${NOMES_LONGOS[ord[i]]} a ${NOMES_LONGOS[ord[j]]}`);
    else for (let k = i; k <= j; k++) partes.push(COM_ARTIGO[ord[k]]);
    i = j + 1;
  }
  return partes.length <= 1 ? (partes[0] ?? "") : `${partes.slice(0, -1).join(", ")} e ${partes[partes.length - 1]}`;
};

// As horas sem cobertura (abaixo do mínimo) nos dias escolhidos, de ponta a ponta: "19h às 21h" (ou "às 19h"). `janela`
// ({ de, ate }, em horas) limita a conta às horas que o turno novo cobre.
export const faixaDasFaltas = (coberturaPorDia, dias, janela = null) => {
  const horas = dias
    .flatMap((d) => (coberturaPorDia[d]?.porHora ?? []).filter((c) => !c.ok).map((c) => c.hora))
    .filter((h) => !janela || (h >= janela.de && h < janela.ate));
  if (!horas.length) return null;
  const de = Math.min(...horas);
  const ate = Math.max(...horas);
  return de === ate ? `às ${de}h` : `${de}h às ${ate}h`;
};

// "Sugestão: 16h–22h na sexta e no sábado cobre as horas sem farmacêutico (19h às 21h)."
export const textoDaSugestao = ({ sugestao, funcao, coberturaPorDia }) => {
  if (!sugestao) return "";
  if (sugestao.semFalta) return "Nenhuma hora está abaixo do mínimo agora. Escolha os dias e o horário da nova pessoa.";
  const alvo = funcao === "Farmacêutico" ? "sem farmacêutico" : `abaixo do mínimo de ${funcao.toLowerCase()}`;
  const faixa = faixaDasFaltas(coberturaPorDia, sugestao.dias, { de: sugestao.entra, ate: sugestao.sai });
  return `Sugestão: ${Math.floor(sugestao.entra)}h–${Math.floor(sugestao.sai)}h ${diasPorExtenso(sugestao.dias)} cobre as horas ${alvo}${faixa ? ` (${faixa})` : ""}.`;
};

// As opções de hora do formulário (de 15 em 15 minutos): [{ valor: 16, texto: "16:00" }].
export const opcoesDeHora = (min, max) => {
  const opcoes = [];
  for (let h = Math.floor(min); h <= Math.ceil(max) + EPS; h += 0.25) {
    const horas = Math.floor(h + EPS);
    const minutos = Math.round((h - horas) * 60);
    opcoes.push({ valor: h, texto: `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}` });
  }
  return opcoes;
};

// ---- Turnos sugeridos para as vagas, folga e avisos da pessoa (spec 040) ---------------------------------------------

const sobeQuarto = (h) => Math.ceil(h * 4 - EPS) / 4;
const comIntervalo = (entrada, saida) => {
  const longo = saida - entrada > HORAS_SEM_INTERVALO + EPS;
  const ini = longo ? entrada + Math.floor((saida - entrada) / 2) : null;
  return { iniIntervalo: ini, fimIntervalo: ini === null ? null : ini + 1 };
};

// Os turnos de UMA vaga, já com a necessidade: o número de dias (parcial: o menor com até 6 h por dia, sem intervalo; integral:
// o que a regra permite, com 1 h de intervalo acima de 6 h), a janela que cobre mais horas sem cobertura da função e os dias
// que mais ganham com ela. `coberturaPorDia` é { dia: cobertura da função com os turnos de agora }.
export const turnosParaVaga = ({ cargaH, coberturaPorDia, abas, regra }) => {
  if (!abas.length) return [];
  const integral = cargaH > LIMITE_PARCIAL_H;
  let n = Math.max(1, integral ? Math.min(regra.dias, abas.length) : Math.min(Math.ceil(cargaH / HORAS_SEM_INTERVALO), abas.length));
  let liquida = cargaH / n;
  while (liquida > regra.maxDia + EPS && n < abas.length) {
    n += 1;
    liquida = cargaH / n;
  }
  liquida = Math.min(sobeQuarto(liquida), regra.maxDia);
  const bruta = liquida + (liquida > HORAS_SEM_INTERVALO + EPS ? 1 : 0);

  const faltas = abas.map((aba) => ({ aba, horas: (coberturaPorDia[aba.dia]?.porHora ?? []).filter((c) => !c.ok).map((c) => c.hora) }));
  const cabe = (aba, s) => s >= aba.abre - EPS && s + bruta <= aba.fecha + EPS;
  const cobre = (f, s) => (cabe(f.aba, s) ? f.horas.filter((h) => h >= s && h < s + bruta).length : 0);

  const minAbre = Math.floor(Math.min(...abas.map((a) => a.abre)));
  const maxFecha = Math.ceil(Math.max(...abas.map((a) => a.fecha)));
  const candidatos = new Set(abas.map((a) => a.abre));
  for (let s = minAbre; s + bruta <= maxFecha + EPS; s++) candidatos.add(s);
  // Também a janela que termina na hora de fechar (a última hora só se cobre assim).
  for (const a of abas) if (a.fecha - bruta >= a.abre - EPS) candidatos.add(a.fecha - bruta);
  let inicio = null;
  let melhor = 0;
  for (const s of [...candidatos].sort((a, b) => a - b)) {
    const pontos = faltas.reduce((acc, f) => acc + cobre(f, s), 0);
    if (pontos > 0 && pontos >= melhor) {
      melhor = pontos;
      inicio = s;
    }
  }
  if (inicio === null) inicio = abas[0].abre;

  const escolhidos = [...faltas]
    .sort((a, b) => cobre(b, inicio) - cobre(a, inicio) || Number(cabe(b.aba, inicio)) - Number(cabe(a.aba, inicio)) || a.aba.dia - b.aba.dia)
    .slice(0, n);
  return escolhidos
    .map((f) => {
      const entrada = Math.max(inicio, f.aba.abre);
      const saida = Math.min(inicio + bruta, f.aba.fecha);
      return { dia: f.aba.dia, entrada, saida, ...comIntervalo(entrada, saida) };
    })
    .filter((t) => t.saida - t.entrada >= 1)
    .sort((a, b) => a.dia - b.dia);
};

// As vagas simuladas que ainda não têm nenhum turno.
export const vagaSemTurnos = (quadro, turnos) => quadro.filter((p) => p.vaga && !p.desligado && p.funcao && !turnos.some((t) => t.matricula === p.matricula));

// Os turnos novos de todas as vagas sem turno, uma depois da outra: cada vaga parte da cobertura já com as anteriores.
// `cobertura` é `avaliacao.cobertura` ({ dia: [{ funcao, porHora }] }).
export const sugerirTurnosDasVagas = ({ quadro, turnos, cobertura, abas, regra, somente = null }) => {
  const funcaoDe = new Map(quadro.filter((p) => !p.desligado && p.funcao).map((p) => [p.matricula, p.funcao]));
  let atuais = [...turnos];
  const novos = [];
  for (const v of vagaSemTurnos(quadro, turnos).filter((x) => !somente || x.matricula === somente)) {
    const coberturaPorDia = Object.fromEntries(
      abas.flatMap((a) => {
        const base = cobertura?.[a.dia]?.find((c) => c.funcao === v.funcao);
        if (!base) return [];
        return [[a.dia, recalcularCobertura(base, atuais.filter((t) => t.dia === a.dia && funcaoDe.get(t.matricula) === v.funcao))]];
      }),
    );
    const ts = turnosParaVaga({ cargaH: v.cargaH, coberturaPorDia, abas, regra }).map((t) => ({ matricula: v.matricula, ...t }));
    novos.push(...ts);
    atuais = [...atuais, ...ts];
  }
  return novos;
};

// O turno que a pessoa mais repete nos outros dias da semana (entrada, saída e intervalo); nulo sem histórico.
export const turnoHabitual = (turnos, matricula, dia) => {
  const outros = turnos.filter((t) => t.matricula === matricula && t.dia !== dia);
  if (!outros.length) return null;
  const contagem = new Map();
  for (const t of outros) {
    const k = `${t.entrada}|${t.saida}|${t.iniIntervalo ?? ""}|${t.fimIntervalo ?? ""}`;
    contagem.set(k, { t, n: (contagem.get(k)?.n ?? 0) + 1 });
  }
  return [...contagem.values()].sort((a, b) => b.n - a.n)[0].t;
};

// O turno que nasce ao clicar numa "Folga": o habitual da pessoa (cortado nas horas do dia) ou, sem histórico, a abertura do dia
// com a jornada diária da regra.
export const novoTurnoNaFolga = ({ turnos, matricula, dia, aba, regra }) => {
  const h = turnoHabitual(turnos, matricula, dia);
  if (h) {
    const entrada = Math.max(h.entrada, aba.abre);
    const saida = Math.min(h.saida, aba.fecha);
    const dentro = h.iniIntervalo != null && h.fimIntervalo != null && h.iniIntervalo >= entrada && h.fimIntervalo <= saida;
    return { matricula, dia, entrada, saida, iniIntervalo: dentro ? h.iniIntervalo : null, fimIntervalo: dentro ? h.fimIntervalo : null };
  }
  const diaria = sobeQuarto(Math.min(regra.maxDia, tetoEfetivo(regra) / regra.dias));
  const entrada = aba.abre;
  const saida = Math.min(aba.fecha, entrada + diaria + (diaria > HORAS_SEM_INTERVALO + EPS ? 1 : 0));
  return { matricula, dia, entrada, saida, ...comIntervalo(entrada, saida) };
};

// Os turnos sem o da pessoa naquele dia (vira folga).
export const semTurnoNoDia = (turnos, matricula, dia) => turnos.filter((t) => !(t.matricula === matricula && t.dia === dia));

// Os avisos de regra da pessoa (jornada, intervalo, folga), sem os de cobertura.
export const avisosDaPessoa = (avaliacao, matricula) =>
  [...(avaliacao?.erros ?? []), ...(avaliacao?.avisos ?? [])]
    .filter((a) => a.matricula === matricula && !["cobertura", "farmaceutico"].includes(a.regra))
    .map((a) => a.texto);

// Os turnos no formato que o servidor aceita ao gravar (só os campos conhecidos, intervalo nulo quando não há). O servidor só
// aceita horas de 15 em 15 minutos; um horário do Cadastro como 14h38 vira o quarto de hora mais perto (14h45), para a mudança
// de qualquer turno não ser recusada por causa de outro.
const emQuarto = (h) => Math.round(h * 60) / 60; // minutos inteiros (spec 047)
export const turnosParaGravar = (turnos) =>
  turnos.map(({ matricula, dia, entrada, saida, iniIntervalo, fimIntervalo, antes }) => {
    const e = emQuarto(entrada);
    const sa = Math.max(emQuarto(saida), e + 1 / 60);
    // `antes`: o horário do Cadastro de antes de o turno ser esticado (spec 046); só vai se for diferente do de agora.
    const volta = antes && (emQuarto(antes.entrada) !== e || emQuarto(antes.saida) !== sa) ? { antes: { entrada: emQuarto(antes.entrada), saida: emQuarto(antes.saida) } } : {};
    return { matricula, dia, entrada: e, saida: sa, iniIntervalo: iniIntervalo == null ? null : emQuarto(iniIntervalo), fimIntervalo: fimIntervalo == null ? null : emQuarto(fimIntervalo), ...volta };
  });

// O turno foi esticado até o limite da regra (spec 046)? Vale quando guarda o horário de antes e ele é diferente do de agora.
export const turnoEsticado = (t) => !!t?.antes && (t.antes.entrada !== t.entrada || t.antes.saida !== t.saida);

// "Turno aumentado de 07h–15h para 07h–16h para cobrir a falta, dentro do limite de 42h".
export const textoDoEsticamento = (t, limiteH) =>
  turnoEsticado(t) ? `Turno aumentado de ${textoDoTurno(t.antes)} para ${textoDoTurno(t)} para cobrir a falta e completar a jornada${limiteH ? `, dentro do limite de ${virgula(limiteH)}h` : ""}` : "";

// ---- Intervalo na escala (almoço) -----------------------------------------------------------------------------------

// Onde fica o intervalo dentro da barra do turno, em % da largura da barra; nulo sem intervalo.
export const posicaoDoIntervalo = (t) => {
  if (!t || t.iniIntervalo == null || t.fimIntervalo == null || !(t.saida > t.entrada)) return null;
  const len = t.saida - t.entrada;
  const esq = ((t.iniIntervalo - t.entrada) / len) * 100;
  const larg = ((t.fimIntervalo - t.iniIntervalo) / len) * 100;
  return esq < 0 || esq + larg > 100 + EPS ? null : { esq, larg };
};

// "10h–11h" do intervalo de um turno.
export const textoDoIntervalo = (t) => (t && t.iniIntervalo != null && t.fimIntervalo != null ? `${hhTexto(t.iniIntervalo)}–${hhTexto(t.fimIntervalo)}` : "");

// Quem está no intervalo em cada hora (a razão de uma hora "faltar" com a barra do turno passando por cima dela):
// { hora: ["Eliane", "Pedro"] }, só para as pessoas dos turnos dados.
export const quemEstaEmIntervalo = (turnosDoDia, quadro) => {
  const nomes = new Map(quadro.map((p) => [p.matricula, String(p.nome ?? "").split(" ")[0]]));
  const porHora = {};
  for (const t of turnosDoDia) {
    if (t.iniIntervalo == null || t.fimIntervalo == null) continue;
    for (let h = Math.floor(t.entrada + EPS); h < Math.ceil(t.saida - EPS); h++) {
      const dentro = t.entrada <= h + EPS && t.saida >= h + 1 - EPS && t.iniIntervalo < h + 1 - EPS && t.fimIntervalo > h + EPS;
      if (dentro) (porHora[h] ??= []).push(nomes.get(t.matricula) ?? "Alguém");
    }
  }
  return porHora;
};
