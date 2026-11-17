import type { VendaLinha } from './vendas.js';

// A régua que mede a perda e o ganho de horários: o lucro bruto por hora (venda − CMV), quando o CMV é confiável, ou a
// venda (como sempre foi). Escolhida uma vez por loja e usada igual nos cenários, na Simulação, na lista e na comparação.
// O lucro bruto de cada hora vem do CMV da base (`margem` = venda − CMV, nulo sem CMV) ou, nas horas sem CMV, do CMV médio da
// loja (spec 034).
export type TipoRegua = 'margem' | 'venda';
// `sem_margem`: falta o CMV (nem por hora nem médio). `margem_parcial`: CMV em poucas horas e sem CMV médio.
// `margem_incoerente`: hora com CMV maior que a venda (ou negativo).
export type MotivoVenda = 'sem_margem' | 'margem_parcial' | 'margem_incoerente';
export type Regua = { tipo: TipoRegua; motivo?: MotivoVenda };

// Proporção mínima das linhas com venda que precisam ter lucro bruto positivo para valer, quando falta CMV em algumas horas.
export const COBERTURA_MINIMA_DE_MARGEM = 0.9;
const EPS = 1e-6;

// As horas sem CMV recebem venda × (1 − CMV médio da loja); sem CMV médio ficam como estão (nulas). Não altera as linhas
// originais. O CMV médio de 0 a 100 é percentual.
export const preencherComCmvMedio = (
  linhas: VendaLinha[],
  cmvMedioPct?: number | null,
): VendaLinha[] =>
  typeof cmvMedioPct !== 'number' || !Number.isFinite(cmvMedioPct)
    ? linhas
    : linhas.map((l) =>
        l.margem === null ? { ...l, margem: l.venda * (1 - cmvMedioPct / 100) } : l,
      );

// Nulo sem linhas (sem base hora a hora não há o que medir). Espera as linhas já preenchidas com o CMV médio.
export const reguaDaBase = (linhas: VendaLinha[]): Regua | null => {
  if (linhas.length === 0) return null;
  const comVenda = linhas.filter((l) => l.venda > 0);
  if (comVenda.length === 0) return { tipo: 'venda', motivo: 'sem_margem' };
  const comDado = linhas.filter((l) => l.margem !== null);
  if (comDado.length === 0) return { tipo: 'venda', motivo: 'sem_margem' };
  // CMV maior que a venda (lucro bruto negativo) ou negativo (lucro bruto maior que a venda) é erro de dado: nenhuma das
  // duas medidas se mistura com a outra.
  if (comDado.some((l) => (l.margem as number) < -EPS || (l.margem as number) > l.venda + EPS))
    return { tipo: 'venda', motivo: 'margem_incoerente' };
  // Todas as horas têm lucro bruto (CMV da hora ou CMV médio): vale, inclusive com lucro bruto zero.
  if (linhas.every((l) => l.margem !== null)) return { tipo: 'margem' };
  // Falta CMV em algumas horas e a loja não tem CMV médio: só vale se quase todas as horas com venda têm CMV.
  const totalMargem = comDado.reduce((s, l) => s + (l.margem as number), 0);
  if (totalMargem <= 0) return { tipo: 'venda', motivo: 'sem_margem' };
  const comMargem = comVenda.filter((l) => (l.margem ?? 0) > 0).length;
  if (comMargem / comVenda.length < COBERTURA_MINIMA_DE_MARGEM - EPS)
    return { tipo: 'venda', motivo: 'margem_parcial' };
  return { tipo: 'margem' };
};

// As mesmas linhas, com `venda` trocado pelo lucro bruto quando a régua é margem (horas sem lucro bruto valem zero). As
// linhas originais não são alteradas.
export const linhasNaRegua = (linhas: VendaLinha[], regua: Regua | null): VendaLinha[] =>
  regua?.tipo === 'margem' ? linhas.map((l) => ({ ...l, venda: l.margem ?? 0 })) : linhas;

export const palavraDaRegua = (regua: Regua | null) =>
  regua?.tipo === 'margem' ? 'margem' : 'venda';
