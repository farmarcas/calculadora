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
// Sem CMV na base (m = null) a régua é a venda, como sempre foi. Os testes de CMV (spec 034) passam o lucro bruto `m` (venda − CMV).
const venda = (hora: number, v: number, m: number | null = null): VendaLinha => ({
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
    expect(r.vendaEstimada).toBe(0);
    // Saldo contra a folha atual: sem mudar o horário vale −(folha extra + hora extra).
    expect(r.saldoMensal).toBeCloseTo(-(r.folhaExtra! + r.horaExtra!), 1);
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

  it('base sem CMV: a régua é venda e a venda que sai e o saldo são os de sempre', () => {
    const r = base({ dias: segundaAte20, vendas: [venda(20, 1000), venda(21, 1000)] });
    expect(r.regua).toEqual({ tipo: 'venda', motivo: 'sem_margem' });
    expect(r.vendaQueSai).toBeCloseTo((2000 * 52) / 12, 1);
  });

  it('base com CMV: a venda que sai, a estimada e o saldo são em margem; a venda real segue como informação', () => {
    const vendas = [venda(20, 1000, 300), venda(21, 1000, 300), venda(10, 1000, 300)];
    const comMargem = base({ dias: segundaAte20, vendas });
    const comVenda = base({
      dias: segundaAte20,
      vendas: vendas.map((l) => ({ ...l, margem: null })),
    });
    expect(comMargem.regua).toEqual({ tipo: 'margem' });
    expect(comMargem.vendaQueSai).toBeCloseTo((600 * 52) / 12, 1);
    expect(comMargem.vendaQueSai!).toBeLessThan(comVenda.vendaQueSai!);
    // Custos não mudam; só a medida da perda: o saldo sobe exatamente o que a perda cai.
    expect(comMargem.folhaExtra).toBe(comVenda.folhaExtra);
    expect(comMargem.horaExtra).toBe(comVenda.horaExtra);
    expect(comMargem.saldoMensal! - comVenda.saldoMensal!).toBeCloseTo(
      comVenda.vendaQueSai! - comMargem.vendaQueSai!,
      1,
    );
    // O faturamento de referência e o ticket médio seguem em venda real.
    expect(comMargem.pesoNoFaturamentoPct).not.toBeNull();
    expect(comMargem.vendaPorHora.venda![0]![20]).toBe(1000);
  });

  it('CMV maior que a venda: volta à venda e avisa o motivo', () => {
    const r = base({ dias: segundaAte20, vendas: [venda(20, 1000, 300), venda(21, 1000, -200)] });
    expect(r.regua).toEqual({ tipo: 'venda', motivo: 'margem_incoerente' });
    expect(r.vendaQueSai).toBeCloseTo((2000 * 52) / 12, 1);
  });

  it('CMV médio da loja: as horas sem CMV recebem venda × (1 − CMV médio); a perda de R$ 1.000 vira R$ 350 com CMV de 65%', () => {
    const vendas = [venda(20, 1000), venda(21, 1000), venda(10, 1000)];
    const r = base({ dias: segundaAte20, vendas, cmvMedioPct: 65 });
    expect(r.regua).toEqual({ tipo: 'margem' });
    expect(r.vendaQueSai).toBeCloseTo((700 * 52) / 12, 1);
    // CMV da hora vale mais que o médio: a hora 21 com lucro bruto de 200 usa o 200.
    const misto = base({
      dias: segundaAte20,
      vendas: [venda(20, 1000), venda(21, 1000, 200), venda(10, 1000)],
      cmvMedioPct: 65,
    });
    expect(misto.vendaQueSai).toBeCloseTo(((350 + 200) * 52) / 12, 1);
  });

  it('sem CMV na base e sem CMV médio: mede em venda, como antes', () => {
    const r = base({
      dias: segundaAte20,
      vendas: [venda(20, 1000), venda(21, 1000)],
      cmvMedioPct: null,
    });
    expect(r.regua).toEqual({ tipo: 'venda', motivo: 'sem_margem' });
    expect(r.vendaQueSai).toBeCloseTo((2000 * 52) / 12, 1);
  });

  it('o gestor recebe a régua e nenhum valor em reais', () => {
    const r = base({
      dias: segundaAte20,
      dono: false,
      vendas: [venda(20, 1000, 300), venda(21, 1000, 300)],
    });
    expect(r.regua).toEqual({ tipo: 'margem' });
    expect(r).not.toHaveProperty('vendaQueSai');
    expect(r).not.toHaveProperty('saldoMensal');
  });

  it('saldo = −folha extra − hora extra + venda estimada − venda que deixa de entrar; anual = mensal × 12; peso sobre o faturamento', () => {
    // Duas farmacêuticas de 40h para 90h abertas: o "manter horário" contrata o que falta; a simulação fecha a segunda às 20h
    // (venda de 2 horas = 2000 × 52 ÷ 12 = 8666,67) e não contrata ninguém: a economia é o custo do manter horário.
    const r = base({
      dias: segundaAte20,
      vendas: [venda(10, 1000), venda(20, 1000), venda(21, 1000)],
    });
    expect(r.custoAdicional).toBe(r.folhaExtra! + r.horaExtra!);
    // A economia de folha (contra manter o horário e contratar) é só informativa; o saldo é contra a folha atual.
    expect(typeof r.economiaFolha).toBe('number');
    expect(r.saldoMensal).toBeCloseTo(
      -r.folhaExtra! - r.horaExtra! + r.vendaEstimada! - r.vendaQueSai!,
      1,
    );
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
      quadro: [
        ...sozinha,
        { matricula: 'VAGA-1', nome: 'Vaga 1', funcao: 'Farmacêutico', cargaH: 40, vaga: true },
      ],
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
    for (const k of [
      'custoAdicional',
      'economiaFolha',
      'saldoMensal',
      'saldoAnual',
      'folhaExtra',
      'horaExtra',
      'vendaQueSai',
    ])
      expect(r).not.toHaveProperty(k);
    expect(r.vendaPorHora.venda).toBeNull();
    expect(r.horasAbertas).toBe(88);
    expect(r.funcoes[0]).not.toHaveProperty('custoMensal');
  });
  it('nível de hoje: uma vaga que cobre o buraco deixa a função coberta ', async () => {
    // Duas atendentes de 44h mantêm 88h hoje; na regra de 40h cada uma faz 40h: faltam 8h, e uma vaga de 8h fecha.
    const atend = (m: string): PessoaSim => ({
      matricula: m,
      nome: m,
      funcao: 'Atendimento',
      cargaH: 44,
    });
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

  describe('venda estimada das horas novas', () => {
    // Segunda: o Cadastro abre 07–22; a simulação abre às 05h (2 horas novas) e fecha às 23h (1 hora nova).
    const maisCedoETarde: DiaAberto[] = [{ dia: 0, abre: 5, fecha: 23 }, ...cadastro.slice(1)];

    it('hora nova sem venda registrada vale 50% da hora de borda; o saldo soma a venda estimada', () => {
      // Borda de abertura = 7h (sem venda na base) e de fechamento = 21h (venda 1000): só a hora de 22h rende 500.
      const r = base({ dias: maisCedoETarde });
      expect(r.vendaEstimada).toBeCloseTo((500 * 52) / 12, 1);
      expect(r.vendaQueSai).toBe(0);
      expect(r.saldoMensal).toBeCloseTo(-r.folhaExtra! - r.horaExtra! + r.vendaEstimada!, 1);
      expect(r.vendaPorHora.novas[0]![5]).toBe(true);
      expect(r.vendaPorHora.novas[0]![22]).toBe(true);
      expect(r.vendaPorHora.novas[0]![10]).toBe(false);
      expect(r.vendaPorHora.estimada![0]![22]).toBe(500);
    });

    it('reduzir não cria venda estimada; sem base comercial a venda estimada e o saldo são nulos', () => {
      expect(base({ dias: segundaAte20 }).vendaEstimada).toBe(0);
      const sem = base({ dias: maisCedoETarde, vendas: [] });
      expect(sem.vendaEstimada).toBeNull();
      expect(sem.saldoMensal).toBeNull();
    });

    it('quem não é dono vê quais horas são novas, mas não a venda estimada', () => {
      const r = base({ dias: maisCedoETarde, dono: false });
      expect(r.vendaPorHora.novas[0]![5]).toBe(true);
      expect(r.vendaPorHora.estimada).toBeNull();
      expect(r).not.toHaveProperty('vendaEstimada');
    });
  });
});

describe('calcularResultado: peso da folha (spec 052)', () => {
  const vaga: PessoaSim = { matricula: 'VAGA-1', nome: 'Vaga 1', funcao: 'Farmacêutico', cargaH: 40, vaga: true };

  it('dono: peso da folha, folha por mês antes e depois e o mesmo cálculo dos Cenários', () => {
    const r = base({ quadro: [...quadro, vaga], faturamentoMensalRef: 100000 });
    const c = r.custoDoDono!;
    expect(c.estado).toBe('ok');
    expect(c.peso!.aumentoMensal).toBe(Math.round(r.custoAdicional!));
    expect(c.folhaDepois! - c.folhaHoje!).toBeCloseTo(r.custoAdicional!, 0);
    expect(c.peso!.depois - c.peso!.hoje).toBeCloseTo(c.peso!.aumentoPp, 1);
    expect(r.emHoras.pessoas).toEqual({ hoje: 2, simulacao: 3 });
    expect(r.emHoras.custoSentido).toBe('aumenta');
  });

  // Uma loja pequena (segunda, 8h): as duas farmacêuticas cobrem tudo, sem hora extra.
  const pequena: DiaAberto[] = [{ dia: 0, abre: 8, fecha: 16 }];

  it('sem contratação: folha igual', () => {
    const r = base({ dias: pequena, diasCadastro: pequena, faturamentoMensalRef: 100000 });
    expect(r.emHoras.custoSentido).toBe('igual');
    expect(r.custoDoDono!.peso!.aumentoMensal).toBe(0);
  });

  it('desligar uma pessoa: a folha cai e "hoje" ainda conta quem sai', () => {
    const r = base({
      dias: pequena,
      diasCadastro: pequena,
      quadro: [quadro[0]!, { ...quadro[1]!, desligado: true }],
      faturamentoMensalRef: 100000,
    });
    expect(r.emHoras.pessoas).toEqual({ hoje: 2, simulacao: 1 });
    expect(r.emHoras.horasContratadas).toEqual({ hoje: 80, simulacao: 40 });
    expect(r.emHoras.custoSentido).toBe('diminui');
    expect(r.custoDoDono!.peso!.aumentoMensal).toBeLessThan(0);
    expect(r.custoDoDono!.folhaDepois!).toBeLessThan(r.custoDoDono!.folhaHoje!);
  });

  it('sem salários e sem faturamento: o estado diz o que falta, sem número inventado', () => {
    const semSal = base({ custos: null, faturamentoMensalRef: 100000 });
    expect(semSal.custoDoDono).toMatchObject({ estado: 'sem_salarios', peso: null, folhaHoje: null });
    const semFat = base({ faturamentoMensalRef: null });
    expect(semFat.custoDoDono).toMatchObject({ estado: 'sem_faturamento', peso: null });
    expect(semFat.emHoras.custoEstado).toBe('sem_faturamento');
  });

  it('gestor e consulta: só o sentido, sem custoDoDono nem % do custo', () => {
    const r = base({ quadro: [...quadro, vaga], faturamentoMensalRef: 100000, dono: false });
    expect(r.custoDoDono).toBeUndefined();
    expect(r.emHoras.custoSentido).toBe('aumenta');
    expect('custoPct' in r.emHoras).toBe(false);
    expect(JSON.stringify(r)).not.toMatch(/custoDoDono|folhaHoje|pesoHoje/);
  });
});
