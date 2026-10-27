import { describe, expect, it } from 'vitest';
import { resumirVendas } from './vendas.js';

describe('resumirVendas', () => {
  it('tira a média por dia e aponta as horas de maior venda', () => {
    const r = resumirVendas([
      { data: '2026-09-01', hora: 9, venda: 100, margem: 30, clientes: 10, unidades: 20 },
      { data: '2026-09-02', hora: 9, venda: 300, margem: 90, clientes: 30, unidades: 60 },
      { data: '2026-09-01', hora: 18, venda: 800, margem: 200, clientes: 50, unidades: 90 },
    ])!;
    expect(r.periodo).toEqual({ inicio: '2026-09-01', fim: '2026-09-02', dias: 2 });
    expect(r.horas.find((h) => h.hora === 9)!.vendaMedia).toBe(200);
    expect(r.top[0]!.hora).toBe(18);
  });
  it('sem linhas, sem resumo', () => expect(resumirVendas([])).toBeNull());
});
