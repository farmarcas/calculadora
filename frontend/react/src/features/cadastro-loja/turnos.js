// Contas puras dos turnos (sem React), espelhando as regras do servidor: o mínimo só conta dentro do horário de funcionamento,
// turnos podem se sobrepor e passar do horário, e hora sem turno é aviso (não erro).
export const FUNCOES = ["Farmacêutico", "Atendimento", "Caixa", "Apoio", "Perfumaria"];
export const MAX_TURNOS = 6;
const EPS = 1e-9;

export const emHoras = (hhmm) => {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h + m / 60;
};
export const texto = (h) => `${String(Math.floor(h + EPS)).padStart(2, "0")}:${String(Math.round((h % 1) * 60) % 60).padStart(2, "0")}`.replace(/^24:00$/, "24:00");
const arred = (n) => Math.round(n * 100) / 100;

// Cada turno vira um ou dois pedaços do relógio (o que vira a noite é cortado na meia-noite). Fim 00:00 = meia-noite.
export const pedacosDe = (t) => {
  const i = emHoras(t.inicio);
  let f = emHoras(t.fim);
  if (f < EPS) f = 24;
  if (f > i + EPS) return [{ de: i, ate: f }];
  return [{ de: i, ate: 24 }, ...(f > EPS && f < i ? [{ de: 0, ate: f }] : [])];
};

// Duração do turno em horas (o que vira a noite soma os dois lados).
export const duracaoDoTurno = (t) => arred(pedacosDe(t).reduce((s, p) => s + (p.ate - p.de), 0));

// Janela do horário de funcionamento: do primeiro horário aberto da semana ao último. Nulo sem horário.
export const janelaDaLoja = (horarios) => {
  const abertos = (horarios?.dias ?? []).filter((d) => d.aberta);
  if (!abertos.length) return null;
  const abre = Math.min(...abertos.map((d) => (d.h24 ? 0 : emHoras(d.abre))));
  const fecha = Math.max(...abertos.map((d) => (d.h24 ? 24 : emHoras(d.fecha === "00:00" ? "24:00" : d.fecha))));
  return { abre, fecha };
};
export const horasDaJanela = (j) => (j ? arred(j.fecha - j.abre) : 0);

// Onde o mínimo do turno conta: turno ∩ horário da loja. Lista de faixas (pode ser vazia).
export const janelaDoMinimo = (turno, janela) => {
  if (!janela) return [];
  return pedacosDe(turno)
    .map((p) => ({ de: Math.max(p.de, janela.abre), ate: Math.min(p.ate, janela.fecha) }))
    .filter((f) => f.ate - f.de > EPS);
};

// Faixas do dia (0–24) em que 2 ou mais turnos estão ativos ao mesmo tempo.
export const sobreposicoes = (turnos) => {
  const cortes = [...new Set([0, 24, ...turnos.flatMap(pedacosDe).flatMap((p) => [p.de, p.ate])])].sort((a, b) => a - b);
  const faixas = [];
  for (let k = 0; k < cortes.length - 1; k++) {
    const de = cortes[k];
    const ate = cortes[k + 1];
    const meio = (de + ate) / 2;
    const ativos = turnos.filter((t) => pedacosDe(t).some((p) => p.de <= meio && meio < p.ate)).length;
    if (ativos >= 2) {
      const ultima = faixas[faixas.length - 1];
      if (ultima && Math.abs(ultima.ate - de) < EPS) ultima.ate = ate;
      else faixas.push({ de, ate });
    }
  }
  return faixas;
};

// Dentro de `janela`, as faixas sobrepostas (para a legenda "Sobreposição: 12:00–15:00 (3h)").
export const sobreposicoesNaJanela = (turnos, janela) =>
  sobreposicoes(turnos)
    .map((f) => (janela ? { de: Math.max(f.de, janela.abre), ate: Math.min(f.ate, janela.fecha) } : f))
    .filter((f) => f.ate - f.de > EPS);

