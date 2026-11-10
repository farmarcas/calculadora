import { describe, expect, it } from 'vitest';
import {
  faturamentoDaLinha,
  faturamentoSchema,
  mesclarFaturamento,
  ocultarFaturamento,
} from './faturamento.js';

const linha = (o: Record<string, string>) => (k: string) => o[k] ?? '';

describe('faturamentoSchema', () => {
  it('aceita sete dias, mensal e CMV médio, com nulos', () => {
    const ok = faturamentoSchema.safeParse({
      dias: [100, 100, 100, 100, 150, 200, null],
      mensal: 4000,
      cmvPct: 65,
    });
    expect(ok.success).toBe(true);
  });
  it('aceita, e depois ignora, a margem antiga que ainda vier num pedido', () => {
    expect(faturamentoSchema.safeParse({ dias: [1, 1, 1, 1, 1, 1, 1], mensal: null, margemPct: 28 }).success).toBe(true);
  });
  it('aceita faturamento sem CMV médio', () => {
    expect(faturamentoSchema.safeParse({ dias: [1, 1, 1, 1, 1, 1, 1], mensal: null }).success).toBe(
      true,
    );
  });
  it('recusa negativo, dias a menos e CMV médio fora de 0–100', () => {
    const base = { dias: [1, 1, 1, 1, 1, 1, 1], mensal: null, cmvPct: null };
    expect(faturamentoSchema.safeParse({ ...base, dias: [-1, 1, 1, 1, 1, 1, 1] }).success).toBe(
      false,
    );
    expect(faturamentoSchema.safeParse({ ...base, dias: [1, 1] }).success).toBe(false);
    expect(faturamentoSchema.safeParse({ ...base, cmvPct: 101 }).success).toBe(false);
    expect(faturamentoSchema.safeParse({ ...base, cmvPct: -5 }).success).toBe(false);
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
  it('lê o CMV médio (%) e, vindo sozinho, marca que só ele veio (os valores de faturamento já guardados ficam)', () => {
    const junto = faturamentoDaLinha(linha({ fat_seg: '100', cmv_pct: '65,5' }));
    expect(junto.faturamento).toEqual({ dias: [100, null, null, null, null, null, null], mensal: null, cmvPct: 65.5 });
    const so = faturamentoDaLinha(linha({ cmv_pct: '65' }));
    expect(so.faturamento).toEqual({ dias: [null, null, null, null, null, null, null], mensal: null, cmvPct: 65, soCmv: true });
  });
  it('CMV médio fora de 0 a 100 ou inválido é recusado em português', () => {
    expect(faturamentoDaLinha(linha({ cmv_pct: '120' })).erro).toContain('CMV médio');
    expect(faturamentoDaLinha(linha({ cmv_pct: 'muito' })).erro).toContain('CMV médio');
  });
  it('planilha antiga com a coluna de margem (até 150) é aceita e a coluna é ignorada', () => {
    const r = faturamentoDaLinha(linha({ fat_seg: '100', margem_pct: '150' }));
    expect(r.erro).toBeUndefined();
    expect(r.faturamento).toEqual({ dias: [100, null, null, null, null, null, null], mensal: null });
    expect(faturamentoDaLinha(linha({ margem_pct: '28' }))).toEqual({});
  });
});

describe('mesclarFaturamento', () => {
  const novo = { dias: [1, 2, 3, 4, 5, 6, 7], mensal: 10 };
  it('mantém o CMV médio guardado quando o pedido não fala dele', () => {
    expect(mesclarFaturamento(novo, { cmvPct: 60 })).toEqual({ ...novo, cmvPct: 60 });
  });
  it('o CMV do pedido vale; null o limpa', () => {
    expect(mesclarFaturamento({ ...novo, cmvPct: 70 }, { cmvPct: 60 })).toEqual({ ...novo, cmvPct: 70 });
    expect(mesclarFaturamento({ ...novo, cmvPct: null }, { cmvPct: 60 })).toEqual(novo);
  });
  it('a margem antiga nunca é gravada, venha de onde vier', () => {
    expect(mesclarFaturamento({ ...novo, margemPct: 99 }, { margemPct: 30 })).toEqual(novo);
    expect(mesclarFaturamento(novo, null)).toEqual(novo);
  });
  it('só o CMV vindo da planilha mantém os valores de faturamento já guardados', () => {
    const planilha = { dias: [null, null, null, null, null, null, null], mensal: null, cmvPct: 65, soCmv: true };
    expect(mesclarFaturamento(planilha, { dias: [1, 2, 3, 4, 5, 6, 7], mensal: 50 })).toEqual({
      dias: [1, 2, 3, 4, 5, 6, 7],
      mensal: 50,
      cmvPct: 65,
    });
    // sem faturamento guardado, vira só o CMV
    expect(mesclarFaturamento(planilha, null)).toEqual({ dias: [null, null, null, null, null, null, null], mensal: null, cmvPct: 65 });
  });
  it('limpar o faturamento mantém o CMV médio guardado', () => {
    expect(mesclarFaturamento(null, { cmvPct: 65 })).toEqual({
      dias: [null, null, null, null, null, null, null],
      mensal: null,
      cmvPct: 65,
    });
    expect(mesclarFaturamento(null, { dias: [1] })).toBeNull();
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
