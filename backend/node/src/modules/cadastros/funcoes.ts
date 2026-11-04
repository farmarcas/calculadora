// Cargos que entram no cálculo da escala. Qualquer outro (inclusive Apoio e Perfumaria, que existiram) é "Outros cargos",
// fora do cálculo: o dado antigo no banco fica como está e é lido como "fora do cálculo".
export const FUNCOES_NO_CALCULO = ['Farmacêutico', 'Atendimento', 'Caixa'] as const;

export const funcaoNoCalculo = (funcao: string | null | undefined): string | null =>
  funcao && (FUNCOES_NO_CALCULO as readonly string[]).includes(funcao) ? funcao : null;
