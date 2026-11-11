import { confirmarSaida } from "../features/cadastro-loja/guardaSaida.js";
import { IconeMenu, IconeRecolherMenu } from "./icones.jsx";

// Barra fixa de 80 px: botão do menu, logo do Radar e (à direita) a conta.
// Endereço do Radar (portal da Farmarcas): o logo leva para lá.
export const URL_RADAR = "https://radar.farmarcas.com.br/";

export default function BarraSuperior({ menuAberto, onAlternar, idMenu }) {
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
        {menuAberto ? <IconeRecolherMenu tamanho={22} /> : <IconeMenu tamanho={22} />}
      </button>
      <a
        href={URL_RADAR}
        aria-label="Radar, abrir o portal"
        onClick={(e) => { if (!confirmarSaida()) e.preventDefault(); }} // alterações não salvas no cadastro pedem confirmação antes de sair
        className="inline-flex items-center rounded-btn focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]"
      >
        <img src={`${import.meta.env.BASE_URL}radar-logo.png`} alt="Radar" width="152" height="28" className="block h-7 w-auto" />
      </a>
      <span className="flex-1" />
    </header>
  );
}
