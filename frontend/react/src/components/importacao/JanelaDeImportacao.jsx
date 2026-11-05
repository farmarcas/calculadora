import { useId, useRef } from "react";
import { Botao } from "../ui/index.jsx";
import { IconeFechar } from "./icones.jsx";
import useArmadilhaDeFoco from "./useArmadilhaDeFoco.js";

// Casca dos modais de importação: role="dialog", foco preso, Esc e × para fechar, foco devolvido a quem abriu.
// Enquanto `ocupado` (lendo ou enviando) a janela não fecha e os botões ficam desabilitados.
// `anuncio` é lido por leitores de tela (arquivo escolhido, "Lendo a planilha…").
export default function JanelaDeImportacao({ titulo, etiqueta, onFechar, ocupado = false, anuncio = "", textoPrincipal, onPrincipal, principalDesabilitado = false, rotuloCancelar = "Cancelar", children }) {
  const idTitulo = useId();
  const ref = useRef(null);
  useArmadilhaDeFoco(ref, { onEsc: onFechar, podeFechar: !ocupado });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(6,25,56,.4)" }}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-busy={ocupado}
        tabIndex={-1}
        className="flex max-h-[92vh] w-full max-w-[680px] flex-col rounded-[8px] bg-[var(--surface-card)] outline-none"
        style={{ boxShadow: "var(--shadow-4)" }}
      >
        <header className="flex items-start justify-between gap-3 px-6 pb-1 pt-5">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h2 id={idTitulo} className="m-0 text-xl font-bold text-[var(--text-strong)]">{titulo}</h2>
            {etiqueta && <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-0.5 text-xs font-bold text-[var(--text-secondary)]">{etiqueta}</span>}
          </div>
          <button type="button" aria-label="Fechar" onClick={onFechar} disabled={ocupado} className="-mr-2 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-btn border-0 bg-transparent text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--surface-subtle)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--border-focus)]">
            <IconeFechar />
          </button>
        </header>
        <div className="flex min-h-0 flex-col gap-4 overflow-auto px-6 pb-6 pt-2">{children}</div>
        <footer className="flex justify-end gap-3 border-t border-[var(--border-subtle)] px-6 py-4">
          <Botao tipo="texto" onClick={onFechar} disabled={ocupado}>{rotuloCancelar}</Botao>
          {textoPrincipal && <Botao onClick={onPrincipal} disabled={principalDesabilitado || ocupado} className="disabled:!bg-[var(--surface-muted)] disabled:!text-[var(--text-secondary)]">{textoPrincipal}</Botao>}
        </footer>
        <p className="sr-only" aria-live="polite">{anuncio}</p>
      </div>
    </div>
  );
}
