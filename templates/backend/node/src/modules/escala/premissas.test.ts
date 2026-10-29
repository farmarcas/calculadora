import { describe, expect, it } from 'vitest';
import { PREMISSAS_PADRAO, premissasDe, premissasQuery } from './premissas.js';

const ler = (q: Record<string, string>) => premissasQuery.safeParse(q);
const erro = (q: Record<string, string>) => {
  const r = ler(q);
  return r.success ? null : r.error.issues.map((i) => i.message).join(' ');
};

describe('premissas para simular', () => {
  it('sem nada no pedido valem os padrões', () => {
    expect(premissasDe(undefined)).toEqual({ valores: PREMISSAS_PADRAO, margemPctSimulada: null });
    expect(PREMISSAS_PADRAO).toEqual({
      recaptura: 0,
      fatorDiaNovo: 50,
      diasProtegidos: 3,
      limiteParcial: 3,
    });
  });

  it('lê números que chegam como texto e junta com os padrões', () => {
    const r = ler({ recaptura: '20', margemPct: '27.5', limiteParcial: '1' });
    expect(r.success).toBe(true);
    expect(premissasDe(r.data)).toEqual({
      valores: { recaptura: 20, fatorDiaNovo: 50, diasProtegidos: 3, limiteParcial: 1 },
      margemPctSimulada: 27.5,
    });
  });

  it('aceita os extremos de cada faixa', () => {
    const extremos: Record<string, string>[] = [
      { recaptura: '0' },
      { recaptura: '30' },
      { margemPct: '0' },
      { margemPct: '100' },
      { fatorDiaNovo: '0' },
      { fatorDiaNovo: '100' },
      { diasProtegidos: '0' },
      { diasProtegidos: '6' },
      { limiteParcial: '0' },
      { limiteParcial: '3' },
    ];
    for (const q of extremos) expect(ler(q).success).toBe(true);
  });

  it('recusa valores fora da faixa com aviso em português', () => {
    expect(erro({ recaptura: '31' })).toContain('entre 0% e 30%');
    expect(erro({ recaptura: '-1' })).toContain('entre 0% e 30%');
    expect(erro({ margemPct: '101' })).toContain('entre 0% e 100%');
    expect(erro({ fatorDiaNovo: '120' })).toContain('entre 0% e 100%');
    expect(erro({ diasProtegidos: '7' })).toContain('entre 0 e 6');
    expect(erro({ diasProtegidos: '2.5' })).toContain('inteiro');
    expect(erro({ limiteParcial: '4' })).toContain('entre 0 e 3');
    expect(erro({ limiteParcial: '1.5' })).toContain('inteiro');
  });

  it('recusa texto que não é número e parâmetros desconhecidos', () => {
    expect(erro({ recaptura: 'muito' })).toContain('número');
    expect(ler({ foo: '1' }).success).toBe(false);
  });
});
