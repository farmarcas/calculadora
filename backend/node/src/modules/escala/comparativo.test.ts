import { describe, expect, it } from 'vitest';
import { montarCenarios, type EntradaCenarios } from './cenarios.js';
import { montarComparativo } from './comparativo.js';
import { vendasDoCadastro } from './vendas-cadastro.js';

// Segunda a sábado, 8h às 22h: 84h e 12 turnos. Margem por dia (25%): 250, 300, 225, 275, 375 e 500.
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
  origemVenda: 'cadastro',
  custos: { salarioMedio: { Farmacêutico: 10000 }, encargosPct: 0 },
  dono: true,
  faturamentoMensalRef: 50000,
  ...extra,
});
const comparar = (extra: Partial<EntradaCenarios> = {}) => {
  const e = entrada(extra);
  return montarComparativo(e, montarCenarios(e));
};
const col = (r: ReturnType<typeof comparar>, id: string) => r.cenarios.find((c) => c.id === id)!;

describe('comparativo dos cenários 1, 2 e 3', () => {
  it('três colunas lado a lado, na ordem 1, 2 e 3', () => {
    expect(comparar().cenarios.map((c) => c.id)).toEqual(['manter', 'economia', 'equilibrio']);
  });

  it('campos dos cartões (dono): folha adicional, faturamento perdido e ganho frente a manter horários, à mão', () => {
    const r = comparar();
    // Cenário 2 (só fim de semana, com travas): o sábado perde 5 h de 14 (8666,67 × 5 ÷ 14 = 3095,24 por mês, 9,3% da
    // venda dos seis dias, 33366,67). Resultado = −margem de 25% (773,81); ganho frente a manter: −773,81 − (−11000).
    expect(col(r, 'manter')).toMatchObject({
      folhaAdicionalMensal: 11000,
      faturamentoPerdidoMensal: 0,
      faturamentoPerdidoPct: 0,
      ganhoFrenteManterMensal: 0,
    });
    expect(col(r, 'economia')).toMatchObject({
      folhaAdicionalMensal: 0,
      faturamentoPerdidoMensal: 3095.24,
      faturamentoPerdidoPct: 9.3,
      ganhoFrenteManterMensal: 10226.19,
    });
    // Cenário 3 fecha seg, qua e qui: (1000+900+1100) × 52 ÷ 12 = 13000 (26% de 50000); folha adicional 500; −3750 + 11000.
    expect(col(r, 'equilibrio')).toMatchObject({
      folhaAdicionalMensal: 500,
      faturamentoPerdidoMensal: 13000,
      faturamentoPerdidoPct: 26,
      ganhoFrenteManterMensal: 7250,
    });
  });

  it('ociosidade das contratações aparece para todos; sem contratação fica nula; valores em reais só para o dono', () => {
    const r = comparar();
    expect(col(r, 'manter').ociosidadePct).not.toBeNull();
    expect(col(r, 'economia').ociosidadePct).toBeNull();
    const naoDono = comparar({ dono: false });
    for (const c of naoDono.cenarios) {
      expect(c).not.toHaveProperty('folhaAdicionalMensal');
      expect(c).not.toHaveProperty('faturamentoPerdidoMensal');
      expect(c).not.toHaveProperty('ganhoFrenteManterMensal');
    }
    expect(col(naoDono, 'manter').ociosidadePct).not.toBeNull();
  });

  it('valores do dono conferidos à mão: 1 farmacêutico de 40h, salário de 10000, faturamento de 50000', () => {
    const r = comparar();
    // Folha atual: 1 × 10000.
    // Cenário 1: 1 integral (10000) + 1 parcial de 4 h (1000) = 11000 de custo adicional.
    const m = col(r, 'manter');
    expect(m).toMatchObject({
      status: 'viavel',
      diasFechar: [],
      custoFolhaMensal: 21000,
      margemMes: 0,
      resultadoLiquidoMensal: -11000,
      impactoPctFaturamento: 22,
    });
    expect(m.contratacoes[0]).toMatchObject({ inteiras: 1, parcial: { turnos: 1, horas: 4 } });
    expect(m.horasSemana).toBe(84);
    // Cenário 2: o sábado perde 5 h (14 → 9 h): venda 3095,24, margem 25% = 773,81; sem contratar; não cobre
    // (1 farmacêutico de 40h para 79 h abertas: faltam 39 h): "não resolve sozinho".
    const e2 = col(r, 'economia');
    expect(e2).toMatchObject({
      status: 'nao_resolve',
      diasFechar: [],
      contratacoes: [],
      custoFolhaMensal: 10000,
      margemMes: -773.81,
      resultadoLiquidoMensal: -773.81,
      impactoPctFaturamento: 1.5,
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
    expect(e2.alertas.join(' ')).toContain('Cenário 3');
    // Cenário 3: fecha segunda, quarta e quinta e contrata 1 parcial de 2h (500): folha 10500, margem −3250, impacto 3750.
    const e3 = col(r, 'equilibrio');
    expect(e3).toMatchObject({
      status: 'viavel',
      diasFechar: [0, 2, 3],
      custoFolhaMensal: 10500,
      margemMes: -3250,
      resultadoLiquidoMensal: -3750,
      impactoPctFaturamento: 7.5,
    });
    expect(e3.contratacoes[0]).toMatchObject({ inteiras: 0, parcial: { turnos: 1, horas: 2 } });
    expect(e3.horasSemana).toBe(42);
  });

  it('destaca o de maior resultado líquido (o mesmo do selo) sem esconder os outros', () => {
    const r = comparar();
    expect(r.destaque).toBe('equilibrio');
    expect(r.cenarios).toHaveLength(3);
    // o destaque é o de menor impacto: 3750 contra 11000; o Cenário 2 não resolve sozinho e fica de fora
    const candidatos = r.cenarios.filter((c) => c.status === 'viavel');
    const maior = Math.max(...candidatos.map((c) => c.resultadoLiquidoMensal!));
    expect(col(r, r.destaque!).resultadoLiquidoMensal).toBe(maior);
    expect(col(r, 'economia').status).toBe('nao_resolve');
  });

  // Todos os dias, 8h às 22h; domingo vende 700 (a menor venda por hora). Equipe de 40 + 40 + 24 h: reduzir o domingo
  // de 14 h para 8 h (1 turno) basta: 6 h de corte, venda 700 × 52 ÷ 12 × 6 ÷ 14 = 1300 (25% = 325), 3,6% da venda total.
  const seteDias = [0, 1, 2, 3, 4, 5, 6].map((dia) => ({ dia, abre: 8, fecha: 22 }));
  const fat7 = [1000, 1200, 900, 1100, 1500, 2000, 700];
  const comSete = (extra: Partial<EntradaCenarios> = {}, margemPct: number | null = 25) =>
    comparar({
      dias: seteDias,
      pessoas: farm(40, 40, 24),
      vendas: vendasDoCadastro({ dias: fat7, mensal: null, margemPct }, seteDias)!.linhas,
      ...extra,
    });

  it('Cenário 2 que resolve reduzindo o fim de semana: status viável, com o horário ajustado', () => {
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
    expect(e2).toMatchObject({
      margemMes: -325,
      resultadoLiquidoMensal: -325,
      faltaH: null,
      faturamentoPerdidoPct: 3.6,
    });
    expect(e2.horasSemana).toBe(92);
    expect(['economia', 'equilibrio']).toContain(r.destaque);
  });

  it('sem margem informada: margem e saldo ficam nulos (nunca R$ 0) e o alerta pede a margem', () => {
    const r = comSete({}, null);
    const e2 = col(r, 'economia');
    expect(e2).toMatchObject({
      status: 'viavel',
      margemMes: null,
      resultadoLiquidoMensal: null,
      faturamentoPerdidoMensal: 1300,
    });
    expect(e2.alertas.join(' ')).toContain('margem bruta média');
    expect(r.destaque).toBeNull();
  });

  it('Cenário 2 sem farmacêutico no quadro: inviável, com o motivo no alerta e valores nulos', () => {
    const r = comparar({ pessoas: [{ funcao: 'Atendimento', cargaH: 40 }] });
    const e2 = col(r, 'economia');
    expect(e2.status).toBe('inviavel');
    expect(e2.alertas.join(' ')).toContain('Não há Farmacêutico');
    expect(e2).toMatchObject({
      custoFolhaMensal: null,
      margemMes: null,
      resultadoLiquidoMensal: null,
      impactoPctFaturamento: null,
    });
    expect(r.destaque).not.toBe('economia');
  });

  it('sem custos: o custo fica nulo, o Cenário 3 fica sem status e o alerta diz o que falta', () => {
    const r = comparar({ custos: null });
    expect(col(r, 'manter')).toMatchObject({
      status: 'viavel',
      custoFolhaMensal: null,
      resultadoLiquidoMensal: null,
    });
    expect(col(r, 'manter').alertas.join(' ')).toContain('salários médios');
    const e3 = col(r, 'equilibrio');
    expect(e3.status).toBeNull();
    expect(e3.alertas.join(' ')).toContain('salário médio');
    expect(e3.resultadoLiquidoMensal).toBeNull();
    expect(r.destaque).toBeNull();
  });

  it('sem faturamento de referência, só o percentual some', () => {
    const r = comparar({ faturamentoMensalRef: null });
    expect(col(r, 'manter')).toMatchObject({
      resultadoLiquidoMensal: -11000,
      impactoPctFaturamento: null,
    });
  });

  it('venda estimada (só o mensal): alerta nos cenários 2 e 3', () => {
    const mensal = vendasDoCadastro(
      { dias: new Array(7).fill(null), mensal: 52000, margemPct: 25 },
      dias,
    )!.linhas;
    const r = comparar({ vendas: mensal, origemVenda: 'estimativa', pessoas: farm(40, 40) });
    expect(col(r, 'economia').alertas.join(' ')).toContain('Venda estimada');
    expect(col(r, 'equilibrio').alertas.join(' ')).toContain('Venda estimada');
  });

  it('Cenário 3 igual ao Cenário 1: o alerta diz qual', () => {
    const igualManter = comparar({
      pessoas: farm(40, 40),
      custos: { salarioMedio: { Farmacêutico: 1000 }, encargosPct: 0 },
    });
    expect(col(igualManter, 'equilibrio').alertas.join(' ')).toContain('mesmo do Cenário 1');
  });

  it('quem não é dono recebe contratações, dias, horas, status e alertas, sem nenhuma linha em reais nem destaque', () => {
    const r = comparar({ dono: false });
    expect('destaque' in r).toBe(false);
    for (const c of r.cenarios) {
      for (const campo of [
        'custoFolhaMensal',
        'margemMes',
        'resultadoLiquidoMensal',
        'impactoPctFaturamento',
      ])
        expect(campo in c).toBe(false);
    }
    expect(col(r, 'equilibrio')).toMatchObject({ status: 'viavel', diasFechar: [0, 2, 3] });
    expect(col(r, 'economia')).toMatchObject({ status: 'nao_resolve', faltaH: 39 });
    expect(col(r, 'economia').ajustes).toHaveLength(1);
    expect(JSON.stringify(r)).not.toContain('R$');
  });
});
