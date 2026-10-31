import type { DiaAberto } from './capacidade.js';
import type { Fatia, Minimos } from './requisitos.js';

// Turnos da loja: faixas do dia, iguais em todos os dias da semana (recortadas pelo horário de cada dia),
// cada uma com o mínimo de pessoas por cargo.
export type TurnoLoja = {
  nome: string;
  inicio: string; // HH:MM
  fim: string; // HH:MM; "24:00" ou "00:00" = meia-noite; fim antes do início = vira a noite
  minimos: Record<string, number>;
};
// `modo` 'unico': o mínimo único vale e os turnos ficam guardados sem uso; ausente = valem os turnos, se houver.
export type ModoMinimo = 'turnos' | 'unico';
export type TurnosLoja = { versao: 1; modo?: ModoMinimo; turnos: TurnoLoja[] };

export const MAX_TURNOS = 6;
const EPS = 1e-9;

const emHoras = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h! + m! / 60;
};
export const hhmm = (h: number) => {
  const total = Math.round(h * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

export type Pedaco = { de: number; ate: number; turno: TurnoLoja };

// Cada turno vira um ou dois pedaços do relógio (o que vira a noite é cortado na meia-noite).
export const pedacosDe = (t: TurnoLoja): Pedaco[] => {
  const i = emHoras(t.inicio);
  let f = emHoras(t.fim);
  if (f < EPS) f = 24;
  if (f > i + EPS) return [{ de: i, ate: f, turno: t }];
  return [{ de: i, ate: 24, turno: t }, ...(f > EPS && f < i ? [{ de: 0, ate: f, turno: t }] : [])];
};

// Um turno só aceita cargos conhecidos, e o farmacêutico nunca fica abaixo de 1 (Lei 13.021/2014).
export const normalizarTurnos = (turnos: TurnoLoja[]): TurnoLoja[] =>
  turnos.map((t) => ({
    ...t,
    nome: t.nome.trim(),
    minimos: { ...t.minimos, Farmacêutico: t.minimos['Farmacêutico'] ?? 1 },
  }));

// Erros em português. Vazio = turnos válidos. Turnos podem se sobrepor e começar antes da abertura ou terminar depois
// do fechamento: o mínimo só conta dentro do horário de funcionamento. Buraco não é erro (ver `coberturaDeTurnos`).
export const validarTurnos = (turnos: TurnoLoja[], dias: DiaAberto[]): string[] => {
  const erros: string[] = [];
  if (turnos.length === 0) return ['Defina ao menos um turno.'];
  if (turnos.length > MAX_TURNOS) erros.push(`Use no máximo ${MAX_TURNOS} turnos.`);
  const nomes = new Set<string>();
  for (const t of turnos) {
    if (!t.nome.trim()) erros.push('Todo turno precisa de um nome.');
    else if (nomes.has(t.nome.trim().toLowerCase()))
      erros.push(`O nome "${t.nome}" está repetido.`);
    nomes.add(t.nome.trim().toLowerCase());
    if (t.inicio === '24:00') erros.push(`Turno ${t.nome}: o início não pode ser 24:00.`);
    else if (emHoras(t.inicio) === emHoras(t.fim))
      erros.push(`Turno ${t.nome}: o início e o fim são iguais.`);
    if ((t.minimos['Farmacêutico'] ?? 1) < 1)
      erros.push(
        `Turno ${t.nome}: o mínimo de farmacêutico é 1, a lei exige farmacêutico em todo o horário de funcionamento.`,
      );
  }
  if (erros.length) return erros;
  if (dias.length === 0)
    return ['Cadastre o horário de funcionamento da loja antes de definir os turnos.'];
  return [...new Set(erros)];
};

export type FaixaSemTurno = { dias: number[]; de: number; ate: number };

// Horas de funcionamento que nenhum turno cobre, dia a dia (os turnos são iguais em todos os dias). Dias com a mesma
// faixa descoberta vêm juntos. É informativo: nessas horas vale 1 farmacêutico e os demais cargos mantêm o nível de hoje.
export const coberturaDeTurnos = (turnos: TurnoLoja[], dias: DiaAberto[]): FaixaSemTurno[] => {
  const pedacos = turnos.flatMap(pedacosDe);
  const porChave = new Map<string, FaixaSemTurno>();
  for (const d of dias) {
    let ponto = d.abre;
    const lacunas: [number, number][] = [];
    for (const p of [...pedacos].sort((a, b) => a.de - b.de || a.ate - b.ate)) {
      if (p.ate <= ponto + EPS) continue;
      if (p.de > ponto + EPS) lacunas.push([ponto, Math.min(p.de, d.fecha)]);
      ponto = Math.max(ponto, p.ate);
      if (ponto >= d.fecha - EPS) break;
    }
    if (ponto < d.fecha - EPS) lacunas.push([ponto, d.fecha]);
    for (const [de, ate] of lacunas.filter(([a, b]) => b - a > EPS)) {
      const k = `${de}|${ate}`;
      const f = porChave.get(k) ?? { dias: [], de, ate };
      f.dias.push(d.dia);
      porChave.set(k, f);
    }
  }
  return [...porChave.values()].sort((a, b) => a.de - b.de);
};

const NOMES_DIA = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];

// A exigência que o motor usa: um número por cargo (sem turnos) ou uma fatia por turno,
// com o mínimo único da loja como reserva para a hora fora de qualquer turno.
export const exigenciasDaLoja = (
  minimos: Record<string, number>,
  turnos: TurnosLoja | null | undefined,
): Minimos => {
  if (!turnos?.turnos.length || turnos.modo === 'unico') return minimos;
  const fatias: Fatia[] = turnos.turnos.flatMap((t) =>
    pedacosDe(t).map((p) => ({ de: p.de, ate: p.ate, minimos: t.minimos, nome: t.nome })),
  );
  return { fatias, reserva: minimos };
};

// Avisos dos turnos já gravados: o que deixou de ser válido e as horas sem turno (informativo, não bloqueia).
export const avisosDeTurnos = (turnos: TurnosLoja | null | undefined, dias: DiaAberto[]): string[] => {
  if (!turnos?.turnos.length || turnos.modo === 'unico') return [];
  const erros = validarTurnos(turnos.turnos, dias);
  if (erros.length) return erros;
  return coberturaDeTurnos(turnos.turnos, dias).map((f) => {
    const todos = f.dias.length === dias.length;
    const onde = todos ? '' : ` (${f.dias.map((d) => NOMES_DIA[d]).join(', ')})`;
    return `Sem turno entre ${hhmm(f.de)} e ${hhmm(f.ate)}${onde}: nessas horas vale 1 farmacêutico e os demais cargos mantêm o nível de hoje.`;
  });
};
