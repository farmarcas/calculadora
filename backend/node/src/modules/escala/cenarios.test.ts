import { describe, expect, it } from 'vitest';
import { montarCenarios, type EntradaCenarios } from './cenarios.js';
import { vendasDoCadastro } from './vendas-cadastro.js';

// Loja de segunda a sábado, 8h às 22h (84h na semana).
const dias = [0, 1, 2, 3, 4, 5].map((dia) => ({ dia, abre: 8, fecha: 22 }));
const base = (extra: Partial<EntradaCenarios> = {}): EntradaCenarios => ({
  regraId: 'r40',
  convencao8h24: false,
  dias,
  minimos: { Farmacêutico: 1, Atendimento: 1 },
  pessoas: [
    { funcao: 'Farmacêutico', cargaH: 44 },
    { funcao: 'Farmacêutico', cargaH: 44 },
    { funcao: 'Atendimento', cargaH: 40 },
  ],
  vendas: [],
  custos: { salarioMedio: { Farmacêutico: 10000, Atendimento: 3000 }, encargosPct: 0 },
  dono: true,
  ...extra,
});

describe('Cenário 1 — manter horários', () => {
  it('lista a contratação por cargo, com parcial e ociosidade', () => {
    const { manter } = montarCenarios(base());
    // Regra do documento (r40: 5 dias, turno de 8h). Farmacêutico: faltam 2 turnos → 0 inteiras, resto 2
    // (até 3) → 1 parcial de 2 turnos (16h). Atendimento: faltam 7 turnos → 7 ÷ 5 = 1 inteira, resto 2 → 1 parcial de 16h.
    expect(manter.contratacoes).toEqual([
      {
        funcao: 'Farmacêutico',
        pessoas: 1,
        inteiras: 0,
        parcial: { turnos: 2, horas: 16 },
        parcialH: 16,
        horasContratadas: 16,
        ociosidadePct: 0,
        ajustado: false,
      },
      {
        funcao: 'Atendimento',
        pessoas: 2,
        inteiras: 1,
        parcial: { turnos: 2, horas: 16 },
        parcialH: 16,
        horasContratadas: 56,
        ociosidadePct: 0,
        ajustado: false,
      },
    ]);
    expect(manter.pessoasContratar).toBe(3);
    // contratadas 16 + 56 = 72h, faltavam 16 + 56 = 72h → nada sobrando
    expect(manter.ociosidadePct).toBe(0);
    expect(manter.direcionamento).toContain('1 Atendimento e 1 parcial de 2 turno(s) (16h)');
    expect(manter.horasSemana).toBe(84);
    expect(manter.horarioSemana[6]).toEqual({ dia: 6, aberto: false, abre: null, fecha: null });
    expect(manter.horarioSemana[0]).toMatchObject({ aberto: true, abre: '08:00', fecha: '22:00' });
  });

  it('custo adicional e % sobre a folha atual, só para o dono', () => {
    const r = montarCenarios(base());
    // farmacêutico parcial de 16h: 10000 × 16 × 5 ÷ 200 = 4000; atendente inteira de 40h: 3000 × 40 × 5 ÷ 200 = 3000;
    // atendente parcial de 16h: 3000 × 16 × 5 ÷ 200 = 1200 → 8200
    expect(r.manter.custoAdicionalMensal).toBe(8200);
    // folha atual: 2 × 10000 + 3000 = 23000
    expect(r.atual.folhaMensal).toBe(23000);
    expect(r.manter.acrescimoPct).toBe(35.7); // 8200 ÷ 23000
  });

  it('42h sem convenção usa o divisor de 210 horas', () => {
    const r = montarCenarios(base({ regraId: 'r42' }));
    // mesmas contratações (16h + 40h + 16h) com o divisor 210: 3809,52 + 4000,00
    expect(r.manter.custoAdicionalMensal).toBe(7809.52);
  });

  it('custo por ano (mensal × 12) e peso no faturamento mensal, só para o dono', () => {
    const r = montarCenarios(base({ faturamentoMensalRef: 100000 }));
    // custo adicional 8200 por mês: × 12 = 98400 por ano; 8200 ÷ 100000 = 8,2% do faturamento
    expect(r.manter.custoAnual).toBe(98400);
    expect(r.manter.impactoPctFaturamento).toBe(8.2);
    expect(r.manter.faturamentoMensalRef).toBe(100000);
  });

  it('sem faturamento de referência o percentual some; sem custos o anual também', () => {
    const sem = montarCenarios(base());
    expect(sem.manter.custoAnual).toBe(98400);
    expect(sem.manter.impactoPctFaturamento).toBeNull();
    expect(sem.manter.faturamentoMensalRef).toBeNull();
    const semCustos = montarCenarios(base({ custos: null, faturamentoMensalRef: 100000 }));
    expect(semCustos.manter.custoAnual).toBeNull();
    expect(semCustos.manter.impactoPctFaturamento).toBeNull();
  });

  it('quem não é dono não recebe valores de custo', () => {
    const r = montarCenarios(base({ dono: false }));
    expect('custoAdicionalMensal' in r.manter).toBe(false);
    expect('acrescimoPct' in r.manter).toBe(false);
    expect('custoAnual' in r.manter).toBe(false);
    expect('impactoPctFaturamento' in r.manter).toBe(false);
    expect('faturamentoMensalRef' in r.manter).toBe(false);
    expect('folhaMensal' in r.atual).toBe(false);
  });

  it('sem custos cadastrados o custo fica nulo', () => {
    const r = montarCenarios(base({ custos: null }));
    expect(r.manter.custoAdicionalMensal).toBeNull();
    expect(r.manter.acrescimoPct).toBeNull();
  });

  it('quadro que já cobre tudo não contrata nada', () => {
    const r = montarCenarios(
      base({
        minimos: { Farmacêutico: 1 },
        pessoas: Array.from({ length: 4 }, () => ({ funcao: 'Farmacêutico', cargaH: 40 })),
      }),
    );
    expect(r.manter.contratacoes).toEqual([]);
    expect(r.manter.ociosidadePct).toBe(0);
    expect(r.manter.custoAdicionalMensal).toBe(0);
    expect(r.manter.acrescimoPct).toBe(0);
    expect(r.manter.direcionamento).toContain('nada a contratar');
  });

  it('informa quantos dias de venda a base tem', () => {
    const v = { data: '2026-03-02', hora: 9, venda: 100, margem: 30, clientes: 1, unidades: 1 };
    expect(montarCenarios(base({ vendas: [v] })).vendasBase).toEqual({ dias: 1 });
    expect(montarCenarios(base()).vendasBase).toBeNull();
  });
});

