import { describe, expect, it } from 'vitest';
import { calcularHorarioEstendido } from './resultado-horario-estendido.js';

describe('resultado do horário estendido (spec 049)', () => {
  it('caso obrigatório: venda 9.000, CMV 57,8%, folha +4.680 → CMV 5.202, lucro bruto 3.798, resultado −882 (não recomendado)', () => {
    const r = calcularHorarioEstendido({
      horasNovasSemana: 3,
      vendaAdicionalMensal: 9000,
      cmvMedioPct: 57.8,
      aumentoFolhaMensal: 4680,
    });
    expect(r).toMatchObject({
      estado: 'ok',
      origemCmv: 'media',
      cmvPct: 57.8,
      cmvMensal: 5202,
      lucroBrutoMensal: 3798,
      aumentoFolhaMensal: 4680,
      resultadoMensal: -882,
      recomendado: false,
    });
  });

  it('resultado positivo é recomendado; exatamente zero também', () => {
    const mais = calcularHorarioEstendido({
      horasNovasSemana: 3,
      vendaAdicionalMensal: 9000,
      cmvMedioPct: 50,
      aumentoFolhaMensal: 3000,
    });
    expect(mais).toMatchObject({ resultadoMensal: 1500, recomendado: true });
    const zero = calcularHorarioEstendido({
      horasNovasSemana: 3,
      vendaAdicionalMensal: 10000,
      cmvMedioPct: 50,
      aumentoFolhaMensal: 5000,
    });
    expect(zero).toMatchObject({ resultadoMensal: 0, recomendado: true });
  });

  it('CMV por hora: o lucro bruto vem da base (origem hora) e o CMV é venda − lucro bruto', () => {
    const r = calcularHorarioEstendido({
      horasNovasSemana: 4,
      vendaAdicionalMensal: 9000,
      lucroBrutoMensal: 4000,
      aumentoFolhaMensal: 4680,
    });
    expect(r).toMatchObject({
      origemCmv: 'hora',
      cmvMensal: 5000,
      cmvPct: 55.6,
      lucroBrutoMensal: 4000,
      resultadoMensal: -680,
      recomendado: false,
    });
  });

  it('sem venda adicional (zero): o resultado é o aumento de folha com sinal de menos', () => {
    const r = calcularHorarioEstendido({
      horasNovasSemana: 2,
      vendaAdicionalMensal: 0,
      cmvMedioPct: 57.8,
      aumentoFolhaMensal: 1000,
    });
    expect(r).toMatchObject({
      cmvMensal: 0,
      lucroBrutoMensal: 0,
      resultadoMensal: -1000,
      recomendado: false,
    });
  });

  it('sem aumento de folha: o resultado é o lucro bruto', () => {
    const r = calcularHorarioEstendido({
      horasNovasSemana: 2,
      vendaAdicionalMensal: 1000,
      cmvMedioPct: 60,
      aumentoFolhaMensal: 0,
    });
    expect(r).toMatchObject({ lucroBrutoMensal: 400, resultadoMensal: 400, recomendado: true });
  });

  it('estados: sem CMV, sem salários e sem venda', () => {
    expect(
      calcularHorarioEstendido({
        horasNovasSemana: 2,
        vendaAdicionalMensal: 1000,
        aumentoFolhaMensal: 100,
      }),
    ).toMatchObject({ estado: 'sem_cmv', resultadoMensal: null, recomendado: null });
    expect(
      calcularHorarioEstendido({
        horasNovasSemana: 2,
        vendaAdicionalMensal: 1000,
        cmvMedioPct: 60,
        aumentoFolhaMensal: null,
      }),
    ).toMatchObject({ estado: 'sem_salarios', lucroBrutoMensal: 400, resultadoMensal: null });
    expect(
      calcularHorarioEstendido({
        horasNovasSemana: 2,
        vendaAdicionalMensal: null,
        cmvMedioPct: 60,
        aumentoFolhaMensal: 100,
      }),
    ).toMatchObject({ estado: 'sem_venda', resultadoMensal: null });
  });
});
