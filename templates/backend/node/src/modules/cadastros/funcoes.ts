// Cargos que entram no cálculo da escala. Qualquer outro (inclusive Apoio e Perfumaria, que existiram) é "Outros cargos",
// fora do cálculo: o dado antigo no banco fica como está e é lido como "fora do cálculo".
export const FUNCOES_NO_CALCULO = ['Farmacêutico', 'Atendimento', 'Caixa'] as const;

export const funcaoNoCalculo = (funcao: string | null | undefined): string | null =>
  funcao && (FUNCOES_NO_CALCULO as readonly string[]).includes(funcao) ? funcao : null;

// Só as funções que contam: tira de um mapa por função (mínimos, salários) as chaves antigas como Apoio e Perfumaria.
export const soNoCalculo = <T>(mapa: Record<string, T> | null | undefined): Record<string, T> =>
  Object.fromEntries(Object.entries(mapa ?? {}).filter(([f]) => funcaoNoCalculo(f) !== null));

// Para validar entradas: descarta só as chaves antigas (Apoio, Perfumaria) em vez de recusar a gravação de um dado salvo antes
// da mudança; qualquer outra função desconhecida continua sendo recusada.
const FUNCOES_ANTIGAS = ['Apoio', 'Perfumaria'];
export const descartarFuncoesFora = (v: unknown) =>
  v && typeof v === 'object' && !Array.isArray(v)
    ? Object.fromEntries(Object.entries(v).filter(([f]) => !FUNCOES_ANTIGAS.includes(f)))
    : v;
