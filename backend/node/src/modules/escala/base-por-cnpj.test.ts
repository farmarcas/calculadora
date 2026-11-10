import { describe, expect, it } from 'vitest';
import type { Aba } from '../planilhas/leitor.js';
import {
  colunasPorCnpj,
  dataDeReferencia,
  ehBasePorCnpj,
  erroDoPeriodo,
  faturamentoDaBase,
  interpretarPorCnpj,
  mesclarCadastro,
  vezesPorDia,
} from './base-por-cnpj.js';

const PERIODO = { inicio: '2026-07-01', fim: '2026-10-31' };
const CAB = [
  'cnpj',
  'dia_semana',
  'dia_semana_nome',
  'hora',
  'faturamento',
  'valor_bruto',
  'cmv_valor',
  'unidades_vendidas',
  'tickets_vendidos',
  'ticket_medio',
];
const aba = (linhas: string[][], cabecalhos = CAB): Aba => ({
  nome: 'Planilha',
  cabecalhos,
  linhas,
});
// cnpj, dia, nome, hora, faturamento, bruto, cmv, unidades, tickets, ticket médio
const L = (cnpj: string, dia: string, hora: string, fat: string, cmv = '', un = '', tk = '') => [
  cnpj,
  dia,
  '',
  hora,
  fat,
  '0',
  cmv,
  un,
  tk,
  '',
];

describe('formato por CNPJ: reconhecimento', () => {
  it('reconhece pelo cabeçalho, com sublinhado, espaço, acento e maiúsculas', () => {
    expect(ehBasePorCnpj(CAB)).toBe(true);
    expect(ehBasePorCnpj(['CNPJ', 'Dia da Semana', 'Hora', 'Faturamento'])).toBe(true);
    expect(colunasPorCnpj(CAB)).toMatchObject({
      cnpj: 0,
      dia: 1,
      hora: 3,
      venda: 4,
      cmv: 6,
      unidades: 7,
      tickets: 8,
    });
  });
  it('o formato atual (código da loja e data) não é reconhecido', () => {
    expect(ehBasePorCnpj(['Data', 'Hora', 'Código da loja', 'Venda líquida (R$)'])).toBe(false);
  });
  it('não confunde "dia_semana_nome" com o dia da semana', () => {
    expect(ehBasePorCnpj(['cnpj', 'dia_semana_nome', 'faturamento'])).toBe(false);
  });
});

describe('período', () => {
  it('julho a outubro de 2026: 17 segundas, 17 terças, 18 quartas a sábados e 17 domingos', () => {
    expect(vezesPorDia(PERIODO)).toEqual([17, 17, 18, 18, 18, 18, 17]);
    expect(vezesPorDia(PERIODO).reduce((s, n) => s + n, 0)).toBe(123);
  });
  it('a data de referência é a primeira ocorrência do dia dentro do período (01/07/2026 é quarta)', () => {
    expect(dataDeReferencia(PERIODO, 2)).toBe('2026-07-01');
    expect(dataDeReferencia(PERIODO, 0)).toBe('2026-07-06');
    expect(dataDeReferencia(PERIODO, 6)).toBe('2026-07-05');
  });
  it('valida: datas, ordem e pelo menos uma semana', () => {
    expect(erroDoPeriodo('2026-07-01', '2026-10-31')).toBeNull();
    expect(erroDoPeriodo('2026-07-01', '2026-07-07')).toBeNull();
    expect(erroDoPeriodo('2026-07-01', '2026-07-06')).toMatch(/pelo menos uma semana/);
    expect(erroDoPeriodo('2026-10-31', '2026-07-01')).toMatch(/Informe o período/);
    expect(erroDoPeriodo(undefined, '2026-07-01')).toMatch(/Informe o período/);
    expect(erroDoPeriodo('2026-02-30', '2026-07-01')).toMatch(/Informe o período/);
    expect(erroDoPeriodo('2020-01-01', '2026-10-31')).toMatch(/longo demais/);
  });
});

