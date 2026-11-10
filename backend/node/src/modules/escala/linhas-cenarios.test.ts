import { describe, expect, it } from 'vitest';
import type { ColunaComparativo, Comparativo } from './comparativo.js';
import type { CenariosRegra, DiaCenario } from './cenarios.js';
import { causaDaLinha, montarLinhas, statusDaLinha } from './linhas-cenarios.js';

const dias = (h = 14): DiaCenario[] =>
  Array.from({ length: 7 }, (_, dia) => ({
    dia,
    aberto: true,
    abre: '08:00',
    fecha: `${8 + h}:00`,
  }));

const col = (p: Partial<ColunaComparativo> & Pick<ColunaComparativo, 'id'>): ColunaComparativo => ({
  nome:
    p.id === 'manter' ? 'Manter horários' : p.id === 'economia' ? 'Sem contratações' : 'Equilíbrio',
  premissa: '',
  resultado: '',
  contratacoes: [],
  diasFechar: [],
  horasSemana: 98,
  ajustes: [],
  faltaH: null,
  status: 'viavel',
  alertas: [],
  ociosidadePct: null,
  faturamentoPerdidoMensal: 0,
  faturamentoPerdidoPct: 0,
  vendaAdicionalMensal: 0,
  vendaAdicionalPct: 0,
  folhaAdicionalMensal: 0,
  ...p,
});

const cen = (
  equilibrioIndisponivel: 'custos' | 'vendas' | null = null,
  folha: number | null = 50000,
) =>
  ({
    atual: { horasSemana: 98, pessoas: 6, folhaMensal: folha },
    manter: { horasSemana: 98, horarioSemana: dias() },
    economia: { horasSemana: 85, horarioSemana: dias(12) },
    equilibrio: {
      horasSemana: 103,
      horarioSemana: dias(15),
      indisponivel: equilibrioIndisponivel ? { motivo: equilibrioIndisponivel, texto: '' } : null,
    },
  }) as unknown as CenariosRegra;

const comp = (cenarios: ColunaComparativo[]) =>
  ({ cenarios, lojaCobreTudo: false, regua: null }) as Comparativo;

describe('statusDaLinha: a ordem de prioridade', () => {
  const base = col({ id: 'economia' });
  it('Inviável, Não resolve sozinho e Não recomendado vencem tudo', () => {
    const comTudo = {
      ...base,
      vendaAdicionalMensal: 10,
      faltaPorFuncao: [{ funcao: 'Atendimento', horasSemana: 8 }],
    };
    expect(statusDaLinha({ ...comTudo, status: 'inviavel' })).toBe('inviavel');
    expect(statusDaLinha({ ...comTudo, status: 'nao_resolve' })).toBe('nao_resolve');
    expect(statusDaLinha({ ...comTudo, status: 'nao_recomendado' })).toBe('nao_recomendado');
  });
  it('Vende mais só sem perda; com perda é Perde venda', () => {
    expect(statusDaLinha({ ...base, vendaAdicionalMensal: 100, faturamentoPerdidoMensal: 0 })).toBe(
      'vende_mais',
    );
    expect(
      statusDaLinha({ ...base, vendaAdicionalMensal: 100, faturamentoPerdidoMensal: 40 }),
    ).toBe('perde_venda');
    expect(statusDaLinha({ ...base, faturamentoPerdidoMensal: 40 })).toBe('perde_venda');
  });
  it('Equipe menor que hoje: falta função ou farmacêutico, sem perda de venda', () => {
    expect(
      statusDaLinha({ ...base, faltaPorFuncao: [{ funcao: 'Atendimento', horasSemana: 44 }] }),
    ).toBe('equipe_menor');
    expect(statusDaLinha({ ...base, semFarmaceuticoH: 3 })).toBe('equipe_menor');
  });
  it('Cobre o horário quando nada se aplica; indisponível não tem status', () => {
    expect(statusDaLinha(base)).toBe('cobre');
    expect(statusDaLinha({ ...base, status: null })).toBeNull();
  });
});

describe('causaDaLinha', () => {
  const base = col({ id: 'economia' });
  it('uma frase por situação', () => {
    expect(causaDaLinha(base, 'inviavel')).toBe('Sem farmacêutico no quadro.');
    expect(causaDaLinha({ ...base, semFarmaceuticoH: 5 }, 'nao_resolve')).toBe(
      'Faltam 5 h de farmacêutico.',
    );
    expect(
      causaDaLinha(
        { ...base, faltaPorFuncao: [{ funcao: 'Atendimento', horasSemana: 12 }] },
        'nao_resolve',
      ),
    ).toBe('Faltam 12 h de atendente.');
    expect(causaDaLinha({ ...base, faltaH: 7 }, 'nao_resolve')).toBe('Faltam 7 h de cobertura.');
    expect(causaDaLinha(base, 'nao_recomendado')).toBe('Só cabe fechando um dos 3 melhores dias.');
    expect(
      causaDaLinha(
        { ...base, faltaPorFuncao: [{ funcao: 'Atendimento', horasSemana: 44 }] },
        'equipe_menor',
      ),
    ).toBe('Atendente: 1 pessoa a menos que hoje.');
    expect(
      causaDaLinha(
        { ...base, faltaPorFuncao: [{ funcao: 'Caixa', horasSemana: 90 }] },
        'equipe_menor',
      ),
    ).toBe('Caixa: 2 pessoas a menos que hoje.');
    expect(
      causaDaLinha(
        { ...base, faltaPorFuncao: [{ funcao: 'Apoio', horasSemana: 8 }] },
        'equipe_menor',
      ),
    ).toBe('Apoio: 8 h por semana a menos que hoje.');
    expect(causaDaLinha({ ...base, semVendaHoraria: true }, 'cobre')).toBe(
      'Sem venda por hora: perda não estimada.',
    );
    expect(causaDaLinha({ ...base, estimativaDeVenda: true }, 'vende_mais')).toBe(
      'Venda das horas novas é estimada.',
    );
    expect(causaDaLinha(base, 'cobre')).toBeNull();
  });
});

