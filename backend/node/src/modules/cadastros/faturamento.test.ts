import { describe, expect, it } from 'vitest';
import { faturamentoDaLinha, faturamentoSchema, ocultarFaturamento } from './faturamento.js';

const linha = (o: Record<string, string>) => (k: string) => o[k] ?? '';

describe('faturamentoSchema', () => {
  it('aceita sete dias, mensal e margem, com nulos', () => {
    const ok = faturamentoSchema.safeParse({
      dias: [100, 100, 100, 100, 150, 200, null],
      mensal: 4000,
      margemPct: 28,
    });
    expect(ok.success).toBe(true);
  });
  it('recusa negativo, dias a menos e margem fora de 0–100', () => {
    const base = { dias: [1, 1, 1, 1, 1, 1, 1], mensal: null, margemPct: null };
    expect(faturamentoSchema.safeParse({ ...base, dias: [-1, 1, 1, 1, 1, 1, 1] }).success).toBe(
      false,
    );
    expect(faturamentoSchema.safeParse({ ...base, dias: [1, 1] }).success).toBe(false);
    expect(faturamentoSchema.safeParse({ ...base, margemPct: 101 }).success).toBe(false);
  });
});

describe('faturamentoDaLinha', () => {
  it('lê valores em formato brasileiro e deixa em branco o que não veio', () => {
    const r = faturamentoDaLinha(
      linha({
        fat_seg: 'R$ 12.000,50',
        fat_sab: '18000',
        fat_mensal: '420.000',
        margem_pct: '28%',
      }),
    );
    expect(r.faturamento).toEqual({
      dias: [12000.5, null, null, null, null, 18000, null],
      mensal: 420000,
      margemPct: 28,
    });
  });
  it('linha sem nenhuma coluna de faturamento não devolve nada', () => {
    expect(faturamentoDaLinha(linha({}))).toEqual({});
  });
  it('avisa valor inválido ou margem acima de 100', () => {
    expect(faturamentoDaLinha(linha({ fat_seg: 'muito' })).erro).toContain('inválido');
    expect(faturamentoDaLinha(linha({ margem_pct: '150' })).erro).toContain('100');
  });
});

describe('ocultarFaturamento', () => {
  const loja = { nome: 'A', faturamento: { dias: [], mensal: 1, margemPct: 1 } };
  it('o dono recebe o faturamento', () => {
    expect(ocultarFaturamento(loja, 'TENANT_ADMIN')).toHaveProperty('faturamento');
  });
  it('gestor e consulta nem recebem a chave', () => {
    expect(ocultarFaturamento(loja, 'SCHEDULE_MANAGER')).not.toHaveProperty('faturamento');
    expect(ocultarFaturamento(loja, 'SCHEDULE_VIEWER')).not.toHaveProperty('faturamento');
  });
});
