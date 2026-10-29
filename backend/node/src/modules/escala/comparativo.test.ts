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
    // Venda por mês = soma semanal × 52 ÷ 12. Cenário 2 fecha seg, ter, qua e qui: (1000+1200+900+1100) × 52 ÷ 12 = 18200.
    expect(col(r, 'manter')).toMatchObject({
      folhaAdicionalMensal: 14000,
      faturamentoPerdidoMensal: 0,
      faturamentoPerdidoPct: 0,
      ganhoFrenteManterMensal: 0,
    });
    expect(col(r, 'economia')).toMatchObject({
      folhaAdicionalMensal: 0,
      faturamentoPerdidoMensal: 18200,
      faturamentoPerdidoPct: 36.4,
      ganhoFrenteManterMensal: 9450,
    });
    // Cenário 3 fecha seg, qua e qui: (1000+900+1100) × 52 ÷ 12 = 13000; folha adicional 2000; −5250 − (−14000) = 8750.
    expect(col(r, 'equilibrio')).toMatchObject({
      folhaAdicionalMensal: 2000,
      faturamentoPerdidoMensal: 13000,
      faturamentoPerdidoPct: 26,
      ganhoFrenteManterMensal: 8750,
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
    // Cenário 1: 1 inteira (10000) + 1 parcial de 2 turnos (4000) = 14000 de custo adicional.
    const m = col(r, 'manter');
    expect(m).toMatchObject({
      status: 'viavel',
      diasFechar: [],
      custoFolhaMensal: 24000,
      margemMes: 0,
      resultadoLiquidoMensal: -14000,
      impactoPctFaturamento: 28,
    });
    expect(m.contratacoes[0]).toMatchObject({ inteiras: 1, parcial: { turnos: 2, horas: 16 } });
    expect(m.horasSemana).toBe(84);
    // Cenário 2: só dá fechando segunda, terça, quarta e quinta (terça é protegida): margem 4550, sem contratar.
    const e2 = col(r, 'economia');
    expect(e2).toMatchObject({
      status: 'nao_recomendado',
      diasFechar: [0, 1, 2, 3],
      contratacoes: [],
      custoFolhaMensal: 10000,
      margemMes: -4550,
      resultadoLiquidoMensal: -4550,
      impactoPctFaturamento: 9.1,
    });
    expect(e2.horasSemana).toBe(28);
    expect(e2.alertas.join(' ')).toContain('terça');
    // Cenário 3: fecha segunda, quarta e quinta e contrata 1 parcial de 8h (2000): folha 12000, margem −3250, impacto 5250.
    const e3 = col(r, 'equilibrio');
    expect(e3).toMatchObject({
      status: 'viavel',
      diasFechar: [0, 2, 3],
      custoFolhaMensal: 12000,
      margemMes: -3250,
      resultadoLiquidoMensal: -5250,
      impactoPctFaturamento: 10.5,
    });
    expect(e3.contratacoes[0]).toMatchObject({ inteiras: 0, parcial: { turnos: 1, horas: 8 } });
    expect(e3.horasSemana).toBe(42);
  });

  it('destaca o de maior resultado líquido (o mesmo do selo) sem esconder os outros', () => {
    const r = comparar();
    expect(r.destaque).toBe('equilibrio');
    expect(r.cenarios).toHaveLength(3);
    // o destaque é o de menor impacto: 5250 contra 14000 e (Cenário 2 não recomendado) 4550 que fica de fora
    const melhor = r.cenarios.filter(
      (c) => c.status !== 'nao_recomendado' && c.status !== 'inviavel',
    );
    const maior = Math.max(...melhor.map((c) => c.resultadoLiquidoMensal!));
    expect(col(r, r.destaque!).resultadoLiquidoMensal).toBe(maior);
  });

  it('Cenário 2 recomendado: status viável, destaque pode ir para ele', () => {
    // 2 farmacêuticos de 40h: fechar a quarta resolve (975 de margem) contra 4000 de contratar
    const r = comparar({ pessoas: farm(40, 40) });
    const e2 = col(r, 'economia');
    expect(e2.status).toBe('viavel');
    expect(e2).toMatchObject({ diasFechar: [2], margemMes: -975, resultadoLiquidoMensal: -975 });
    expect(['economia', 'equilibrio']).toContain(r.destaque);
  });

  it('Cenário 2 sem equipe que cubra: inviável, com o motivo no alerta e valores nulos', () => {
    const r = comparar({ pessoas: farm(8) });
    const e2 = col(r, 'economia');
    expect(e2.status).toBe('inviavel');
    expect(e2.alertas.join(' ')).toContain('Mesmo fechando dias');
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
      resultadoLiquidoMensal: -14000,
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

  it('Cenário 3 igual a outro cenário: o alerta diz qual', () => {
    const igualEco = comparar({ pessoas: farm(40, 40) });
    expect(col(igualEco, 'equilibrio').alertas.join(' ')).toContain('mesmo do Cenário 2');
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
    expect(col(r, 'economia').status).toBe('nao_recomendado');
    expect(JSON.stringify(r)).not.toContain('R$');
  });
});
