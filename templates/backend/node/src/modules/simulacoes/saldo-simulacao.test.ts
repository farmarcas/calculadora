import { describe, expect, it } from 'vitest';
import { saldoDaSimulacao } from './saldo-simulacao.js';

const s = (
  folhaExtra: number | null,
  horaExtra: number | null,
  vendaEstimada: number | null,
  vendaQueSai: number | null,
) => saldoDaSimulacao({ folhaExtra, horaExtra, vendaEstimada, vendaQueSai });

describe('saldo da simulação (contra a folha atual)', () => {
  it('reduzindo: folha extra 0 e venda que deixa de entrar 41.916 = −41.916', () => {
    expect(s(0, 0, 0, 41916)).toBe(-41916);
  });
  it('abrindo mais: folha extra 4.200 e venda estimada 9.100 = +4.900', () => {
    expect(s(4200, 0, 9100, 0)).toBe(4900);
  });
  it('a hora extra entra na conta', () => {
    expect(s(1000, 500, 0, 0)).toBe(-1500);
    expect(s(0, 800, 2000, 300)).toBe(900);
  });
  it('tudo zero dá 0, nunca −0', () => {
    expect(Object.is(s(0, 0, 0, 0), 0)).toBe(true);
  });
  it('arredonda em centavos', () => {
    expect(s(10.005, 0, 0, 0)).toBe(-10.01);
  });
  it('falta de dado devolve nulo, nunca zero', () => {
    expect(s(null, 0, 0, 0)).toBeNull();
    expect(s(0, null, 0, 0)).toBeNull();
    expect(s(0, 0, null, 0)).toBeNull();
    expect(s(0, 0, 0, null)).toBeNull();
  });
});
