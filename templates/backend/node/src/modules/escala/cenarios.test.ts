import { describe, expect, it } from 'vitest';
import { montarCenarios, type EntradaCenarios } from './cenarios.js';

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

  it('quem não é dono não recebe valores de custo', () => {
    const r = montarCenarios(base({ dono: false }));
    expect('custoAdicionalMensal' in r.manter).toBe(false);
    expect('acrescimoPct' in r.manter).toBe(false);
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

describe('Cenário 2 — foco em economia', () => {
  const so = (extra: Partial<EntradaCenarios> = {}) =>
    base({
      minimos: { Farmacêutico: 1 },
      pessoas: [{ funcao: 'Farmacêutico', cargaH: 40 }],
      ...extra,
    });
  const sab = (c: EntradaCenarios) => montarCenarios(c).economia;

  it('sem base comercial corta o fim do dia, do dia mais tarde para o mais cedo, e não estima venda', () => {
    // 84h abertas e 12 turnos para 1 farmacêutico de 40h (5 turnos): só passa com Seg e Ter inteiras e Qua até 16h
    const e = sab(so());
    expect(e.viavel).toBe(true);
    expect(e.horasReduzir).toBe(48);
    expect(e.horasSemana).toBe(36);
    expect(e.horarioSemana.map((d) => d.aberto)).toEqual([
      true,
      true,
      true,
      false,
      false,
      false,
      false,
    ]);
    expect(e.horarioSemana[2]).toMatchObject({ abre: '08:00', fecha: '16:00' });
    expect(e.cortes).toEqual([
      { dia: 2, de: '16:00', ate: '22:00', venda: null, margem: null },
      { dia: 3, de: '08:00', ate: '22:00', venda: null, margem: null },
      { dia: 4, de: '08:00', ate: '22:00', venda: null, margem: null },
      { dia: 5, de: '08:00', ate: '22:00', venda: null, margem: null },
    ]);
    expect(e.vendaCortadaMes).toBeNull();
    expect(e.direcionamento).toContain('Sem base comercial');
  });

  // Segunda a sexta, 8h às 17h: 1 farmacêutico de 40h precisa de 1 hora a menos em cada dia.
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

  it('corta as horas que menos vendem e confere o valor cortado com as médias', () => {
    const e = sab(so({ dias: semana, vendas }));
    expect(e.horasReduzir).toBe(5);
    // terça perde a primeira hora (50); nos outros dias, a última (100)
    expect(e.cortes).toEqual([
      { dia: 0, de: '16:00', ate: '17:00', venda: 100, margem: 30 },
      { dia: 1, de: '08:00', ate: '09:00', venda: 50, margem: 15 },
      { dia: 2, de: '16:00', ate: '17:00', venda: 100, margem: 30 },
      { dia: 3, de: '16:00', ate: '17:00', venda: 100, margem: 30 },
      { dia: 4, de: '16:00', ate: '17:00', venda: 100, margem: 30 },
    ]);
    expect(e.vendaCortadaSemana).toBe(450);
    expect(e.vendaCortadaMes).toBe(1950); // 450 × 52 ÷ 12
    expect(e.margemCortadaMes).toBe(585);
    expect(e.aviso).toContain('5 dias');
  });

  it('loja 24 horas: corta o fim do domingo até caber', () => {
    const dias24 = Array.from({ length: 7 }, (_, dia) => ({ dia, abre: 0, fecha: 24 }));
    const e = sab(
      so({
        dias: dias24,
        pessoas: Array.from({ length: 4 }, () => ({ funcao: 'Farmacêutico', cargaH: 40 })),
      }),
    );
    expect(e.horasReduzir).toBe(8);
    expect(e.cortes).toEqual([{ dia: 6, de: '16:00', ate: '24:00', venda: null, margem: null }]);
  });

  it('quadro que já cobre tudo não reduz nada', () => {
    const e = sab(
      so({ pessoas: Array.from({ length: 4 }, () => ({ funcao: 'Farmacêutico', cargaH: 40 })) }),
    );
    expect(e).toMatchObject({ viavel: true, horasReduzir: 0, cortes: [] });
    expect(e.direcionamento).toContain('não é preciso reduzir');
  });

  it('função obrigatória sem ninguém no quadro: não há solução cortando horário', () => {
    const e = sab(so({ pessoas: [{ funcao: 'Atendimento', cargaH: 40 }] }));
    expect(e.viavel).toBe(false);
    expect(e.motivoInviavel).toContain('Farmacêutico');
    expect(e.cortes).toEqual([]);
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
    const r = com();
    // Cenário 1: 1 farmacêutico de 40h = 10000; Cenário 2: margem perdida 585; Cenário 3: 0 + 715
    expect(r.manter.impactoMensal).toBe(10000);
    expect(r.economia.impactoMensal).toBe(585);
    expect(r.equilibrio.impactoMensal).toBe(715);
    expect(r.destaque).toBe('economia');
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
