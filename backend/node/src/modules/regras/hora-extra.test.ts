import { describe, expect, it } from 'vitest';
import {
  HORA_EXTRA,
  alertasDeHoraExtra,
  capacidadeDeHoraExtraH,
  coberturaComHoraExtra,
  custoBrutoDaHoraExtra,
  custoMensalDaHoraExtra,
  decidirPorHoras,
} from './hora-extra.js';

describe('coberturaComHoraExtra', () => {
  it('uma falta pequena cabe toda na hora extra', () => {
    expect(coberturaComHoraExtra({ faltaH: 2, pessoas: 2 })).toEqual({
      horaExtraH: 2,
      restanteH: 0,
    });
  });
  it('acima do teto por pessoa, o resto vira contratação (2 pessoas = 20 h)', () => {
    expect(coberturaComHoraExtra({ faltaH: 25, pessoas: 2 })).toEqual({
      horaExtraH: 20,
      restanteH: 5,
    });
  });
  it('sem ninguém na função, não há hora extra', () => {
    expect(coberturaComHoraExtra({ faltaH: 5, pessoas: 0 })).toEqual({
      horaExtraH: 0,
      restanteH: 5,
    });
  });
  it('sem falta, nada a fazer', () => {
    expect(coberturaComHoraExtra({ faltaH: 0, pessoas: 3 })).toEqual({
      horaExtraH: 0,
      restanteH: 0,
    });
  });
  it('teto por dia: a falta concentrada num dia só cabe 2 h por pessoa daquele dia', () => {
    // 6 h faltando numa quarta com 2 pessoas trabalhando: só 4 h cabem (2 h × 2 pessoas).
    const r = coberturaComHoraExtra({
      faltaH: 6,
      pessoas: 2,
      faltaPorDiaH: [0, 0, 6, 0, 0, 0, 0],
      pessoasPorDia: [2, 2, 2, 2, 2, 2, 2],
    });
    expect(r).toEqual({ horaExtraH: 4, restanteH: 2 });
  });
  it('falta espalhada em vários dias cabe, respeitando o teto da semana', () => {
    const r = coberturaComHoraExtra({
      faltaH: 9,
      pessoas: 1,
      faltaPorDiaH: [2, 2, 2, 2, 1, 0, 0],
      pessoasPorDia: [1, 1, 1, 1, 1, 1, 1],
    });
    expect(r).toEqual({ horaExtraH: 9, restanteH: 0 });
    // 1 pessoa: no máximo 10 h por semana mesmo que a falta por dia deixasse mais.
    expect(
      capacidadeDeHoraExtraH({
        faltaH: 14,
        pessoas: 1,
        faltaPorDiaH: [2, 2, 2, 2, 2, 2, 2],
        pessoasPorDia: [1, 1, 1, 1, 1, 1, 1],
      }),
    ).toBe(10);
  });
  it('dia sem ninguém da função não tem hora extra', () => {
    expect(
      coberturaComHoraExtra({
        faltaH: 3,
        pessoas: 2,
        faltaPorDiaH: [0, 0, 0, 0, 0, 0, 3],
        pessoasPorDia: [2, 2, 2, 2, 2, 2, 0],
      }),
    ).toEqual({ horaExtraH: 0, restanteH: 3 });
  });
});

