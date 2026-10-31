import { describe, expect, it } from 'vitest';
import type { HorariosSemana } from './horarios.js';
import { situacaoDoCadastro, type LojaParaSituacao } from './situacao.js';

const semana = (abertos: number[]): HorariosSemana => ({
  versao: 2,
  dias: Array.from({ length: 7 }, (_, i) =>
    abertos.includes(i) ? { aberta: true, abre: '08:00', fecha: '21:00' } : { aberta: false },
  ),
});
const fat = (dias: (number | null)[], mensal: number | null = null) => ({
  dias,
  mensal,
  margemPct: 30,
});
const ok: LojaParaSituacao = {
  nome: 'Centro',
  cidade: 'Sumaré',
  uf: 'SP',
  regimeTributario: 'real',
  horarios: semana([0, 1, 2, 3, 4, 5]),
  faturamento: fat([20, 15, 17, 18, 20, 11, null].map((x) => (x === null ? null : x * 1000))),
};

describe('situacaoDoCadastro', () => {
  it('Completo quando tem tudo: dados, funcionamento, farmacêutico e faturamento dos dias abertos', () => {
    expect(situacaoDoCadastro(ok, 1)).toEqual({ status: 'completo', motivo: null });
  });

  it('dia fechado não exige faturamento; dia aberto sem valor vira motivo com o nome do dia', () => {
    const f = fat([20000, 15000, null, 18000, 20000, 11000, null]);
    expect(situacaoDoCadastro({ ...ok, faturamento: f }, 1)).toEqual({
      status: 'revisar',
      motivo: 'Falta faturamento de quarta',
    });
    const dois = fat([20000, null, null, 18000, 20000, 11000, null]);
    expect(situacaoDoCadastro({ ...ok, faturamento: dois }, 1).motivo).toBe(
      'Falta faturamento de terça e quarta',
    );
    // domingo aberto passa a exigir
    const comDom = { ...ok, horarios: semana([0, 1, 2, 3, 4, 5, 6]) };
    expect(situacaoDoCadastro(comDom, 1).motivo).toBe('Falta faturamento de domingo');
  });

  it('sem nenhum faturamento: "Falta o faturamento por dia"', () => {
    expect(situacaoDoCadastro({ ...ok, faturamento: null }, 1).motivo).toBe(
      'Falta o faturamento por dia',
    );
  });

  it('dados obrigatórios: lista o que falta', () => {
    expect(
      situacaoDoCadastro({ ...ok, cidade: '', regimeTributario: null }, 1).motivo,
    ).toBe('Faltam dados da loja: cidade e regime tributário');
    expect(situacaoDoCadastro({ ...ok, uf: undefined }, 1).motivo).toBe('Faltam dados da loja: UF');
  });

  it('sem funcionamento definido ou com a semana toda fechada', () => {
    expect(situacaoDoCadastro({ ...ok, horarios: null }, 1).motivo).toBe(
      'Falta definir o funcionamento da loja',
    );
    expect(situacaoDoCadastro({ ...ok, horarios: semana([]) }, 1).motivo).toBe(
      'Falta definir o funcionamento da loja',
    );
  });

  it('sem farmacêutico na equipe', () => {
    expect(situacaoDoCadastro(ok, 0).motivo).toBe('Falta cadastrar um farmacêutico na equipe');
  });

  it('mensal informado: até 10% de diferença da soma × 52 ÷ 12 passa; acima vai para revisão', () => {
    // soma = 101.000 por semana → 437.667 por mês
    expect(situacaoDoCadastro({ ...ok, faturamento: { ...ok.faturamento!, mensal: 437667 } }, 1).status).toBe('completo');
    expect(situacaoDoCadastro({ ...ok, faturamento: { ...ok.faturamento!, mensal: 470000 } }, 1).status).toBe('completo'); // +7,4%
    const longe = situacaoDoCadastro({ ...ok, faturamento: { ...ok.faturamento!, mensal: 487698 } }, 1);
    expect(longe).toEqual({
      status: 'revisar',
      motivo: 'O faturamento mensal informado difere mais de 10% da soma dos dias',
    });
    // sem mensal informado não há o que comparar
    expect(situacaoDoCadastro({ ...ok, faturamento: { ...ok.faturamento!, mensal: null } }, 1).status).toBe('completo');
  });

  it('o motivo nunca traz valores em reais', () => {
    const r = situacaoDoCadastro({ ...ok, faturamento: { ...ok.faturamento!, mensal: 999999 } }, 1);
    expect(r.motivo).not.toMatch(/R\$|\d{3}/);
  });

  it('a primeira falha manda: dados antes de funcionamento, farmacêutico, faturamento', () => {
    expect(situacaoDoCadastro({ ...ok, cidade: '', horarios: null, faturamento: null }, 0).motivo).toMatch(/Faltam dados/);
    expect(situacaoDoCadastro({ ...ok, horarios: null, faturamento: null }, 0).motivo).toMatch(/funcionamento/);
    expect(situacaoDoCadastro({ ...ok, faturamento: null }, 0).motivo).toMatch(/farmacêutico/);
  });
});
