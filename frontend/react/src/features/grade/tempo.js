export const NOMES_DIA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

// Horas decimais (8.25) ↔ "08:15".
export const hhmm = (h) => {
  const t = Math.round(h * 60);
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};
export const lerHhmm = (s) => {
  if (!s) return null;
  const [h, m] = s.split(":").map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h + m / 60 : null;
};
export const quarto = (h) => Math.round(h * 4) / 4;
export const limitar = (v, a, b) => Math.min(b, Math.max(a, v));

export const horasLiquidas = (t) => t.saida - t.entrada - (t.iniIntervalo != null && t.fimIntervalo != null ? t.fimIntervalo - t.iniIntervalo : 0);