// Horas de funcionamento que nenhum turno cobre, dia a dia; dias com a mesma faixa vêm juntos.
export const coberturaDoHorario = (turnos, horarios) => {
  const pedacos = turnos.flatMap(pedacosDe).sort((a, b) => a.de - b.de || a.ate - b.ate);
  const porChave = new Map();
  (horarios?.dias ?? []).forEach((d, dia) => {
    if (!d.aberta) return;
    const abre = d.h24 ? 0 : emHoras(d.abre);
    const fecha = d.h24 ? 24 : emHoras(d.fecha === "00:00" ? "24:00" : d.fecha);
    if (!(fecha > abre)) return;
    let ponto = abre;
    const lacunas = [];
    for (const p of pedacos) {
      if (p.ate <= ponto + EPS) continue;
      if (p.de > ponto + EPS) lacunas.push([ponto, Math.min(p.de, fecha)]);
      ponto = Math.max(ponto, p.ate);
      if (ponto >= fecha - EPS) break;
    }
    if (ponto < fecha - EPS) lacunas.push([ponto, fecha]);
    for (const [de, ate] of lacunas.filter(([a, b]) => b - a > EPS)) {
      const k = `${de}|${ate}`;
      const f = porChave.get(k) ?? { dias: [], de, ate };
      f.dias.push(dia);
      porChave.set(k, f);
    }
  });
  return [...porChave.values()].sort((a, b) => a.de - b.de);
};

// Ponto de partida ao ativar os turnos: o mínimo único atual em cada turno (nada a redigitar).
export const turnosIniciais = (janela, minimos) => {
  const copia = () => Object.fromEntries(Object.entries(minimos).filter(([, v]) => v > 0));
  const comFarma = () => ({ ...copia(), Farmacêutico: Math.max(1, minimos.Farmacêutico ?? 1) });
  if (!janela) return [{ nome: "Dia todo", inicio: "08:00", fim: "20:00", minimos: comFarma() }];
  if (janela.abre === 0 && janela.fecha === 24)
    return [
      { nome: "Turno 1", inicio: "00:00", fim: "12:00", minimos: comFarma() },
      { nome: "Turno 2", inicio: "12:00", fim: "00:00", minimos: comFarma() },
    ];
  return [{ nome: "Turno 1", inicio: texto(janela.abre), fim: janela.fecha === 24 ? "00:00" : texto(janela.fecha), minimos: comFarma() }];
};

// Erros dos turnos em texto, com o campo: nome repetido ou vazio, início = fim, farmacêutico menor que 1, mais de 6 turnos.
export const errosDosTurnos = (turnos) => {
  const e = [];
  if (turnos.length > MAX_TURNOS) e.push({ campo: "turnos", texto: `Use no máximo ${MAX_TURNOS} turnos.` });
  const nomes = new Set();
  turnos.forEach((t, i) => {
    const n = t.nome.trim().toLowerCase();
    if (!n) e.push({ campo: `turno-${i}-nome`, texto: `Turno ${i + 1}: informe um nome.` });
    else if (nomes.has(n)) e.push({ campo: `turno-${i}-nome`, texto: `O nome "${t.nome}" está repetido.` });
    nomes.add(n);
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(t.inicio)) e.push({ campo: `turno-${i}-inicio`, texto: `${t.nome || `Turno ${i + 1}`}: informe o início (HH:mm).` });
    else if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(t.fim)) e.push({ campo: `turno-${i}-fim`, texto: `${t.nome || `Turno ${i + 1}`}: informe o fim (HH:mm).` });
    else if (emHoras(t.inicio) === emHoras(t.fim)) e.push({ campo: `turno-${i}-fim`, texto: `${t.nome || `Turno ${i + 1}`}: o início e o fim são iguais.` });
    if ((t.minimos.Farmacêutico ?? 1) < 1) e.push({ campo: `turno-${i}-farma`, texto: `${t.nome || `Turno ${i + 1}`}: o mínimo de farmacêutico é 1 (Lei 13.021/2014).` });
  });
  return e;
};
