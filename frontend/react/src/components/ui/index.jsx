import { useEffect } from "react";

// Alquimia DS · Button: 40 px (normal) ou 32 px (pequeno), 14 px / 12 px em negrito, raio de 4 px.
// primario = primary-filled · secundario = primary-outline · texto = primary-unfilled (ação de linha: pequeno).
const botoes = {
  primario: "bg-system-500 text-white border border-transparent hover:bg-system-600 active:bg-system-700 disabled:bg-system-200",
  secundario: "bg-transparent text-system-500 border border-system-500 hover:bg-system-50 hover:text-system-500 active:text-system-700 active:border-system-700 disabled:text-system-200 disabled:border-system-200",
  perigo: "bg-transparent text-error-500 border border-error-500 hover:bg-error-50",
  texto: "bg-transparent text-system-500 border border-transparent hover:bg-system-50 active:text-system-700 disabled:text-system-200",
};
const tamanhos = { normal: "h-10 px-4 text-sm", pequeno: "h-8 px-3 text-xs" };

export const Botao = ({ tipo = "primario", tamanho, className = "", ...p }) => (
  <button
    type="button"
    {...p}
    className={`inline-flex items-center justify-center gap-2 rounded-btn font-bold whitespace-nowrap transition-colors disabled:cursor-not-allowed ${tamanhos[tamanho ?? (tipo === "texto" ? "pequeno" : "normal")]} ${botoes[tipo]} ${className}`}
  />
);

// Ícone de upload (Lucide, traço de 2 px), herda a cor do texto. Decorativo: o botão já tem o rótulo.
export const IconeUpload = ({ tamanho = 18 }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
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

// Alquimia DS · Pill (status): arredondado, 12 px em negrito, 28 px de altura. O texto usa o tom escuro do próprio DS
// (o mesmo do Toast) para manter o contraste, no lugar do tom claro da Pill sobre o fundo suave.
const fichas = {
  ok: "bg-[var(--func-success-100)] text-[#3d5f00]",
  atencao: "bg-[var(--func-attention-100)] text-[#7a5200]",
  erro: "bg-[var(--func-warning-50)] text-[#8b0020]",
  neutro: "bg-surface-subtle text-ink-700",
};
export const Ficha = ({ tom = "neutro", children }) => (
  <span className={`inline-flex items-center rounded-full h-7 px-3.5 text-xs font-bold whitespace-nowrap ${fichas[tom]}`}>{children}</span>
);

// Alquimia DS · Toast: mensagem de status de largura total, 48 px no mínimo, raio de 8 px.
const avisos = {
  ok: "bg-[var(--func-success-100)] text-[#3d5f00]",
  atencao: "bg-[var(--func-attention-100)] text-[#7a5200]",
  erro: "bg-[var(--func-warning-50)] text-[#8b0020]",
  neutro: "bg-system-50 text-[#0b4a8f]",
};
export const Aviso = ({ tom = "erro", children }) => (
  <div role="alert" className={`flex items-center min-h-12 rounded-card px-4 py-3 text-base ${avisos[tom]}`}>
    {children}
  </div>
);

// Alquimia DS · Field: rótulo de 14 px em texto secundário acima do controle, 4 px de distância.
export const Campo = ({ rotulo, children }) => (
  <label className="flex flex-col gap-1 text-sm text-ink-700">
    {rotulo}
    {children}
  </label>
);
// Alquimia DS · Input (variante de 36 px): borda de 1 px que passa a 2 px azul no foco, sem mexer no layout.
export const entrada =
  "h-9 rounded-input border border-line bg-white px-3 text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none focus:border-system-500 focus:shadow-[inset_0_0_0_1px_var(--system-500)] disabled:bg-surface-subtle disabled:text-ink-500 disabled:cursor-not-allowed";

// Alquimia DS · Tabs: sublinhado de 3 px azul na aba ativa, texto de 16 px (negrito quando ativa).
export function Abas({ opcoes = [], valor, onChange, rotulo, className = "" }) {
  return (
    <div className={`flex gap-4 border-b border-line ${className}`} role="tablist" aria-label={rotulo}>
      {opcoes.map(([id, texto]) => {
        const ativa = id === valor;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={ativa}
            onClick={() => onChange(id)}
            className={`bg-transparent border-0 px-1.5 pt-2 pb-2.5 text-base cursor-pointer ${ativa ? "font-bold text-ink-900" : "font-normal text-ink-700"}`}
            style={{ boxShadow: ativa ? "inset 0 -3px 0 var(--color-primary)" : "none" }}
          >
            {texto}
          </button>
        );
      })}
    </div>
  );
}

// Alquimia DS · Segmented: item ativo com fundo escuro e texto branco em negrito, 40 px de altura.
export function Segmentado({ opcoes = [], valor, onChange, rotulo, desabilitado = false }) {
  return (
    <div role="group" aria-label={rotulo} className="inline-flex overflow-hidden rounded-btn border border-[var(--border-default)] bg-[var(--surface-card)]">
      {opcoes.map(([id, texto, extra]) => {
        const ativo = id === valor;
        const fora = desabilitado || extra?.desabilitado;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={ativo}
            disabled={fora}
            title={extra?.dica}
            onClick={() => onChange(id)}
            className={`h-10 min-w-10 px-4 text-sm border-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--border-focus)] disabled:cursor-not-allowed ${ativo ? "bg-[var(--neutral-dark-900)] text-white font-bold" : extra?.desabilitado ? "bg-[var(--surface-muted)] text-[var(--text-disabled)]" : "bg-transparent text-[var(--text-secondary)] disabled:opacity-60"}`}
          >
            {texto}
          </button>
        );
      })}
    </div>
  );
}

// Passo numerado de uma tela em etapas: círculo de 24 px, título e subtítulo.
export const Passo = ({ numero, titulo, subtitulo, semMargem = false, children }) => (
  <section aria-labelledby={`passo-${numero}`} className="rounded-card border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-card">
    <header className="flex items-start gap-3 px-6 pt-5 pb-4">
      <span aria-hidden="true" className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--neutral-dark-900)] text-xs font-bold text-white">{numero}</span>
      <div className="min-w-0">
        <h2 id={`passo-${numero}`} className="m-0 text-lg font-bold text-[var(--text-strong)]">{titulo}</h2>
        {subtitulo && <p className="m-0 mt-0.5 text-sm text-[var(--text-secondary)]">{subtitulo}</p>}
      </div>
    </header>
    <div className={semMargem ? "" : "px-6 pb-6"}>{children}</div>
  </section>
);

// Alquimia DS · Table: cabeçalho sobre fundo suave, 14 px em negrito, sem maiúsculas; linhas separadas por 1 px.
export const TH = "text-left bg-surface-subtle text-sm font-bold text-ink-900 whitespace-nowrap";
export const TD = "text-sm text-ink-900 border-t border-line";

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
        className={`bg-white border border-line rounded-card shadow-pop w-full max-h-[90vh] overflow-auto ${largo ? "max-w-5xl" : "max-w-lg"}`}
      >
        <header className="flex items-center justify-between px-6 pt-6">
          <h2 className="m-0 text-2xl font-bold text-ink-900">{titulo}</h2>
          <button aria-label="Fechar" onClick={onClose} className="text-ink-500 text-xl leading-none">×</button>
        </header>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
