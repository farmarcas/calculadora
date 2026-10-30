import { describe, expect, it } from 'vitest';
import type { DiaAberto } from './capacidade.js';
import { FARMACEUTICO, gapPorCargo } from './gap-horas.js';
import { regraPara } from './perfis.js';

// Loja aberta todos os dias, 8h às 22h: 14 h por dia e 98 h por semana.
const dias = (abre = 8, fecha = 22, lista = [0, 1, 2, 3, 4, 5, 6]): DiaAberto[] =>
  lista.map((dia) => ({ dia, abre, fecha }));
const regraAtual = regraPara('atual', false);
const gap = (
  r: 'atual' | 'r42' | 'r40',
  pessoas: { funcao: string; cargaH: number }[],
  extra: Partial<Parameters<typeof gapPorCargo>[0]> = {},
) =>
  gapPorCargo({
    regra: regraPara(r, false),
    regraAtual,
    dias: dias(),
    pessoas,
    ...extra,
  });
const de = (g: ReturnType<typeof gap>, funcao: string) => g.find((x) => x.funcao === funcao)!;

describe('gap de farmacêutico', () => {
  it('precisa estar presente em todas as horas abertas: 1 de 44 h numa loja de 98 h', () => {
    // Regra de 42 h sem convenção: 5 dias × 8 h = 40 h por pessoa. Necessidade 98 h, capacidade 40 h → gap 58 h.
    const f = de(gap('r42', [{ funcao: FARMACEUTICO, cargaH: 44 }]), FARMACEUTICO);
    expect(f).toMatchObject({
      obrigatorio: true,
      necessidadeH: 98,
      capacidadeH: 40,
      gapH: 58,
      origemMeta: 'lei',
    });
  });

  it('a regra de 40 h usa o mesmo cálculo, e a atual (44 h) tem outro teto', () => {
    expect(de(gap('r40', [{ funcao: FARMACEUTICO, cargaH: 44 }]), FARMACEUTICO)).toMatchObject({
      capacidadeH: 40,
      gapH: 58,
    });
    // Regra atual: 6 dias × 8 h = 48, teto 44 → 44 h; gap 98 − 44 = 54.
    expect(de(gap('atual', [{ funcao: FARMACEUTICO, cargaH: 44 }]), FARMACEUTICO)).toMatchObject({
      capacidadeH: 44,
      gapH: 54,
    });
  });

  it('loja 24 horas: 168 h por semana', () => {
    const d24 = dias(0, 24);
    const f = de(
      gap(
        'r42',
        [
          { funcao: FARMACEUTICO, cargaH: 40 },
          { funcao: FARMACEUTICO, cargaH: 40 },
        ],
        { dias: d24 },
      ),
      FARMACEUTICO,
    );
    expect(f).toMatchObject({ necessidadeH: 168, capacidadeH: 80, gapH: 88 });
  });

  it('sem nenhum farmacêutico o gap é a necessidade inteira', () => {
    const f = de(gap('r42', [{ funcao: 'Atendimento', cargaH: 40 }]), FARMACEUTICO);
    expect(f).toMatchObject({ pessoas: 0, capacidadeH: 0, gapH: 98 });
  });

  it('quadro que cobre: gap zero e saldo positivo', () => {
    // 3 farmacêuticos de 40 h = 120 h ≥ 98 h
    const f = de(
      gap(
        'r42',
        [1, 2, 3].map(() => ({ funcao: FARMACEUTICO, cargaH: 40 })),
      ),
      FARMACEUTICO,
    );
    expect(f).toMatchObject({ capacidadeH: 120, saldoH: 22, gapH: 0 });
  });

  it('o dono pode pedir mais de 1 farmacêutico por hora, nunca menos de 1', () => {
    const dois = de(gap('r42', [], { metasDono: { [FARMACEUTICO]: 2 } }), FARMACEUTICO);
    expect(dois.necessidadeH).toBe(196);
    const zero = de(gap('r42', [], { metasDono: { [FARMACEUTICO]: 0 } }), FARMACEUTICO);
    expect(zero.necessidadeH).toBe(98);
  });
});

