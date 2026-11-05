import { useEffect, useRef, useState } from "react";
import { ICONES, IconeSeta } from "./icones.jsx";
import { itemDaFolha, itensDoMenu } from "./menu.js";

const ANEL = "focus-visible:outline-2 focus-visible:outline-[var(--border-focus)] focus-visible:-outline-offset-2";
const ATIVO = "bg-[var(--color-primary-soft)] shadow-[inset_3px_0_0_var(--color-primary)]";

// Dica do menu recolhido: só visual (o nome acessível já está no botão). Aparece com o mouse e com o foco.
const Dica = ({ texto }) => (
  <span aria-hidden="true" className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 hidden h-8 -translate-y-1/2 whitespace-nowrap rounded-btn bg-[var(--neutral-dark-900)] px-3 text-[13px] leading-8 text-white group-focus-within:block group-hover:block">
    {texto}
  </span>
);

// Menu aberto (280 px) ou recolhido (72 px, só ícones). Quem navega é a casca: aqui só se escolhe a folha.
export default function MenuLateral({ perfil, folha, aberto, onNavegar, id }) {
  const itens = itensDoMenu(perfil);
  const atual = itemDaFolha(perfil, folha);
  const [expandidos, setExpandidos] = useState(() => ({ [atual?.id]: true }));
  const [painel, setPainel] = useState(null); // item cujo painel de subitens está aberto (menu recolhido)
  const raiz = useRef(null);
  const botaoDoPainel = useRef(null);

  // Ao mudar de tela, o item que contém a folha atual fica aberto.
  useEffect(() => {
    if (atual) setExpandidos((e) => (e[atual.id] ? e : { ...e, [atual.id]: true }));
  }, [atual?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Painel de subitens: Esc e clique fora fecham; o foco volta ao ícone.
  useEffect(() => {
    if (!painel) return undefined;
    const esc = (e) => {
      if (e.key !== "Escape") return;
      setPainel(null);
      botaoDoPainel.current?.focus();
    };
    const fora = (e) => { if (raiz.current && !raiz.current.contains(e.target)) setPainel(null); };
    document.addEventListener("keydown", esc);
    document.addEventListener("pointerdown", fora);
    return () => {
      document.removeEventListener("keydown", esc);
      document.removeEventListener("pointerdown", fora);
    };
  }, [painel]);
  useEffect(() => { if (aberto) setPainel(null); }, [aberto]);

  const ir = (f) => { setPainel(null); onNavegar(f); };

  return (
    <nav id={id} aria-label="Menu principal" ref={raiz} className="flex flex-col">
      {itens.map((item) => {
        const Icone = ICONES[item.icone];
        const temFilhos = !!item.filhos?.length;
        const ativoNoItem = atual?.id === item.id;
        if (aberto) {
          const aberta = !!expandidos[item.id];
          return (
            <div key={item.id}>
              <button
                type="button"
                aria-expanded={temFilhos ? aberta : undefined}
                aria-current={!temFilhos && folha.id === item.id ? "page" : undefined}
                onClick={() => (temFilhos ? setExpandidos((e) => ({ ...e, [item.id]: !e[item.id] })) : ir(item))}
                className={`flex min-h-14 w-full cursor-pointer items-center gap-4 border-0 px-4 py-3 text-left text-sm leading-5 font-bold ${ANEL} ${!temFilhos && folha.id === item.id ? ATIVO : "bg-transparent hover:bg-[var(--surface-subtle)]"} ${ativoNoItem ? "text-[var(--text-strong)]" : "text-[var(--text-secondary)]"}`}
              >
                <span className="shrink-0 text-[var(--icon-default)] opacity-85"><Icone tamanho={22} /></span>
                <span className="flex-1">{item.rotulo}</span>
                {temFilhos && <span className="shrink-0 text-[var(--icon-default)] opacity-60"><IconeSeta tamanho={18} aberta={aberta} /></span>}
              </button>
              {temFilhos && aberta && item.filhos.map((f) => {
                const IconeF = ICONES[f.icone];
                const ativo = folha.id === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    aria-current={ativo ? "page" : undefined}
                    onClick={() => ir(f)}
                    className={`flex min-h-14 w-full cursor-pointer items-center gap-4 border-0 py-3 pr-4 pl-8 text-left text-sm leading-5 font-bold ${ANEL} ${ativo ? `${ATIVO} text-[var(--text-strong)]` : "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]"}`}
                  >
                    <span className="shrink-0 text-[var(--icon-default)] opacity-85"><IconeF tamanho={22} /></span>
                    <span className="flex-1">{f.rotulo}</span>
                  </button>
                );
              })}
            </div>
          );
        }
        // Recolhido: só ícone. Item com subitens abre um painel à direita; sem subitens, navega.
        const aberto_ = painel === item.id;
        const destaque = temFilhos ? ativoNoItem : folha.id === item.id;
        return (
          <div key={item.id} className="group relative">
            <button
              type="button"
              ref={aberto_ ? botaoDoPainel : undefined}
              aria-label={item.rotulo}
              aria-haspopup={temFilhos ? "menu" : undefined}
              aria-expanded={temFilhos ? aberto_ : undefined}
              aria-current={!temFilhos && folha.id === item.id ? "page" : undefined}
              onClick={() => (temFilhos ? setPainel(aberto_ ? null : item.id) : ir(item))}
              className={`flex h-14 w-full cursor-pointer items-center justify-center border-0 text-[var(--icon-default)] ${ANEL} ${destaque ? ATIVO : "bg-transparent hover:bg-[var(--surface-subtle)]"}`}
            >
              <Icone tamanho={22} />
            </button>
            {!aberto_ && <Dica texto={item.rotulo} />}
            {temFilhos && aberto_ && (
              <div role="menu" aria-label={item.rotulo} className="absolute top-0 left-full z-50 ml-1 min-w-52 overflow-hidden rounded-card border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-[var(--shadow-2)]">
                {item.filhos.map((f, i) => {
                  const IconeF = ICONES[f.icone];
                  const ativo = folha.id === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      role="menuitem"
                      autoFocus={i === 0}
                      aria-current={ativo ? "page" : undefined}
                      onClick={() => ir(f)}
                      className={`flex min-h-12 w-full cursor-pointer items-center gap-3 border-0 px-4 text-left text-sm font-bold ${ANEL} ${ativo ? `${ATIVO} text-[var(--text-strong)]` : "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]"}`}
                    >
                      <span className="text-[var(--icon-default)]"><IconeF tamanho={20} /></span>
                      {f.rotulo}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

