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
    expect(manter.contratacoes).toEqual([
      { funcao: 'Farmacêutico', pessoas: 1, parcialH: 16, horasContratadas: 16, ociosidadePct: 0 },
      {
        funcao: 'Atendimento',
        pessoas: 2,
        parcialH: null,
        horasContratadas: 80,
        ociosidadePct: 30,
      },
    ]);
    expect(manter.pessoasContratar).toBe(3);
    // contratadas 96h, faltavam 16 + 56 = 72h → 24h sobrando
    expect(manter.ociosidadePct).toBe(25);
    expect(manter.horasSemana).toBe(84);
    expect(manter.horarioSemana[6]).toEqual({ dia: 6, aberto: false, abre: null, fecha: null });
    expect(manter.horarioSemana[0]).toMatchObject({ aberto: true, abre: '08:00', fecha: '22:00' });
  });

  it('custo adicional e % sobre a folha atual, só para o dono', () => {
    const r = montarCenarios(base());
    // 16h de farmacêutico: 10000 × 16 × 5 ÷ 200 = 4000; 2 atendentes: 3000 × 40 × 5 ÷ 200 = 3000 cada
    expect(r.manter.custoAdicionalMensal).toBe(10000);
    // folha atual: 2 × 10000 + 3000 = 23000
    expect(r.atual.folhaMensal).toBe(23000);
    expect(r.manter.acrescimoPct).toBe(43.5);
  });

  it('42h sem convenção usa o divisor de 210 horas', () => {
    const r = montarCenarios(base({ regraId: 'r42' }));
    expect(r.manter.custoAdicionalMensal).toBe(9523.81);
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
