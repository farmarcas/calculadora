import { describe, expect, it } from 'vitest';
import { PARCIAL, sugerirContratacao, type EntradaContratacao } from './contratacao-horas.js';

// Regra de 42 h sem convenção: jornada integral efetiva de 40 h, divisor 210.
// Farmacêutico: salário médio de R$ 4.722, encargos de 66%.
const base: Omit<EntradaContratacao, 'gapH'> = {
  jornadaIntegralH: 40,
  divisor: 210,
  salarioMedio: 4722,
  encargosPct: 66,
};
const sug = (gapH: number, extra: Partial<EntradaContratacao> = {}) =>
  sugerirContratacao({ ...base, gapH, ...extra });

describe('limites do parcial', () => {
  it('constantes: até 30 h; variante de 26 h com até 6 h extras, adicional de 50%', () => {
    expect(PARCIAL).toEqual({
      maxHorasSemana: 30,
      variante: { baseH: 26, extrasMaxH: 6 },
      extrasAdicionalPct: 50,
    });
  });
});

describe('sugestão por horas', () => {
  it('sem gap não há sugestão', () => {
    expect(sug(0)).toBeNull();
    expect(sug(0.001)).toBeNull();
  });

  it('gap de 10 h: 1 parcial de 10 h, sem ociosidade', () => {
    const s = sug(10)!.principal;
    expect(s).toMatchObject({
      tipo: 'parcial',
      inteiras: 0,
      parcialH: 10,
      horasContratadas: 10,
      horasUsadas: 10,
      horasOciosas: 0,
      ociosidadePct: 0,
    });
    // 4722 × 10 × 5 ÷ 210 = 1124,2857 × 1,66 = 1866,31
    expect(s.custoMensal).toBe(1866.31);
  });

  it('gap de 30 h exatos: 1 parcial de 30 h', () => {
    expect(sug(30)!.principal).toMatchObject({
      tipo: 'parcial',
      parcialH: 30,
      inteiras: 0,
      horasOciosas: 0,
    });
  });

  it('gap de 35 h: contrato integral (40 h), com 5 h ociosas (12,5%)', () => {
    expect(sug(35)!.principal).toMatchObject({
      tipo: 'integral',
      inteiras: 1,
      parcialH: null,
      horasContratadas: 40,
      horasUsadas: 35,
      horasOciosas: 5,
      ociosidadePct: 12.5,
    });
  });

  it('gap de 54 h (Porto Feliz): 1 integral de 40 h + 1 parcial de 14 h, sem ociosidade', () => {
    const s = sug(54)!.principal;
    expect(s).toMatchObject({
      tipo: 'integral_parcial',
      inteiras: 1,
      parcialH: 14,
      horasContratadas: 54,
      horasOciosas: 0,
      ociosidadePct: 0,
    });
    // integral: 4722 × 40 × 5 ÷ 210 × 1,66 = 7465,25; parcial de 14 h: 4722 × 14 × 5 ÷ 210 × 1,66 = 2612,84 (soma sem arredondar: 10078,0971)
    expect(s.custoMensal).toBe(10078.1);
  });

  it('o integral custa o salário vezes a jornada efetiva, e o parcial é proporcional', () => {
    // 40 h: 4722 × 40 × 5 ÷ 210 = 4497,14 × 1,66 = 7465,25
    expect(sug(40)!.principal).toMatchObject({
      tipo: 'integral',
      inteiras: 1,
      horasOciosas: 0,
      custoMensal: 7465.26,
    });
    expect(sug(80)!.principal.custoMensal).toBe(14930.51); // 2 × 7465,2571, como o sistema já calcula
    // Regra atual (44 h, divisor 220): 4722 × 44 × 5 ÷ 220 = 4722 × 1,66 = 7838,52
    expect(sug(44, { jornadaIntegralH: 44, divisor: 220 })!.principal.custoMensal).toBe(7838.52);
  });

  it('70 h: 1 integral + parcial de 30 h; 75 h: 2 integrais (o resto de 35 h passaria de 30 h)', () => {
    expect(sug(70)!.principal).toMatchObject({
      tipo: 'integral_parcial',
      inteiras: 1,
      parcialH: 30,
      horasOciosas: 0,
    });
    expect(sug(75)!.principal).toMatchObject({
      tipo: 'integral',
      inteiras: 2,
      parcialH: null,
      horasContratadas: 80,
      horasOciosas: 5,
    });
  });

  it('múltiplos exatos da jornada: só integrais; 100 h: 2 integrais + parcial de 20 h', () => {
    expect(sug(80)!.principal).toMatchObject({ tipo: 'integral', inteiras: 2, horasOciosas: 0 });
    expect(sug(100)!.principal).toMatchObject({
      tipo: 'integral_parcial',
      inteiras: 2,
      parcialH: 20,
      horasOciosas: 0,
    });
  });

  it('nunca sugere parcial acima de 30 h, para qualquer gap', () => {
    for (let g = 0.5; g <= 200; g += 0.5) {
      const o = sug(g)!;
      expect(o.principal.parcialH ?? 0).toBeLessThanOrEqual(30);
      expect(o.principal.horasContratadas).toBeGreaterThanOrEqual(g - 1e-9);
    }
  });

  it('a ociosidade nunca passa de uma jornada integral, e é a menor entre as combinações válidas', () => {
    for (let g = 1; g <= 160; g++) {
      const p = sug(g)!.principal;
      expect(p.horasOciosas).toBeLessThan(40);
    }
  });

  it('sem salário informado: as horas e a ociosidade aparecem e o custo fica nulo', () => {
    const s = sug(54, { salarioMedio: null })!.principal;
    expect(s).toMatchObject({ inteiras: 1, parcialH: 14, horasOciosas: 0, custoMensal: null });
  });

  it('sem encargos o custo é só o salário proporcional', () => {
    // 4722 × 10 × 5 ÷ 210 = 1124,29
    expect(sug(10, { encargosPct: 0 })!.principal.custoMensal).toBe(1124.29);
  });
});

