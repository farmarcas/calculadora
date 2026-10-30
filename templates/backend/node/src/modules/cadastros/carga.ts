// Convenção do motor de regras: carga mensal = carga semanal × 5 (220 h = 44 h, 200 h = 40 h).
export const semanalDeMensal = (mensal: number) => Math.round(mensal / 5);
export const mensalDeSemanal = (semanal: number) => semanal * 5;

// "08:30" ↔ 8.5 (horas decimais, como o turno atual da escala).
export const horaParaDecimal = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h! + m! / 60;
};
export const decimalParaHora = (d: number) => {
  const total = Math.round(d * 60);
  const h = Math.floor(total / 60) % 24;
  return `${String(h).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};
