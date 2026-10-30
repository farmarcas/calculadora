import { describe, expect, it } from 'vitest';
import type { DiaAberto } from '../regras/capacidade.js';
import { regraPara } from '../regras/perfis.js';
import type { PessoaSim } from './avaliar.js';
import { calcularResultado } from './resultado.js';
import type { VendaLinha } from '../escala/vendas.js';

// Seg a sáb 07h–22h (15h por dia = 90h por semana), domingo fechado.
const cadastro: DiaAberto[] = [0, 1, 2, 3, 4, 5].map((dia) => ({ dia, abre: 7, fecha: 22 }));
const regra = regraPara('r40', false);
const regraAtual = regraPara('atual', false);
const custos = { salarioMedio: { Farmacêutico: 6000, Atendimento: 2000 }, encargosPct: 40 };
const quadro: PessoaSim[] = [
  { matricula: 'A', nome: 'Ana', funcao: 'Farmacêutico', cargaH: 40 },
  { matricula: 'B', nome: 'Bia', funcao: 'Farmacêutico', cargaH: 40 },
];
// 2026-01-05 é uma segunda: uma data por dia da semana, então a média é o próprio valor.
const venda = (hora: number, v: number, m = v * 0.26): VendaLinha => ({
  data: '2026-01-05',
  hora,
  venda: v,
  margem: m,
  clientes: 0,
  unidades: 0,
});
const base = (over: Partial<Parameters<typeof calcularResultado>[0]> = {}) =>
  calcularResultado({
    regraId: 'r40',
    regra,
    regraAtual,
    dias: cadastro,
    diasCadastro: cadastro,
    minimos: {},
    quadro,
    vendas: [venda(10, 1000), venda(20, 1000), venda(21, 1000)],
    custos,
    dono: true,
    ...over,
  });
const segundaAte20: DiaAberto[] = [{ dia: 0, abre: 7, fecha: 20 }, ...cadastro.slice(1)];

describe('calcularResultado', () => {
  it('sem editar o horário, nada de venda ou margem sai e as horas abertas não mudam', () => {
    const r = base();
    expect(r.horario.mudou).toBe(false);
    expect(r.horasAbertas).toBe(90);
    expect(r.horasAbertasAntes).toBe(90);
    expect(r.vendaQueSai).toBe(0);
    expect(r.margemPerdida).toBe(0);
  });

  it('fechar a segunda às 20h: venda e margem das horas 20 e 21 saem, por mês (× 52 ÷ 12)', () => {
    const r = base({ dias: segundaAte20 });
    expect(r.horario.mudou).toBe(true);
    expect(r.horario.dias[0]).toMatchObject({ fecha: '20:00', horas: 13, alterado: true });
    expect(r.horario.dias[1]!.alterado).toBe(false);
    expect(r.horasAbertas).toBe(88);
    expect(r.vendaQueSai).toBeCloseTo((2000 * 52) / 12, 1);
    expect(r.margemPerdida).toBeCloseTo((520 * 52) / 12, 1);
    expect(r.vendaPorHora.fechadas[0]![20]).toBe(true);
    expect(r.vendaPorHora.fechadas[0]![19]).toBe(false);
    expect(r.vendaPorHora.fechadas[1]![20]).toBe(false);
  });

  it('sem base comercial, venda e margem que saem são nulas, não zero', () => {
    const r = base({ dias: segundaAte20, vendas: [] });
    expect(r.temBase).toBe(false);
    expect(r.vendaQueSai).toBeNull();
    expect(r.margemPerdida).toBeNull();
    expect(r.vendaPorHora.venda).toBeNull();
  });

  it('sem margem informada, a margem perdida é nula e a venda que sai continua', () => {
    const r = base({
      dias: segundaAte20,
      vendas: [venda(20, 1000, 0), venda(21, 1000, 0)],
    });
    expect(r.margemInformada).toBe(false);
    expect(r.margemPerdida).toBeNull();
    expect(r.vendaQueSai).toBeCloseTo((2000 * 52) / 12, 1);
  });

  it('contratação simulada: folha extra pelo custo da vaga e função coberta', () => {
    // Só a Ana de farmacêutica (40h) não cobre 90h; a vaga integral cobre o resto.
    const sozinha: PessoaSim[] = [quadro[0]!];
    const sem = base({ quadro: sozinha });
    const f0 = sem.funcoes.find((f) => f.funcao === 'Farmacêutico')!;
    expect(f0.faltaHoje).toBeGreaterThan(0);
    expect(f0.resultado.coberto).toBe(false);
    expect(sem.folhaExtra).toBe(0);
    expect(sem.horaExtra).toBeGreaterThan(0);

    const com = base({
      quadro: [...sozinha, { matricula: 'VAGA-1', nome: 'Vaga 1', funcao: 'Farmacêutico', cargaH: 40, vaga: true }],
    });
    const f1 = com.funcoes.find((f) => f.funcao === 'Farmacêutico')!;
    expect(f1.contratacoes).toHaveLength(1);
    // 6000 × 40h × 5 ÷ 200 (divisor da regra de 40h) × 1,4 = 8400
    expect(com.folhaExtra).toBe(8400);
    expect(f1.custoMensal).toBe(8400);
    expect(com.impactoMensal).toBe(com.folhaExtra! + com.horaExtra!);
  });

  it('sem salário informado, folha e hora extra ficam nulas (nunca parciais)', () => {
    const r = base({
      quadro: [
        quadro[0]!,
        { matricula: 'VAGA-1', nome: 'Vaga 1', funcao: 'Farmacêutico', cargaH: 40, vaga: true },
      ],
      custos: { salarioMedio: {}, encargosPct: 40 },
    });
    expect(r.folhaExtra).toBeNull();
    expect(r.impactoMensal).toBeNull();
  });

  it('quem não é dono não recebe nenhum valor em reais', () => {
    const r = base({ dias: segundaAte20, dono: false });
    for (const k of ['impactoMensal', 'folhaExtra', 'horaExtra', 'vendaQueSai', 'margemPerdida'])
      expect(r).not.toHaveProperty(k);
    expect(r.vendaPorHora.venda).toBeNull();
    expect(r.horasAbertas).toBe(88);
    expect(r.funcoes[0]).not.toHaveProperty('custoMensal');
  });
});