describe('variante de 26 h com horas extras (opção secundária)', () => {
  it('gap de 32 h: o principal é o integral (8 h ociosas) e a variante 26 h + 6 h extras não deixa ociosidade', () => {
    const o = sug(32)!;
    expect(o.principal).toMatchObject({ tipo: 'integral', horasContratadas: 40, horasOciosas: 8 });
    expect(o.alternativa).toMatchObject({
      variante: 'com_hora_extra',
      parcialH: 26,
      extrasH: 6,
      inteiras: 0,
      horasContratadas: 32,
      horasOciosas: 0,
    });
    // contrato 4722 × 26 × 5 ÷ 210 = 2923,14; 6 h extras × 1,5: 4722 × 6 × 5 ÷ 210 × 1,5 = 1011,857; (2923,143 + 1011,857 = 3935,00) × 1,66 = 6532,10
    expect(o.alternativa!.custoMensal).toBe(6532.1);
  });

  it('gap de 31 h: 26 h + 5 h extras; gap de 33 h: sem variante (passaria de 32 h)', () => {
    expect(sug(31)!.alternativa).toMatchObject({ parcialH: 26, extrasH: 5, horasOciosas: 0 });
    expect(sug(33)!.alternativa).toBeNull();
  });

  it('só aparece quando o resto está entre 30 h e 32 h: nunca para 54 h, 10 h ou 30 h', () => {
    expect(sug(54)!.alternativa).toBeNull();
    expect(sug(10)!.alternativa).toBeNull();
    expect(sug(30)!.alternativa).toBeNull();
  });

  it('com integral antes: gap de 71 h = 1 integral + 26 h + 5 h extras', () => {
    expect(sug(71)!.alternativa).toMatchObject({
      inteiras: 1,
      parcialH: 26,
      extrasH: 5,
      horasContratadas: 71,
      horasOciosas: 0,
    });
  });
});

describe('loja 24 horas e outras jornadas', () => {
  it('gap de 88 h (loja 24 h com 2 farmacêuticos de 40 h): 2 integrais + parcial de 8 h', () => {
    expect(sug(88)!.principal).toMatchObject({
      tipo: 'integral_parcial',
      inteiras: 2,
      parcialH: 8,
      horasOciosas: 0,
    });
  });

  it('jornada integral de 42 h (com convenção de 8h24): gap de 54 h = 1 integral de 42 h + parcial de 12 h', () => {
    expect(sug(54, { jornadaIntegralH: 42 })!.principal).toMatchObject({
      inteiras: 1,
      parcialH: 12,
      horasContratadas: 54,
      horasOciosas: 0,
    });
  });
});
