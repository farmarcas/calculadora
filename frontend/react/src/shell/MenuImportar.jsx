import { useEffect, useId, useRef, useState } from "react";
import { Botao } from "../components/ui/index.jsx";
import { IconeEnvio } from "./icones.jsx";
import { proximoItem } from "./importar.js";

// Botão "Importar" (o mesmo nas telas de Cadastro e de Escala) que abre um menu com o que a pessoa pode importar.
// Setas, Home, End e Esc funcionam; ao escolher ou fechar, o foco volta ao botão.
export default function MenuImportar({ itens, onEscolher, className = "" }) {
  const [aberto, setAberto] = useState(false);
  const raiz = useRef(null);
  const botao = useRef(null);
  const idMenu = useId();

  useEffect(() => {
    if (!aberto) return undefined;
    const fora = (e) => { if (raiz.current && !raiz.current.contains(e.target)) setAberto(false); };
    document.addEventListener("pointerdown", fora);
    return () => document.removeEventListener("pointerdown", fora);
  }, [aberto]);

  if (!itens.length) return null;

  const focar = (i) => raiz.current?.querySelectorAll('[role="menuitem"]')[i]?.focus();
  const abrir = (indice = 0) => { setAberto(true); setTimeout(() => focar(indice), 0); };
  const fechar = () => { setAberto(false); botao.current?.focus(); };
  const escolher = (id) => { fechar(); setTimeout(() => onEscolher(id), 0); };

  const noBotao = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); abrir(0); }
    if (e.key === "ArrowUp") { e.preventDefault(); abrir(itens.length - 1); }
  };
  const noMenu = (e) => {
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); fechar(); return; }
    if (e.key === "Tab") { setAberto(false); return; }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
      e.preventDefault();
      const atual = [...raiz.current.querySelectorAll('[role="menuitem"]')].indexOf(document.activeElement);
      focar(proximoItem(atual, itens.length, e.key));
    }
  };

  return (
    <div ref={raiz} className="relative shrink-0">
      <Botao
        ref={botao}
        aria-label="Importar planilhas"
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-controls={aberto ? idMenu : undefined}
        onClick={() => (aberto ? fechar() : abrir(0))}
        onKeyDown={noBotao}
        className={`h-11 max-[599px]:px-3 lg:h-10 ${className}`}
      >
        <IconeEnvio tamanho={18} />
        <span className="hidden min-[600px]:inline">Importar</span>
      </Botao>
      {aberto && (
        <div id={idMenu} role="menu" aria-label="Importar" onKeyDown={noMenu} className="absolute right-0 top-full z-40 mt-2 w-72 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--surface-card)] py-2" style={{ boxShadow: "var(--shadow-3)" }}>
          {itens.map((i) => (
            <button key={i.id} type="button" role="menuitem" tabIndex={-1} onClick={() => escolher(i.id)} className="flex h-11 w-full items-center border-0 bg-transparent px-4 text-left text-sm text-[var(--text-strong)] cursor-pointer hover:bg-[var(--surface-subtle)] focus-visible:bg-[var(--surface-subtle)] focus-visible:outline-none">
              {i.rotulo}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
