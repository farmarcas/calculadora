export const reais = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).replace(/ /g, " ");
// Impacto é um custo: aparece com o sinal de menos (U+2212).
export const impacto = (n) => (n === 0 ? reais(0) : `−${reais(Math.abs(n))}`);

const DIAS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];
// Junta números seguidos: [0,1,2,3,4] → "seg a sex"; [0,2] → "seg e qua".
const grupos = (xs) => xs.reduce((g, x) => (g.length && g[g.length - 1][1] === x - 1 ? [...g.slice(0, -1), [g[g.length - 1][0], x]] : [...g, [x, x]]), []);
const juntar = (partes) => (partes.length <= 1 ? (partes[0] ?? "") : `${partes.slice(0, -1).join(", ")} e ${partes[partes.length - 1]}`);

export const textoDeDias = (dias) => juntar(grupos(dias).map(([a, b]) => (a === b ? DIAS[a] : b === a + 1 ? `${DIAS[a]} e ${DIAS[b]}` : `${DIAS[a]} a ${DIAS[b]}`)));
export const textoDeHoras = (horas) => juntar(grupos(horas).map(([a, b]) => `${a}h–${b + 1}h`));

export const REGIMES = { simples: "Simples Nacional", presumido: "Lucro Presumido", real: "Lucro Real" };

export const NOMES_DIA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
// "07:00" → "07h"; "08:30" → "08h30".
export const horaCurta = (t) => (t ? (t.endsWith(":00") ? `${t.slice(0, 2)}h` : `${t.slice(0, 2)}h${t.slice(3)}`) : "");
export const faixa = (d) => (d.abre && d.fecha ? `${horaCurta(d.abre)}–${horaCurta(d.fecha)}` : "Fechado");

// Aceita "8:00", "08:00" e (só no fechamento) "24:00"; devolve "HH:mm" ou null.
export const lerHora = (txt, ehFechamento = false) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec((txt ?? "").trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (min > 59 || h > 24 || (h === 24 && (min !== 0 || !ehFechamento))) return null;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
};
export const minutos = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));

// Valor curto para o rótulo do gráfico: 1.700 → "1,7 mil".
export const curto = (n) => (n >= 1000 ? `${(n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil` : Math.round(n).toLocaleString("pt-BR"));
