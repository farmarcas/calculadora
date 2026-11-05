import { z } from 'zod';

const valor = z.number().min(0).max(1_000_000_000);

// Faturamento médio da loja: um valor por dia da semana (segunda … domingo) e o mensal.
// Tudo opcional: dia fechado ou sem informação fica nulo.
// `margemPct` é um valor antigo: continua guardado, mas não tem tela, não vem de planilha, não entra em conta nenhuma
// e nenhuma gravação o altera (ver `manterMargem`).
export const faturamentoSchema = z
  .object({
    dias: z.array(valor.nullable()).length(7),
    mensal: valor.nullable(),
    margemPct: z.number().min(0).max(100).nullable().optional(),
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

// Grava o faturamento novo mantendo a margem que já estava guardada: o que vier de margem no pedido é ignorado.
// Faturamento limpo (null) com margem guardada vira "sem valores" com a margem preservada, para não perdê-la.
export const manterMargem = (novo: Faturamento | null, atual: unknown): Faturamento | null => {
  const guardada = (atual as { margemPct?: unknown } | null | undefined)?.margemPct;
  const margem = typeof guardada === 'number' ? { margemPct: guardada } : {};
  if (novo === null)
    return 'margemPct' in margem
      ? { dias: [null, null, null, null, null, null, null], mensal: null, ...margem }
      : null;
  const { margemPct: _ignorada, ...resto } = novo;
  return { ...resto, ...margem };
};

// Lê as colunas Fat_Seg…Fat_Dom e Fat_Mensal de uma linha (a coluna de margem das planilhas antigas é ignorada).
// Nulo quando a linha não traz nada.
export const faturamentoDaLinha = (
  celula: (chave: string) => string,
): { faturamento?: Faturamento; erro?: string } => {
  const lidos = [
    ...DIAS_SIGLA.map((d) => numero(celula(`fat_${d}`))),
    numero(celula('fat_mensal')),
  ];
  if (lidos.every((n) => n === null)) return {};
  if (lidos.some((n) => Number.isNaN(n)))
    return { erro: 'faturamento com valor inválido' };
  return {
    faturamento: {
      dias: lidos.slice(0, 7) as (number | null)[],
      mensal: lidos[7]!,
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
