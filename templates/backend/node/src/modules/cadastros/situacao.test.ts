import { describe, expect, it } from 'vitest';
import type { HorariosSemana } from './horarios.js';
import {
  situacaoDoCadastro,
  type CadastroDaLoja,
  type LojaParaSituacao,
} from './situacao.js';

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

// Equipe com farmacêutico e atendimento, e o salário médio das duas funções informado.
const completo: CadastroDaLoja = {
  funcoesNaEquipe: ['Farmacêutico', 'Atendimento'],
  salariosInformados: ['Farmacêutico', 'Atendimento'],
};
const sit = (loja: LojaParaSituacao, farmaceuticos: number, cadastro = completo) =>
  situacaoDoCadastro(loja, farmaceuticos, cadastro);

describe('situacaoDoCadastro', () => {
  it('Completo quando tem tudo: dados, funcionamento, farmacêutico e faturamento dos dias abertos', () => {
    expect(sit(ok, 1)).toEqual({ status: 'completo', motivo: null });
  });

  it('dia fechado não exige faturamento; dia aberto sem valor vira motivo com o nome do dia', () => {
    const f = fat([20000, 15000, null, 18000, 20000, 11000, null]);
    expect(sit({ ...ok, faturamento: f }, 1)).toEqual({
      status: 'revisar',
      motivo: 'Falta faturamento de quarta',
    });
    const dois = fat([20000, null, null, 18000, 20000, 11000, null]);
    expect(sit({ ...ok, faturamento: dois }, 1).motivo).toBe(
      'Falta faturamento de terça e quarta',
    );
    // domingo aberto passa a exigir
    const comDom = { ...ok, horarios: semana([0, 1, 2, 3, 4, 5, 6]) };
    expect(sit(comDom, 1).motivo).toBe('Falta faturamento de domingo');
  });

  it('sem nenhum faturamento: "Falta o faturamento por dia"', () => {
    expect(sit({ ...ok, faturamento: null }, 1).motivo).toBe(
      'Falta o faturamento por dia',
    );
  });

  it('dados obrigatórios: lista o que falta', () => {
    expect(
      sit({ ...ok, cidade: '', regimeTributario: null }, 1).motivo,
    ).toBe('Faltam dados da loja: cidade e regime tributário');
    expect(sit({ ...ok, uf: undefined }, 1).motivo).toBe('Faltam dados da loja: UF');
  });

  it('sem funcionamento definido ou com a semana toda fechada', () => {
    expect(sit({ ...ok, horarios: null }, 1).motivo).toBe(
      'Falta definir o funcionamento da loja',
    );
    expect(sit({ ...ok, horarios: semana([]) }, 1).motivo).toBe(
      'Falta definir o funcionamento da loja',
    );
  });

  it('sem farmacêutico na equipe', () => {
    expect(sit(ok, 0).motivo).toBe('Falta cadastrar um farmacêutico na equipe');
  });

  it('mensal informado: até 10% de diferença da soma × 52 ÷ 12 passa; acima vai para revisão', () => {
    // soma = 101.000 por semana → 437.667 por mês
    expect(sit({ ...ok, faturamento: { ...ok.faturamento!, mensal: 437667 } }, 1).status).toBe('completo');
    expect(sit({ ...ok, faturamento: { ...ok.faturamento!, mensal: 470000 } }, 1).status).toBe('completo'); // +7,4%
    const longe = sit({ ...ok, faturamento: { ...ok.faturamento!, mensal: 487698 } }, 1);
    expect(longe).toEqual({
      status: 'revisar',
      motivo: 'O faturamento mensal informado difere mais de 10% da soma dos dias',
    });
    // sem mensal informado não há o que comparar
    expect(sit({ ...ok, faturamento: { ...ok.faturamento!, mensal: null } }, 1).status).toBe('completo');
  });

  it('o motivo nunca traz valores em reais', () => {
    const r = sit({ ...ok, faturamento: { ...ok.faturamento!, mensal: 999999 } }, 1);
    expect(r.motivo).not.toMatch(/R\$|\d{3}/);
  });

  it('a primeira falha manda: dados antes de funcionamento, farmacêutico, faturamento', () => {
    expect(sit({ ...ok, cidade: '', horarios: null, faturamento: null }, 0).motivo).toMatch(/Faltam dados/);
    expect(sit({ ...ok, horarios: null, faturamento: null }, 0).motivo).toMatch(/funcionamento/);
    expect(sit({ ...ok, faturamento: null }, 0).motivo).toMatch(/farmacêutico/);
  });

  it('sem margem bruta média: vai para revisão, e margem zero também', () => {
    expect(sit({ ...ok, faturamento: { ...ok.faturamento!, margemPct: null } }, 1)).toEqual({
      status: 'revisar',
      motivo: 'Falta a margem bruta média',
    });
    expect(sit({ ...ok, faturamento: { ...ok.faturamento!, margemPct: 0 } }, 1).motivo).toBe(
      'Falta a margem bruta média',
    );
  });

  it('sem salário médio de uma função que conta: lista as que faltam', () => {
    expect(
      sit(ok, 1, { funcoesNaEquipe: ['Farmacêutico', 'Atendimento'], salariosInformados: ['Farmacêutico'] })
        .motivo,
    ).toBe('Falta o salário médio de Atendimento');
    expect(
      sit(ok, 1, { funcoesNaEquipe: ['Farmacêutico', 'Atendimento', 'Caixa'], salariosInformados: [] })
        .motivo,
    ).toBe('Falta o salário médio de Farmacêutico, Atendimento e Caixa');
  });

  it('função sem ninguém na equipe não exige salário; o farmacêutico sempre exige', () => {
    expect(
      sit(ok, 1, { funcoesNaEquipe: ['Farmacêutico'], salariosInformados: ['Farmacêutico'] }).status,
    ).toBe('completo');
    expect(sit(ok, 1, { funcoesNaEquipe: ['Farmacêutico'], salariosInformados: ['Atendimento'] }).motivo).toBe(
      'Falta o salário médio de Farmacêutico',
    );
  });

  it('margem e salário vêm depois do faturamento na ordem das falhas', () => {
    expect(
      sit({ ...ok, faturamento: null }, 1, { funcoesNaEquipe: [], salariosInformados: [] }).motivo,
    ).toBe('Falta o faturamento por dia');
  });
});
