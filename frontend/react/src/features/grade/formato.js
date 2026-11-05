// Formatos da lista e da comparação de simulações: reais com sinal (− é U+2212), horas e o tipo do cenário.

const MENOS = "−";
export const VAZIO = "—";

const inteiro = (n) => Math.round(Math.abs(n)).toLocaleString("pt-BR");

// R$ 2.299 (sem sinal). Valor ausente vira "—".
export const reais = (n) => (n == null || Number.isNaN(n) ? VAZIO : `${n < 0 ? MENOS : ""}R$ ${inteiro(n)}`);

// +R$ 4.900 / −R$ 2.299 / R$ 0: o sinal vem sempre junto do número (a cor nunca é o único sinal).
export const reaisComSinal = (n) => {
  if (n == null || Number.isNaN(n)) return VAZIO;
  const r = Math.round(n);
  if (r === 0) return "R$ 0";
  return `${r > 0 ? "+" : MENOS}R$ ${inteiro(r)}`;
};

export const horas = (n) => (n == null ? VAZIO : `${Math.round(n * 100) / 100}h`);
export const horasPorSemana = (n) => (n == null ? VAZIO : `${horas(n)} por semana`);

export const TIPOS = { mantem: "Mantém horários", reduz: "Reduz horários", amplia: "Amplia horários" };
export const tipoTexto = (t) => TIPOS[t] ?? "";

export const SITUACOES = { rascunho: ["atencao", "Rascunho"], gravada: ["ok", "Gravada"], descartada: ["neutro", "Descartada"] };

export const DICA_DESATUALIZADA = "Os dados da loja mudaram depois que esta simulação foi gravada. Abra e confira antes de usar.";
