// Preferência de cada pessoa neste navegador: menu aberto ou recolhido. Leitura e escrita nunca derrubam a tela.
export const CHAVE_MENU = "menu:recolhido";
export const LARGURA_MINIMA_ABERTO = 768;

// Padrão por largura: aberto a partir de 768 px, recolhido abaixo.
export const padraoPorLargura = (largura) => largura < LARGURA_MINIMA_ABERTO;

export const lerRecolhido = (largura, armazenamento = globalThis.localStorage) => {
  try {
    const v = armazenamento?.getItem(CHAVE_MENU);
    if (v === "1") return true;
    if (v === "0") return false;
  } catch {
    /* navegador sem armazenamento: usa o padrão */
  }
  return padraoPorLargura(largura);
};

export const gravarRecolhido = (recolhido, armazenamento = globalThis.localStorage) => {
  try {
    armazenamento?.setItem(CHAVE_MENU, recolhido ? "1" : "0");
  } catch {
    /* sem armazenamento: a escolha vale só nesta visita */
  }
};
