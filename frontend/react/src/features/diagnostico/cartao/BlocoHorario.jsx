import { diasAlterados, horasTxt, textoDaDiferenca, tomDaDiferenca } from "./cartao-regras.js";
import { COR_DO_TOM } from "./tom.js";

const FUNDO = { perigo: "var(--func-warning-50)", sucesso: "var(--func-success-100)", neutro: "var(--surface-muted)" };

// Horário da semana (altura fixa): horas por semana com a diferença, a faixa de sete dias, a legenda e o link do painel.
export default function BlocoHorario({ linhas, totais, onAbrirPainel }) {
  const n = diasAlterados(linhas);
  return (
    <div className="min-h-[124px]">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm leading-5 text-[var(--text-secondary)]">Horário</span>
        <span className="text-sm leading-5 font-bold text-[var(--text-strong)]">
          {horasTxt(totais.novo)} por semana
          {n > 0 && totais.diferenca !== 0 && <span style={{ color: COR_DO_TOM[tomDaDiferenca(totais.diferenca)] }}> ({textoDaDiferenca(totais.diferenca)})</span>}
        </span>
      </div>
      {n === 0 ? (
        <p className="m-0 mt-3 text-sm leading-5 font-bold text-[var(--text-strong)]">Mantido, sem alterações</p>
      ) : (
        <>
          <ul className="m-0 mt-3 grid list-none grid-cols-7 gap-1 p-0">
            {linhas.map((l) => {
              const tom = l.alterado ? tomDaDiferenca(l.diferenca) : "neutro";
              return (
                <li key={l.dia} className="flex h-11 flex-col items-center justify-center rounded-btn" style={{ background: FUNDO[tom] }} aria-label={`${l.nome}: ${l.alterado ? `${l.novo} (${textoDaDiferenca(l.diferenca)})` : "sem alteração"}`}>
                  <span aria-hidden="true" className="text-xs leading-4 font-bold text-[var(--text-strong)]">{l.nome}</span>
                  <span aria-hidden="true" className="text-[11px] leading-4 font-bold" style={{ color: COR_DO_TOM[tom] }}>{l.alterado ? textoDaDiferenca(l.diferenca) : "–"}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex items-center justify-between gap-2 text-xs leading-4">
            <strong className="text-[var(--text-strong)]">{n} {n === 1 ? "dia alterado" : "dias alterados"}</strong>
            <button type="button" aria-haspopup="dialog" onClick={onAbrirPainel} className="min-h-11 cursor-pointer border-0 bg-transparent p-0 text-xs font-bold text-[var(--color-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]">
              Ver todos os dias ›
            </button>
          </div>
        </>
      )}
    </div>
  );
}
