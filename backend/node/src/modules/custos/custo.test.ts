import { describe, expect, it } from 'vitest';
import type { PessoaSim } from '../simulacoes/avaliar.js';
import { calcularCusto } from './custo.js';

const custos = { salarioMedio: { Farmacêutico: 8000, Atendimento: 2200 }, encargosPct: 50 };
const ana: PessoaSim = { matricula: 'A', nome: 'Ana', funcao: 'Farmacêutico', cargaH: 44 };
const bruno: PessoaSim = { matricula: 'B', nome: 'Bruno', funcao: 'Atendimento', cargaH: 44 };

describe('calcularCusto', () => {
  it('sem custos informados não calcula nada', () => {
    expect(calcularCusto({ regra: 'r40', quadro: [ana], custos: null })).toEqual({
      informado: false,
    });
  });

  it('pessoa do cadastro custa o salário médio com encargos', () => {
    const c = calcularCusto({ regra: 'r40', quadro: [ana, bruno], custos });
    expect(c).toMatchObject({ informado: true, mensal: 15300, anual: 183600, faltamInformar: [] });
  });

  it('vaga custa proporcional à carga pelo divisor da regra', () => {
    const vaga: PessoaSim = {
      matricula: 'VAGA-1',
      nome: 'Vaga 1',
      funcao: 'Atendimento',
      cargaH: 24,
      vaga: true,
    };
    // 2200 × 24 × 5 ÷ 200 = 1320; × 1,5 = 1980
    const r40 = calcularCusto({ regra: 'r40', quadro: [vaga], custos });
    expect(r40).toMatchObject({ mensal: 1980 });
    // na regra atual o divisor é 220: 2200 × 24 × 5 ÷ 220 = 1200; × 1,5 = 1800
    expect(calcularCusto({ regra: 'atual', quadro: [vaga], custos })).toMatchObject({
      mensal: 1800,
    });
  });

  it('vaga de jornada cheia custa o mesmo que uma pessoa na regra de 40h', () => {
    const vaga: PessoaSim = {
      matricula: 'VAGA-1',
      nome: 'Vaga 1',
      funcao: 'Atendimento',
      cargaH: 40,
      vaga: true,
    };
    expect(calcularCusto({ regra: 'r40', quadro: [vaga], custos })).toMatchObject({ mensal: 3300 });
  });

  it('desligado não entra no custo', () => {
    const c = calcularCusto({ regra: 'r40', quadro: [ana, { ...bruno, desligado: true }], custos });
    expect(c).toMatchObject({ mensal: 12000 });
  });

  it('função sem salário informado: avisa e não mostra total parcial', () => {
    const caixa: PessoaSim = { matricula: 'C', nome: 'Carla', funcao: 'Caixa', cargaH: 44 };
    const c = calcularCusto({ regra: 'r40', quadro: [ana, caixa], custos });
    expect(c).toMatchObject({
      informado: true,
      faltamInformar: ['Caixa'],
      mensal: null,
      anual: null,
    });
  });

  it('explica a conta', () => {
    const c = calcularCusto({ regra: 'r40', quadro: [ana], custos });
    expect(c.informado && c.memoria[0]).toContain('1 pessoa(s)');
  });
});
