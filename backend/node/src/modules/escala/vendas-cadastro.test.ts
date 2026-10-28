import { describe, expect, it } from 'vitest';
import { vendasDoCadastro } from './vendas-cadastro.js';
import { resumirVendas, vendasPorDiaEHora } from './vendas.js';

const semana = (abre: number, fecha: number, ate = 7) =>
  Array.from({ length: ate }, (_, dia) => ({ dia, abre, fecha }));

describe('vendasDoCadastro', () => {
  it('divide cada dia igualmente entre as horas abertas e aplica a margem', () => {
    const r = vendasDoCadastro(
      { dias: [1000, 1000, 1000, 1000, 1000, 1000, 1000], mensal: null, margemPct: 20 },
      semana(8, 18),
    )!;
    const vb = vendasPorDiaEHora(r.linhas)!;
    expect(vb.venda[0]![8]).toBe(100);
    expect(vb.venda[0]![17]).toBe(100);
    expect(vb.venda[0]![18]).toBe(0);
    expect(vb.margem[3]![12]).toBe(20);
    expect(r.comMargem).toBe(true);
    expect(r.linhas).toHaveLength(70);
  });

  it('meia hora de abertura vale meia hora de venda', () => {
    const r = vendasDoCadastro(
      { dias: [300, null, null, null, null, null, null], mensal: null, margemPct: null },
      [{ dia: 0, abre: 8.5, fecha: 10 }],
    )!;
    // 1,5 hora aberta: 8h30–9h (0,5), 9h–10h (1): 100 e 200.
    const vb = vendasPorDiaEHora(r.linhas)!;
    expect(vb.venda[0]![8]).toBe(100);
    expect(vb.venda[0]![9]).toBe(200);
    expect(r.comMargem).toBe(false);
  });

  it('só o mensal: mensal × 12 ÷ 52 dividido entre os dias abertos', () => {
    const r = vendasDoCadastro(
      { dias: new Array(7).fill(null), mensal: 52000, margemPct: null },
      semana(8, 10, 5),
    )!;
    // 52000 × 12 / 52 = 12000 por semana ÷ 5 dias = 2400 por dia ÷ 2 horas = 1200
    expect(vendasPorDiaEHora(r.linhas)!.venda[2]![9]).toBe(1200);
  });

  it('dia aberto sem valor usa a média dos informados e avisa', () => {
    const r = vendasDoCadastro(
      { dias: [100, 300, null, null, null, null, null], mensal: null, margemPct: null },
      semana(8, 9, 3),
    )!;
    expect(r.diasPelaMedia).toEqual([2]);
    expect(vendasPorDiaEHora(r.linhas)!.venda[2]![8]).toBe(200);
  });

  it('dia fechado não gera venda, mesmo com valor informado', () => {
    const r = vendasDoCadastro(
      { dias: [500, 500, 500, 500, 500, 500, 500], mensal: null, margemPct: null },
      semana(8, 9, 2),
    )!;
    expect(r.linhas.every((l) => l.data <= '2001-01-02')).toBe(true);
  });

  it('loja 24 horas distribui entre as 24 horas', () => {
    const r = vendasDoCadastro(
      { dias: [2400, null, null, null, null, null, null], mensal: null, margemPct: null },
      [{ dia: 0, abre: 0, fecha: 24 }],
    )!;
    expect(r.linhas).toHaveLength(24);
    expect(vendasPorDiaEHora(r.linhas)!.venda[0]![23]).toBe(100);
  });

  it('sem faturamento útil ou sem horário devolve nada', () => {
    expect(vendasDoCadastro(null, semana(8, 9))).toBeNull();
    expect(
      vendasDoCadastro(
        { dias: new Array(7).fill(null), mensal: null, margemPct: 30 },
        semana(8, 9),
      ),
    ).toBeNull();
    expect(
      vendasDoCadastro({ dias: [1, 1, 1, 1, 1, 1, 1], mensal: null, margemPct: null }, []),
    ).toBeNull();
  });

  it('o resumo por hora usa os mesmos números (formato da base)', () => {
    const r = vendasDoCadastro(
      { dias: [1000, 1000, 1000, 1000, 1000, 1000, 1000], mensal: null, margemPct: null },
      semana(8, 10),
    )!;
    expect(resumirVendas(r.linhas)!.horas).toHaveLength(2);
  });
});
