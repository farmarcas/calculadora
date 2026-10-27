import { describe, expect, it } from 'vitest';
import { avaliarAlertas, LIMITES_PADRAO, type Semana } from './alertas.js';

const sem = (inicio: string, horaExtraH: number, aderenciaPct: number | null = 100): Semana => ({
  inicio,
  fim: inicio,
  aderenciaPct,
  horaExtraH,
  horasPlanejadas: 100,
  faltas: 0,
});

describe('avaliarAlertas', () => {
  it('sem problema, sem alerta', () => {
    expect(avaliarAlertas([sem('a', 0), sem('b', 2)], LIMITES_PADRAO)).toEqual([]);
  });
  it('hora extra acima do limite em semanas seguidas gera alerta', () => {
    const r = avaliarAlertas([sem('a', 1), sem('b', 7), sem('c', 8)], LIMITES_PADRAO);
    expect(r).toHaveLength(1);
    expect(r[0]!.texto).toContain('2 semana(s) seguida(s) (7%, 8%)');
  });
  it('uma semana acima e outra abaixo não conta como seguida', () => {
    expect(avaliarAlertas([sem('a', 8), sem('b', 1)], LIMITES_PADRAO)).toEqual([]);
  });
  it('aderência abaixo do mínimo na última semana', () => {
    const r = avaliarAlertas([sem('a', 0, 95), sem('b', 0, 80)], LIMITES_PADRAO);
    expect(r).toEqual([
      { tipo: 'aderencia', texto: 'Aderência de 80% na última semana (mínimo 90%).' },
    ]);
  });
  it('respeita limites editados', () => {
    expect(
      avaliarAlertas([sem('a', 3)], { horaExtraPct: 2, semanasSeguidas: 1, aderenciaMinPct: 50 }),
    ).toHaveLength(1);
  });
});
