import { useEffect, useState } from "react";
import BarraSuperior from "./BarraSuperior.jsx";
import MenuLateral from "./MenuLateral.jsx";
import { gravarRecolhido, LARGURA_MINIMA_ABERTO, lerRecolhido } from "./estadoDoMenu.js";

const ID_MENU = "menu-principal";

// A casca: barra superior, menu lateral, faixa de contexto (quando a tela tem) e a área de conteúdo.
// Em tela estreita o menu fica recolhido e o botão da barra o abre como gaveta por cima do conteúdo.
export default function AppShell({ perfil, folha, onNavegar, onInicio, conta, faixa, children }) {
  const [recolhido, setRecolhido] = useState(() => lerRecolhido(window.innerWidth));
  const [estreito, setEstreito] = useState(() => window.innerWidth < LARGURA_MINIMA_ABERTO);
  const [gaveta, setGaveta] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${LARGURA_MINIMA_ABERTO}px)`);
    const ajustar = (e) => {
      setEstreito(!e.matches);
      setGaveta(false);
      if (e.matches) setRecolhido(lerRecolhido(window.innerWidth));
    };
    mq.addEventListener("change", ajustar);
    return () => mq.removeEventListener("change", ajustar);
  }, []);

  // Gaveta aberta: Esc fecha e devolve o foco ao botão da barra.
  useEffect(() => {
    if (!gaveta) return undefined;
    const esc = (e) => {
      if (e.key !== "Escape") return;
      setGaveta(false);
      document.querySelector(`button[aria-controls="${ID_MENU}"]`)?.focus();
    };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [gaveta]);

  const aberto = estreito ? gaveta : !recolhido;
  const alternar = () => {
    if (estreito) { setGaveta((g) => !g); return; }
    setRecolhido((r) => { gravarRecolhido(!r); return !r; });
  };
  const navegar = (f) => { setGaveta(false); onNavegar(f); };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-page)]">
      <BarraSuperior menuAberto={aberto} onAlternar={alternar} idMenu={ID_MENU} onInicio={onInicio} conta={conta} />
      <div className="relative flex min-h-0 flex-1">
        {estreito && gaveta && <div aria-hidden="true" onClick={() => setGaveta(false)} className="fixed inset-0 z-30 bg-black/30" />}
        <aside
          style={{ width: estreito || recolhido ? 72 : 280 }}
          className="relative z-40 shrink-0 bg-[var(--surface-card)] shadow-[var(--shadow-0)] transition-[width] duration-150 motion-reduce:transition-none"
        >
          <div className={estreito && gaveta ? "absolute inset-y-0 left-0 w-[280px] bg-[var(--surface-card)] shadow-[var(--shadow-3)]" : ""}>
            <MenuLateral id={ID_MENU} perfil={perfil} folha={folha} aberto={aberto} onNavegar={navegar} />
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          {faixa}
          <main id="conteudo" className="flex flex-col gap-6 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
