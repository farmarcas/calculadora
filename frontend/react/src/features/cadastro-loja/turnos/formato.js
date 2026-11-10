// Textos do faturamento por hora na tela de turnos (puro).
export const reais = (n) => `R$ ${Math.round(n).toLocaleString("pt-BR")}`;
export const TIPOS_DE_DIA = [["uteis", "Dias úteis"], ["sabado", "Sábado"], ["domingo", "Domingo"]];
export const nomeDoTipo = (id) => TIPOS_DE_DIA.find(([k]) => k === id)?.[1] ?? "Dias úteis";
export const rotuloHora = (h) => `${String(h).padStart(2, "0")}h`;
