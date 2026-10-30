import { describe, expect, it } from 'vitest';
import { calcularCusto } from '../custos/custo.js';
import {
  PARAMETROS_PADRAO,
  dataBR,
  tabelaVigente,
  validarParametro,
  versaoVigente,
  type ParametroFase,
} from './parametros.js';
import { regraPara, tetoEfetivo } from './perfis.js';

const v = (
  fase: ParametroFase['fase'],
  vigenciaInicio: string,
  jornadaSemanalH: number,
): ParametroFase => ({
  ...PARAMETROS_PADRAO[fase],
  vigenciaInicio,
  jornadaSemanalH,
});

describe('versão vigente', () => {
  it('vale a mais recente que já começou', () => {
    const vs = [v('r40', '2027-12-01', 40), v('r40', '2028-06-01', 38), v('r40', '2026-01-01', 41)];
    expect(versaoVigente(vs, '2028-07-01')?.jornadaSemanalH).toBe(38);
    expect(versaoVigente(vs, '2027-12-01')?.jornadaSemanalH).toBe(40); // o dia do início já conta
    expect(versaoVigente(vs, '2026-06-01')?.jornadaSemanalH).toBe(41);
  });
  it('se todas começam no futuro, vale a mais antiga delas', () => {
    const vs = [v('r42', '2027-01-01', 41), v('r42', '2026-12-16', 42)];
    expect(versaoVigente(vs, '2026-10-28')?.jornadaSemanalH).toBe(42);
  });
  it('mesma data de início: vale a última da lista (a mais nova)', () => {
    const vs = [v('r40', '2027-12-01', 40), v('r40', '2027-12-01', 39)];
    expect(versaoVigente(vs, '2028-01-01')?.jornadaSemanalH).toBe(39);
  });
  it('sem versões: nulo, e a tabela usa o padrão da fase', () => {
    expect(versaoVigente([], '2026-10-28')).toBeNull();
    expect(tabelaVigente([], '2026-10-28')).toEqual(PARAMETROS_PADRAO);
  });
  it('a tabela pega a vigente de cada fase', () => {
    const t = tabelaVigente(
      [v('r40', '2026-01-01', 36), v('atual', '2000-01-01', 44)],
      '2026-10-28',
    );
    expect(t.r40.jornadaSemanalH).toBe(36);
    expect(t.r42).toEqual(PARAMETROS_PADRAO.r42);
  });
});

describe('validarParametro', () => {
  const ok = { ...PARAMETROS_PADRAO.r40 };
  it('aceita os valores de hoje', () => {
    for (const f of ['atual', 'r42', 'r40'] as const)
      expect(validarParametro(PARAMETROS_PADRAO[f])).toEqual([]);
  });
  it('recusa valores impossíveis, em português', () => {
    expect(validarParametro({ ...ok, jornadaSemanalH: 0 }).join(' ')).toContain('jornada semanal');
    expect(validarParametro({ ...ok, horasDiaMax: 25 }).join(' ')).toContain('horas por dia');
    expect(validarParametro({ ...ok, diasTrabalho: 8 }).join(' ')).toContain('dias de trabalho');
    expect(validarParametro({ ...ok, diasTrabalho: 4.5 }).join(' ')).toContain('dias de trabalho');
    expect(validarParametro({ ...ok, divisor: 0 }).join(' ')).toContain('divisor');
    expect(validarParametro({ ...ok, vigenciaInicio: 'amanhã' }).join(' ')).toContain(
      'data de início',
    );
    expect(validarParametro({ ...ok, horasDiaMaxConvencao: 30 }).join(' ')).toContain('convenção');
    expect(validarParametro({ ...ok, fase: 'x' }).join(' ')).toContain('Fase');
  });
});

describe('regraPara pela tabela', () => {
  it('sem tabela, as regras de hoje (nome, dias, horas, teto e texto)', () => {
    expect(regraPara('atual', false)).toEqual({
      id: 'atual',
      nome: '44h (regra atual)',
      vigencia: 'hoje',
      dias: 6,
      maxDia: 8,
      teto: 44,
      descricao: '6 dias · até 8h por dia · teto 44h',
    });
    expect(regraPara('r42', false)).toMatchObject({
      nome: '42h',
      dias: 5,
      maxDia: 8,
      teto: 42,
      descricao: 'Sem convenção que permita 8h24: na prática 40h (5 × 8h)',
    });
    expect(regraPara('r42', true)).toMatchObject({
      maxDia: 8.4,
      descricao: '5 dias · até 8h24 por dia · teto 42h',
    });
    expect(regraPara('r40', false)).toMatchObject({
      nome: '40h',
      dias: 5,
      maxDia: 8,
      teto: 40,
      descricao: '5 dias · até 8h por dia · teto 40h',
    });
    expect(tetoEfetivo(regraPara('r42', false))).toBe(40);
    expect(tetoEfetivo(regraPara('r42', true))).toBe(42);
  });

  it('a data de início aparece como vigência', () => {
    expect(regraPara('r42', false).vigencia).toBe('16/12/2026');
    expect(dataBR('2027-12-01')).toBe('01/12/2027');
  });

  it('muda quando a tabela muda', () => {
    const t = tabelaVigente([v('r40', '2026-01-01', 36)], '2026-10-28');
    const r = regraPara('r40', false, t);
    expect(r).toMatchObject({ teto: 36, nome: '36h' });
    expect(tetoEfetivo(r)).toBe(36);
  });
});

describe('divisor pela tabela', () => {
  const quadro = [{ matricula: 'V', nome: 'Vaga', funcao: 'Atendimento', cargaH: 40, vaga: true }];
  const custos = { salarioMedio: { Atendimento: 2000 }, encargosPct: 0 };
  const mensal = (parametros?: Parameters<typeof calcularCusto>[0]['parametros']) => {
    const r = calcularCusto({ regra: 'r40', quadro, custos, parametros });
    return r.informado ? r.mensal : null;
  };
  it('sem tabela, 200 horas: 2000 × 40 × 5 ÷ 200 = 2000', () => {
    expect(mensal()).toBe(2000);
  });
  it('com outro divisor, o custo da vaga acompanha', () => {
    const t = tabelaVigente(
      [{ ...PARAMETROS_PADRAO.r40, divisor: 160, vigenciaInicio: '2026-01-01' }],
      '2026-10-28',
    );
    expect(mensal(t)).toBe(2500); // 2000 × 40 × 5 ÷ 160
  });
});
