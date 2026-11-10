import { useEffect, useId, useRef } from "react";
import { Botao } from "../../../components/ui/index.jsx";
import { diasAlterados, horasTxt, sentidoDoHorario, textoDaDiferenca, tomDaDiferenca } from "./cartao-regras.js";
import { COR_DO_TOM } from "./tom.js";

const FOCAVEIS = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Painel "Dias e horários": lateral (440 px) no computador e folha inferior abaixo de 640 px. Janela de diálogo: Esc, clique
// fora, X e Fechar fecham; o foco fica preso dentro e volta ao link que abriu.
export default function PainelDias({ painel, onFechar, onPersonalizar, podePersonalizar, ocupado }) {
  const { c, posicao, linhas, totais, gatilho } = painel;
  const idTitulo = useId();
  const raiz = useRef(null);
  const n = diasAlterados(linhas);

  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    raiz.current?.querySelector("[data-foco-inicial]")?.focus();
    return () => {
      document.body.style.overflow = anterior;
      if (gatilho?.isConnected) gatilho.focus();
    };
  }, [gatilho]);

  const teclas = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onFechar();
      return;
    }
    if (e.key !== "Tab") return;
    const itens = [...raiz.current.querySelectorAll(FOCAVEIS)].filter((x) => x.offsetParent !== null);
    if (itens.length === 0) return;
    const primeiro = itens[0];
    const ultimo = itens[itens.length - 1];
    if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
  };

  return (
    <div className="fixed inset-0 z-50" onKeyDown={teclas}>
      <div aria-hidden="true" className="absolute inset-0 bg-black/30" onClick={onFechar} />
      <div
        ref={raiz}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        className="absolute inset-x-0 bottom-0 flex max-h-[92vh] flex-col overflow-y-auto rounded-t-[16px] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-3)] sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[440px] sm:rounded-none"
      >
        <span aria-hidden="true" className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--border-default)] sm:hidden" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id={idTitulo} className="m-0 text-xl leading-[26px] font-bold text-[var(--text-strong)]">Dias e horários</h2>
            <p className="mt-1 mb-0 text-sm leading-5 text-[var(--text-secondary)]">{c.nome} · {sentidoDoHorario(totais)} horários</p>
          </div>
          <button type="button" data-foco-inicial aria-label="Fechar painel" onClick={onFechar} className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-btn border-0 bg-transparent text-[var(--icon-default)] hover:bg-[var(--surface-subtle)] focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <p className="mt-4 mb-0 text-sm leading-5 font-bold text-[var(--text-strong)]">
          {n} {n === 1 ? "dia alterado" : "dias alterados"} · {horasTxt(totais.novo)} por semana
          {totais.diferenca !== 0 && <span style={{ color: COR_DO_TOM[tomDaDiferenca(totais.diferenca)] }}> ({textoDaDiferenca(totais.diferenca)})</span>}
        </p>

        <table className="mt-3 w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs text-[var(--text-secondary)]">
              <th scope="col" className="px-3 py-2 font-medium">Dia</th>
              <th scope="col" className="py-2 font-medium">Novo horário</th>
              <th scope="col" className="py-2 font-medium">Antes</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Diferença</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.dia} className={`h-10 sm:h-12 ${l.alterado ? "bg-[var(--surface-subtle)] font-bold text-[var(--text-strong)]" : "text-[var(--text-secondary)]"}`}>
                <th scope="row" className="rounded-l-btn px-3 text-left font-bold text-[var(--text-strong)]">{l.nome}</th>
                <td>{l.novo}</td>
                <td className="font-normal text-[var(--text-secondary)]">{l.antes}</td>
                <td className="rounded-r-btn px-3 text-right font-bold" style={{ color: COR_DO_TOM[l.alterado ? tomDaDiferenca(l.diferenca) : "neutro"] }}>{l.alterado ? textoDaDiferenca(l.diferenca) : "–"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="h-12 border-t border-[var(--border-default)] font-bold text-[var(--text-strong)]">
              <th scope="row" className="px-3 text-left">Total</th>
              <td>{horasTxt(totais.novo)}</td>
              <td className="font-normal text-[var(--text-secondary)]">{horasTxt(totais.antes)}</td>
              <td className="px-3 text-right" style={{ color: COR_DO_TOM[tomDaDiferenca(totais.diferenca)] }}>{textoDaDiferenca(totais.diferenca)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Botao tipo="secundario" className="h-11 w-full sm:w-auto" onClick={onFechar}>Fechar</Botao>
          {podePersonalizar && <Botao className="h-11 w-full sm:w-auto" disabled={ocupado} onClick={onPersonalizar}>Personalizar horários</Botao>}
        </div>
      </div>
    </div>
  );
}
