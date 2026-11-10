import { z } from 'zod';

const valor = z.number().min(0).max(1_000_000_000);

// Faturamento médio da loja: um valor por dia da semana (segunda … domingo) e o mensal.
// Tudo opcional: dia fechado ou sem informação fica nulo.
// `cmvPct` é o CMV médio da loja (% da venda líquida que volta ao fornecedor): padrão das horas sem CMV na base comercial.
// `margemPct` é um valor antigo, apagado pela migration da spec 034: se ainda vier num pedido, é ignorado.
export const faturamentoSchema = z
  .object({
    dias: z.array(valor.nullable()).length(7),
    mensal: valor.nullable(),
    cmvPct: z.number().min(0).max(100).nullable().optional(),
    margemPct: z.unknown().optional(),
  })
  .strict();
export type Faturamento = z.infer<typeof faturamentoSchema>;

export const DIAS_SIGLA = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const;

const numero = (texto: string) => {
  const t = texto.replace(/[R$\s%]/g, '');
  if (!t) return null;
  // "1.234,56" e "420.000" (pt-BR, ponto separa milhar) ou "1234.56"
  const milhar = /^\d{1,3}(\.\d{3})+$/.test(t);
  const n = Number(
    t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : milhar ? t.replace(/\./g, '') : t,
  );
  return Number.isFinite(n) && n >= 0 ? n : Number.NaN;
};

// Grava o faturamento novo. O CMV médio que já estava guardado fica quando o pedido não fala dele; `null` o limpa. A
// margem antiga nunca é gravada. `soCmv` (planilha que traz só o CMV médio) mantém os valores de faturamento já guardados.
// Faturamento limpo (null) com CMV médio guardado vira "sem valores" com o CMV preservado.
export type FaturamentoEntrada = Faturamento & { soCmv?: boolean };
export const mesclarFaturamento = (novo: FaturamentoEntrada | null, atual: unknown): Faturamento | null => {
  const antes = atual as { dias?: (number | null)[]; mensal?: number | null; cmvPct?: unknown } | null | undefined;
  const cmvAntes = typeof antes?.cmvPct === 'number' ? antes.cmvPct : undefined;
  const semValores = { dias: [null, null, null, null, null, null, null] as (number | null)[], mensal: null };
  if (novo === null) return cmvAntes !== undefined ? { ...semValores, cmvPct: cmvAntes } : null;
  const { margemPct: _antiga, soCmv, cmvPct, ...resto } = novo;
  const cmv = cmvPct === undefined ? cmvAntes : cmvPct;
  const base = soCmv && antes?.dias ? { dias: antes.dias, mensal: antes.mensal ?? null } : resto;
  return { ...base, ...(typeof cmv === 'number' ? { cmvPct: cmv } : {}) };
};

// Lê as colunas Fat_Seg…Fat_Dom, Fat_Mensal e CMV médio (%) de uma linha (a coluna de margem das planilhas antigas é
// ignorada). Vazio quando a linha não traz nada.
export const faturamentoDaLinha = (
  celula: (chave: string) => string,
): { faturamento?: FaturamentoEntrada; erro?: string } => {
  const lidos = [
    ...DIAS_SIGLA.map((d) => numero(celula(`fat_${d}`))),
    numero(celula('fat_mensal')),
  ];
  const cmv = numero(celula('cmv_pct'));
  if (lidos.every((n) => n === null) && cmv === null) return {};
  if (lidos.some((n) => Number.isNaN(n)))
    return { erro: 'faturamento com valor inválido' };
  if (cmv !== null && (Number.isNaN(cmv) || cmv > 100)) return { erro: 'CMV médio fora de 0 a 100' };
  const semFaturamento = lidos.every((n) => n === null);
  return {
    faturamento: {
      dias: lidos.slice(0, 7) as (number | null)[],
      mensal: lidos[7]!,
      ...(cmv !== null ? { cmvPct: cmv } : {}),
      ...(semFaturamento ? { soCmv: true } : {}),
    },
  };
};

// Faturamento é valor em reais: só o dono vê. Para os demais o campo nem existe na resposta.
export const ocultarFaturamento = <T extends { faturamento?: unknown }>(
  l: T,
  perfil: string,
): T => {
  if (perfil === 'TENANT_ADMIN') return l;
  const { faturamento: _omitido, ...resto } = l;
  return resto as T;
};
