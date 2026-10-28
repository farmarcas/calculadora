import type { DiaAberto } from './capacidade.js';

const EPS = 1e-9;

// Exigência de pessoas por cargo. Forma simples (um número por cargo, igual em todas as horas) ou
// por fatias do dia (turnos), cada uma com o seu mínimo; `reserva` vale para a hora fora de qualquer fatia.
// Dado puro (sem função), para poder ser gravado no retrato de uma simulação.
export type Fatia = { de: number; ate: number; minimos: Record<string, number>; nome?: string };
export type MinimosPorFatia = { fatias: Fatia[]; reserva: Record<string, number> };
export type Minimos = Record<string, number> | MinimosPorFatia;

export const porFatia = (m: Minimos): m is MinimosPorFatia => 'fatias' in m;

export type Requisitos = {
  // Cargos que são exigidos (> 0) em alguma hora.
  funcoes: string[];
  // Presente só na forma simples: permite manter a conta antiga, número por número.
  uniforme: Record<string, number> | null;
  emHora: (funcao: string, dia: number, hora: number) => number;
  // Maior exigência do cargo ao longo do dia.
  pico: (funcao: string) => number;
  // "Manhã 1 · Tarde 3": a exigência do cargo em cada turno com nome; nulo na forma simples.
  porTurno: (funcao: string) => string | null;
};

// Pergunta única do motor: quantas pessoas deste cargo a loja exige neste dia e nesta hora.
export const requisitos = (m: Minimos): Requisitos => {
  if (!porFatia(m))
    return {
      funcoes: Object.keys(m).filter((f) => (m[f] ?? 0) > 0),
      uniforme: m,
      emHora: (f) => m[f] ?? 0,
      pico: (f) => m[f] ?? 0,
      porTurno: () => null,
    };
  const todos = [m.reserva, ...m.fatias.map((x) => x.minimos)];
  const pico = (f: string) => Math.max(0, ...todos.map((r) => r[f] ?? 0));
  const funcoes = [...new Set(todos.flatMap((r) => Object.keys(r)))].filter((f) => pico(f) > 0);
  return {
    funcoes,
    uniforme: null,
    // A hora h ocupa [h, h+1): vale a fatia que contém o meio dela.
    emHora: (f, _dia, h) => {
      const meio = h + 0.5;
      const x = m.fatias.find((s) => s.de <= meio + EPS && meio < s.ate - EPS);
      return (x ? x.minimos : m.reserva)[f] ?? 0;
    },
    pico,
    porTurno: (f) => {
      const vistos = new Map<string, number>();
      for (const x of m.fatias) if (x.nome) vistos.set(x.nome, x.minimos[f] ?? 0);
      return vistos.size ? [...vistos].map(([nome, n]) => `${nome} ${n}`).join(' · ') : null;
    },
  };
};

// Horas do dia aberto em que o cargo é exigido por k pessoas ou mais, para k = 1, 2, …
// (camada k = posição k). Com exigência igual em todas as horas, são `mínimo` camadas iguais às horas abertas.
export const camadasDoDia = (req: Requisitos, funcao: string, d: DiaAberto): number[] => {
  const camadas: number[] = [];
  for (let h = Math.floor(d.abre); h < Math.ceil(d.fecha - EPS); h++) {
    const parte = Math.min(h + 1, d.fecha) - Math.max(h, d.abre);
    const n = req.emHora(funcao, d.dia, h);
    for (let k = 0; k < n; k++) camadas[k] = (camadas[k] ?? 0) + parte;
  }
  return camadas;
};

// Duas exigências são a mesma? Na forma simples compara cargo a cargo (ausente = 0).
export const minimosIguais = (a: Minimos, b: Minimos) => {
  if (!porFatia(a) && !porFatia(b))
    return [...new Set([...Object.keys(a), ...Object.keys(b)])].every(
      (f) => (a[f] ?? 0) === (b[f] ?? 0),
    );
  return JSON.stringify(a) === JSON.stringify(b);
};
