import { describe, expect, it } from 'vitest';
import {
  causaDaSimulacao,
  contratarDe,
  montarEmHoras,
  statusDaSimulacao,
  type EntradaEmHoras,
} from './resultado-em-horas.js';

const entrada = (p: Partial<EntradaEmHoras> = {}): EntradaEmHoras => ({
  semFarmaceutico: false,
  temBase: true,
  horarioMudou: false,
  vendaPerdidaReal: 0,
  vendaGanhaReal: 0,
  faturamentoMensalReal: 100000,
  folhaHoje: 48000,
  custoAdicional: 0,
  pessoas: { hoje: 12, simulacao: 12 },
  horasContratadas: { hoje: 480, simulacao: 480 },
  horasAbertas: { hoje: 99, simulacao: 99 },
  faltas: [],
  vagas: [],
  ...p,
});

describe('statusDaSimulacao: a ordem de prioridade', () => {
  it('Inviável vence tudo', () => {
    expect(statusDaSimulacao(entrada({ semFarmaceutico: true, vendaGanhaReal: 500 }))).toBe(
      'inviavel',
    );
  });
  it('Vende mais só sem perda; com perda é Perde venda', () => {
    expect(statusDaSimulacao(entrada({ vendaGanhaReal: 500 }))).toBe('vende_mais');
    expect(statusDaSimulacao(entrada({ vendaGanhaReal: 500, vendaPerdidaReal: 100 }))).toBe(
      'perde_venda',
    );
    expect(statusDaSimulacao(entrada({ vendaPerdidaReal: 100 }))).toBe('perde_venda');
  });
  it('Equipe menor que hoje: ainda faltam horas, sem perda de venda', () => {
    expect(statusDaSimulacao(entrada({ faltas: [{ funcao: 'Atendimento', horas: 6 }] }))).toBe(
      'equipe_menor',
    );
  });
  it('Cobre o horário quando nada se aplica', () => {
    expect(statusDaSimulacao(entrada())).toBe('cobre');
    expect(statusDaSimulacao(entrada({ faltas: [{ funcao: 'Caixa', horas: 0 }] }))).toBe('cobre');
  });
});

describe('causaDaSimulacao', () => {
  it('uma frase por situação', () => {
    expect(causaDaSimulacao(entrada({ semFarmaceutico: true }), 'inviavel')).toBe(
      'Sem farmacêutico no quadro.',
    );
    expect(
      causaDaSimulacao(entrada({ faltas: [{ funcao: 'Farmacêutico', horas: 6 }] }), 'equipe_menor'),
    ).toBe('Faltam 6 h de farmacêutico.');
    expect(
      causaDaSimulacao(
        entrada({ faltas: [{ funcao: 'Atendimento', horas: 12.5 }] }),
        'equipe_menor',
      ),
    ).toBe('Faltam 12,5 h de atendente.');
    expect(
      causaDaSimulacao(
        entrada({
          faltas: [
            { funcao: 'Caixa', horas: 4 },
            { funcao: 'Apoio', horas: 2 },
          ],
        }),
        'equipe_menor',
      ),
    ).toBe('Faltam 6 h de equipe.');
    expect(causaDaSimulacao(entrada({ temBase: false, horarioMudou: true }), 'cobre')).toBe(
      'Sem venda por hora: perda não estimada.',
    );
    expect(causaDaSimulacao(entrada({ vendaGanhaReal: 800 }), 'vende_mais')).toBe(
      'Venda das horas novas é estimada.',
    );
    expect(causaDaSimulacao(entrada(), 'cobre')).toBeNull();
  });
  it('sem base e sem mudar o horário não há o que explicar', () => {
    expect(causaDaSimulacao(entrada({ temBase: false }), 'cobre')).toBeNull();
  });
});

describe('contratarDe', () => {
  it('agrupa por função: inteiras contam e cada parcial leva as horas', () => {
    expect(
      contratarDe([
        { funcao: 'Atendimento', cargaH: 40, tipo: 'integral' },
        { funcao: 'Atendimento', cargaH: 20, tipo: 'parcial' },
        { funcao: 'Atendimento', cargaH: 18, tipo: 'parcial' },
        { funcao: 'Caixa', cargaH: 40, tipo: 'integral' },
        { funcao: 'Caixa', cargaH: 40, tipo: 'integral' },
      ]),
    ).toEqual([
      { funcao: 'Atendimento', inteiras: 1, parciaisHoras: [20, 18] },
      { funcao: 'Caixa', inteiras: 2, parciaisHoras: [] },
    ]);
    expect(contratarDe([])).toEqual([]);
  });
});

describe('montarEmHoras', () => {
  it('variações em % à mão: venda (ganho − perda sobre o faturamento) e custo (adicional ÷ folha de hoje)', () => {
    const r = montarEmHoras(
      entrada({ vendaGanhaReal: 1700, vendaPerdidaReal: 0, custoAdicional: 3456 }),
    );
    expect(r).toMatchObject({
      vendaPct: 1.7,
      vendaEstado: 'ok',
      custoPct: 7.2,
      custoEstado: 'ok',
      status: 'vende_mais',
    });
    expect(montarEmHoras(entrada({ vendaPerdidaReal: 2900 }))).toMatchObject({ vendaPct: -2.9 });
    expect(montarEmHoras(entrada())).toMatchObject({ vendaPct: 0, custoPct: 0 });
  });
  it('sem venda por hora a venda é "não estimada"; sem salários o custo fica sem cálculo', () => {
    expect(
      montarEmHoras(entrada({ temBase: false, vendaPerdidaReal: null, vendaGanhaReal: null })),
    ).toMatchObject({ vendaPct: null, vendaEstado: 'nao_estimada' });
    expect(montarEmHoras(entrada({ folhaHoje: null, custoAdicional: null }))).toMatchObject({
      custoPct: null,
      custoEstado: 'sem_salarios',
    });
    expect(montarEmHoras(entrada({ custoAdicional: null }))).toMatchObject({
      custoEstado: 'sem_salarios',
    });
    expect(montarEmHoras(entrada({ faturamentoMensalReal: 0 }))).toMatchObject({
      vendaPct: null,
      vendaEstado: 'sem_calculo',
    });
    expect(montarEmHoras(entrada({ folhaHoje: 0 }))).toMatchObject({
      custoPct: null,
      custoEstado: 'sem_calculo',
    });
  });
  it('pessoas, horas e hora extra em horas', () => {
    const r = montarEmHoras(
      entrada({
        pessoas: { hoje: 12, simulacao: 14 },
        horasContratadas: { hoje: 480, simulacao: 534.256 },
        horasAbertas: { hoje: 99, simulacao: 90 },
        faltas: [{ funcao: 'Caixa', horas: 6 }],
      }),
    );
    expect(r).toMatchObject({
      pessoas: { hoje: 12, simulacao: 14 },
      horasContratadas: { hoje: 480, simulacao: 534.26 },
      horasAbertas: { hoje: 99, simulacao: 90 },
      horaExtraH: 6,
    });
  });
  it('nenhuma chave em reais na saída', () => {
    const json = JSON.stringify(
      montarEmHoras(entrada({ custoAdicional: 3456, vendaGanhaReal: 1700 })),
    );
    for (const chave of [
      'Mensal',
      'folha',
      'saldo',
      'margem',
      'cmv',
      'salario',
      'faturamento',
      'economia',
      'vendaQueSai',
    ]) {
      expect(json).not.toContain(chave);
    }
  });
});
