// Foco preso dentro de uma janela (spec 057), regras puras e sem React. O navegador cuida do Tab no meio da janela; só as pontas
// precisam de ajuda: Tab no último elemento volta ao primeiro, e Shift+Tab no primeiro vai ao último.

// Tudo o que recebe foco com o teclado.
export const SELETOR_FOCAVEL = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Para onde o foco deve ir quando a pessoa aperta Tab (ou Shift+Tab): o elemento que o código precisa focar à mão, ou `null` quando
// o navegador pode seguir sozinho. `elementos` são os focáveis da janela, em ordem; `atual`, o que tem o foco agora.
export const focoPreso = (elementos, atual, shift) => {
  if (!elementos.length) return null;
  const i = elementos.indexOf(atual);
  if (i === -1) return shift ? elementos[elementos.length - 1] : elementos[0]; // o foco saiu da janela (ou está na própria janela)
  if (shift && i === 0) return elementos[elementos.length - 1];
  if (!shift && i === elementos.length - 1) return elementos[0];
  return null;
};
