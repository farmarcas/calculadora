import { useEffect, useId, useRef, useState } from "react";
import { PERFIS } from "../api/perfis.js";
import { IconeSeta } from "./icones.jsx";

// Com o login desligado, o bloco "Demonstração" (Grupo e Papel) fica ligado até a variável dizer o contrário.
export const MODO_DEMONSTRACAO = import.meta.env.VITE_MODO_DEMONSTRACAO !== "false";

const iniciais = (txt) => txt.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");

// Avatar com seta no canto da barra; abre um popover de 320 px com papel, grupo e "Sair".
export default function MenuDaConta({ perfil, ge, ges, geAtual, onPerfil, onGe, onSair, usuario, radar = false, demonstracao = MODO_DEMONSTRACAO }) {
  const [aberto, setAberto] = useState(false);
  const raiz = useRef(null);
  const botao = useRef(null);
  const idPopover = useId();
  const papel = PERFIS[perfil] ?? perfil;
  const nome = usuario?.nome ?? papel;

  const fechar = () => { setAberto(false); botao.current?.focus(); };

  useEffect(() => {
    if (!aberto) return undefined;
    const esc = (e) => { if (e.key === "Escape") fechar(); };
    const fora = (e) => { if (raiz.current && !raiz.current.contains(e.target)) setAberto(false); };
    document.addEventListener("keydown", esc);
    document.addEventListener("pointerdown", fora);
    return () => {
      document.removeEventListener("keydown", esc);
      document.removeEventListener("pointerdown", fora);
    };
  }, [aberto]);

  const campo = "h-10 w-full min-w-0 rounded-input border border-line bg-white px-2 text-sm text-ink-900 focus:outline-none focus:border-system-500";

  return (
    <div ref={raiz} className="relative">
      <button
        ref={botao}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={aberto}
        aria-controls={aberto ? idPopover : undefined}
        aria-label={`Conta: ${nome}`}
        onClick={() => setAberto((a) => !a)}
        className="inline-flex h-11 cursor-pointer items-center gap-1 rounded-btn border-0 bg-transparent px-1 focus-visible:outline-2 focus-visible:outline-[var(--border-focus)] sm:h-10"
      >
        <span aria-hidden="true" className="grid h-[34px] w-[34px] place-items-center rounded-full bg-[var(--surface-subtle)] text-xs font-bold text-[var(--text-secondary)]">{iniciais(nome)}</span>
        <span className="text-[var(--icon-default)] opacity-60"><IconeSeta tamanho={18} aberta={aberto} /></span>
      </button>
      {aberto && (
        <div id={idPopover} role="dialog" aria-label="Menu da conta" className="absolute top-full right-0 z-50 mt-2 w-[min(320px,calc(100vw-2rem))] rounded-card border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-2)]">
          <div className="flex items-center gap-3 border-b border-dashed border-[var(--border-default)] pb-3">
            <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--surface-subtle)] text-xs font-bold text-[var(--text-secondary)]">{iniciais(nome)}</span>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-[var(--text-strong)]">{nome}</div>
              {usuario && <div className="truncate text-xs text-[var(--text-secondary)]">{usuario.email}</div>}
              {usuario && <div className="truncate text-xs text-[var(--text-secondary)]">{papel}</div>}
              {geAtual && <div className="truncate text-xs text-[var(--text-secondary)]">{geAtual.nome}</div>}
            </div>
          </div>
          {/* No Radar o papel é fixo (vem do login); só a troca de grupo aparece, e apenas com mais de um. */}
          {((radar && ges.length > 1) || (!radar && demonstracao)) && (
            <div className="flex flex-col gap-3 py-3">
              {!radar && demonstracao && (
                <span className="w-fit rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-xs font-bold text-[var(--text-strong)]">Demonstração</span>
              )}
              <label className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                <span className="w-12 shrink-0">Grupo</span>
                <select aria-label="Grupo" value={ge} onChange={(e) => { onGe(e.target.value); fechar(); }} className={campo}>
                  {ges.map((g) => <option key={g.id} value={g.id}>{g.nome}{g.identificacao ? ` (${g.identificacao})` : ""}</option>)}
                </select>
              </label>
              {!radar && demonstracao && (
                <label className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                  <span className="w-12 shrink-0">Papel</span>
                  <select aria-label="Papel de demonstração" value={perfil} onChange={(e) => { onPerfil(e.target.value); fechar(); }} className={campo}>
                    {Object.entries(PERFIS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </label>
              )}
            </div>
          )}
          <div className="border-t border-[var(--border-subtle)] pt-2">
            <button type="button" onClick={() => { onSair(); fechar(); }} className="h-10 w-full cursor-pointer rounded-btn border-0 bg-transparent px-1 text-left text-sm text-[var(--text-strong)] hover:bg-[var(--surface-subtle)] focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]">Sair</button>
          </div>
        </div>
      )}
    </div>
  );
}