describe('interpretarPorCnpj', () => {
  const cols = colunasPorCnpj(CAB)!;
  it('divide o total do período pelas vezes do dia da semana e usa a data de referência', () => {
    // segunda (17 vezes) e quarta (18 vezes)
    const r = interpretarPorCnpj(
      aba([
        L('00112423000101', '1', '7', '3620.44', '2138.05', '314', '86'),
        L('00.112.423/0001-01', '3', '9', '1800', '900', '36', '18'),
      ]),
      cols,
      PERIODO,
    );
    const linhas = r.porCnpj.get('00112423000101')!;
    expect(linhas).toHaveLength(2);
    const seg = linhas.find((l) => l.hora === 7)!;
    expect(seg.data).toBe('2026-07-06');
    expect(seg.venda).toBeCloseTo(3620.44 / 17, 6);
    expect(seg.margem).toBeCloseTo((3620.44 - 2138.05) / 17, 6);
    expect(seg.clientes).toBeCloseTo(86 / 17, 6);
    expect(seg.unidades).toBeCloseTo(314 / 17, 6);
    const qua = linhas.find((l) => l.hora === 9)!;
    expect(qua.data).toBe('2026-07-01');
    expect(qua.venda).toBe(100);
    expect(r.erros).toEqual([]);
  });

  it('soma linhas repetidas da mesma loja, dia e hora antes de dividir', () => {
    const r = interpretarPorCnpj(
      aba([
        L('00112423000101', '2', '8', '170', '100'),
        L('00112423000101', '2', '8', '170', '70'),
      ]),
      cols,
      PERIODO,
    );
    const [l] = r.porCnpj.get('00112423000101')!;
    expect(l!.venda).toBe(20);
    expect(l!.margem).toBeCloseTo(10, 10);
  });

  it('CMV vazio deixa a hora sem lucro bruto (nulo), nunca zero', () => {
    const r = interpretarPorCnpj(aba([L('00112423000101', '2', '8', '170')]), cols, PERIODO);
    expect(r.porCnpj.get('00112423000101')![0]!.margem).toBeNull();
  });

  it('a soma (média do dia × vezes no período) devolve o total do arquivo', () => {
    const entrada = [
      L('11111111000191', '1', '8', '1000', '600'),
      L('11111111000191', '6', '8', '777.77', '400'),
      L('11111111000191', '4', '18', '5000.5', '3000'),
    ];
    const r = interpretarPorCnpj(aba(entrada), cols, PERIODO);
    const total = r.porCnpj
      .get('11111111000191')!
      .reduce(
        (s, l) => s + l.venda * r.vezes[(new Date(`${l.data}T00:00:00Z`).getUTCDay() + 6) % 7]!,
        0,
      );
    expect(total).toBeCloseTo(1000 + 777.77 + 5000.5, 6);
  });

  it('rejeita a linha ruim com o motivo e segue com as outras', () => {
    const r = interpretarPorCnpj(
      aba([
        L('123', '1', '8', '10'),
        L('00112423000101', '8', '8', '10'),
        L('00112423000101', '0', '8', '10'),
        L('00112423000101', '1', '24', '10'),
        L('00112423000101', '1', '8', ''),
        L('00112423000101', '1', '8', '-5'),
        L('00112423000101', '1', '8', 'abc'),
        L('00112423000101', '1', '9', '10'),
      ]),
      cols,
      PERIODO,
    );
    expect(r.aceitas).toBe(1);
    expect(r.erros.map((e) => e.linha)).toEqual([2, 3, 4, 5, 6, 7, 8]);
    expect(r.erros[0]!.motivo).toMatch(/CNPJ inválido/);
    expect(r.erros[1]!.motivo).toMatch(/Dia da semana/);
    expect(r.erros[3]!.motivo).toMatch(/Hora inválida/);
    expect(r.erros[4]!.motivo).toMatch(/Faturamento/);
  });

  it('conta os avisos: linha zerada, unidades menores que clientes, CMV maior que a venda e loja com poucos dias', () => {
    const r = interpretarPorCnpj(
      aba([
        L('11111111000191', '1', '8', '0', '0', '0', '1'),
        L('11111111000191', '1', '9', '100', '150', '5', '10'),
        L('11111111000191', '2', '9', '100', '50', '50', '10'),
      ]),
      cols,
      PERIODO,
    );
    expect(r.avisos).toEqual({
      linhaZerada: 1,
      unidadesMenoresQueClientes: 2,
      cmvMaiorQueVenda: 1,
      lojaComPoucosDias: 1,
    });
  });

  it('ignora o valor bruto e o ticket médio', () => {
    const r = interpretarPorCnpj(
      aba([['00112423000101', '1', 'Monday', '8', '170', '99999', '', '', '', '99999']]),
      cols,
      PERIODO,
    );
    expect(r.porCnpj.get('00112423000101')![0]).toMatchObject({
      venda: 10,
      clientes: 0,
      unidades: 0,
    });
  });

  it('separa as lojas pelo CNPJ de 14 dígitos (com ou sem pontuação)', () => {
    const r = interpretarPorCnpj(
      aba([L('11.111.111/0001-91', '1', '8', '17'), L('22222222000191', '1', '8', '34')]),
      cols,
      PERIODO,
    );
    expect([...r.porCnpj.keys()].sort()).toEqual(['11111111000191', '22222222000191']);
  });
});

