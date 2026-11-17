import { describe, expect, it } from 'vitest';
import { saldoDaOperacao } from './saldo-operacao.js';

const s = (
  custo: number | null,
  perdida: number | null,
  estimada: number | null = 0,
  economia = 0,
) =>
  saldoDaOperacao({
    economiaFolha: economia,
    custoFolha: custo,
    vendaEstimada: estimada,
    vendaPerdida: perdida,
  });

describe('saldo da operação (contra a folha atual)', () => {
  it('Cenário 1: custo de folha e nenhuma venda perdida = −6.480', () => {
    expect(s(6480, 0)).toBe(-6480);
  });
  it('Cenário 2: sem custo e venda que deixa de entrar = −64.968', () => {
    expect(s(0, 64968)).toBe(-64968);
  });
  it('Cenário 3 reduzindo: custo 1.013 e venda perdida 31.200 = −32.213', () => {
    expect(s(1013, 31200)).toBe(-32213);
  });
  it('Cenário 3 ampliando: custo 8.920 e venda estimada 38.200 = +29.280', () => {
    expect(s(8920, 0, 38200)).toBe(29280);
  });
  it('economia de folha soma: economia 2.140 sem venda perdida = +2.140', () => {
    expect(s(0, 0, 0, 2140)).toBe(2140);
  });
  it('tudo zero dá 0, nunca −0', () => {
    expect(Object.is(s(0, 0), 0)).toBe(true);
  });
  it('arredonda em centavos', () => {
    expect(s(0.004, 0.001)).toBe(0);
    expect(s(10.005, 0)).toBe(-10.01);
  });
  it('falta de dado devolve nulo, nunca zero', () => {
    expect(s(null, 0)).toBeNull();
    expect(s(0, null)).toBeNull();
    expect(s(0, 0, null)).toBeNull();
    expect(
      saldoDaOperacao({ economiaFolha: null, custoFolha: 0, vendaEstimada: 0, vendaPerdida: 0 }),
    ).toBeNull();
  });
});
