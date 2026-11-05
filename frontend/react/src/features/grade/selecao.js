// Seleção de simulações para comparar: de 2 a 4, na ordem em que foram marcadas (a primeira é a base).
import { MAX_COMPARACAO, MIN_COMPARACAO } from "./comparacao.js";

export const MENSAGEM_LIMITE = `Você pode comparar no máximo ${MAX_COMPARACAO} simulações.`;

// Marca ou desmarca `id`. Devolve as marcadas e se a tentativa foi barrada pelo limite.
export const alternarSelecao = (marcadas, id) => {
  if (marcadas.includes(id)) return { marcadas: marcadas.filter((x) => x !== id), barrada: false };
  if (marcadas.length >= MAX_COMPARACAO) return { marcadas, barrada: true };
  return { marcadas: [...marcadas, id], barrada: false };
};

// A barra de comparar só aparece com duas ou mais simulações marcadas.
export const mostrarBarra = (marcadas) => marcadas.length >= MIN_COMPARACAO;

export const textoDaBarra = (n) => `${n} simulações selecionadas. A primeira escolhida é a base da comparação.`;

// Descartadas não entram na comparação.
export const podeMarcar = (simulacao) => simulacao.status !== "descartada";

// Tira da seleção o que não está mais na lista (por exemplo, uma simulação descartada em outra aba).
export const marcadasValidas = (marcadas, lista) => marcadas.filter((id) => lista.some((s) => s.id === id && podeMarcar(s)));
