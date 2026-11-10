import { describe, expect, it } from 'vitest';
import { montarCenarios, type EntradaCenarios } from './cenarios.js';
import { montarComparativo } from './comparativo.js';
import { vendasDoCadastro } from './vendas-cadastro.js';

// Segunda a sábado, 8h às 22h: 84h e 12 turnos. Venda por dia: 1000, 1200, 900, 1100, 1500 e 2000.
const dias = [0, 1, 2, 3, 4, 5].map((dia) => ({ dia, abre: 8, fecha: 22 }));
const fat = [1000, 1200, 900, 1100, 1500, 2000, null];
const farm = (...horas: number[]) => horas.map((cargaH) => ({ funcao: 'Farmacêutico', cargaH }));
const entrada = (extra: Partial<EntradaCenarios> = {}): EntradaCenarios => ({
  regraId: 'r40',
  convencao8h24: false,
  dias,
  minimos: { Farmacêutico: 1 },
  pessoas: farm(40),
  vendas: vendasDoCadastro({ dias: fat, mensal: null, margemPct: 25 }, dias)!.linhas,
  origemVenda: 'base', // os fixtures do cadastro têm venda igual em todas as horas: servem de venda hora a hora
  custos: { salarioMedio: { Farmacêutico: 10000 }, encargosPct: 0 },
  dono: true,
  faturamentoMensalRef: 50000,
  // Estes testes são das contas do comparativo, escritos com o limite de 10%; o padrão de 3% tem testes próprios.
  limitePerdaCenario2Pct: 10,
  ...extra,
});
const comparar = (extra: Partial<EntradaCenarios> = {}) => {
  const e = entrada(extra);
  return montarComparativo(e, montarCenarios(e));
};
const col = (r: ReturnType<typeof comparar>, id: string) => r.cenarios.find((c) => c.id === id)!;

