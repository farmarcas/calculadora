import { describe, expect, it } from 'vitest';
import {
  faturamentoDaLinha,
  faturamentoSchema,
  manterMargem,
  ocultarFaturamento,
} from './faturamento.js';

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
  it('aceita faturamento sem margem (a tela não a envia mais)', () => {
    expect(faturamentoSchema.safeParse({ dias: [1, 1, 1, 1, 1, 1, 1], mensal: null }).success).toBe(
      true,
    );
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
      }),
    );
    expect(r.faturamento).toEqual({
      dias: [12000.5, null, null, null, null, 18000, null],
      mensal: 420000,
    });
  });
  it('linha sem nenhuma coluna de faturamento não devolve nada', () => {
    expect(faturamentoDaLinha(linha({}))).toEqual({});
  });
  it('avisa valor inválido de faturamento', () => {
    expect(faturamentoDaLinha(linha({ fat_seg: 'muito' })).erro).toContain('inválido');
  });
  it('planilha antiga com a coluna de margem (até 150) é aceita e a coluna é ignorada', () => {
    const r = faturamentoDaLinha(linha({ fat_seg: '100', margem_pct: '150' }));
    expect(r.erro).toBeUndefined();
    expect(r.faturamento).toEqual({
      dias: [100, null, null, null, null, null, null],
      mensal: null,
    });
    expect(faturamentoDaLinha(linha({ margem_pct: '28' }))).toEqual({});
  });
});

describe('manterMargem', () => {
  const novo = { dias: [1, 2, 3, 4, 5, 6, 7], mensal: 10 };
  it('mantém a margem que já estava guardada e ignora a do pedido', () => {
    expect(manterMargem({ ...novo, margemPct: 99 }, { margemPct: 30 })).toEqual({
      ...novo,
      margemPct: 30,
    });
  });
  it('sem margem guardada, não cria margem', () => {
    expect(manterMargem({ ...novo, margemPct: 50 }, { dias: [], margemPct: null })).toEqual(novo);
    expect(manterMargem(novo, null)).toEqual(novo);
  });
  it('limpar o faturamento mantém a margem guardada', () => {
    expect(manterMargem(null, { margemPct: 30 })).toEqual({
      dias: [null, null, null, null, null, null, null],
      mensal: null,
      margemPct: 30,
    });
    expect(manterMargem(null, { margemPct: null })).toBeNull();
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
