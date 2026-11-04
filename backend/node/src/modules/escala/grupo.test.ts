import { describe, expect, it } from 'vitest';
import { somarGrupo, type ImpactoDaLoja } from './grupo.js';

const loja = (extra: Partial<ImpactoDaLoja> = {}): ImpactoDaLoja => ({
  saldoMensal: 0,
  vendaPerdidaMensal: 0,
  economiaFolhaMensal: 0,
  vendaAdicionalMensal: 0,
  faturamentoMensal: 100000,
  ...extra,
});

describe('soma do grupo', () => {
  it('soma o saldo, a venda perdida, a economia de folha e a venda adicional das lojas', () => {
    const g = somarGrupo([
      loja({ saldoMensal: -2000, vendaPerdidaMensal: 10000, economiaFolhaMensal: 8000, faturamentoMensal: 200000 }),
      loja({ saldoMensal: 500, vendaAdicionalMensal: 1500, economiaFolhaMensal: -1000, faturamentoMensal: 300000 }),
    ]);
    expect(g).toMatchObject({
      saldoMensal: -1500,
      saldoAnual: -18000,
      vendaPerdidaMensal: 10000,
      economiaFolhaMensal: 7000,
      vendaAdicionalMensal: 1500,
      faturamentoMensal: 500000,
      lojasNaSoma: 2,
      lojasSemDado: 0,
    });
  });

  it('o peso é o saldo do grupo sobre o faturamento total do grupo, não a média dos pesos das lojas', () => {
    const g = somarGrupo([
      loja({ saldoMensal: -2000, faturamentoMensal: 200000 }), // −1,0% sozinha
      loja({ saldoMensal: -3000, faturamentoMensal: 300000 }), // −1,0% sozinha
      loja({ saldoMensal: -500, faturamentoMensal: 50000 }),
    ]);
    // −5500 ÷ 550000 = −1,0%
    expect(g.pesoNoFaturamentoPct).toBe(-1);
    const desigual = somarGrupo([loja({ saldoMensal: -1000, faturamentoMensal: 100000 }), loja({ saldoMensal: 0, faturamentoMensal: 900000 })]);
    // a média dos pesos seria −0,5%; sobre o total do grupo é −0,1%
    expect(desigual.pesoNoFaturamentoPct).toBe(-0.1);
  });

  it('loja sem saldo (falta custo ou venda hora a hora) fica fora da soma e é contada à parte; o faturamento dela entra no peso', () => {
    const g = somarGrupo([loja({ saldoMensal: -1000, faturamentoMensal: 100000 }), loja({ saldoMensal: null, vendaPerdidaMensal: null, faturamentoMensal: 100000 })]);
    expect(g.lojasNaSoma).toBe(1);
    expect(g.lojasSemDado).toBe(1);
    expect(g.saldoMensal).toBe(-1000);
    expect(g.faturamentoMensal).toBe(200000);
    expect(g.pesoNoFaturamentoPct).toBe(-0.5);
  });

  it('sem faturamento nenhum o peso é nulo (não zero); grupo vazio soma zero', () => {
    expect(somarGrupo([loja({ saldoMensal: -100, faturamentoMensal: null })]).pesoNoFaturamentoPct).toBeNull();
    expect(somarGrupo([])).toMatchObject({ saldoMensal: 0, saldoAnual: 0, pesoNoFaturamentoPct: null, lojasNaSoma: 0, lojasSemDado: 0 });
  });
});
