import { describe, expect, it } from 'vitest';
import { faturamentoPorHora } from './faturamento-por-hora.js';

const l = (data: string, hora: number, venda: number) => ({
  data,
  hora,
  venda,
  margem: null,
  clientes: 1,
  unidades: 1,
});
// 2026-09-07 segunda, 08 terça, 12 sábado, 13 domingo.
const base = [
  l('2026-09-07', 8, 100),
  l('2026-09-07', 9, 300),
  l('2026-09-08', 8, 200),
  l('2026-09-08', 9, 100),
  l('2026-09-12', 8, 50),
  l('2026-09-12', 9, 150),
  l('2026-09-13', 10, 80),
];

describe('faturamentoPorHora', () => {
  it('sem linhas: sem base', () => {
    expect(faturamentoPorHora([], { dono: true })).toEqual({ temBase: false });
  });

  it('a média por dia de cada tipo, à mão: dias úteis = (100+200)/2 às 8h e (300+100)/2 às 9h', () => {
    const r = faturamentoPorHora(base, { dono: true });
    expect(r.temBase).toBe(true);
    if (!r.temBase) return;
    expect(r.tipos.uteis).toEqual([
      { hora: 8, participacao: 0.4286, valor: 150 },
      { hora: 9, participacao: 0.5714, valor: 200 },
    ]);
    expect(r.tipos.sabado!.map((h) => [h.hora, h.valor])).toEqual([
      [8, 50],
      [9, 150],
    ]);
    expect(r.tipos.domingo!.map((h) => [h.hora, h.valor])).toEqual([[10, 80]]);
  });

  it('a participação de cada tipo de dia soma 1', () => {
    const r = faturamentoPorHora(base, { dono: true });
    if (!r.temBase) throw new Error('sem base');
    for (const t of ['uteis', 'sabado', 'domingo'] as const)
      expect(r.tipos[t]!.reduce((s, h) => s + h.participacao, 0)).toBeCloseTo(1, 3);
  });

  it('tipo de dia sem venda vira nulo', () => {
    const r = faturamentoPorHora([l('2026-09-07', 8, 100)], { dono: true });
    if (!r.temBase) throw new Error('sem base');
    expect(r.tipos.sabado).toBeNull();
    expect(r.tipos.domingo).toBeNull();
  });

  it('poucos dias: menos de 4 semanas de vendas; com 5 semanas não avisa', () => {
    const curto = faturamentoPorHora(base, { dono: true });
    if (!curto.temBase) throw new Error('sem base');
    expect(curto.poucosDias).toBe(true);
    expect(curto.periodo).toMatchObject({ inicio: '2026-09-07', fim: '2026-09-13', dias: 4 });
    const longo = faturamentoPorHora([l('2026-09-07', 8, 100), l('2026-10-12', 8, 100)], {
      dono: true,
    });
    if (!longo.temBase) throw new Error('sem base');
    expect(longo.poucosDias).toBe(false);
  });

  it('para quem não é dono nenhum campo valor existe', () => {
    const r = faturamentoPorHora(base, { dono: false });
    expect(JSON.stringify(r)).not.toContain('valor');
    if (!r.temBase) throw new Error('sem base');
    expect(r.tipos.uteis![0]).toHaveProperty('participacao');
  });

  it('horas fora de 0 a 23 são ignoradas', () => {
    expect(faturamentoPorHora([l('2026-09-07', 30, 100)], { dono: true })).toEqual({
      temBase: false,
    });
  });
});
