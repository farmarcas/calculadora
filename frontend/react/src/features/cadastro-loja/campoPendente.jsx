import { createContext, useContext } from "react";

// Destaque dos campos que faltam preencher: anel amarelo, selo "Preencher" / "✓ Preenchido" e o motivo em uma linha.
// `mapa` vem de estadoDosCampos; sem provedor (ou sem o campo no mapa) nada muda no campo.
const Contexto = createContext({});
export const CamposPendentes = ({ mapa, children }) => <Contexto.Provider value={mapa ?? {}}>{children}</Contexto.Provider>;
export const usarCampos = () => useContext(Contexto);

export const classeDoCampo = (mapa, campo) => (mapa[campo]?.estado === "pendente" ? "cl-pendente" : "");
export const descricaoDoCampo = (mapa, campo) => (mapa[campo]?.estado === "pendente" ? `porque-${campo}` : undefined);
// O primeiro campo pendente cujo nome começa por `prefixo` (para uma frase só em uma lista de campos, como o faturamento por dia).
export const primeiroPendente = (mapa, prefixo) => Object.keys(mapa).find((c) => c.startsWith(prefixo) && mapa[c].estado === "pendente");

export function SeloCampo({ campo }) {
  const e = usarCampos()[campo];
  if (!e) return null;
  return e.estado === "pendente"
    ? <span className="ml-2 inline-flex items-center rounded-full px-2 text-xs font-bold text-[var(--text-strong)]" style={{ background: "var(--func-attention-100)" }}>Preencher</span>
    : <span className="ml-2 inline-flex items-center rounded-full px-2 text-xs font-bold text-[var(--text-strong)]" style={{ background: "var(--func-success-100)" }}>✓ Preenchido</span>;
}

export function MotivoCampo({ campo }) {
  const e = usarCampos()[campo];
  if (e?.estado !== "pendente") return null;
  return <span id={`porque-${campo}`} className="text-xs text-[var(--text-secondary)]">{e.porque}</span>;
}