describe('Cenário 2 — fechar dias para manter a equipe', () => {
  const dias = (abre: number, fecha: number, lista: number[]) =>
    lista.map((dia) => ({ dia, abre, fecha }));
  // Segunda a sábado, 8h às 22h: 84h e 12 turnos por semana.
  const seisDias = dias(8, 22, [0, 1, 2, 3, 4, 5]);
  // Faturamento por dia (segunda a sábado) e margem de 25%: margem do dia 250, 300, 225, 275, 375 e 500.
  const fat = [1000, 1200, 900, 1100, 1500, 2000, null];
  const vendasDe = (d: typeof seisDias, f: (number | null)[] = fat) =>
    vendasDoCadastro({ dias: f, mensal: null, margemPct: 25 }, d)!.linhas;
  const farm = (...horas: number[]) => horas.map((cargaH) => ({ funcao: 'Farmacêutico', cargaH }));
  const eco = (extra: Partial<EntradaCenarios> = {}) =>
    montarCenarios(
      base({
        minimos: { Farmacêutico: 1 },
        dias: seisDias,
        pessoas: farm(40, 40),
        vendas: vendasDe(seisDias),
        origemVenda: 'cadastro',
        ...extra,
      }),
    ).economia;

  it('fecha o dia de menor margem que resolve: 2 farmacêuticos de 40h (80h, 10 turnos) para 84h e 12 turnos', () => {
    // Fechar um dia de 14h (2 turnos) dá 70h e 10 turnos: cabe. Entre os dias não protegidos
    // (segunda 250, quarta 225, quinta 275 de margem) o menor é a quarta: 225 × 52 ÷ 12 = 975 por mês.
    const e = eco();
    expect(e.viavel).toBe(true);
    expect(e.diasFechar).toEqual([{ dia: 2, vendaMes: 3900, margemMes: 975 }]);
    expect(e.horasReduzir).toBe(14);
    expect(e.horasSemana).toBe(70);
    expect(e.horarioSemana[2]).toEqual({ dia: 2, aberto: false, abre: null, fecha: null });
    expect(e.margemCortadaMes).toBe(975);
    expect(e.vendaCortadaMes).toBe(3900); // 900 × 52 ÷ 12
    expect(e.naoRecomendado).toBeNull();
    expect(e.resumo).toContain('Fechando quarta a equipe atual cobre o horário sem contratar');
    expect(e.resumo).toContain('deixa de contratar 1 pessoa');
  });

  it('só fecha dia protegido como último recurso e marca "não recomendado"', () => {
    // 1 farmacêutico de 40h: cabem no máximo 2 dias de 14h. Fecha segunda, terça?, quarta e quinta pela ordem de margem:
    // quarta 975, segunda 1083,33, quinta 1191,67 e, como ainda não cabe, a terça (protegida, 300 → 1300).
    const e = eco({ pessoas: farm(40) });
    expect(e.diasFechar.map((d) => d.dia)).toEqual([0, 1, 2, 3]);
    expect(e.naoRecomendado).toMatchObject({ dias: [1] });
    expect(e.naoRecomendado!.texto).toContain('terça');
    expect(e.margemCortadaMes).toBe(4550); // 1083,33 + 1300 + 975 + 1191,67
    expect(e.horasSemana).toBe(28);
    // o dia protegido fechado tira o cenário da escolha do selo
    const r = montarCenarios(
      base({
        minimos: { Farmacêutico: 1 },
        dias: seisDias,
        pessoas: farm(40),
        vendas: vendasDe(seisDias),
      }),
    );
    expect(r.economia.impactoMensal).toBeNull();
  });

  it('reabre o dia que acabou não sendo necessário', () => {
    // Domingo curto (09h às 13h) e equipe de 2 × 40h mais 1 × 8h (88h e 11 turnos) para 88h e 13 turnos.
    // Fechar o domingo (o menor) não basta; fechar a quarta resolve; com a quarta fechada o domingo cabe de volta.
    const domingo = [...seisDias, { dia: 6, abre: 9, fecha: 13 }];
    const e = eco({
      dias: domingo,
      pessoas: farm(40, 40, 8),
      vendas: vendasDe(domingo, [1000, 1200, 900, 1100, 1500, 2000, 300]),
    });
    expect(e.diasFechar.map((d) => d.dia)).toEqual([2]);
    expect(e.horarioSemana[6]).toMatchObject({
      dia: 6,
      aberto: true,
      abre: '09:00',
      fecha: '13:00',
    });
    expect(e.horasReduzir).toBe(14);
  });

  it('equipe que não cobre nem com um único dia aberto: sem solução', () => {
    const e = eco({ pessoas: farm(8) });
    expect(e.viavel).toBe(false);
    expect(e.motivoInviavel).toContain('Mesmo fechando dias');
    expect(e.diasFechar).toEqual([]);
  });

  it('função obrigatória sem ninguém no quadro: não há solução fechando dias', () => {
    const e = eco({ pessoas: [{ funcao: 'Atendimento', cargaH: 40 }] });
    expect(e.viavel).toBe(false);
    expect(e.motivoInviavel).toContain('Não há Farmacêutico');
  });

  it('quadro que já cobre tudo não fecha nada, com margem perdida zero', () => {
    const e = eco({ pessoas: farm(40, 40, 40) });
    expect(e.viavel).toBe(true);
    expect(e.diasFechar).toEqual([]);
    expect(e.horasReduzir).toBe(0);
    expect(e.margemCortadaMes).toBe(0);
    expect(e.direcionamento).toContain('já cobre todos os dias');
  });

  it('sem venda por dia (nem base nem faturamento) diz o que falta e não escolhe dia', () => {
    const e = eco({ vendas: [], origemVenda: null });
    expect(e.viavel).toBe(false);
    expect(e.motivoInviavel).toContain('faturamento por dia da semana');
    expect(e.margemCortadaMes).toBeNull();
  });

  it('só o faturamento mensal: avisa que a venda é estimada', () => {
    const mensal = vendasDoCadastro(
      { dias: new Array(7).fill(null), mensal: 52000, margemPct: 25 },
      seisDias,
    )!.linhas;
    const e = eco({ vendas: mensal, origemVenda: 'estimativa' });
    expect(e.viavel).toBe(true);
    expect(e.aviso).toContain('Venda estimada');
    // dias iguais (2000 cada): fecha o mais tardio entre os não protegidos (protegidos: sábado, sexta, quinta)
    expect(e.diasFechar.map((d) => d.dia)).toEqual([2]);
  });

  it('a recaptura reduz a venda e a margem perdidas (20% de 975 e de 3900)', () => {
    const e = eco({ recaptura: 0.2 });
    expect(e.margemCortadaMes).toBe(780);
    expect(e.vendaCortadaMes).toBe(3120);
    expect(e.diasFechar[0]).toMatchObject({ margemMes: 780, vendaMes: 3120 });
    expect(e.direcionamento).toContain('20%');
    // acima de 30% vale 30%
    expect(eco({ recaptura: 0.9 }).margemCortadaMes).toBe(682.5);
  });

  it('quem não é dono vê os dias e a frase, sem valores em reais', () => {
    const e = eco({ dono: false });
    expect(e.diasFechar).toEqual([{ dia: 2 }]);
    expect(e.resumo).not.toContain('R$');
    expect(e.direcionamento).not.toContain('R$');
  });

  it('loja 24 horas: fecha dias inteiros (7 × 24h = 168h para 3 farmacêuticos de 40h)', () => {
    const d24 = dias(0, 24, [0, 1, 2, 3, 4, 5, 6]);
    const e = eco({
      dias: d24,
      pessoas: farm(40, 40, 40),
      vendas: vendasDe(d24, new Array(7).fill(2400)),
    });
    // 120h e 15 turnos de capacidade: cabem 5 dias de 24h (120h e 15 turnos); fecha 2 (a quinta e a quarta: empate e o mais tardio vai primeiro)
    expect(e.diasFechar.map((d) => d.dia)).toEqual([2, 3]);
    expect(e.horasSemana).toBe(120);
    expect(e.horasReduzir).toBe(48);
  });
});

