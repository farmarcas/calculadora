import { z } from 'zod';

const valor = z.number().min(0).max(1_000_000_000);

// Faturamento médio da loja: um valor por dia da semana (segunda … domingo), o mensal e a margem bruta média.
// Tudo opcional: dia fechado ou sem informação fica nulo.
export const faturamentoSchema = z
  .object({
    dias: z.array(valor.nullable()).length(7),
    mensal: valor.nullable(),
    margemPct: z.number().min(0).max(100).nullable(),
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

// Lê as colunas Fat_Seg…Fat_Dom, Fat_Mensal e Margem_Pct de uma linha. Nulo quando a linha não traz nada.
export const faturamentoDaLinha = (
  celula: (chave: string) => string,
): { faturamento?: Faturamento; erro?: string } => {
  const lidos = [
    ...DIAS_SIGLA.map((d) => numero(celula(`fat_${d}`))),
    numero(celula('fat_mensal')),
    numero(celula('margem_pct')),
  ];
  if (lidos.every((n) => n === null)) return {};
  if (lidos.some((n) => Number.isNaN(n)))
    return { erro: 'faturamento ou margem com valor inválido' };
  const margem = lidos[8]!;
  if (margem !== null && margem > 100) return { erro: 'margem acima de 100%' };
  return {
    faturamento: {
      dias: lidos.slice(0, 7) as (number | null)[],
      mensal: lidos[7]!,
      margemPct: margem,
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