describe('comparativo dos cenários 1, 2 e 3', () => {
  // Venda do sábado: 2000 por dia × 52 ÷ 12 = 8666,67 por mês, igual em todas as 14 horas (619,05 por hora).
  // Com salário de 10000 o Cenário 1 custa 11000 (1 integral + 1 parcial de 4 h); cortar horário não compensa.
  const cara = { salarioMedio: { Farmacêutico: 40000 }, encargosPct: 0 };

  it('três colunas lado a lado, na ordem 1, 2 e 3', () => {
    expect(comparar().cenarios.map((c) => c.id)).toEqual(['manter', 'economia', 'equilibrio']);
  });

  it('o exemplo da regra: perdi R$ 10.000 de venda e economizei R$ 8.000 de folha, o saldo é −R$ 2.000', () => {
    const e = entrada();
    const c = montarCenarios(e);
    c.manter.custoAdicionalMensal = 8000;
    c.economia.viavel = true;
    c.economia.naoResolveSozinho = false;
    c.economia.vendaCortadaMes = 10000;
    const eco = col(montarComparativo(e, c), 'economia');
    expect(eco).toMatchObject({
      folhaAdicionalMensal: 0,
      economiaFolhaMensal: 8000,
      faturamentoPerdidoMensal: 10000,
      saldoMensal: -2000,
      saldoAnual: -24000,
      pesoNoFaturamentoPct: -4,
    });
  });

  it('campos dos cartões (dono): folha adicional, venda perdida, economia de folha e saldo, à mão', () => {
    const r = comparar({ estenderHorario: false });
    // Cenário 1 é a base: venda perdida 0, economia 0 e saldo 0; o custo adicional de folha é 11000.
    expect(col(r, 'manter')).toMatchObject({
      folhaAdicionalMensal: 11000,
      economiaFolhaMensal: 0,
      faturamentoPerdidoMensal: 0,
      faturamentoPerdidoPct: 0,
      vendaAdicionalMensal: 0,
      saldoMensal: 0,
      saldoAnual: 0,
      pesoNoFaturamentoPct: 0,
      vendaPerdidaPorDia: [],
    });
    // Cenário 2 (só fim de semana, com travas): o sábado perde 5 h de 14 (619,05 por hora = 3095,24 por mês, 9,3% da venda
    // dos seis dias); economiza os 11000 do Cenário 1; saldo = 11000 − 3095,24 = 7904,76.
    const eco = col(r, 'economia');
    expect(eco).toMatchObject({
      folhaAdicionalMensal: 0,
      economiaFolhaMensal: 11000,
      faturamentoPerdidoPct: 9.3,
      semVendaHoraria: false,
    });
    expect(eco.faturamentoPerdidoMensal!).toBeCloseTo(3095.24, 0);
    expect(eco.saldoMensal!).toBeCloseTo(7904.76, 0);
    expect(eco.saldoAnual!).toBeCloseTo(7904.76 * 12, -1);
    expect(eco.pesoNoFaturamentoPct!).toBeCloseTo(15.8, 1);
    expect(eco.vendaPerdidaPorDia).toMatchObject([{ dia: 5, horasFechadas: 5, ate: 17 }]);
    // Com essa venda por hora, cortar o sábado não compensa a folha de 10000: o Cenário 3 é o próprio Cenário 1.
    expect(col(r, 'equilibrio')).toMatchObject({
      recolher: 'manter',
      folhaAdicionalMensal: 11000,
      economiaFolhaMensal: 0,
      saldoMensal: 0,
    });
  });

  it('saldo da operação (spec 024): contra a folha atual, é o saldo antigo menos o custo de folha do Cenário 1', () => {
    const r = comparar({ estenderHorario: false });
    const custo1 = col(r, 'manter').folhaAdicionalMensal!;
    // Cenário 1: custo de folha 11000 e nenhuma venda perdida = −11000 (antes: R$ 0, a base).
    expect(col(r, 'manter').saldoOperacaoMensal).toBe(-custo1);
    // Os outros: o saldo novo = o antigo − o custo do Cenário 1; a ordem entre os cenários não muda.
    for (const id of ['economia', 'equilibrio'] as const) {
      const c = col(r, id);
      expect(c.saldoOperacaoMensal!).toBeCloseTo(c.saldoMensal! - custo1, 1);
    }
    const ordem = (campo: 'saldoMensal' | 'saldoOperacaoMensal') =>
      [...r.cenarios].sort((a, b) => a[campo]! - b[campo]!).map((c) => c.id);
    expect(ordem('saldoOperacaoMensal')).toEqual(ordem('saldoMensal'));
  });

  it('saldo da operação e venda estimada em %: só para o dono e nulos sem dado', () => {
    const naoDono = comparar({ dono: false });
    for (const c of naoDono.cenarios) {
      expect(c).not.toHaveProperty('saldoOperacaoMensal');
      expect(c).not.toHaveProperty('vendaAdicionalPct');
    }
    const r = comparar();
    for (const c of r.cenarios) {
      expect(c).toHaveProperty('saldoOperacaoMensal');
      expect(c).toHaveProperty('vendaAdicionalPct');
    }
  });

  it('com a folha cara (40000) cortar o sábado compensa: o Cenário 3 corta 4 h, economiza folha e fica com saldo positivo', () => {
    const r = comparar({ custos: cara, estenderHorario: false });
    // Cenário 1: 1 integral (40000) + parcial de 4 h (4000) = 44000. Cenário 3: sábado até 18h, 1 integral (40000):
    // economia 4000, venda perdida 4 × 619,05 = 2476,19, saldo 1523,81 (3,0% de 50000).
    const e3 = col(r, 'equilibrio');
    expect(e3).toMatchObject({
      status: 'viavel',
      recolher: null,
      folhaAdicionalMensal: 40000,
      economiaFolhaMensal: 4000,
    });
    expect(e3.faturamentoPerdidoMensal!).toBeCloseTo(2476.19, 0);
    expect(e3.saldoMensal!).toBeCloseTo(1523.81, 0);
    expect(e3.saldoMensal!).toBeGreaterThan(0);
    expect(e3.pesoNoFaturamentoPct!).toBeCloseTo(3, 0);
    expect(r.destaque).toBe('equilibrio');
    expect(r.sugerido).toBe('equilibrio');
  });

  it('ociosidade das contratações aparece para todos; sem contratação fica nula; valores em reais só para o dono', () => {
    const r = comparar();
    expect(col(r, 'manter').ociosidadePct).not.toBeNull();
    expect(col(r, 'economia').ociosidadePct).toBeNull();
    const naoDono = comparar({ dono: false });
    for (const c of naoDono.cenarios) {
      for (const campo of [
        'folhaAdicionalMensal',
        'faturamentoPerdidoMensal',
        'economiaFolhaMensal',
        'saldoMensal',
        'saldoAnual',
        'pesoNoFaturamentoPct',
        'vendaAdicionalMensal',
      ])
        expect(c).not.toHaveProperty(campo);
    }
    expect(col(naoDono, 'manter').ociosidadePct).not.toBeNull();
  });

  it('valores do dono conferidos à mão: 1 farmacêutico de 40h, salário de 10000, faturamento de 50000', () => {
    const r = comparar({ estenderHorario: false });
    // Folha atual: 1 × 10000. Cenário 1: 1 integral (10000) + 1 parcial de 4 h (1000) = 11000 de custo adicional.
    const m = col(r, 'manter');
    expect(m).toMatchObject({
      status: 'viavel',
      diasFechar: [],
      custoFolhaMensal: 21000,
      saldoMensal: 0,
    });
    expect(m.contratacoes[0]).toMatchObject({ inteiras: 1, parcial: { turnos: 1, horas: 4 } });
    expect(m.horasSemana).toBe(84);
    // Cenário 2: o sábado perde 5 h (14 → 9 h); sem contratar; não cobre (1 farmacêutico de 40h para 79 h abertas: faltam
    // 39 h): "não resolve sozinho".
    const e2 = col(r, 'economia');
    expect(e2).toMatchObject({
      status: 'nao_resolve',
      diasFechar: [],
      contratacoes: [],
      custoFolhaMensal: 10000,
      faltaH: 39,
    });
    expect(e2.horasSemana).toBe(79);
    expect(e2.ajustes).toEqual([
      {
        dia: 5,
        antes: { abre: '08:00', fecha: '22:00' },
        depois: { abre: '08:00', fecha: '17:00' },
      },
    ]);
    expect(e2.alertas.join(' ')).toContain('faltam 39 h');
    expect(e2.alertas.join(' ')).toContain('Equilíbrio');
    // Cenário 3: não compensa cortar; contrata tudo e mantém o horário (igual ao 1).
    const e3 = col(r, 'equilibrio');
    expect(e3).toMatchObject({
      status: 'viavel',
      diasFechar: [],
      custoFolhaMensal: 21000,
      saldoMensal: 0,
      horasSemana: 84,
      ajustes: [],
    });
  });

  it('destaca o de maior saldo (o mesmo do selo) sem esconder os outros', () => {
    const r = comparar({ estenderHorario: false });
    expect(r.cenarios).toHaveLength(3);
    // O Cenário 2 não resolve sozinho e fica de fora da escolha; manter e equilíbrio empatam em saldo 0: vence o que contrata menos
    // e, no empate, o Cenário 1.
    expect(r.destaque).toBe('manter');
    expect(col(r, 'economia').status).toBe('nao_resolve');
    const candidatos = r.cenarios.filter((c) => c.status === 'viavel');
    const maior = Math.max(...candidatos.map((c) => c.saldoMensal!));
    expect(col(r, r.destaque!).saldoMensal).toBe(maior);
  });

  // Todos os dias, 8h às 22h; domingo vende 700 (a menor venda por hora). Equipe de 40 + 40 + 24 h: reduzir o domingo
  // de 14 h para 8 h (1 turno) basta: 6 h de corte, venda 700 × 52 ÷ 12 × 6 ÷ 14 = 1300, 3,6% da venda total.
  const seteDias = [0, 1, 2, 3, 4, 5, 6].map((dia) => ({ dia, abre: 8, fecha: 22 }));
  const fat7 = [1000, 1200, 900, 1100, 1500, 2000, 700];
  const comSete = (extra: Partial<EntradaCenarios> = {}, margemPct: number | null = 25) =>
    comparar({
      dias: seteDias,
      pessoas: farm(40, 40, 24),
      vendas: vendasDoCadastro({ dias: fat7, mensal: null, margemPct }, seteDias)!.linhas,
      ...extra,
    });

  it('Cenário 2 que resolve reduzindo o fim de semana: status viável, com o horário ajustado e o saldo = economia − venda perdida', () => {
    const r = comSete();
    const e2 = col(r, 'economia');
    expect(e2.status).toBe('viavel');
    expect(e2.diasFechar).toEqual([]);
    expect(e2.ajustes).toEqual([
      {
        dia: 6,
        antes: { abre: '08:00', fecha: '22:00' },
        depois: { abre: '08:00', fecha: '16:00' },
      },
    ]);
    expect(e2).toMatchObject({ faltaH: null, faturamentoPerdidoPct: 3.6 });
    expect(e2.faturamentoPerdidoMensal!).toBeCloseTo(1300, 0);
    expect(e2.saldoMensal!).toBeCloseTo(e2.economiaFolhaMensal! - e2.faturamentoPerdidoMensal!, 1);
    expect(e2.horasSemana).toBe(92);
  });

  it('a margem bruta não muda nada: sem ela os valores e o destaque são os mesmos', () => {
    const com = comSete({}, 25);
    const sem = comSete({}, null);
    expect(col(sem, 'economia').saldoMensal).toBe(col(com, 'economia').saldoMensal);
    expect(col(sem, 'economia').alertas.join(' ')).not.toContain('margem');
    expect(sem.destaque).toBe(com.destaque);
  });

  it('Cenário 2 sem farmacêutico no quadro: inviável, com o motivo no alerta e valores nulos', () => {
    const r = comparar({ pessoas: [{ funcao: 'Atendimento', cargaH: 40 }] });
    const e2 = col(r, 'economia');
    expect(e2.status).toBe('inviavel');
    expect(e2.alertas.join(' ')).toContain('Não há Farmacêutico');
    expect(e2).toMatchObject({
      custoFolhaMensal: null,
      economiaFolhaMensal: null,
      saldoMensal: null,
      saldoAnual: null,
      pesoNoFaturamentoPct: null,
    });
    expect(r.destaque).not.toBe('economia');
  });

  it('sem custos: o custo e o saldo ficam nulos, o Cenário 3 fica sem status e o alerta diz o que falta', () => {
    const r = comparar({ custos: null });
    expect(col(r, 'manter')).toMatchObject({
      status: 'viavel',
      custoFolhaMensal: null,
      saldoMensal: null,
    });
    expect(col(r, 'manter').alertas.join(' ')).toContain('salários médios');
    const e3 = col(r, 'equilibrio');
    expect(e3.status).toBeNull();
    expect(e3.alertas.join(' ')).toContain('salário médio');
    expect(e3.saldoMensal).toBeNull();
    expect(r.destaque).toBeNull();
  });

  it('sem faturamento de referência, só o percentual some', () => {
    const r = comparar({ faturamentoMensalRef: null });
    expect(col(r, 'manter')).toMatchObject({ saldoMensal: 0, pesoNoFaturamentoPct: null });
  });

  it('sem venda hora a hora (só o faturamento mensal ou do Cadastro): aviso, nenhum valor de venda e nenhum saldo (nunca R$ 0)', () => {
    const mensal = vendasDoCadastro(
      { dias: new Array(7).fill(null), mensal: 52000, margemPct: 25 },
      dias,
    )!.linhas;
    const r = comparar({ vendas: mensal, origemVenda: 'estimativa', pessoas: farm(40, 40) });
    const e2 = col(r, 'economia');
    expect(e2.semVendaHoraria).toBe(true);
    expect(e2.alertas.join(' ')).toContain('Venda estimada');
    expect(e2.alertas.join(' ')).toContain(
      'Sem venda hora a hora, não é possível estimar a venda perdida',
    );
    expect(e2).toMatchObject({
      faturamentoPerdidoMensal: null,
      saldoMensal: null,
      saldoAnual: null,
      vendaPerdidaPorDia: [],
    });
    const e3 = col(r, 'equilibrio');
    expect(e3.semVendaHoraria).toBe(true);
    expect(e3.alertas.join(' ')).toContain('hora a hora');
    expect(e3.saldoMensal).toBeNull();
    expect(r.destaque).toBeNull();
    // só o faturamento por dia do Cadastro: o mesmo aviso
    expect(
      col(comparar({ origemVenda: 'cadastro', pessoas: farm(40, 40) }), 'economia').semVendaHoraria,
    ).toBe(true);
  });

  it('cenário sem mudança de horário: venda perdida zero (e não o aviso)', () => {
    const r = comparar({ pessoas: farm(40, 40, 40) });
    const eco = col(r, 'economia');
    expect(eco).toMatchObject({
      faturamentoPerdidoMensal: 0,
      vendaPerdidaPorDia: [],
      semVendaHoraria: false,
    });
    expect(col(r, 'manter')).toMatchObject({ faturamentoPerdidoMensal: 0 });
  });

  it('Cenário 3 igual ao Cenário 1: o alerta diz qual', () => {
    const igualManter = comparar({
      estenderHorario: false,
      pessoas: farm(40, 40),
      custos: { salarioMedio: { Farmacêutico: 1000 }, encargosPct: 0 },
    });
    expect(col(igualManter, 'equilibrio').alertas.join(' ')).toContain('mesmo de Manter horários');
  });

  it('quem não é dono recebe contratações, dias, horas, status e alertas, sem nenhuma linha em reais nem destaque', () => {
    const r = comparar({ dono: false });
    expect('destaque' in r).toBe(false);
    for (const c of r.cenarios) {
      for (const campo of [
        'custoFolhaMensal',
        'saldoMensal',
        'economiaFolhaMensal',
        'pesoNoFaturamentoPct',
      ])
        expect(campo in c).toBe(false);
    }
    expect(col(r, 'equilibrio')).toMatchObject({ status: 'viavel', diasFechar: [] });
    expect(col(r, 'economia')).toMatchObject({ status: 'nao_resolve', faltaH: 39 });
    expect(col(r, 'economia').ajustes).toHaveLength(1);
    expect(JSON.stringify(r)).not.toContain('R$');
  });
});

