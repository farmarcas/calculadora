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
  it('sem editar o horário, nenhuma venda sai e as horas abertas não mudam', () => {
    const r = base();
    expect(r.horario.mudou).toBe(false);
    expect(r.horasAbertas).toBe(90);
    expect(r.horasAbertasAntes).toBe(90);
    expect(r.vendaQueSai).toBe(0);
    expect(r.saldoMensal).toBe(r.economiaFolha);
  });

  it('fechar a segunda às 20h: a venda das horas 20 e 21 sai, por mês (× 52 ÷ 12)', () => {
    const r = base({ dias: segundaAte20 });
    expect(r.horario.mudou).toBe(true);
    expect(r.horario.dias[0]).toMatchObject({ fecha: '20:00', horas: 13, alterado: true });
    // O horário do Cadastro continua disponível para restaurar e para saber quais dias abrem.
    expect(r.horario.cadastro[0]).toEqual({ aberta: true, abre: '07:00', fecha: '22:00' });
    expect(r.horario.cadastro[6]).toEqual({ aberta: false, abre: null, fecha: null });
    expect(r.horario.dias[1]!.alterado).toBe(false);
    expect(r.horasAbertas).toBe(88);
    expect(r.vendaQueSai).toBeCloseTo((2000 * 52) / 12, 1);
    expect(r.vendaPorHora.fechadas[0]![20]).toBe(true);
    expect(r.vendaPorHora.fechadas[0]![19]).toBe(false);
    expect(r.vendaPorHora.fechadas[1]![20]).toBe(false);
  });

  it('sem base comercial, a venda que sai e o saldo são nulos, não zero', () => {
    const r = base({ dias: segundaAte20, vendas: [] });
    expect(r.temBase).toBe(false);
    expect(r.vendaQueSai).toBeNull();
    expect(r.saldoMensal).toBeNull();
    expect(r.saldoAnual).toBeNull();
    expect(r.pesoNoFaturamentoPct).toBeNull();
    expect(r.vendaPorHora.venda).toBeNull();
  });

  it('a margem não importa: sem ela a venda que sai e o saldo são os mesmos', () => {
    const com = base({ dias: segundaAte20, vendas: [venda(20, 1000), venda(21, 1000)] });
    const sem = base({ dias: segundaAte20, vendas: [venda(20, 1000, 0), venda(21, 1000, 0)] });
    expect(sem.vendaQueSai).toBeCloseTo((2000 * 52) / 12, 1);
    expect(sem.vendaQueSai).toBe(com.vendaQueSai);
    expect(sem.saldoMensal).toBe(com.saldoMensal);
    expect('margemPerdida' in sem).toBe(false);
  });

  it('saldo = economia de folha − venda que sai; anual = mensal × 12; peso sobre o faturamento da base', () => {
    // Duas farmacêuticas de 40h para 90h abertas: o "manter horário" contrata o que falta; a simulação fecha a segunda às 20h
    // (venda de 2 horas = 2000 × 52 ÷ 12 = 8666,67) e não contrata ninguém: a economia é o custo do manter horário.
    const r = base({ dias: segundaAte20, vendas: [venda(10, 1000), venda(20, 1000), venda(21, 1000)] });
    expect(r.custoAdicional).toBe(r.folhaExtra! + r.horaExtra!);
    // (a hora extra que sobra do horário menor pode custar mais que as contratações do "manter horário": a economia fica negativa)
    expect(typeof r.economiaFolha).toBe('number');
    expect(r.saldoMensal).toBeCloseTo(r.economiaFolha! - r.vendaQueSai!, 1);
    expect(r.saldoAnual).toBeCloseTo(r.saldoMensal! * 12, 0);
    const faturamento = 3000 * (52 / 12);
    expect(r.pesoNoFaturamentoPct).toBeCloseTo((r.saldoMensal! / faturamento) * 100, 0);
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
    expect(com.custoAdicional).toBe(com.folhaExtra! + com.horaExtra!);
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
    expect(r.custoAdicional).toBeNull();
    expect(r.saldoMensal).toBeNull();
  });

  it('quem não é dono não recebe nenhum valor em reais', () => {
    const r = base({ dias: segundaAte20, dono: false });
    for (const k of ['custoAdicional', 'economiaFolha', 'saldoMensal', 'saldoAnual', 'folhaExtra', 'horaExtra', 'vendaQueSai'])
      expect(r).not.toHaveProperty(k);
    expect(r.vendaPorHora.venda).toBeNull();
    expect(r.horasAbertas).toBe(88);
    expect(r.funcoes[0]).not.toHaveProperty('custoMensal');
  });
  it('nível de hoje: uma vaga que cobre o buraco deixa a função coberta ', async () => {
    // Duas atendentes de 44h mantêm 88h hoje; na regra de 40h cada uma faz 40h: faltam 8h, e uma vaga de 8h fecha.
    const atend = (m: string): PessoaSim => ({ matricula: m, nome: m, funcao: 'Atendimento', cargaH: 44 });
    const q: PessoaSim[] = [
      ...quadro,
      atend('C'),
      atend('D'),
      { matricula: 'VAGA-1', nome: 'Vaga 1', funcao: 'Atendimento', cargaH: 8, vaga: true },
    ];
    const r = base({ quadro: q });
    const f = r.funcoes.find((x) => x.funcao === 'Atendimento')!;
    expect(f.faltaHoje).toBe(8);
    expect(f.resultado).toEqual({ coberto: true, horas: 0 });
  });
});
