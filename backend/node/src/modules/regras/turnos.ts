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
export type TurnosLoja = { versao: 1; turnos: TurnoLoja[] };

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

// Erros em português. Vazio = turnos válidos para o horário da loja: sem sobreposição, sem buraco e
// dentro do horário de funcionamento (do primeiro horário aberto da semana ao último).
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

  const abre = Math.min(...dias.map((d) => d.abre));
  const fecha = Math.max(...dias.map((d) => d.fecha));
  const pedacos = turnos.flatMap(pedacosDe).sort((a, b) => a.de - b.de || a.ate - b.ate);
  let ponto = abre;
  for (const p of pedacos) {
    if (p.de < abre - EPS)
      erros.push(`O turno ${p.turno.nome} começa antes da abertura da loja (${hhmm(abre)}).`);
    else if (p.de < ponto - EPS)
      erros.push(`Os turnos se sobrepõem entre ${hhmm(p.de)} e ${hhmm(Math.min(ponto, p.ate))}.`);
    else if (p.de > ponto + EPS) erros.push(`Falta um turno entre ${hhmm(ponto)} e ${hhmm(p.de)}.`);
    if (p.ate > fecha + EPS)
      erros.push(`O turno ${p.turno.nome} termina depois do fechamento da loja (${hhmm(fecha)}).`);
    ponto = Math.max(ponto, p.ate);
  }
  if (ponto < fecha - EPS) erros.push(`Falta um turno entre ${hhmm(ponto)} e ${hhmm(fecha)}.`);
  return [...new Set(erros)];
};

// A exigência que o motor usa: um número por cargo (sem turnos) ou uma fatia por turno,
// com o mínimo único da loja como reserva para a hora fora de qualquer turno.
export const exigenciasDaLoja = (
  minimos: Record<string, number>,
  turnos: TurnosLoja | null | undefined,
): Minimos => {
  if (!turnos?.turnos.length) return minimos;
  const fatias: Fatia[] = turnos.turnos.flatMap((t) =>
    pedacosDe(t).map((p) => ({ de: p.de, ate: p.ate, minimos: t.minimos, nome: t.nome })),
  );
  return { fatias, reserva: minimos };
};

// Avisos de turnos já gravados que deixaram de caber (ex.: o horário da loja mudou depois).
export const avisosDeTurnos = (turnos: TurnosLoja | null | undefined, dias: DiaAberto[]) =>
  turnos?.turnos.length ? validarTurnos(turnos.turnos, dias) : [];