describe('premissas, recolhimento e selo sugerido', () => {
  // Farmacêutico coberto e atendimento abaixo do nível de hoje na regra de 42 h: o Cenário 2 não contrata nem muda horário.
  const semCorte = (extra: Partial<EntradaCenarios> = {}) =>
    comparar({
      estenderHorario: false,
      regraId: 'r42',
      minimos: { Farmacêutico: 1 },
      pessoas: [
        ...farm(44, 44, 44),
        ...[44, 44].map((cargaH) => ({ funcao: 'Atendimento', cargaH })),
      ],
      custos: { salarioMedio: { Farmacêutico: 10000, Atendimento: 3000 }, encargosPct: 0 },
      ...extra,
    });

  it('premissas fixas e resultado por cenário, em qualquer loja', () => {
    for (const r of [comparar(), semCorte()]) {
      expect(col(r, 'manter').premissa).toBe('Contratar para cobrir a escala nos horários de hoje');
      expect(col(r, 'economia').premissa).toBe('Não contratar; ajustar horários só se precisar');
      expect(col(r, 'equilibrio').premissa).toBe(
        'A melhor combinação entre contratar e ajustar horários',
      );
      expect(r.cenarios.every((c) => c.resultado.length > 0)).toBe(true);
    }
  });

  it('Cenário 2 sem corte: nenhum horário muda e a falta fica por função, sem venda perdida', () => {
    const eco = col(semCorte(), 'economia');
    expect(eco.resultado).toBe('Nenhum horário precisa mudar');
    expect(eco.faltaPorFuncao?.length).toBeGreaterThan(0);
    expect(eco.semFarmaceuticoH).toBe(0);
    expect(eco.faturamentoPerdidoMensal).toBe(0);
  });

  it('Cenário 2 com corte: o resultado descreve o dia que muda', () => {
    expect(col(comparar(), 'economia').resultado).toContain('Sábado fecha');
  });

  it('Cenário 3 igual ao 1 fica para recolher, apontando o cenário de origem', () => {
    const r = semCorte();
    expect(col(r, 'equilibrio').recolher).toBe('manter');
    expect(col(r, 'equilibrio').resultado).toBe('Igual a Manter horários');
    expect(col(comparar(), 'equilibrio').recolher).toBeNull();
  });

  it('o selo "Cenário sugerido" não vai ao Cenário 2 quando ele deixa função abaixo do nível de hoje', () => {
    const r = semCorte();
    expect(r.destaque).toBe('economia');
    expect(r.sugerido).toBe('manter');
  });

  it('sem função abaixo do nível de hoje, o sugerido é o de maior saldo', () => {
    const r = comparar({ estenderHorario: false });
    expect(r.sugerido).toBe(r.destaque);
  });

  it('loja que já cobre tudo: os cenários não têm o que mostrar', () => {
    const r = comparar({ pessoas: farm(44, 44, 44) });
    expect(r.lojaCobreTudo).toBe(true);
    expect(semCorte().lojaCobreTudo).toBe(false);
    expect(comparar().lojaCobreTudo).toBe(false);
  });

  it('gerente não recebe selo sugerido nem valores, mas recebe a falta em horas', () => {
    const r = semCorte({ dono: false });
    expect('sugerido' in r).toBe(false);
    expect(col(r, 'economia').faltaPorFuncao?.length).toBeGreaterThan(0);
  });

  it('o resultado do Cenário 1 lista as funções em português corrido', () => {
    const r = semCorte({
      pessoas: farm(44, 44, 44)
        .slice(0, 1)
        .concat([{ funcao: 'Atendimento', cargaH: 40 }]),
    });
    expect(col(r, 'manter').resultado).toMatch(/^Contrata \d+ pessoas?: [\p{L}, ]+$/u);
    expect(col(r, 'manter').resultado).not.toMatch(/ e .* e /);
  });
});