describe('Cenário 3 — equilíbrio', () => {
  // Segunda a sexta, 8h às 17h, 1 farmacêutico de 40h. Margem por hora: 60, exceto 30 às 16h e 15 na terça às 8h.
  const semana = [0, 1, 2, 3, 4].map((dia) => ({ dia, abre: 8, fecha: 17 }));
  const vendas = [0, 1, 2, 3, 4].flatMap((d) =>
    Array.from({ length: 9 }, (_, i) => {
      const hora = 8 + i;
      const venda = hora === 16 ? 100 : d === 1 && hora === 8 ? 50 : 200;
      return {
        data: `2026-03-0${2 + d}`,
        hora,
        venda,
        margem: venda * 0.3,
        clientes: 1,
        unidades: 1,
      };
    }),
  );
  const eq = (extra: Partial<EntradaCenarios> = {}) =>
    montarCenarios(
      base({
        minimos: { Farmacêutico: 1 },
        pessoas: [{ funcao: 'Farmacêutico', cargaH: 40 }],
        dias: semana,
        vendas,
        ...extra,
      }),
    ).equilibrio;

  it('fecha só as horas cuja margem não paga a cobertura e contrata o resto', () => {
    // cobrir 1 hora semanal custa 10000 × 5 ÷ 200 = 250/mês; margem de 30/semana = 130/mês (não paga),
    // de 60/semana = 260/mês (paga)
    const e = eq();
    expect(e.indisponivel).toBeNull();
    expect(e.coincideComManter).toBe(false);
    expect(e.horasReduzir).toBe(6);
    expect(e.horasSemana).toBe(39);
    expect(e.cortes).toEqual([
      { dia: 0, de: '16:00', ate: '17:00', venda: 100, margem: 30 },
      { dia: 1, de: '08:00', ate: '09:00', venda: 50, margem: 15 },
      { dia: 1, de: '16:00', ate: '17:00', venda: 100, margem: 30 },
      { dia: 2, de: '16:00', ate: '17:00', venda: 100, margem: 30 },
      { dia: 3, de: '16:00', ate: '17:00', venda: 100, margem: 30 },
      { dia: 4, de: '16:00', ate: '17:00', venda: 100, margem: 30 },
    ]);
    expect(e.margemCortadaMes).toBe(715); // (5 × 30 + 15) × 52 ÷ 12
    // com 39h e 5 turnos o farmacêutico atual já cobre: nada a contratar
    expect(e.contratacoes).toEqual([]);
    expect(e.custoAdicionalMensal).toBe(0);
    expect(e.acrescimoPct).toBe(0);
  });

  it('o dono vê o custo; quem não é dono recebe os mesmos cortes, sem valores de custo', () => {
    const dono = eq();
    const outro = eq({ dono: false });
    expect(outro.cortes).toEqual(dono.cortes);
    expect('custoAdicionalMensal' in outro).toBe(false);
    expect('acrescimoPct' in outro).toBe(false);
  });

  it('quando fechar não compensa, mantém todos os horários', () => {
    // quatro farmacêuticos já cobrem tudo (nada a contratar): fechar só perderia margem
    const e = eq({
      pessoas: Array.from({ length: 4 }, () => ({ funcao: 'Farmacêutico', cargaH: 40 })),
    });
    expect(e.coincideComManter).toBe(true);
    expect(e.cortes).toEqual([]);
    expect(e.horasReduzir).toBe(0);
    expect(e.direcionamento).toContain('não compensa');
  });

  it('sem base comercial ou sem custos, explica o que falta e não mostra número', () => {
    const semVendas = eq({ vendas: [] });
    expect(semVendas.indisponivel?.motivo).toBe('vendas');
    expect(semVendas.cortes).toEqual([]);
    expect(semVendas.margemCortadaMes).toBeNull();

    const semCustos = eq({ custos: null });
    expect(semCustos.indisponivel?.motivo).toBe('custos');

    const faltaFuncao = eq({
      minimos: { Farmacêutico: 1, Atendimento: 1 },
      custos: { salarioMedio: { Farmacêutico: 10000 }, encargosPct: 0 },
    });
    expect(faltaFuncao.indisponivel?.motivo).toBe('custos');
    expect(faltaFuncao.indisponivel?.texto).toContain('Atendimento');
    expect(faltaFuncao.custoAdicionalMensal).toBeNull();

    expect(eq({ custos: null, dono: false }).indisponivel?.texto).toContain('dono do grupo');
  });
});

