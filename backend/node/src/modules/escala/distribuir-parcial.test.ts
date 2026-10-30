import { describe, expect, it } from 'vitest';
import { distribuirParcial } from './distribuir-parcial.js';

const dia = (d: number, abre = 8, fecha = 22) => ({ dia: d, abre, fecha });
const turno = (dias: number[], entrada: number, saida: number) => ({
  funcao: 'Farmacêutico',
  dias,
  entrada,
  saida,
  iniIntervalo: null,
  fimIntervalo: null,
});

describe('distribuirParcial', () => {
  it('sem ninguém no cargo: tudo descoberto, é estimativa; 14 h = 8 h num dia + 6 h no outro', () => {
    // dias iguais (14 h descobertas cada): ordem pelo número do dia → segunda e terça
    const r = distribuirParcial([dia(0), dia(1), dia(2)], [], 14);
    expect(r.estimativa).toBe(true);
    expect(r.blocos).toEqual([
      { dia: 0, de: '08:00', ate: '16:00', horas: 8 },
      { dia: 1, de: '08:00', ate: '14:00', horas: 6 },
    ]);
    expect(r.semLugarH).toBe(0);
  });

  it('parcial de 14 h sobre dias com 6 h descobertas: 2 blocos de 6 h e 1 de 2 h', () => {
    // Um farmacêutico das 8h às 16h em três dias: descoberto das 16h às 22h (6 h) em cada um
    const t = turno([0, 1, 2], 8, 16);
    const r = distribuirParcial([dia(0), dia(1), dia(2)], [t], 14);
    expect(r.estimativa).toBe(false);
    expect(r.blocos).toEqual([
      { dia: 0, de: '16:00', ate: '22:00', horas: 6 },
      { dia: 1, de: '16:00', ate: '22:00', horas: 6 },
      { dia: 2, de: '16:00', ate: '18:00', horas: 2 },
    ]);
  });

  it('começa pelos dias com mais horas descobertas', () => {
    // segunda coberta até 20h (2 h descobertas); terça só das 8h às 12h (10 h descobertas)
    const r = distribuirParcial([dia(0), dia(1)], [turno([0], 8, 20), turno([1], 8, 12)], 6);
    expect(r.blocos).toEqual([{ dia: 1, de: '12:00', ate: '18:00', horas: 6 }]);
  });

  it('usa a maior faixa contínua do dia e respeita o intervalo', () => {
    // farmacêutico 8h–22h com intervalo 12h–13h: só 12h–13h descoberta
    const t = { ...turno([0], 8, 22), iniIntervalo: 12, fimIntervalo: 13 };
    const r = distribuirParcial([dia(0)], [t], 4);
    expect(r.blocos).toEqual([{ dia: 0, de: '12:00', ate: '13:00', horas: 1 }]);
    expect(r.semLugarH).toBe(3);
  });

  it('nunca passa de 5 dias nem de 8 h por dia: 30 h em 7 dias de 14 h = 5 blocos (8+8+8+6)', () => {
    const r = distribuirParcial(
      [0, 1, 2, 3, 4, 5, 6].map((d) => dia(d)),
      [],
      30,
    );
    expect(r.blocos.map((b) => b.horas)).toEqual([8, 8, 8, 6]);
    expect(r.blocos.length).toBeLessThanOrEqual(5);
  });

  it('horas com fração viram minutos (14,67 h)', () => {
    const r = distribuirParcial([dia(0), dia(1)], [], 14.67);
    expect(r.blocos[1]).toEqual({ dia: 1, de: '08:00', ate: '14:40', horas: 6.67 });
  });
});
