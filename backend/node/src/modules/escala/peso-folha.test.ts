import { describe, expect, it } from 'vitest';
import { pesoDaFolha } from './peso-folha.js';

const base = { vendaPct: 0 };

describe('pesoDaFolha (conta única de Cenários e Simulação)', () => {
  it('Cosmópolis: 8,0% → 9,7%, +1,7 e R$ 7.659', () => {
    expect(pesoDaFolha({ ...base, folhaHoje: 36037.6, custoAdicional: 7659.08, faturamento: 450567 })).toEqual({
      hoje: 8,
      depois: 9.7,
      aumentoPp: 1.7,
      aumentoMensal: 7659,
    });
  });
  it('Paulínia: 10,3% → 14,7%, +4,4 e R$ 11.112', () => {
    expect(pesoDaFolha({ ...base, folhaHoje: 25677.88, custoAdicional: 11112.32, faturamento: 249921 })).toEqual({
      hoje: 10.3,
      depois: 14.7,
      aumentoPp: 4.4,
      aumentoMensal: 11112,
    });
  });
  it('a diferença usa os pesos já arredondados (8,04 → 9,66 dá +1,7)', () => {
    const r = pesoDaFolha({ ...base, folhaHoje: 36180, custoAdicional: 7290, faturamento: 450000 })!;
    expect([r.hoje, r.depois, r.aumentoPp]).toEqual([8, 9.7, 1.7]);
  });
  it('folha igual com a venda caindo: o peso sobe só pela venda', () => {
    const r = pesoDaFolha({ folhaHoje: 36037.6, custoAdicional: 0, faturamento: 450567, vendaPct: -2.4 })!;
    expect(r.aumentoMensal).toBe(0);
    expect(r.depois).toBeGreaterThan(r.hoje);
  });
  it('folha que cai: diferença e reais negativos', () => {
    const r = pesoDaFolha({ ...base, folhaHoje: 36037.6, custoAdicional: -2340, faturamento: 450567 })!;
    expect([r.depois, r.aumentoPp, r.aumentoMensal]).toEqual([7.5, -0.5, -2340]);
  });
  it('sem folha, sem faturamento ou sem custo: nulo', () => {
    expect(pesoDaFolha({ ...base, folhaHoje: null, custoAdicional: 0, faturamento: 450567 })).toBeNull();
    expect(pesoDaFolha({ ...base, folhaHoje: 1000, custoAdicional: 0, faturamento: null })).toBeNull();
    expect(pesoDaFolha({ ...base, folhaHoje: 1000, custoAdicional: 0, faturamento: 0 })).toBeNull();
    expect(pesoDaFolha({ ...base, folhaHoje: 1000, custoAdicional: null, faturamento: 5000 })).toBeNull();
  });
});
