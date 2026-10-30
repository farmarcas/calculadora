import { useEffect } from "react";

const botoes = {
  primario: "bg-system-500 text-white hover:bg-system-600",
  secundario: "bg-white text-system-700 border border-system-500 hover:bg-system-50",
  perigo: "bg-white text-error-600 border border-error-500 hover:bg-error-50",
  texto: "text-system-700 hover:bg-system-50",
};

export const Botao = ({ tipo = "primario", className = "", ...p }) => (
  <button
    type="button"
    {...p}
    className={`inline-flex items-center justify-center gap-2 rounded-btn px-4 h-9 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${botoes[tipo]} ${className}`}
  />
);

export const Cartao = ({ titulo, subtitulo, acoes, children, className = "" }) => (
  <section className={`bg-surface-card border border-line rounded-card shadow-card ${className}`}>
    {(titulo || acoes) && (
      <header className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 border-b border-line">
        <div>
          <h2 className="m-0 text-base font-medium">{titulo}</h2>
          {subtitulo && <p className="mt-1 mb-0 text-xs text-ink-500">{subtitulo}</p>}
        </div>
        <div className="flex gap-2">{acoes}</div>
      </header>
    )}
    {children}
  </section>
);

const fichas = {
  ok: "bg-success-50 text-success-600",
  atencao: "bg-attention-50 text-attention-700",
  erro: "bg-error-50 text-error-600",
  neutro: "bg-surface-subtle text-ink-700",
};
export const Ficha = ({ tom = "neutro", children }) => (
  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${fichas[tom]}`}>{children}</span>
);

export const Aviso = ({ tom = "erro", children }) => (
  <div role="alert" className={`rounded-input px-4 py-3 text-sm ${fichas[tom]}`}>
    {children}
  </div>
);

export const Campo = ({ rotulo, children }) => (
  <label className="flex flex-col gap-1 text-xs font-medium text-ink-500">
    {rotulo}
    {children}
  </label>
);
export const entrada =
  "h-9 rounded-input border border-ink-300 bg-white px-3 text-sm text-ink-900 focus:outline-none focus:border-system-500";

export function Modal({ titulo, onClose, children, largo = false }) {
  useEffect(() => {
    const f = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(6,25,56,.4)" }} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-card shadow-pop w-full max-h-[90vh] overflow-auto ${largo ? "max-w-5xl" : "max-w-lg"}`}
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h2 className="m-0 text-base font-medium">{titulo}</h2>
          <button aria-label="Fechar" onClick={onClose} className="text-ink-500 text-xl leading-none">×</button>
        </header>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