describe('faturamentoDaBase', () => {
  const l = (data: string, hora: number, venda: number, margem: number | null) => ({
    data,
    hora,
    venda,
    margem,
    clientes: 0,
    unidades: 0,
  });
  it('soma as horas de cada dia da semana e calcula o CMV médio só nas horas com CMV', () => {
    // segunda 06/07/2026, terça 07/07/2026
    const f = faturamentoDaBase([
      l('2026-07-06', 8, 1000, 400),
      l('2026-07-06', 9, 500, 200),
      l('2026-07-07', 8, 300, null),
    ]);
    expect(f.dias).toEqual([1500, 300, null, null, null, null, null]);
    // CMV = 600 + 300 = 900 sobre 1500 de venda com CMV = 60%
    expect(f.cmvPct).toBe(60);
  });
  it('sem nenhum CMV o CMV médio fica nulo', () => {
    expect(faturamentoDaBase([l('2026-07-06', 8, 1000, null)]).cmvPct).toBeNull();
  });
});

describe('mesclarCadastro (só onde está vazio)', () => {
  const calc = {
    dias: [1500, 300, null, null, null, null, null] as (number | null)[],
    cmvPct: 58.7,
  };
  it('loja sem faturamento recebe tudo', () => {
    const r = mesclarCadastro(null, calc);
    expect(r.novo).toEqual({
      dias: [1500, 300, null, null, null, null, null],
      mensal: null,
      cmvPct: 58.7,
    });
    expect(r).toMatchObject({ preencheuDias: 2, preencheuCmv: true, jaTinha: false });
  });
  it('o que já estava digitado fica; só o vazio é preenchido', () => {
    const r = mesclarCadastro(
      { dias: [999, null, null, null, null, null, null], mensal: 50000, cmvPct: 65 },
      calc,
    );
    expect(r.novo).toEqual({
      dias: [999, 300, null, null, null, null, null],
      mensal: 50000,
      cmvPct: 65,
    });
    expect(r).toMatchObject({ preencheuDias: 1, preencheuCmv: false, jaTinha: true });
  });
  it('nada a preencher devolve nulo (a loja não é alterada)', () => {
    const r = mesclarCadastro(
      { dias: [1, 2, null, null, null, null, null], mensal: null, cmvPct: 60 },
      calc,
    );
    expect(r.novo).toBeNull();
    expect(r.jaTinha).toBe(true);
  });
  it('sem CMV calculado não inventa CMV médio', () => {
    expect(mesclarCadastro(null, { dias: calc.dias, cmvPct: null }).novo).toEqual({
      dias: calc.dias,
      mensal: null,
    });
  });
});
