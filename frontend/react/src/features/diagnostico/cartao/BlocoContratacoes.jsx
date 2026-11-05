import { brl, horasOciosasDe, horasTxt, linhasDeContratacao, totalContratado } from "./cartao-regras.js";

const ROTULO = "text-sm leading-5 text-[var(--text-secondary)]";
const FUNDO_DA_LETRA = { F: "var(--color-primary-soft)", A: "var(--func-success-100)", C: "var(--func-attention-100)", Ap: "var(--border-default)" };

// Contratações (uma linha cada, bloco com altura para quatro linhas) e a linha de horas ociosas da equipe.
export function BlocoContratacoes({ contratacoes }) {
  const linhas = linhasDeContratacao(contratacoes);
  return (
    <div className="min-h-[148px]">
      <div className="flex items-baseline justify-between gap-2">
        <span className={ROTULO}>Contratações</span>
        {linhas.length > 0 && <span className="text-sm leading-5 font-bold text-[var(--text-strong)]">{horasTxt(totalContratado(linhas))} por semana</span>}
      </div>
      {linhas.length === 0 ? (
        <p className="m-0 mt-3 text-sm leading-5 text-[var(--text-secondary)]">Nenhuma contratação</p>
      ) : (
        <ul className="m-0 mt-3 flex list-none flex-col gap-1 p-0">
          {linhas.map((l, i) => (
            <li key={i} className="grid h-7 grid-cols-[20px_92px_minmax(0,1fr)_78px] items-center gap-x-2 text-xs">
              <span aria-hidden="true" className="grid h-5 w-5 place-items-center rounded-full text-[10px] leading-none font-bold text-[var(--text-strong)]" style={{ background: FUNDO_DA_LETRA[l.letra] }}>{l.letra}</span>
              <span className="truncate font-bold text-[var(--text-strong)]" title={l.opcional ? `${l.nome} (opcional)` : l.nome}>{l.nome}{l.opcional && <span className="sr-only"> (opcional)</span>}</span>
              <span aria-hidden="true" className="h-1.5 rounded-full bg-[var(--surface-muted)]"><span className="block h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${l.largura}%` }} /></span>
              <span className="text-right text-[var(--text-secondary)]"><strong className="text-[var(--text-strong)]">{horasTxt(l.horas)}</strong> {l.tipo}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function LinhaOciosas({ c, dono }) {
  const horas = horasOciosasDe(c.contratacoes);
  const custo = dono && c.folhaAdicionalMensal > 0 && c.ociosidadePct ? Math.round((c.folhaAdicionalMensal * c.ociosidadePct) / 100) : null;
  return (
    <div className="flex min-h-16 items-center justify-between gap-4 border-b border-[var(--border-subtle)] py-2">
      <span className={ROTULO}>Horas ociosas da equipe</span>
      <span className="flex flex-col items-end text-right">
        <span className="text-sm leading-5 font-bold text-[var(--text-strong)]">{!c.ociosidadePct ? "Nenhuma" : `${horasTxt(horas)} por semana (${String(c.ociosidadePct).replace(".", ",")}%)`}</span>
        {custo != null && <span className="text-xs leading-4 text-[var(--text-secondary)]">custam {brl(custo)} por mês</span>}
      </span>
    </div>
  );
}
