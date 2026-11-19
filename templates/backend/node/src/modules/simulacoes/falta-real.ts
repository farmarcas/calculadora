// A falta real de cobertura de uma simulação (spec 063), hora a hora, vinda dos turnos: por função, o total que falta por semana,
// o que falta em cada dia e quantas pessoas trabalham em cada dia. É a mesma medida de `semanaComFolgas` (a do cartão do cenário),
// para a hora extra da Simulação e a do cartão darem o mesmo número.
import { coberturaDaFuncao, faltaDaFuncao } from '../escala/semana-com-folgas.js';
import type { TurnoSim } from './avaliar.js';
import { FARMACEUTICO } from '../regras/gap-horas.js';
import { requisitos, type Minimos } from '../regras/requisitos.js';
import type { DiaAberto } from '../regras/capacidade.js';

export type FaltaReal = { faltaH: number; faltaPorDiaH: number[]; pessoasPorDia: number[] };

const arred = (n: number) => Math.round(n * 100) / 100;

export const faltaRealPorFuncao = (a: {
  quadro: { matricula: string; funcao: string | null; desligado?: boolean }[];
  turnos: TurnoSim[];
  dias: DiaAberto[];
  minimos: Minimos;
}): Record<string, FaltaReal> => {
  const funcaoDe = new Map(
    a.quadro.filter((p) => !p.desligado && p.funcao).map((p) => [p.matricula, p.funcao!]),
  );
  const exigidas = [...new Set([FARMACEUTICO, ...requisitos(a.minimos).funcoes])];
  const saida: Record<string, FaltaReal> = {};
  for (const funcao of exigidas) {
    const daFuncao = a.turnos.filter((t) => funcaoDe.get(t.matricula) === funcao);
    const cob = coberturaDaFuncao(funcao, daFuncao, a.dias, a.minimos);
    saida[funcao] = {
      faltaH: faltaDaFuncao(cob),
      faltaPorDiaH: Array.from({ length: 7 }, (_, d) =>
        arred((cob[d] ?? []).reduce((s, c) => s + Math.max(0, c.exigido - c.pessoas), 0)),
      ),
      pessoasPorDia: Array.from(
        { length: 7 },
        (_, d) => new Set(daFuncao.filter((t) => t.dia === d).map((t) => t.matricula)).size,
      ),
    };
  }
  return saida;
};
