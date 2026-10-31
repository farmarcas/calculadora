// Aba da seção no endereço (?tela=escala&aba=cobertura|regras|equipe), sem biblioteca de rotas.
export const ABAS_SECAO = [["cobertura", "Cobertura e vendas"], ["regras", "Resultado por regra"], ["equipe", "Equipe no cálculo"]];
const VALIDAS = ABAS_SECAO.map(([id]) => id);

export const lerAbaDaUrl = () => {
  const aba = new URLSearchParams(window.location.search).get("aba");
  return VALIDAS.includes(aba) ? aba : "cobertura";
};
export const gravarAbaNaUrl = (aba) => {
  const p = new URLSearchParams(window.location.search);
  p.set("tela", "escala");
  p.set("aba", aba);
  window.history.replaceState(null, "", `${window.location.pathname}?${p}`);
};