describe('decidirPorHoras (sem a cobertura real)', () => {
  it('a hora extra cobre tudo quando cabe: nenhuma contratação', () => {
    expect(decidirPorHoras({ gapH: 8, jornadaIntegralH: 40, pessoas: 2 })).toEqual({
      horaExtraH: 8,
      contratarInteiras: 0,
    });
  });
  it('se uma pessoa nova já cobre o que passa do teto, não há hora extra', () => {
    expect(decidirPorHoras({ gapH: 25, jornadaIntegralH: 40, pessoas: 2 })).toEqual({
      horaExtraH: 0,
      contratarInteiras: 1,
    });
  });
  it('em parte: contrata só o que sobra e a hora extra cobre a ponta', () => {
    expect(decidirPorHoras({ gapH: 85, jornadaIntegralH: 40, pessoas: 2 })).toEqual({
      horaExtraH: 5,
      contratarInteiras: 2,
    });
  });
  it('sem ninguém na função, contrata como hoje', () => {
    expect(decidirPorHoras({ gapH: 30, jornadaIntegralH: 40, pessoas: 0 })).toEqual({
      horaExtraH: 0,
      contratarInteiras: 1,
    });
  });
  it('sem falta, nada', () => {
    expect(decidirPorHoras({ gapH: 0, jornadaIntegralH: 40, pessoas: 2 })).toEqual({
      horaExtraH: 0,
      contratarInteiras: 0,
    });
  });
});

describe('custo da hora extra', () => {
  // A conta que a Simulação usava em resultado.ts: falta × 5 semanas × (salário ÷ divisor) × 1,5 × encargos.
  const contaAntiga = (falta: number, s: number, divisor: number, encargosPct: number) =>
    falta * 5 * (s / divisor) * 1.5 * (1 + encargosPct / 100);
  it('é igual à conta de antes', () => {
    for (const [h, s, d, e] of [
      [2, 4722, 220, 62.2],
      [8.5, 2129, 220, 62.2],
      [20, 1963, 200, 28],
    ] as const) {
      expect(
        custoBrutoDaHoraExtra({ horasSemana: h, salarioMedio: s, divisor: d, encargosPct: e }),
      ).toBeCloseTo(contaAntiga(h, s, d, e), 9);
    }
    expect(
      custoMensalDaHoraExtra({
        horasSemana: 2,
        salarioMedio: 4722,
        divisor: 220,
        encargosPct: 62.2,
      }),
    ).toBe(Math.round(contaAntiga(2, 4722, 220, 62.2) * 100) / 100);
  });
  it('sem salário, o custo é nulo (nunca parcial); sem horas, é zero', () => {
    expect(custoMensalDaHoraExtra({ horasSemana: 2, salarioMedio: null, divisor: 220 })).toBeNull();
    expect(custoMensalDaHoraExtra({ horasSemana: 0, salarioMedio: null, divisor: 220 })).toBe(0);
  });
  it('as constantes são as combinadas', () => {
    expect(HORA_EXTRA).toEqual({
      maxPorDiaH: 2,
      maxPorSemanaH: 10,
      adicionalPct: 50,
      semanasNaFolha: 5,
    });
  });
});

describe('alertasDeHoraExtra', () => {
  const base = {
    funcao: 'Farmacêutico',
    horaExtraH: 18,
    horaExtraCustoMensal: 9000,
    contratarCustoMensal: 7659,
    restanteH: 0,
  };
  it('contratar sai mais barato: compara os dois custos para o dono', () => {
    expect(alertasDeHoraExtra({ ...base, comValores: true })).toEqual([
      'Contratar farmacêutico sairia mais barato: a hora extra custa R$ 9.000 por mês e contratar, R$ 7.659.',
    ]);
  });
  it('gestor e consulta recebem a frase sem valores', () => {
    const [a] = alertasDeHoraExtra({ ...base, comValores: false });
    expect(a).toBe('Contratar farmacêutico sairia mais barato que a hora extra.');
    expect(a).not.toMatch(/R\$/);
  });
  it('hora extra barata: nenhum alerta', () => {
    expect(alertasDeHoraExtra({ ...base, horaExtraCustoMensal: 1000, comValores: true })).toEqual(
      [],
    );
  });
  it('teto atingido: avisa que o resto vira contratação', () => {
    expect(
      alertasDeHoraExtra({ ...base, horaExtraCustoMensal: 1000, restanteH: 5, comValores: true }),
    ).toEqual([
      'A hora extra de farmacêutico não basta: o que passa de 2 h por dia e 10 h por semana por pessoa vira contratação.',
    ]);
  });
});
