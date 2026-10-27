import { describe, expect, it } from 'vitest';
import { vendasPorDiaEHora, resumirVendas } from './vendas.js';

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

describe('vendasPorDiaEHora', () => {
  // 2026-03-02 e 2026-03-09 são segundas; 2026-03-03 é terça.
  const linhas = [
    { data: '2026-03-02', hora: 9, venda: 100, margem: 30, clientes: 5, unidades: 9 },
    { data: '2026-03-09', hora: 9, venda: 300, margem: 50, clientes: 5, unidades: 9 },
    { data: '2026-03-03', hora: 10, venda: 80, margem: 20, clientes: 2, unidades: 3 },
  ];

  it('divide pelo número de datas de cada dia da semana', () => {
    const r = vendasPorDiaEHora(linhas)!;
    expect(r.venda[0]![9]).toBe(200);
    expect(r.margem[0]![9]).toBe(40);
    expect(r.venda[1]![10]).toBe(80);
    expect(r.dias).toBe(3);
  });

  it('hora sem linha vale zero e sem linhas devolve nulo', () => {
    expect(vendasPorDiaEHora(linhas)!.venda[0]![10]).toBe(0);
    expect(vendasPorDiaEHora([])).toBeNull();
  });
});
