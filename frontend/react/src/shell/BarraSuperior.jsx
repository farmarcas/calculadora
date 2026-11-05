import { IconeMenu } from "./icones.jsx";

// Barra fixa de 80 px: botão do menu, logo do Radar e (à direita) a conta.
export default function BarraSuperior({ menuAberto, onAlternar, idMenu, onInicio, conta }) {
  return (
    <header className="sticky top-0 z-30 flex h-20 shrink-0 items-center gap-4 bg-[var(--surface-card)] px-4 shadow-[var(--shadow-0)] sm:px-6">
      <button
        type="button"
        aria-label={menuAberto ? "Recolher menu" : "Expandir menu"}
        aria-expanded={menuAberto}
        aria-controls={idMenu}
        onClick={onAlternar}
        className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-btn border-0 bg-transparent text-[var(--icon-default)] hover:bg-[var(--surface-subtle)] focus-visible:outline-2 focus-visible:outline-[var(--border-focus)] sm:h-10 sm:w-10"
      >
        <IconeMenu tamanho={22} />
      </button>
      <a
        href="/"
        aria-label="Radar, ir para o início"
        onClick={(e) => { e.preventDefault(); onInicio?.(); }}
        className="inline-flex items-center rounded-btn focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]"
      >
        <img src="/radar-logo.png" alt="Radar" width="152" height="28" className="block h-7 w-auto" />
      </a>
      <span className="flex-1" />
      {conta}
    </header>
  );
}