describe('demais cargos: sem mínimo, meta é o nível de hoje', () => {
  const quadro = [
    ...[1, 2, 3, 4].map(() => ({ funcao: 'Atendimento', cargaH: 44 })),
    ...[1, 2, 3].map(() => ({ funcao: 'Apoio', cargaH: 44 })),
  ];

  it('loja sem nenhum atendente: não há gap nem meta de atendimento', () => {
    const g = gap('r42', [{ funcao: FARMACEUTICO, cargaH: 40 }]);
    expect(g.find((x) => x.funcao === 'Atendimento')).toBeUndefined();
    const comAtendente = gap('r42', [{ funcao: 'Apoio', cargaH: 40 }]);
    expect(de(comAtendente, 'Apoio').gapH).toBe(0);
  });

  it('4 atendentes de 44 h: meta de 176 h; na regra de 40 h cabem 160 h e o gap é de 16 h', () => {
    const a = de(gap('r40', quadro), 'Atendimento');
    expect(a).toMatchObject({
      obrigatorio: false,
      necessidadeH: 176,
      capacidadeH: 160,
      gapH: 16,
      origemMeta: 'nivel_de_hoje',
    });
    // Apoio: 3 × 44 = 132 h de meta; 3 × 40 = 120 h → gap de 12 h
    expect(de(gap('r40', quadro), 'Apoio')).toMatchObject({
      necessidadeH: 132,
      capacidadeH: 120,
      gapH: 12,
    });
  });

  it('na regra atual (44 h) o quadro mantém o nível de hoje: gap zero', () => {
    const g = gap('atual', quadro);
    expect(de(g, 'Atendimento').gapH).toBe(0);
    expect(de(g, 'Apoio').gapH).toBe(0);
  });

  it('a meta do dono (pessoas por hora) substitui o nível de hoje: 2 atendentes × 98 h = 196 h', () => {
    const a = de(gap('r42', quadro, { metasDono: { Atendimento: 2 } }), 'Atendimento');
    expect(a).toMatchObject({ necessidadeH: 196, capacidadeH: 160, gapH: 36, origemMeta: 'dono' });
  });

  it('a meta do dono pode existir para cargo sem ninguém: tudo é gap', () => {
    const c = de(gap('r42', [], { metasDono: { Caixa: 1 } }), 'Caixa');
    expect(c).toMatchObject({ pessoas: 0, necessidadeH: 98, gapH: 98, origemMeta: 'dono' });
  });

  it('meta zero do dono não vale como meta: segue o nível de hoje', () => {
    const a = de(gap('r40', quadro, { metasDono: { Atendimento: 0 } }), 'Atendimento');
    expect(a.origemMeta).toBe('nivel_de_hoje');
    expect(a.necessidadeH).toBe(176);
  });

  it('com horário menor (cenário), a meta acompanha as horas abertas', () => {
    // Domingo reduzido: 90 h abertas em vez de 98. Meta de atendimento: 176 × 90 ÷ 98 = 161,63 h.
    const reduzido = dias().map((d) => (d.dia === 6 ? { ...d, fecha: 14 } : d)); // domingo 6 h → 90 h
    const a = de(gap('r40', quadro, { dias: reduzido, horasAbertasHoje: 98 }), 'Atendimento');
    expect(a.necessidadeH).toBe(161.63);
    expect(a.gapH).toBe(1.63);
    // e a necessidade do farmacêutico acompanha as horas abertas
    expect(
      de(gap('r40', quadro, { dias: reduzido, horasAbertasHoje: 98 }), FARMACEUTICO).necessidadeH,
    ).toBe(90);
  });

  it('pessoa com carga acima da jornada atual conta só até a jornada atual na meta', () => {
    const a = de(gap('r40', [{ funcao: 'Atendimento', cargaH: 60 }]), 'Atendimento');
    // meta = min(60, 44) = 44; capacidade = min(60, 40) = 40
    expect(a).toMatchObject({ necessidadeH: 44, capacidadeH: 40, gapH: 4 });
  });
});
