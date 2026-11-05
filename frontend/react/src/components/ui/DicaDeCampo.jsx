import { useEffect, useRef, useState } from "react";

// Ícone de informação (ⓘ) ao lado do rótulo de um campo, com a explicação em um balão. Abre ao passar o mouse, ao focar com o
// teclado (Tab) e ao tocar; fecha com Esc, ao clicar fora, ao tirar o mouse ou o foco. O balão tem no máximo 280 px, texto de
// 14 px e nunca cobre o campo: no computador abre acima do rótulo; no celular abre abaixo do campo.
//
// Uso: o rótulo do campo (o elemento que tem `relative`) recebe <DicaDeCampo id={id} rotulo="RAT (%)" texto="…" />, e o campo
// recebe aria-describedby={id}. O balão sempre existe no HTML (escondido quando fechado) para o leitor de tela ler a explicação
// pelo campo. `aDireita` alinha o balão pela borda direita do rótulo (para rótulos no lado direito de um card). `abaixo` abre o balão sempre embaixo do rótulo (para rótulos no alto de um card). `extra` é uma linha a mais abaixo do texto (ex.: "Com os seus valores: 3,0% do salário").
export default function DicaDeCampo({ id, rotulo, texto, extra = null, abaixo = false, aDireita = false }) {
  const [passou, setPassou] = useState(false);
  const [focou, setFocou] = useState(false);
  const [fixou, setFixou] = useState(false);
  const raiz = useRef(null);
  const aberto = passou || focou || fixou;

  useEffect(() => {
    if (!aberto) return undefined;
    const fechar = () => { setPassou(false); setFocou(false); setFixou(false); };
    const aoTeclar = (e) => { if (e.key === "Escape") { e.stopPropagation(); fechar(); } };
    const aoClicarFora = (e) => { if (raiz.current && !raiz.current.contains(e.target)) fechar(); };
    document.addEventListener("keydown", aoTeclar);
    document.addEventListener("pointerdown", aoClicarFora);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.removeEventListener("pointerdown", aoClicarFora);
    };
  }, [aberto]);

  return (
    <span ref={raiz} className="ml-1.5 inline-flex align-middle" onMouseEnter={() => setPassou(true)} onMouseLeave={() => setPassou(false)}>
      <button
        type="button"
        aria-label={`Explicação sobre ${rotulo}`}
        aria-describedby={id}
        aria-expanded={aberto}
        onFocus={() => setFocou(true)}
        onBlur={() => setFocou(false)}
        onClick={() => setFixou((v) => !v)}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-0 bg-transparent p-0 text-[var(--text-secondary)] cursor-pointer hover:text-[var(--system-500)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--border-focus)]"
      >
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </button>
      <span
        id={id}
        role="tooltip"
        hidden={!aberto}
        className={`absolute ${aDireita ? "right-0" : "left-0"} top-full z-30 mt-1 w-[min(280px,calc(100vw-3rem))] rounded-card border border-[var(--border-default)] bg-[var(--surface-card)] p-3 text-sm font-normal normal-case leading-5 text-[var(--text-strong)] shadow-card ${abaixo ? "" : "sm:bottom-full sm:top-auto sm:mb-1 sm:mt-0"}`}
      >
        {texto}
        {extra && <span className="mt-2 block font-bold">{extra}</span>}
      </span>
    </span>
  );
}
