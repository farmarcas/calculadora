import { describe, expect, it } from 'vitest';
import type { Contratacao } from './cenarios.js';
import { adicionalEntre, montarEtapas } from './etapas.js';

const c = (funcao: string, inteiras: number, parcialH: number | null = null): Contratacao => ({
  funcao,
  pessoas: inteiras + (parcialH ? 1 : 0),
  inteiras,
  parcial: parcialH ? { turnos: parcialH / 8, horas: parcialH } : null,
  parcialH,
  horasContratadas: inteiras * 40 + (parcialH ?? 0),
  ociosidadePct: 0,
  ajustado: false,
});

describe('adicional entre as fases', () => {
  it('fase de 42h pede 1 inteira; a de 40h pede 2: adicional de 1 inteira', () => {
    expect(adicionalEntre([c('Farmacêutico', 1)], [c('Farmacêutico', 2)])).toEqual([
      { funcao: 'Farmacêutico', inteiras: 1, horasParciais: 0 },
    ]);
  });
  it('parcial que cresce: adicional em horas de parcial', () => {
    expect(adicionalEntre([c('Caixa', 0, 8)], [c('Caixa', 0, 24)])).toEqual([
      { funcao: 'Caixa', inteiras: 0, horasParciais: 16 },
    ]);
  });
  it('cargo que só aparece na fase de 40h entra inteiro como adicional', () => {
    expect(adicionalEntre([], [c('Atendimento', 1, 16)])).toEqual([
      { funcao: 'Atendimento', inteiras: 1, horasParciais: 16 },
    ]);
  });
  it('fase de 40h pedindo igual ou menos: sem adicional (nunca negativo)', () => {
    expect(adicionalEntre([c('Farmacêutico', 2)], [c('Farmacêutico', 2)])).toEqual([]);
    expect(adicionalEntre([c('Farmacêutico', 2)], [c('Farmacêutico', 1)])).toEqual([]);
    expect(adicionalEntre([], [])).toEqual([]);
  });
});

describe('montarEtapas', () => {
  const base = {
    etapa1: [c('Farmacêutico', 1)],
    etapa2: [c('Farmacêutico', 2)],
    vigencia1: '16/12/2026',
    vigencia2: '01/12/2027',
  };
  it('o dono recebe o custo de cada etapa e o adicional', () => {
    const e = montarEtapas({ ...base, dono: true, custo1: 8000, custo2: 15000.5 });
    expect(e).toMatchObject({
      custoEtapa1Mensal: 8000,
      custoEtapa2Mensal: 15000.5,
      custoAdicionalMensal: 7000.5,
    });
    expect(e.adicional).toHaveLength(1);
  });
  it('sem custos informados, os valores ficam nulos (nunca parciais)', () => {
    const e = montarEtapas({ ...base, dono: true, custo1: null, custo2: 5000 });
    expect(e.custoAdicionalMensal).toBeNull();
  });
  it('quem não é dono recebe as etapas sem nenhum campo de custo', () => {
    const e = montarEtapas({ ...base, dono: false, custo1: 8000, custo2: 15000 });
    expect('custoEtapa1Mensal' in e).toBe(false);
    expect('custoEtapa2Mensal' in e).toBe(false);
    expect('custoAdicionalMensal' in e).toBe(false);
    expect(e.vigencia1).toBe('16/12/2026');
  });
});
