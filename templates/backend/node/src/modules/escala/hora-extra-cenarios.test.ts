import { describe, expect, it } from 'vitest';
import { PARAMETROS_PADRAO } from '../regras/parametros.js';
import { custoMensalDaHoraExtra } from '../regras/hora-extra.js';
import { montarCenarios, type EntradaCenarios } from './cenarios.js';
import { pesoDaFolha } from './peso-folha.js';

// Spec 063: os Cenários cobrem a falta com hora extra de quem já está escalado antes de contratar.
const dias = [0, 1, 2, 3, 4, 5].map((dia) => ({ dia, abre: 8, fecha: 22 })); // 84 h por semana
const farm = (...horas: number[]) => horas.map((cargaH) => ({ funcao: 'Farmacêutico', cargaH }));
const entrada = (extra: Partial<EntradaCenarios> = {}): EntradaCenarios => ({
  regraId: 'r40',
  convencao8h24: false,
  dias,
  minimos: { Farmacêutico: 1 },
  pessoas: farm(44, 44),
  vendas: [],
  custos: { salarioMedio: { Farmacêutico: 10000, Atendimento: 3000 }, encargosPct: 0 },
  dono: true,
  faturamentoMensalRef: 200000,
  horaExtra: true,
  ...extra,
});
const divisor = PARAMETROS_PADRAO.r40.divisor;
const custoHE = (h: number, s = 10000) =>
  custoMensalDaHoraExtra({ horasSemana: h, salarioMedio: s, divisor, encargosPct: 0 })!;

describe('Cenário 1 (manter) com hora extra', () => {
  it('fecha só com hora extra: 2 farmacêuticos e 4 h por semana faltando, sem contratar ninguém', () => {
    const { manter } = montarCenarios(entrada());
    expect(manter.contratacoes).toEqual([]);
    expect(manter.pessoasContratar).toBe(0);
    expect(manter.horaExtra).toEqual([
      { funcao: 'Farmacêutico', horasSemana: 4, custoMensal: custoHE(4) },
    ]);
    expect(manter.semContratar).toBe(true);
    expect(manter.resultado).toBe('Sem contratar: cobre com 4 h de hora extra por semana');
    expect(manter.direcionamento).toContain('Não é preciso contratar');
    expect(manter.direcionamento).toContain('4 h por semana de farmacêutico');
    // O custo adicional é o da hora extra (a mesma conta da Simulação), não o de contratar.
    expect(manter.custoAdicionalMensal).toBe(custoHE(4));
  });

  it('fecha em parte: contrata só o que sobra e mostra os dois', () => {
    // 1 farmacêutico (40 h): faltam 44 h; 1 integral cobre 40 h e as 4 h da ponta ficam como hora extra.
    const { manter } = montarCenarios(entrada({ pessoas: farm(44) }));
    expect(manter.contratacoes).toHaveLength(1);
    expect(manter.contratacoes[0]).toMatchObject({ funcao: 'Farmacêutico', inteiras: 1 });
    expect(manter.horaExtra).toEqual([
      { funcao: 'Farmacêutico', horasSemana: 4, custoMensal: custoHE(4) },
    ]);
    expect(manter.semContratar).toBe(false);
    expect(manter.resultado).toContain('Contrata 1 pessoa: farmacêutico');
    expect(manter.resultado).toContain('cobre 4 h por semana com hora extra');
    expect(manter.direcionamento).toContain(
      'cubra o resto com hora extra (4 h por semana de farmacêutico)',
    );
    // Custo adicional = 1 integral + a hora extra; sem hora extra seriam 2 integrais (44 h para 1 pessoa de 40 h).
    const semHE = montarCenarios(entrada({ pessoas: farm(44), horaExtra: false })).manter;
    expect(semHE.horaExtra).toEqual([]);
    expect(semHE.contratacoes[0]?.inteiras).toBe(2);
    expect(semHE.custoAdicionalMensal).toBe(20000);
    expect(manter.custoAdicionalMensal).toBe(10000 + custoHE(4));
    expect(manter.custoAdicionalMensal!).toBeLessThan(semHE.custoAdicionalMensal!);
  });

  it('continua precisando contratar quando ninguém do cargo está escalado', () => {
    const { manter } = montarCenarios(entrada({ minimos: { Farmacêutico: 1, Atendimento: 1 } }));
    const atendimento = manter.contratacoes.find((c) => c.funcao === 'Atendimento');
    expect(atendimento).toBeDefined();
    expect(manter.horaExtra.find((h) => h.funcao === 'Atendimento')).toBeUndefined();
    expect(manter.semContratar).toBe(false);
  });

  it('sem falta nenhuma, nada muda', () => {
    const { manter } = montarCenarios(entrada({ regraId: 'r40', pessoas: farm(44, 44, 44) }));
    expect(manter.horaExtra).toEqual([]);
    expect(manter.semContratar).toBe(false);
    expect(manter.resultado).toBe('Nada a contratar');
  });

  it('desligada (horaExtra: false), é a conta antiga: contrata', () => {
    const { manter } = montarCenarios(entrada({ horaExtra: false }));
    expect(manter.contratacoes).toHaveLength(1);
    expect(manter.horaExtra).toEqual([]);
  });
});

