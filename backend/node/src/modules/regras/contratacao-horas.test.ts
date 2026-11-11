import { describe, expect, it } from 'vitest';
import { sugerirContratacao, type EntradaContratacao } from './contratacao-horas.js';

// Spec 044: só contratação integral. Regra de 42 h sem convenção: jornada integral efetiva de 40 h, divisor 210.
// Farmacêutico: salário médio de R$ 4.722, encargos de 66%.
const base: Omit<EntradaContratacao, 'gapH'> = {
  jornadaIntegralH: 40,
  divisor: 210,
  salarioMedio: 4722,
  encargosPct: 66,
};
const sug = (gapH: number, extra: Partial<EntradaContratacao> = {}) =>
  sugerirContratacao({ ...base, gapH, ...extra });

describe('sugestão por horas (só integral)', () => {
  it('sem gap não há sugestão', () => {
    expect(sug(0)).toBeNull();
    expect(sug(0.001)).toBeNull();
  });

  it('nunca há alternativa nem parcial: o principal é sempre integral, sem hora extra', () => {
    for (let g = 0.5; g <= 200; g += 0.5) {
      const o = sug(g)!;
      expect(o.alternativa).toBeNull();
      expect(o.principal).toMatchObject({
        tipo: 'integral',
        parcialH: null,
        extrasH: 0,
        variante: null,
      });
      expect(o.principal.inteiras).toBe(Math.ceil(g / 40 - 1e-9));
      expect(o.principal.horasContratadas).toBeGreaterThanOrEqual(g - 1e-9);
    }
  });

  it('gap de 10 h: 1 integral de 40 h, com 30 h ociosas (75%)', () => {
    expect(sug(10)!.principal).toMatchObject({
      inteiras: 1,
      horasContratadas: 40,
      horasUsadas: 10,
      horasOciosas: 30,
      ociosidadePct: 75,
    });
  });

  it('gap de 35 h: 1 integral, com 5 h ociosas (12,5%)', () => {
    expect(sug(35)!.principal).toMatchObject({
      inteiras: 1,
      horasContratadas: 40,
      horasUsadas: 35,
      horasOciosas: 5,
      ociosidadePct: 12.5,
    });
  });

  it('gap de 54 h (Porto Feliz): 2 integrais, com 26 h ociosas', () => {
    const s = sug(54)!.principal;
    expect(s).toMatchObject({ inteiras: 2, horasContratadas: 80, horasOciosas: 26 });
    // integral: 4722 × 40 × 5 ÷ 210 × 1,66 = 7465,2571; duas: 14930,51
    expect(s.custoMensal).toBe(14930.51);
  });

  it('múltiplos exatos da jornada não deixam ociosidade', () => {
    expect(sug(40)!.principal).toMatchObject({ inteiras: 1, horasOciosas: 0, custoMensal: 7465.26 });
    expect(sug(80)!.principal).toMatchObject({ inteiras: 2, horasOciosas: 0, custoMensal: 14930.51 });
    // Regra atual (44 h, divisor 220): 4722 × 44 × 5 ÷ 220 = 4722 × 1,66 = 7838,52
    expect(sug(44, { jornadaIntegralH: 44, divisor: 220 })!.principal.custoMensal).toBe(7838.52);
  });

  it('a ociosidade nunca passa de uma jornada integral', () => {
    for (let g = 1; g <= 160; g++) expect(sug(g)!.principal.horasOciosas).toBeLessThan(40);
  });

  it('sem salário informado: as horas e a ociosidade aparecem e o custo fica nulo', () => {
    expect(sug(54, { salarioMedio: null })!.principal).toMatchObject({
      inteiras: 2,
      horasOciosas: 26,
      custoMensal: null,
    });
  });

  it('sem encargos o custo é só o salário da jornada cheia', () => {
    // 4722 × 40 × 5 ÷ 210 = 4497,14
    expect(sug(10, { encargosPct: 0 })!.principal.custoMensal).toBe(4497.14);
  });
});
