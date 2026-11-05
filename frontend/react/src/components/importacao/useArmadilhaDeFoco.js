import { useEffect, useRef } from "react";

export const FOCAVEIS = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Qual elemento recebe o foco ao apertar Tab (ou Shift+Tab) dentro da janela: o foco circula e nunca sai dela.
// `elementos` são os focáveis em ordem; `ativo` é o que tem o foco agora. Devolve o índice de quem deve receber o foco,
// ou nulo para deixar o navegador seguir o caminho normal.
export const proximoIndice = (total, indiceAtivo, voltar) => {
  if (total === 0) return null;
  if (indiceAtivo === -1) return voltar ? total - 1 : 0;
  if (voltar && indiceAtivo === 0) return total - 1;
  if (!voltar && indiceAtivo === total - 1) return 0;
  return null;
};

// Prende o foco dentro de `ref`, fecha com Esc (se `podeFechar`), trava a rolagem do corpo e, ao sair, devolve o foco
// a quem abriu a janela.
export default function useArmadilhaDeFoco(ref, { onEsc, podeFechar = true }) {
  const ultimo = useRef({ onEsc, podeFechar });
  ultimo.current = { onEsc, podeFechar };

  useEffect(() => {
    const abriu = document.activeElement;
    const raiz = ref.current;
    const rolagem = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const lista = () => [...(raiz?.querySelectorAll(FOCAVEIS) ?? [])].filter((e) => e.offsetParent !== null || e === document.activeElement);
    // Foco inicial: o primeiro controle da janela (ou a própria janela, se não houver nenhum).
    const primeiro = lista()[0];
    if (primeiro) primeiro.focus();
    else raiz?.focus();

    const aoTeclar = (e) => {
      if (e.key === "Escape") {
        if (ultimo.current.podeFechar) {
          e.stopPropagation();
          ultimo.current.onEsc?.();
        }
        return;
      }
      if (e.key !== "Tab") return;
      const itens = lista();
      const i = itens.indexOf(document.activeElement);
      const alvo = proximoIndice(itens.length, i, e.shiftKey);
      if (alvo !== null) {
        e.preventDefault();
        itens[alvo]?.focus();
      } else if (itens.length === 0) e.preventDefault();
    };
    document.addEventListener("keydown", aoTeclar, true);
    return () => {
      document.removeEventListener("keydown", aoTeclar, true);
      document.body.style.overflow = rolagem;
      if (abriu && typeof abriu.focus === "function" && document.contains(abriu)) abriu.focus();
    };
  }, [ref]);
}