describe('Direcionamento — destaque de menor impacto financeiro', () => {
  const semana = [0, 1, 2, 3, 4].map((dia) => ({ dia, abre: 8, fecha: 17 }));
  const vendas = [0, 1, 2, 3, 4].flatMap((d) =>
    Array.from({ length: 9 }, (_, i) => {
      const hora = 8 + i;
      const venda = hora === 16 ? 100 : d === 1 && hora === 8 ? 50 : 200;
      return {
        data: `2026-03-0${2 + d}`,
        hora,
        venda,
        margem: venda * 0.3,
        clientes: 1,
        unidades: 1,
      };
    }),
  );
  const com = (extra: Partial<EntradaCenarios> = {}) =>
    montarCenarios(
      base({
        minimos: { Farmacêutico: 1 },
        pessoas: [{ funcao: 'Farmacêutico', cargaH: 40 }],
        dias: semana,
        vendas,
        ...extra,
      }),
    );

  it('escolhe o menor entre custo adicional e margem perdida', () => {
    // Farmacêutico de 40h e outro de 16h: 56h e 7 turnos para 45h e 10 turnos. Cenário 1: faltam 3 turnos →
    // 1 parcial de 24h: 10000 × 24 × 5 ÷ 200 = 6000. Cenário 2: fechar 2 dias não protegidos (terça: 1550 por dia,
    // margem de 465; segunda: 1700, margem de 510) resolve; × 52 ÷ 12 = 2015 + 2210 = 4225.
    const r = com({
      pessoas: [
        { funcao: 'Farmacêutico', cargaH: 40 },
        { funcao: 'Farmacêutico', cargaH: 16 },
      ],
    });
    expect(r.manter.impactoMensal).toBe(6000);
    expect(r.economia.diasFechar.map((d) => d.dia)).toEqual([0, 1]);
    expect(r.economia.naoRecomendado).toBeNull();
    expect(r.economia.impactoMensal).toBe(4225);
    const impactos = [
      r.manter.impactoMensal,
      r.economia.impactoMensal,
      r.equilibrio.impactoMensal,
    ].filter((x): x is number => typeof x === 'number');
    expect(Math.min(...impactos)).toBeLessThanOrEqual(4225);
    expect(r[r.destaque!].impactoMensal).toBe(Math.min(...impactos));
  });

  it('Cenário 2 "não recomendado" (só fecha dia protegido) não entra na escolha do selo', () => {
    // 1 farmacêutico de 40h: 3 dias protegidos pedem fechar 3 dias, e só dois são livres
    const r = com();
    expect(r.economia.naoRecomendado).not.toBeNull();
    expect(r.economia.impactoMensal).toBeNull();
    expect(r.destaque).not.toBe('economia');
  });

  it('empate no impacto: vence o que contrata menos, depois a ordem 1, 3, 2', () => {
    const r = com({
      pessoas: Array.from({ length: 4 }, () => ({ funcao: 'Farmacêutico', cargaH: 40 })),
    });
    expect(r.manter.impactoMensal).toBe(0);
    expect(r.economia.impactoMensal).toBe(0);
    expect(r.equilibrio.impactoMensal).toBe(0);
    expect(r.destaque).toBe('manter');
  });

  it('Cenário 2 sem solução fica de fora da comparação', () => {
    const r = com({ pessoas: [{ funcao: 'Atendimento', cargaH: 40 }] });
    expect(r.economia.viavel).toBe(false);
    expect(r.economia.impactoMensal).toBeNull();
    expect(['manter', 'equilibrio']).toContain(r.destaque);
  });

  it('sem custos ou sem base comercial não há destaque', () => {
    expect(com({ custos: null }).destaque).toBeNull();
    expect(com({ vendas: [] }).destaque).toBeNull();
  });

  it('quem não é dono não recebe destaque nem impactos', () => {
    const r = com({ dono: false });
    expect('destaque' in r).toBe(false);
    expect('impactoMensal' in r.manter).toBe(false);
    expect('impactoMensal' in r.economia).toBe(false);
    expect('impactoMensal' in r.equilibrio).toBe(false);
  });
});