describe('o peso da folha reflete o custo da hora extra', () => {
  it('o peso com hora extra é o da folha de hoje mais o custo da hora extra, sobre o faturamento', () => {
    const e = entrada();
    const r = montarCenarios(e);
    const folha = r.atual.folhaMensal!;
    const peso = pesoDaFolha({
      folhaHoje: folha,
      custoAdicional: r.manter.custoAdicionalMensal!,
      faturamento: 200000,
      vendaPct: 0,
    })!;
    const esperado = Math.round(((folha + custoHE(4)) / 200000) * 1000) / 10;
    expect(peso.depois).toBe(esperado);
    // Sem hora extra (contratando), o peso é outro: a diferença é só o custo que mudou.
    const semHE = montarCenarios(entrada({ horaExtra: false }));
    const pesoSem = pesoDaFolha({
      folhaHoje: folha,
      custoAdicional: semHE.manter.custoAdicionalMensal!,
      faturamento: 200000,
      vendaPct: 0,
    })!;
    expect(peso.depois).not.toBe(pesoSem.depois);
    expect(peso.aumentoMensal).toBe(Math.round(custoHE(4)));
  });

  it('sem salário informado, o custo adicional fica sem valor (nunca parcial) e as horas continuam aparecendo', () => {
    const { manter } = montarCenarios(entrada({ custos: { salarioMedio: {}, encargosPct: 0 } }));
    expect(manter.horaExtra[0]).toMatchObject({
      funcao: 'Farmacêutico',
      horasSemana: 4,
      custoMensal: null,
    });
    expect(manter.custoAdicionalMensal).toBeNull();
  });
});

describe('permissões (spec 052): gestor e consulta não recebem reais', () => {
  it('as horas de hora extra aparecem, mas nenhum custo', () => {
    const { manter } = montarCenarios(entrada({ dono: false }));
    expect(manter.horaExtra).toEqual([{ funcao: 'Farmacêutico', horasSemana: 4 }]);
    expect(manter.semContratar).toBe(true);
    expect(manter.custoAdicionalMensal).toBeUndefined();
    expect(JSON.stringify(manter)).not.toMatch(/R\$/);
  });
});

describe('alerta de hora extra demais', () => {
  // 3 farmacêuticos de 18, 18 e 20 h (56 h) para 84 h: faltam 28 h; a hora extra (28 h × 1,5) custa mais que 1 integral (40 h).
  const pessoas = farm(18, 18, 20);
  it('contratar sairia mais barato: compara os dois custos (dono)', () => {
    const { manter } = montarCenarios(entrada({ pessoas }));
    expect(manter.horaExtra[0]?.horasSemana).toBe(28);
    expect(manter.alertasHoraExtra).toHaveLength(1);
    expect(manter.alertasHoraExtra[0]).toMatch(
      /^Contratar farmacêutico sairia mais barato: a hora extra custa R\$ .* por mês e contratar, R\$ .*\.$/,
    );
  });
  it('gestor e consulta recebem o alerta sem valores', () => {
    const { manter } = montarCenarios(entrada({ pessoas, dono: false }));
    expect(manter.alertasHoraExtra).toEqual([
      'Contratar farmacêutico sairia mais barato que a hora extra.',
    ]);
  });
  it('hora extra barata: nenhum alerta', () => {
    expect(montarCenarios(entrada()).manter.alertasHoraExtra).toEqual([]);
  });
});