describe('montarLinhas', () => {
  const manter = col({
    id: 'manter',
    folhaAdicionalMensal: 1800,
    contratacoes: [
      {
        funcao: 'Farmacêutico',
        pessoas: 1,
        inteiras: 0,
        parcial: { turnos: 1, horas: 20 },
        parcialH: 20,
        horasContratadas: 20,
        horasUsadas: 20,
        horasOciosas: 0,
        ociosidadePct: 0,
        motivo: 'obrigatoria',
        ajustado: false,
      },
    ],
  });
  const economia = col({
    id: 'economia',
    horasSemana: 85,
    faturamentoPerdidoPct: 9.7,
    faturamentoPerdidoMensal: 5000,
  });
  const equilibrio = col({
    id: 'equilibrio',
    horasSemana: 103,
    vendaAdicionalPct: 1.7,
    vendaAdicionalMensal: 800,
    folhaAdicionalMensal: 1400,
    estimativaDeVenda: true,
  });

  it('devolve as três linhas na ordem Equilíbrio, Manter horários, Sem contratações', () => {
    const l = montarLinhas(comp([manter, economia, equilibrio]), cen());
    expect(l.map((x) => x.id)).toEqual(['equilibrio', 'manter', 'economia']);
  });

  it('variações em % à mão: venda (ganho − perda sobre o faturamento) e custo (adicional ÷ folha)', () => {
    const [eq, ma, ec] = montarLinhas(comp([manter, economia, equilibrio]), cen());
    expect(eq).toMatchObject({
      vendaPct: 1.7,
      vendaEstado: 'ok',
      custoPct: 2.8,
      custoEstado: 'ok',
      status: 'vende_mais',
      horasDiferenca: 5,
      horasSemana: 103,
    });
    expect(ma).toMatchObject({ vendaPct: 0, custoPct: 3.6, status: 'cobre', horasDiferenca: 0 });
    expect(ec).toMatchObject({ vendaPct: -9.7, custoPct: 0, horasDiferenca: -13 });
  });

  it('Manter horários leva o que contratar e o horário de hoje', () => {
    const [, ma] = montarLinhas(comp([manter, economia, equilibrio]), cen());
    expect(ma!.contratar).toEqual([{ funcao: 'Farmacêutico', inteiras: 0, parcialHoras: 20 }]);
    expect(ma!.horarioSemana).toHaveLength(7);
  });

  it('sem venda por hora a venda é "não estimada"; sem salários o custo fica sem cálculo', () => {
    const semVenda = col({
      id: 'economia',
      semVendaHoraria: true,
      faturamentoPerdidoPct: null,
      faturamentoPerdidoMensal: null,
    });
    const [, , ec] = montarLinhas(comp([manter, semVenda, equilibrio]), cen());
    expect(ec).toMatchObject({
      vendaPct: null,
      vendaEstado: 'nao_estimada',
      causa: 'Sem venda por hora: perda não estimada.',
    });
    const semSalario = montarLinhas(
      comp([{ ...manter, folhaAdicionalMensal: null }, economia, equilibrio]),
      cen(null, null),
    );
    expect(semSalario[1]).toMatchObject({ custoPct: null, custoEstado: 'sem_salarios' });
  });

  it('Equilíbrio indisponível: sem status, sem causa e sem números; o motivo vai junto', () => {
    const indisp = col({
      id: 'equilibrio',
      status: null,
      folhaAdicionalMensal: null,
      faturamentoPerdidoPct: null,
      vendaAdicionalPct: null,
    });
    const [eq] = montarLinhas(comp([manter, economia, indisp]), cen('custos'));
    expect(eq).toMatchObject({
      status: null,
      causa: null,
      indisponivel: { motivo: 'custos' },
      vendaPct: null,
      custoPct: null,
    });
  });

  it('Equilíbrio igual a outro cenário leva o subtítulo', () => {
    expect(
      montarLinhas(comp([manter, economia, { ...equilibrio, recolher: 'manter' }]), cen())[0]!
        .igualA,
    ).toBe('Manter horários');
    expect(
      montarLinhas(comp([manter, economia, { ...equilibrio, recolher: 'economia' }]), cen())[0]!
        .igualA,
    ).toBe('Sem contratações');
  });

  it('nenhuma chave de valor em reais na saída', () => {
    const json = JSON.stringify(montarLinhas(comp([manter, economia, equilibrio]), cen()));
    for (const chave of [
      'Mensal',
      'Anual',
      'folha',
      'saldo',
      'margem',
      'cmv',
      'salario',
      'faturamento',
      '"venda"',
      'vendaMes',
    ]) {
      expect(json).not.toContain(chave);
    }
  });
});
