// Contas puras do gráfico de turnos com o faturamento por hora (spec 035), sem React. A série vem do servidor:
// [{ hora, participacao, valor? }] de um tipo de dia (o `valor` em reais só existe para o dono).
import { emHoras, janelaDoMinimo, pedacosDe, texto } from "../turnos.js";

const EPS = 1e-9;
const arred = (n) => Math.round(n * 100) / 100;

// Uma coluna por hora de funcionamento: da hora em que a loja abre à última hora em que ainda está aberta.
export const eixoDaJanela = (janela) => {
  if (!janela) return [];
  const ini = Math.floor(janela.abre + EPS);
  const fim = Math.ceil(janela.fecha - EPS);
  return Array.from({ length: Math.max(0, fim - ini) }, (_, i) => ini + i);
};

const celula = (serie, hora) => serie?.find((s) => s.hora === hora) ?? null;
// O que a hora fatura: o valor em reais (dono) ou a participação no dia (demais perfis), para comparar barras.
const peso = (c) => (c ? (c.valor ?? c.participacao ?? 0) : 0);

// Horas do eixo que o turno cobre dentro do horário da loja (a hora conta se o meio dela cai no turno).
export const horasDoTurno = (turno, janela) => {
  const faixas = janelaDoMinimo(turno, janela);
  return eixoDaJanela(janela).filter((h) => faixas.some((f) => f.de <= h + 0.5 && h + 0.5 < f.ate));
};

// As `n` horas de maior faturamento do eixo (só as que vendem).
export const horasDeMaiorFaturamento = (serie, janela, n = 3) =>
  new Set(
    eixoDaJanela(janela)
      .map((h) => ({ h, p: peso(celula(serie, h)) }))
      .filter((x) => x.p > 0)
      .sort((a, b) => b.p - a.p || a.h - b.h)
      .slice(0, n)
      .map((x) => x.h),
  );

// Números do turno: faturamento (soma das horas), parte do dia, média por hora e pico. `valor` e `media` só existem para o dono.
export const faturamentoDoTurno = (turno, serie, janela) => {
  const horas = horasDoTurno(turno, janela).map((hora) => {
    const c = celula(serie, hora);
    return { hora, participacao: c?.participacao ?? 0, ...(c && "valor" in c ? { valor: c.valor } : {}) };
  });
  const comValor = horas.length > 0 && horas.every((h) => "valor" in h) && serie?.some((s) => "valor" in s);
  const pct = horas.reduce((s, h) => s + h.participacao, 0);
  const pico = horas.length ? horas.reduce((a, b) => (peso(b) > peso(a) ? b : a)) : null;
  const valor = comValor ? arred(horas.reduce((s, h) => s + h.valor, 0)) : undefined;
  return {
    horas,
    participacao: pct,
    pctDoDia: Math.round(pct * 100),
    ...(valor !== undefined ? { valor, media: horas.length ? Math.round(valor / horas.length) : 0 } : {}),
    pico: pico && peso(pico) > 0 ? pico : null,
  };
};

const fimEmHoras = (t) => {
  const f = emHoras(t.fim);
  return f < EPS ? 24 : f;
};
const turnoSimples = (t) => pedacosDe(t).length === 1;

// Pares de turnos que se tocam (o fim de um é o início do outro): lá fica a alça para arrastar o limite.
export const alcasDosTurnos = (turnos) => {
  const alcas = [];
  turnos.forEach((a, i) => {
    turnos.forEach((b, j) => {
      if (i === j || !turnoSimples(a) || !turnoSimples(b)) return;
      if (Math.abs(fimEmHoras(a) - emHoras(b.inicio)) < EPS) alcas.push({ de: i, para: j, hora: fimEmHoras(a) });
    });
  });
  return alcas;
};

const textoDoFim = (h) => (h >= 24 - EPS ? "00:00" : texto(h));

// Arrasta o limite entre o turno `de` e o turno `para`: muda o fim de um e o início do outro, de 1 em 1 hora, com mínimo de
// 1 hora em cada um. Devolve os turnos novos (a entrada não é alterada); sem efeito, devolve a própria entrada.
export const moverLimite = (turnos, de, para, novaHora) => {
  const a = turnos[de];
  const b = turnos[para];
  if (!a || !b || !turnoSimples(a) || !turnoSimples(b)) return turnos;
  const hora = Math.round(novaHora);
  const minimo = emHoras(a.inicio) + 1;
  const maximo = fimEmHoras(b) - 1;
  if (hora < minimo - EPS || hora > maximo + EPS) return turnos;
  if (Math.abs(hora - fimEmHoras(a)) < EPS) return turnos;
  return turnos.map((t, i) => (i === de ? { ...t, fim: textoDoFim(hora) } : i === para ? { ...t, inicio: texto(hora) } : t));
};

// Sugere limites de turno pelo movimento: divide o horário da loja em k turnos que carregam partes iguais do faturamento do
// dia (cada limite cai na hora cheia mais perto de 1/k, 2/k… do total), com no mínimo 1 hora por turno. Assim a manhã
// fraca vira um turno mais longo e o pico, um turno mais curto. Mantém nome e mínimos dos turnos atuais, por ordem; os que
// faltam usam "Turno n" e o mínimo do último. Determinístico; não altera a entrada.
export const sugerirTurnos = (serie, janela, turnosAtuais, maximo = 6) => {
  const eixo = eixoDaJanela(janela);
  if (!eixo.length) return null;
  const k = Math.min(maximo, eixo.length, Math.max(turnosAtuais.length, 3));
  const v = eixo.map((h) => peso(celula(serie, h)));
  const n = v.length;
  const acum = [0];
  v.forEach((x, i) => acum.push(acum[i] + x));
  const total = acum[n];
  // Índices de corte (1..n-1): o mais próximo de cada fração do total, sempre crescentes e com 1 hora em cada turno.
  const cortes = [];
  for (let j = 1; j < k; j++) {
    const alvo = total > 0 ? (total * j) / k : (n * j) / k;
    const minimo = (cortes.at(-1) ?? 0) + 1;
    const maximoDoCorte = n - (k - j);
    let melhor = minimo;
    let menor = Infinity;
    for (let c = minimo; c <= maximoDoCorte; c++) {
      const d = Math.abs((total > 0 ? acum[c] : c) - alvo);
      if (d < menor - 1e-9) { menor = d; melhor = c; }
    }
    cortes.push(melhor);
  }
  const limites = [0, ...cortes];
  const horaDe = (idx) => (idx === 0 ? janela.abre : idx >= n ? janela.fecha : eixo[idx]);
  const minimosPadrao = turnosAtuais.length ? turnosAtuais[turnosAtuais.length - 1].minimos : { Farmacêutico: 1 };
  return limites.map((ini, t) => {
    const fim = t + 1 < limites.length ? limites[t + 1] : n;
    const base = turnosAtuais[t];
    const minimos = { ...(base?.minimos ?? minimosPadrao) };
    minimos["Farmacêutico"] = Math.max(1, minimos["Farmacêutico"] ?? 1);
    return { nome: base?.nome ?? `Turno ${t + 1}`, inicio: texto(horaDe(ini)), fim: textoDoFim(horaDe(fim)), minimos };
  });
};
