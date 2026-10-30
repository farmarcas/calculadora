// Loja e aba no endereço (?tela=cadastros&loja=<id>&aba=equipe), sem biblioteca de rotas. Nada sensível vai no endereço.
const ABAS_VALIDAS = ["dados", "equipe", "regras"];

export const lerUrl = () => {
  const p = new URLSearchParams(window.location.search);
  const aba = p.get("aba");
  return { tela: p.get("tela"), loja: p.get("loja"), aba: ABAS_VALIDAS.includes(aba) ? aba : "dados" };
};

export const gravarUrl = ({ tela, loja, aba }) => {
  const p = new URLSearchParams(window.location.search);
  if (tela) p.set("tela", tela);
  if (loja) p.set("loja", loja);
  else p.delete("loja");
  if (loja && aba) p.set("aba", aba);
  else p.delete("aba");
  const q = p.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${q ? `?${q}` : ""}`);
};
