import { describe, expect, it } from 'vitest';
import type { DiaAberto } from '../regras/capacidade.js';
import {
  DIAS_PROTEGIDOS_PADRAO,
  diasProtegidos,
  listaDeDias,
  semValores,
  totaisPorDia,
  vendasPorDia,
} from './cenarios-dias.js';
import { vendasDoCadastro } from './vendas-cadastro.js';

const aberta = (abre: number, fecha: number, dias: number[]): DiaAberto[] =>
  dias.map((dia) => ({ dia, abre, fecha }));
const linha = (data: string, hora: number, venda: number, margem = 0) => ({
  data,
  hora,
  venda,
  margem,
  clientes: 0,
  unidades: 0,
});

describe('venda e margem por dia da semana', () => {
  // Segunda a sábado, 08h às 20h; faturamento por dia e margem de 25%.
  const dias = aberta(8, 20, [0, 1, 2, 3, 4, 5]);
  const cadastro = vendasDoCadastro(
    { dias: [1000, 1200, 900, 1100, 1500, 2000, null], mensal: null, margemPct: 25 },
    dias,
  )!;

  it('com o faturamento por dia, o dia vale exatamente o informado (sem desvio de arredondamento)', () => {
    const v = vendasPorDia(cadastro.linhas, dias);
    expect(v.map((x) => x.venda)).toEqual([1000, 1200, 900, 1100, 1500, 2000, 0]);
    expect(v.map((x) => x.margem)).toEqual([250, 300, 225, 275, 375, 500, 0]);
  });

  it('o mês vale o dia × 52 ÷ 12 (conta à mão: 250 → 1083,33; 500 → 2166,67)', () => {
    const v = vendasPorDia(cadastro.linhas, dias);
    expect(v[0]!.vendaMes).toBe(4333.33);
    expect(v[0]!.margemMes).toBe(1083.33);
    expect(v[1]!.margemMes).toBe(1300);
    expect(v[5]!.margemMes).toBe(2166.67);
  });

  it('protege os três dias de maior faturamento entre os abertos (sábado, sexta, terça)', () => {
    const v = vendasPorDia(cadastro.linhas, dias);
    expect(v.filter((x) => x.protegido).map((x) => x.dia)).toEqual([1, 4, 5]);
    expect(v[6]).toMatchObject({ aberto: false, protegido: false, venda: 0, margemMes: 0 });
  });

  it('empate de faturamento: protege o dia mais tardio da semana', () => {
    expect(
      diasProtegidos(
        [
          { dia: 0, venda: 100 },
          { dia: 1, venda: 100 },
          { dia: 2, venda: 50 },
        ],
        [0, 1, 2],
        1,
      ),
    ).toEqual([1]);
  });

  it('loja com poucos dias abertos nunca protege todos: com 3 abertos, protege 2; com 1, nenhum', () => {
    const tres = aberta(8, 20, [0, 1, 2]);
    const c3 = vendasDoCadastro(
      { dias: [300, 200, 100, null, null, null, null], mensal: null, margemPct: null },
      tres,
    )!;
    expect(
      vendasPorDia(c3.linhas, tres)
        .filter((x) => x.protegido)
        .map((x) => x.dia),
    ).toEqual([0, 1]);
    const um = aberta(8, 20, [3]);
    const c1 = vendasDoCadastro(
      { dias: [null, null, null, 500, null, null, null], mensal: null, margemPct: null },
      um,
    )!;
    expect(vendasPorDia(c1.linhas, um).some((x) => x.protegido)).toBe(false);
  });

  it('a quantidade de dias protegidos é ajustável (0 a 6)', () => {
    expect(vendasPorDia(cadastro.linhas, dias, 0).some((x) => x.protegido)).toBe(false);
    expect(
      vendasPorDia(cadastro.linhas, dias, 1)
        .filter((x) => x.protegido)
        .map((x) => x.dia),
    ).toEqual([5]);
    expect(DIAS_PROTEGIDOS_PADRAO).toBe(3);
  });

  it('base comercial: média do dia = soma das horas ÷ número de datas daquele dia da semana', () => {
    // duas segundas (07/09 e 14/09/2026): 100 + 100 em uma e 300 na outra → (200 + 300) ÷ 2 = 250
    const base = [
      linha('2026-09-07', 9, 100, 20),
      linha('2026-09-07', 10, 100, 20),
      linha('2026-09-14', 9, 300, 60),
    ];
    expect(totaisPorDia(base)[0]).toEqual({ venda: 250, margem: 50 });
    const v = vendasPorDia(base, aberta(8, 20, [0]));
    expect(v[0]).toMatchObject({ venda: 250, margem: 50, vendaMes: 1083.33, margemMes: 216.67 });
  });

  it('dia fechado com venda na base aparece com o valor, mas nunca como protegido', () => {
    const base = [linha('2026-09-06', 10, 400, 100)]; // domingo
    const v = vendasPorDia(base, aberta(8, 20, [0, 1]));
    expect(v[6]).toMatchObject({ aberto: false, protegido: false, venda: 400 });
  });

  it('sem nenhuma venda, tudo zero e sem dias protegidos', () => {
    const v = vendasPorDia([], aberta(8, 20, [0, 1]));
    expect(v.every((x) => x.venda === 0 && x.margemMes === 0)).toBe(true);
  });

  it('semValores deixa só o dia, se está aberto e se é protegido', () => {
    const v = vendasPorDia(cadastro.linhas, dias)[5]!;
    expect(semValores(v)).toEqual({ dia: 5, aberto: true, protegido: true });
  });
});

describe('listaDeDias', () => {
  it('escreve a lista em português', () => {
    expect(listaDeDias([])).toBe('');
    expect(listaDeDias([6])).toBe('domingo');
    expect(listaDeDias([0, 6])).toBe('segunda e domingo');
    expect(listaDeDias([0, 2, 5])).toBe('segunda, quarta e sábado');
  });
});
