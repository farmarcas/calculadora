import { describe, expect, it } from 'vitest';
import {
  ENCARGOS_PADRAO,
  calcularEncargos,
  tabelaEncargosVigente,
  validarAjustes,
  validarEncargos,
  versaoVigenteEncargos,
} from './encargos.js';

describe('calcularEncargos', () => {
  it('Simples sem rescisão: 29,0% (diretos 8 + provisões 19,44 + 19,44 × 8% = 1,5552)', () => {
    // 8 + 19,44 + 1,5552 = 28,9952
    const r = calcularEncargos('simples');
    expect(r.totalPct).toBe(29);
    expect(r.totalPct).toBeGreaterThanOrEqual(28.9);
    expect(r.totalPct).toBeLessThanOrEqual(29.1);
    expect(r.regime).toBe('simples');
    expect(r.regimeAusente).toBe(false);
  });

  it('Presumido com RAT 2% e FAP 1,0, sem rescisão: 62,2% (diretos 35,8 + 19,44 + 19,44 × 35,8% = 6,95952)', () => {
    // 35,8 + 19,44 + 6,95952 = 62,19952
    const r = calcularEncargos('presumido');
    expect(r.totalPct).toBe(62.2);
    expect(r.totalPct).toBeGreaterThanOrEqual(62.1);
    expect(r.totalPct).toBeLessThanOrEqual(62.3);
  });

  it('Lucro Real dá o mesmo total do Presumido com os mesmos parâmetros', () => {
    expect(calcularEncargos('real').totalPct).toBe(calcularEncargos('presumido').totalPct);
  });

  it('a lista de componentes soma o total (menos arredondamento de 4 casas)', () => {
    const r = calcularEncargos('presumido');
    const soma = r.componentes.reduce((s, c) => s + c.pct, 0);
    expect(soma).toBeCloseTo(r.totalPct, 1);
    expect(r.componentes.map((c) => c.chave)).toEqual([
      'inss',
      'rat',
      'terceiros',
      'fgts',
      'decimo',
      'ferias',
      'sobre_provisoes',
    ]);
  });

  it('provisão de rescisão ligada soma 4% no Simples (33,0%) e 5% no Presumido (67,2%)', () => {
    // 28,9952 + 4 = 32,9952; 62,19952 + 5 = 67,19952
    const simples = calcularEncargos('simples', ENCARGOS_PADRAO, { rescisaoLigada: true });
    expect(simples.totalPct).toBe(33);
    expect(simples.componentes.at(-1)).toMatchObject({ chave: 'rescisao', pct: 4 });
    expect(calcularEncargos('presumido', ENCARGOS_PADRAO, { rescisaoLigada: true }).totalPct).toBe(
      67.2,
    );
  });

  it('ajuste de RAT e FAP da loja: RAT 3% × FAP 1,5 = 4,5% → total 65,19%; RAT 1% × FAP 0,5 → 60,41%', () => {
    // diretos 20 + 4,5 + 5,8 + 8 = 38,3 → 38,3 + 19,44 + 7,44552 = 65,18552
    expect(calcularEncargos('presumido', ENCARGOS_PADRAO, { ratPct: 3, fap: 1.5 }).totalPct).toBe(
      65.19,
    );
    // diretos 20 + 0,5 + 5,8 + 8 = 34,3 → 34,3 + 19,44 + 6,66792 = 60,40792
    expect(calcularEncargos('presumido', ENCARGOS_PADRAO, { ratPct: 1, fap: 0.5 }).totalPct).toBe(
      60.41,
    );
  });

  it('o ajuste de uma loja não muda a tabela nem outra loja', () => {
    const ajustada = calcularEncargos('presumido', ENCARGOS_PADRAO, { ratPct: 3, fap: 2 });
    const outra = calcularEncargos('presumido', ENCARGOS_PADRAO);
    expect(ajustada.totalPct).not.toBe(outra.totalPct);
    expect(outra.totalPct).toBe(62.2);
    expect(ENCARGOS_PADRAO.presumido.ratPct).toBe(2);
  });

  it('regime ausente ou inválido usa Presumido e marca regimeAusente', () => {
    for (const r of [null, undefined, '', 'mei', 'lucro_real', 42]) {
      const x = calcularEncargos(r);
      expect(x.regime).toBe('presumido');
      expect(x.regimeAusente).toBe(true);
      expect(x.totalPct).toBe(62.2);
    }
  });
});

describe('validação', () => {
  it('RAT de 1 a 3 e FAP de 0,5 a 2,0; no Simples o RAT 0 vale', () => {
    expect(validarAjustes({ ratPct: 2, fap: 1 })).toEqual([]);
    expect(validarAjustes({ ratPct: 0.5 })[0]).toContain('RAT');
    expect(validarAjustes({ ratPct: 3.1 })[0]).toContain('RAT');
    expect(validarAjustes({ fap: 0.4 })[0]).toContain('FAP');
    expect(validarAjustes({ fap: 2.1 })[0]).toContain('FAP');
    expect(validarAjustes({ ratPct: 0 }, true)).toEqual([]);
  });

  it('versão de parâmetros: erros em português', () => {
    expect(validarEncargos({ ...ENCARGOS_PADRAO.presumido, vigenciaInicio: '2027-01-01' })).toEqual(
      [],
    );
    const erros = validarEncargos({
      ...ENCARGOS_PADRAO.presumido,
      fgtsPct: 120,
      vigenciaInicio: 'amanhã',
    });
    expect(erros.join(' ')).toContain('FGTS');
    expect(erros.join(' ')).toContain('vigência');
    expect(
      validarEncargos({
        ...ENCARGOS_PADRAO.simples,
        regime: 'mei',
        vigenciaInicio: '2027-01-01',
      })[0],
    ).toContain('Regime');
  });
});

describe('vigência', () => {
  const nova = { ...ENCARGOS_PADRAO.presumido, fgtsPct: 9, vigenciaInicio: '2027-03-01' };
  it('vale a versão mais recente já iniciada; sem versão, o padrão', () => {
    expect(versaoVigenteEncargos([], 'presumido', '2026-10-30')).toBe(ENCARGOS_PADRAO.presumido);
    expect(versaoVigenteEncargos([nova], 'presumido', '2026-10-30')).toBe(
      ENCARGOS_PADRAO.presumido,
    );
    expect(versaoVigenteEncargos([nova], 'presumido', '2027-03-01')).toBe(nova);
    // outro regime não é afetado
    expect(versaoVigenteEncargos([nova], 'simples', '2027-03-01')).toBe(ENCARGOS_PADRAO.simples);
  });
  it('a nova versão muda o total: FGTS 9% → diretos 36,8 → 36,8 + 19,44 + 7,15392 = 63,39', () => {
    const tabela = tabelaEncargosVigente([nova], '2027-03-01');
    expect(calcularEncargos('presumido', tabela).totalPct).toBe(63.39);
  });
});
