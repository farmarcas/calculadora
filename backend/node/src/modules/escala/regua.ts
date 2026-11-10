import type { VendaLinha } from './vendas.js';

// A régua que mede a perda e o ganho de horários: a margem bruta por hora da base comercial, quando ela é confiável,
// ou a venda (como sempre foi). Escolhida uma vez por loja e usada igual nos cenários, na Simulação, na lista e na comparação.
export type TipoRegua = 'margem' | 'venda';
export type MotivoVenda = 'sem_margem' | 'margem_parcial' | 'margem_incoerente';
export type Regua = { tipo: TipoRegua; motivo?: MotivoVenda };

// Proporção mínima das linhas com venda que precisam ter margem positiva para a margem valer.
export const COBERTURA_MINIMA_DE_MARGEM = 0.9;
const EPS = 1e-6;

// Nulo sem linhas (sem base hora a hora não há o que medir).
export const reguaDaBase = (linhas: VendaLinha[]): Regua | null => {
  if (linhas.length === 0) return null;
  const comVenda = linhas.filter((l) => l.venda > 0);
  const totalMargem = linhas.reduce((s, l) => s + (l.margem || 0), 0);
  if (comVenda.length === 0 || totalMargem <= 0) return { tipo: 'venda', motivo: 'sem_margem' };
  // Margem maior que a venda da mesma hora é erro de dado: nenhuma das duas medidas se mistura com a outra.
  if (linhas.some((l) => (l.margem || 0) > l.venda + EPS)) return { tipo: 'venda', motivo: 'margem_incoerente' };
  const comMargem = comVenda.filter((l) => (l.margem || 0) > 0).length;
  if (comMargem / comVenda.length < COBERTURA_MINIMA_DE_MARGEM - EPS)
    return { tipo: 'venda', motivo: 'margem_parcial' };
  return { tipo: 'margem' };
};

// As mesmas linhas, com `venda` trocado pela margem quando a régua é margem. As linhas originais não são alteradas.
export const linhasNaRegua = (linhas: VendaLinha[], regua: Regua | null): VendaLinha[] =>
  regua?.tipo === 'margem' ? linhas.map((l) => ({ ...l, venda: l.margem || 0 })) : linhas;

export const palavraDaRegua = (regua: Regua | null) => (regua?.tipo === 'margem' ? 'margem' : 'venda');
