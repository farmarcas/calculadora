// Intervalo que não precisa de cobertura (spec 045): a pessoa em intervalo de até 2 horas continua contando como presente na
// hora; acima disso, o intervalo desconta como antes. Vale para todas as funções. Regra de referência: o jurídico confirma.
export const LIMITE_INTERVALO_SEM_COBERTURA_H = 2;

const EPS = 1e-9;

// O intervalo desconta a pessoa da cobertura só quando passa do limite.
export const intervaloDesconta = (ini: number | null, fim: number | null) =>
  ini != null && fim != null && fim - ini > LIMITE_INTERVALO_SEM_COBERTURA_H + EPS;
