import { describe, expect, it } from 'vitest';
import type { ColunaComparativo, Comparativo } from './comparativo.js';
import type { CenariosRegra, DiaCenario } from './cenarios.js';
import { causaDaLinha, montarLinhas, statusDaLinha, type Explicacao } from './linhas-cenarios.js';

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
  faturamento: number | null = null,
) =>
  ({
    atual: { horasSemana: 98, pessoas: 6, folhaMensal: folha },
    manter: { horasSemana: 98, horarioSemana: dias(), faturamentoMensalRef: faturamento },
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
    const [eq, ma, ec] = montarLinhas(
      comp([manter, economia, equilibrio]),
      cen(null, 50000, 450000),
      true,
    );
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
    const [, ma] = montarLinhas(comp([manter, economia, equilibrio]), cen(), true);
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
    const [, , ec] = montarLinhas(comp([manter, semVenda, equilibrio]), cen(), true);
    expect(ec).toMatchObject({
      vendaPct: null,
      vendaEstado: 'nao_estimada',
      causa: 'Sem venda por hora: perda não estimada.',
    });
    const semSalario = montarLinhas(
      comp([{ ...manter, folhaAdicionalMensal: null }, economia, equilibrio]),
      cen(null, null),
      true,
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
    const [eq] = montarLinhas(comp([manter, economia, indisp]), cen('custos'), true);
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
    // A frase explicativa (spec 051) é texto para leitura e pode dizer "folha"; o guarda vale para as chaves.
    const json = JSON.stringify(
      montarLinhas(comp([manter, economia, equilibrio]), cen()).map((l) => ({ ...l, explicacao: null })),
    );
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

  // Spec 048: o peso do custo de pessoal no faturamento (só o dono) e o sentido da mudança (todos os perfis)
  describe('peso no faturamento', () => {
    // Cosmópolis (r42): folha 36.037,60, faturamento 450.567, 1 farmacêutico a R$ 7.659,08 por mês
    const cosmopolis = () =>
      montarLinhas(
        comp([
          col({ id: 'manter', folhaAdicionalMensal: 7659.08 }),
          col({
            id: 'economia',
            folhaAdicionalMensal: 0,
            vendaAdicionalPct: 0,
            faturamentoPerdidoPct: 0,
          }),
          equilibrio,
        ]),
        cen(null, 36037.6, 450567),
        true,
      );
    it('Cosmópolis: 8,0% → 9,7% do faturamento, +1,7 p.p. e R$ 7.659 por mês', () => {
      const ma = cosmopolis()[1]!;
      expect(ma.custoPctFaturamento).toEqual({
        hoje: 8,
        depois: 9.7,
        aumentoPp: 1.7,
        aumentoMensal: 7659,
      });
      expect(ma.custoSentido).toBe('aumenta');
    });
    it('Paulínia: 10,3% → 14,7%, +4,4 p.p. e R$ 11.112 por mês', () => {
      const l = montarLinhas(
        comp([
          col({ id: 'manter', folhaAdicionalMensal: 11112.32 }),
          col({ id: 'economia' }),
          equilibrio,
        ]),
        cen(null, 25677.88, 249921),
        true,
      );
      expect(l[1]!.custoPctFaturamento).toEqual({
        hoje: 10.3,
        depois: 14.7,
        aumentoPp: 4.4,
        aumentoMensal: 11112,
      });
    });
    it('reduz equipe: 8,0% → 7,4%, −0,6 e R$ −2.340 por mês', () => {
      const l = montarLinhas(
        comp([col({ id: 'manter', folhaAdicionalMensal: -2340 }), col({ id: 'economia' }), equilibrio]),
        cen(null, 36037.6, 450567),
        true,
      );
      expect(l[1]!.custoPctFaturamento).toEqual({ hoje: 8, depois: 7.5, aumentoPp: -0.5, aumentoMensal: -2340 });
      expect(l[1]!.custoSentido).toBe('diminui');
    });
    it('a diferença usa os pesos já arredondados (8,04 → 9,66 mostra 8,0, 9,7 e +1,7, e não 1,6)', () => {
      // folha 36.180 ÷ 450.000 = 8,04% (mostra 8,0); com +7.290 = 9,66% (mostra 9,7): a diferença exibida é 1,7, não 1,62
      const l = montarLinhas(
        comp([col({ id: 'manter', folhaAdicionalMensal: 7290 }), col({ id: 'economia' }), equilibrio]),
        cen(null, 36180, 450000),
        true,
      );
      const c = l[1]!.custoPctFaturamento!;
      expect(c.hoje).toBe(8);
      expect(c.depois).toBe(9.7);
      expect(c.aumentoPp).toBe(1.7);
      expect(Math.round((c.depois - c.hoje) * 10) / 10).toBe(c.aumentoPp);
    });
    it('sem custo adicional: 0 p.p., R$ 0 e sentido igual', () => {
      const ec = cosmopolis()[2]!;
      expect(ec.custoPctFaturamento).toEqual({
        hoje: 8,
        depois: 8,
        aumentoPp: 0,
        aumentoMensal: 0,
      });
      expect(ec.custoSentido).toBe('igual');
    });
    it('sem faturamento: sem o peso e com o estado que diz o que falta; sem salários: sem_salarios', () => {
      const [, ma] = montarLinhas(
        comp([manter, economia, equilibrio]),
        cen(null, 50000, null),
        true,
      );
      expect(ma!.custoPctFaturamento).toBeNull();
      expect(ma!.custoEstado).toBe('sem_faturamento');
      const [, sem] = montarLinhas(
        comp([{ ...manter, folhaAdicionalMensal: null }, economia, equilibrio]),
        cen(null, null, 450567),
        true,
      );
      expect(sem!.custoEstado).toBe('sem_salarios');
    });
    it('gestor e consulta: só o sentido, nenhum número de custo, folha ou faturamento', () => {
      const l = montarLinhas(comp([manter, economia, equilibrio]), cen(null, 50000, 450000), false);
      for (const x of l) {
        expect(x).not.toHaveProperty('custoPct');
        expect(x).not.toHaveProperty('custoPctFaturamento');
      }
      expect(l[1]!.custoSentido).toBe('aumenta');
      expect(l[2]!.custoSentido).toBe('igual');
    });
  });
});

describe('explicacaoDaLinha (spec 051)', () => {
  const equilibrio = col({ id: 'equilibrio' });
  const texto = (e: Explicacao | null) => e?.partes.map((x) => x.texto).join('') ?? null;
  const linhas = (manter: Partial<ColunaComparativo>, economia: Partial<ColunaComparativo>, dono: boolean, folha = 36037.6, fat = 450567) =>
    montarLinhas(
      comp([col({ id: 'manter', ...manter }), col({ id: 'economia', ...economia }), equilibrio]),
      cen(null, folha, fat),
      dono,
    );

  it('Cosmópolis, dono: Manter horários traz pesos, reais e o caminho recomendado', () => {
    const l = linhas({ folhaAdicionalMensal: 7659.08 }, {}, true);
    expect(texto(l[1]!.explicacao)).toBe(
      'Para manter todos os seus horários e a venda de hoje, a folha sobe de 8,0% para 9,7% do faturamento (R$ 7.659 por mês). Este é o caminho recomendado.',
    );
  });

  it('Paulínia, dono: 10,3% → 14,7% e R$ 11.112', () => {
    const l = linhas({ folhaAdicionalMensal: 11112.32 }, {}, true, 25677.88, 249921);
    expect(texto(l[1]!.explicacao)).toContain('de 10,3% para 14,7% do faturamento (R$ 11.112 por mês)');
  });

  it('gestor e consulta: a mesma ideia, sem R$ nem %', () => {
    const l = linhas({ folhaAdicionalMensal: 7659.08 }, {}, false);
    const t = texto(l[1]!.explicacao)!;
    expect(t).toBe(
      'Para manter todos os seus horários e a venda de hoje, a folha precisa aumentar. Este é o caminho recomendado.',
    );
    expect(t).not.toMatch(/R\$|%/);
  });

  it('folha igual: "a folha não muda"; folha cai: "cai de … para …"', () => {
    expect(texto(linhas({ folhaAdicionalMensal: 0 }, {}, true)[1]!.explicacao)).toContain('a folha não muda');
    const cai = texto(linhas({ folhaAdicionalMensal: -2340 }, {}, true)[1]!.explicacao)!;
    expect(cai).toContain('a folha cai de 8,0% para 7,5% do faturamento (R$ 2.340 por mês)');
    expect(texto(linhas({ folhaAdicionalMensal: -2340 }, {}, false)[1]!.explicacao)).toContain('a folha diminui');
  });

  it('Manter que não cobre tudo: sem "caminho recomendado" e diz o que falta', () => {
    const l = linhas(
      { folhaAdicionalMensal: 7659.08, status: 'nao_resolve', faltaPorFuncao: [{ funcao: 'Atendimento', horasSemana: 8 }] },
      {},
      true,
    );
    const t = texto(l[1]!.explicacao)!;
    expect(t).not.toContain('caminho recomendado');
    expect(t).toContain('Ainda faltariam 8 h de atendente por semana.');
  });

  it('dono sem salários: a frase de Manter omite o custo', () => {
    const l = linhas({ folhaAdicionalMensal: null, contratacoes: [{ funcao: 'Farmacêutico', inteiras: 1, parcial: null }] as never }, {}, true);
    expect(texto(l[1]!.explicacao)).toBe('Para manter todos os seus horários e a venda de hoje, é preciso contratar. Este é o caminho recomendado.');
  });

  it('Sem contratações com falta de farmacêutico: o trecho do "mesmo assim" vem em negrito', () => {
    const l = linhas({}, { status: 'nao_resolve', semFarmaceuticoH: 17 }, true);
    const e = l[2]!.explicacao!;
    expect(e.partes).toEqual([
      { texto: 'Sem contratar ninguém, você vai precisar fechar a loja em alguns horários. ' },
      { texto: 'Mesmo assim, ainda faltariam 17 h de farmacêutico por semana.', negrito: true },
      { texto: ' Entre em Analisar para escolher quais horários fechar.' },
    ]);
  });

  it('falta de outra função e de várias funções', () => {
    const outra = linhas({}, { status: 'nao_resolve', faltaPorFuncao: [{ funcao: 'Atendimento', horasSemana: 12 }] }, false);
    expect(outra[2]!.explicacao!.partes[1]).toEqual({
      texto: 'Mesmo assim, ainda faltariam 12 h de atendente por semana.',
      negrito: true,
    });
    const varias = linhas(
      {},
      { status: 'nao_resolve', semFarmaceuticoH: 17, faltaPorFuncao: [{ funcao: 'Atendimento', horasSemana: 8 }] },
      true,
    );
    expect(varias[2]!.explicacao!.partes[1]!.texto).toBe(
      'Mesmo assim, ainda faltariam 17 h de farmacêutico e mais 8 h de outras funções por semana.',
    );
  });

  it('Sem contratações que resolve', () => {
    const l = linhas({}, { status: 'viavel' }, true);
    expect(texto(l[2]!.explicacao)).toBe(
      'Sem contratar ninguém, é possível cobrir tudo fechando em alguns horários. Entre em Analisar para escolher quais.',
    );
  });

  it('Equilíbrio e cenário indisponível não têm frase; nenhuma frase usa p.p., pontos nem Personalizar', () => {
    const l = linhas({ folhaAdicionalMensal: 7659.08 }, { status: 'nao_resolve', semFarmaceuticoH: 17 }, true);
    expect(l[0]!.explicacao).toBeNull();
    for (const x of l) expect(texto(x.explicacao) ?? '').not.toMatch(/p\.p\.|pontos|Personalizar/);
    const ind = montarLinhas(comp([col({ id: 'manter' }), col({ id: 'economia' }), equilibrio]), cen('custos'), true);
    expect(ind[0]!.explicacao).toBeNull();
  });
});
