import type { DiaAberto } from '../regras/capacidade.js';

export type TurnoPessoa = {
  funcao: string;
  dias: number[];
  entrada: number;
  saida: number;
  iniIntervalo: number | null;
  fimIntervalo: number | null;
};

export type CelulaHora = { hora: number; pessoas: number | null; ok: boolean | null };
export type CoberturaFuncao = { funcao: string; minimo: number; porHora: CelulaHora[] };

// A pessoa cobre a hora h se está no posto durante a hora inteira e não está em intervalo.
const cobre = (t: TurnoPessoa, dia: number, h: number) =>
  t.dias.includes(dia) &&
  t.entrada <= h &&
  t.saida >= h + 1 &&
  !(
    t.iniIntervalo != null &&
    t.fimIntervalo != null &&
    t.iniIntervalo < h + 1 &&
    t.fimIntervalo > h
  );

// Pessoas presentes no pior dia de cada hora, já descontado o intervalo.
export const cobertura = (
  dias: DiaAberto[],
  turnos: TurnoPessoa[],
  minimos: Record<string, number>,
) => {
  if (dias.length === 0) return { horas: [] as number[], funcoes: [] as CoberturaFuncao[] };
  const ini = Math.floor(Math.min(...dias.map((d) => d.abre)));
  const fim = Math.ceil(Math.max(...dias.map((d) => d.fecha)));
  const horas = Array.from({ length: fim - ini }, (_, i) => ini + i);
  const funcoes = [
    ...new Set([
      ...Object.keys(minimos).filter((f) => (minimos[f] ?? 0) > 0),
      ...turnos.map((t) => t.funcao),
    ]),
  ];

  return {
    horas,
    funcoes: funcoes.map((funcao): CoberturaFuncao => {
      const minimo = minimos[funcao] ?? 0;
      const doFuncao = turnos.filter((t) => t.funcao === funcao);
      return {
        funcao,
        minimo,
        porHora: horas.map((hora) => {
          const abertos = dias.filter((d) => d.abre <= hora && hora + 1 <= d.fecha + 1e-9);
          if (abertos.length === 0) return { hora, pessoas: null, ok: null };
          const pessoas = Math.min(
            ...abertos.map((d) => doFuncao.filter((t) => cobre(t, d.dia, hora)).length),
          );
          return { hora, pessoas, ok: pessoas >= minimo };
        }),
      };
    }),
  };
};
