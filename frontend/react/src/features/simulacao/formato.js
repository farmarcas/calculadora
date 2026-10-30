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
