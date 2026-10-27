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
