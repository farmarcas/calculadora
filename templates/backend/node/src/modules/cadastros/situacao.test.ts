import { describe, expect, it } from 'vitest';
import type { HorariosSemana } from './horarios.js';
import {
  pendenciasDoCadastro,
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
    expect(sit(ok, 1)).toEqual({ status: 'completo', motivo: null, quantidade: 0 });
  });

  it('dia fechado não exige faturamento; dia aberto sem valor vira motivo com o nome do dia', () => {
    const f = fat([20000, 15000, null, 18000, 20000, 11000, null]);
    expect(sit({ ...ok, faturamento: f }, 1)).toEqual({
      status: 'revisar',
      motivo: 'Falta faturamento de quarta',
      quantidade: 1,
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
      quantidade: 1,
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

  it('a margem bruta média é opcional: sem ela (ou zerada) a loja continua Completo', () => {
    expect(sit({ ...ok, faturamento: { ...ok.faturamento!, margemPct: null } }, 1)).toEqual({
      status: 'completo',
      motivo: null,
      quantidade: 0,
    });
    expect(sit({ ...ok, faturamento: { ...ok.faturamento!, margemPct: 0 } }, 1).status).toBe('completo');
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

  it('o salário vem depois do faturamento na ordem das falhas', () => {
    expect(
      sit({ ...ok, faturamento: null }, 1, { funcoesNaEquipe: [], salariosInformados: [] }).motivo,
    ).toBe('Falta o faturamento por dia');
  });

  describe('pendências: tudo o que falta, de uma vez', () => {
    const vazia: LojaParaSituacao = { nome: '', cidade: '', uf: '', regimeTributario: null, horarios: null, faturamento: null };
    const ids = (l: LojaParaSituacao, farm = 1, c = completo) => pendenciasDoCadastro(l, farm, c).map((p) => p.id);

    it('loja completa: nenhuma pendência', () => {
      expect(pendenciasDoCadastro(ok, 1, completo)).toEqual([]);
    });

    it('tudo pendente: lista cada item na ordem de verificação, com a aba e quem preenche', () => {
      const todas = pendenciasDoCadastro(vazia, 0, { funcoesNaEquipe: [], salariosInformados: [] });
      expect(todas.map((p) => p.id)).toEqual(['dados', 'funcionamento', 'farmaceutico', 'salario:Farmacêutico']);
      expect(todas.map((p) => p.aba)).toEqual(['dados', 'dados', 'equipe', 'regras']);
      expect(todas.map((p) => p.soDono)).toEqual([false, false, false, true]);
      expect(todas[0]).toMatchObject({ campos: ['nome', 'cidade', 'uf', 'regime'], texto: 'Falta: nome, cidade, UF e regime tributário.' });
    });

    it('2 ou 3 pendências em abas diferentes', () => {
      const l = { ...ok, horarios: null, faturamento: { ...ok.faturamento!, mensal: null } };
      expect(ids(l, 0, { funcoesNaEquipe: ['Atendimento'], salariosInformados: ['Farmacêutico'] })).toEqual([
        'funcionamento',
        'farmaceutico',
        'salario:Atendimento',
      ]);
    });

    it('faturamento por dia: lista os dias abertos sem valor e o campo de cada um', () => {
      const f = fat([20000, 15000, null, 18000, 20000, null, null]);
      const [p] = pendenciasDoCadastro({ ...ok, faturamento: f }, 1, completo);
      expect(p).toMatchObject({
        id: 'faturamentoDia',
        texto: 'Faltam 2 dias abertos: quarta e sábado.',
        campos: ['fat-2', 'fat-5'],
        soDono: true,
      });
      expect(pendenciasDoCadastro({ ...ok, faturamento: fat([1, 1, null, 1, 1, 1, null]) }, 1, completo)[0]!.texto).toBe(
        'Falta 1 dia aberto: quarta.',
      );
    });

    it('divergência do mês é um alerta (não campo vazio) e só vale quando os dias estão completos', () => {
      const longe = { ...ok, faturamento: { ...ok.faturamento!, mensal: 487698 } };
      expect(pendenciasDoCadastro(longe, 1, completo)).toMatchObject([
        { id: 'faturamentoMes', alerta: true, campos: ['mensal'], soDono: true },
      ]);
      const incompleto = { ...longe, faturamento: { ...longe.faturamento!, dias: [20000, null, null, null, null, null, null] } };
      expect(ids(incompleto)).toEqual(['faturamentoDia']);
    });

    it('um item de salário por função que conta; função sem gente não exige', () => {
      expect(
        ids(ok, 1, { funcoesNaEquipe: ['Farmacêutico', 'Atendimento', 'Caixa'], salariosInformados: ['Atendimento'] }),
      ).toEqual(['salario:Farmacêutico', 'salario:Caixa']);
      expect(ids(ok, 1, { funcoesNaEquipe: ['Farmacêutico'], salariosInformados: ['Farmacêutico'] })).toEqual([]);
    });

    it('a quantidade e o motivo seguem a lista; as pendências de salário saem juntas no motivo', () => {
      const s = situacaoDoCadastro(ok, 1, { funcoesNaEquipe: ['Farmacêutico', 'Atendimento'], salariosInformados: [] });
      expect(s).toEqual({ status: 'revisar', motivo: 'Falta o salário médio de Farmacêutico e Atendimento', quantidade: 2 });
    });

    it('nenhum texto traz valores em reais', () => {
      const longe = { ...ok, faturamento: { ...ok.faturamento!, mensal: 999999 } };
      for (const p of pendenciasDoCadastro(longe, 0, { funcoesNaEquipe: [], salariosInformados: [] }))
        expect(`${p.resumo} ${p.texto} ${p.porque}`).not.toMatch(/R\$|\d{3}/);
    });
  });
});