describe('Cenário 3 com horário estendido (spec 020)', () => {
  // Farmacêutico coberto, atendimento com horas ociosas e venda do cadastro: estender o sábado compensa por pouco.
  const loja = (extra: Partial<EntradaCenarios> = {}): EntradaCenarios =>
    entrada({
      regraId: 'r42',
      minimos: { Farmacêutico: 1 },
      pessoas: [
        ...farm(44, 44, 44),
        ...[44, 44].map((cargaH) => ({ funcao: 'Atendimento', cargaH })),
      ],
      custos: { salarioMedio: { Farmacêutico: 10000, Atendimento: 3000 }, encargosPct: 0 },
      ...extra,
    });
  const calcular = (extra: Partial<EntradaCenarios> = {}) => {
    const e = loja(extra);
    const c = montarCenarios(e);
    return { e, c, r: montarComparativo(e, c) };
  };

  it('estende o sábado, avisa que a venda das horas novas é estimada e fica com saldo maior que o Cenário 1', () => {
    const { c, r } = calcular();
    expect(c.equilibrio.passos).toMatchObject([{ tipo: 'estender', dia: 5 }]);
    expect(c.equilibrio.horasEstendidas).toEqual([{ dia: 5, horasNovas: 2, origem: 'vizinha' }]);
    const eq3 = col(r, 'equilibrio');
    expect(eq3.recolher).toBeNull();
    expect(eq3.estimativaDeVenda).toBe(true);
    expect(eq3.resultado).toContain('Sábado fecha 2 h mais tarde');
    expect(eq3.alertas.join(' ')).toContain('Venda das horas novas é estimada');
    expect(eq3.ajustes).toEqual([
      {
        dia: 5,
        antes: { abre: '08:00', fecha: '22:00' },
        depois: { abre: '08:00', fecha: '24:00' },
      },
    ]);
    // a venda das horas novas (50% da hora vizinha) abate a folha extra: saldo melhor que o do Cenário 1 (que é 0)
    expect(eq3.vendaAdicionalMensal!).toBeGreaterThan(0);
    expect(eq3.saldoMensal!).toBeGreaterThan(col(r, 'manter').saldoMensal!);
    expect(eq3.saldoMensal!).toBeCloseTo(
      eq3.economiaFolhaMensal! - eq3.faturamentoPerdidoMensal! + eq3.vendaAdicionalMensal!,
      1,
    );
  });

  it('o percentual de venda da hora nova é uma premissa: mudar de 50% para 100% dobra a venda adicional', () => {
    const base50 = col(calcular().r, 'equilibrio').vendaAdicionalMensal!;
    const cem = col(calcular({ fatorHoraNova: 100 }).r, 'equilibrio').vendaAdicionalMensal!;
    expect(cem).toBeCloseTo(base50 * 2, 0);
    // com 0% a hora nova não rende nada e o Cenário 3 deixa de estender
    expect(calcular({ fatorHoraNova: 0 }).c.equilibrio.horasEstendidas).toEqual([]);
  });

  it('segunda a sexta nunca mudam e só sábado e domingo ganham horas', () => {
    const { c } = calcular();
    for (const d of [0, 1, 2, 3, 4])
      expect(c.equilibrio.horarioSemana[d]).toMatchObject({ abre: '08:00', fecha: '22:00' });
  });

  it('com a extensão desligada, o Cenário 3 volta a só cortar (igual ao 1 quando nada compensa)', () => {
    const { c, r } = calcular({ estenderHorario: false });
    expect(c.equilibrio.horasEstendidas).toEqual([]);
    expect(col(r, 'equilibrio').estimativaDeVenda).toBe(false);
    expect(col(r, 'equilibrio').recolher).toBe('manter');
  });

  it('o ganho das horas novas e o impacto robusto são só do dono', () => {
    const { c } = calcular();
    expect(c.equilibrio.vendaGanhaMes).toBeGreaterThan(0);
    expect(c.equilibrio.impactoRobusto).toBeGreaterThan(c.equilibrio.impactoMensal!);
    const g = calcular({ dono: false });
    expect('vendaGanhaMes' in g.c.equilibrio).toBe(false);
    expect('impactoRobusto' in g.c.equilibrio).toBe(false);
    expect(col(g.r, 'equilibrio').ajustes).toHaveLength(1);
    expect(JSON.stringify(g.r)).not.toContain('R$');
  });

  it('o "Cenário sugerido" só vai ao Cenário 3 com horas novas se resistir à metade da venda estimada', () => {
    const { e, c } = calcular();
    const forcado = (impactoRobusto: number) => {
      const copia = structuredClone(c);
      copia.destaque = 'equilibrio';
      copia.equilibrio.impactoRobusto = impactoRobusto;
      return montarComparativo(e, copia);
    };
    const melhorOutro = Math.min(c.manter.impactoMensal!, c.economia.impactoMensal!);
    expect(forcado(melhorOutro - 100).sugerido).toBe('equilibrio');
    expect(forcado(melhorOutro + 100).sugerido).not.toBe('equilibrio');
  });
});
