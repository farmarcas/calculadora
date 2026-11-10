import { COR_DA_FUNCAO } from "./LinhaDaFuncao.jsx";
import { textoDoTurno, totalDaSemana } from "./escala-regras.js";

// Uma pessoa no dia: o turno em barra sobre as colunas das horas, "Função · 44h" e o total da semana. Folga mostra a barra
// tracejada. A contratação simulada é a linha azul, com "Remover" em vermelho.
export default function LinhaDaPessoa({ pessoa, turno, turnosDaPessoa, ini, fim, colunas, simulada = false, selecionado = false, onSelecionar, onRemover, rotuloSimulada }) {
  const total = totalDaSemana(turnosDaPessoa, pessoa.matricula);
  const largura = fim - ini;
  const esq = turno ? ((turno.entrada - ini) / largura) * 100 : 0;
  const larg = turno ? ((turno.saida - turno.entrada) / largura) * 100 : 0;
  const cor = COR_DA_FUNCAO[pessoa.funcao] ?? "var(--escala-caixa)";
  const escuro = pessoa.funcao === "Farmacêutico";

  return (
    <div role="row" className={`grid items-center gap-x-1 border-t border-[var(--border-subtle)] py-1.5 ${simulada ? "bg-[var(--color-primary-soft)]" : ""}`} style={{ gridTemplateColumns: colunas }}>
      <div className="min-w-0 pl-9">
        <div className={`truncate text-[13px] leading-4 font-bold ${simulada ? "text-[var(--color-primary)]" : "text-[var(--text-strong)]"}`}>{simulada ? "Contratação simulada" : pessoa.nome}</div>
        <div className="truncate text-[11px] leading-4 text-[var(--text-secondary)]">{simulada ? rotuloSimulada : `${pessoa.funcao} · ${pessoa.cargaH}h`}</div>
        {simulada && onRemover && <button type="button" onClick={onRemover} className="cursor-pointer border-0 bg-transparent p-0 text-[11px] leading-4 font-bold text-[var(--text-danger)] hover:underline">Remover</button>}
      </div>
      <div role="cell" className="relative h-7" style={{ gridColumn: `span ${Math.round(largura)}` }}>
        {turno ? (
          <button
            type="button"
            onClick={onSelecionar}
            aria-label={`${pessoa.nome}: turno ${textoDoTurno(turno)}`}
            aria-pressed={selecionado}
            className={`absolute top-0 flex h-7 min-w-0 items-center overflow-hidden rounded-btn px-2 text-left text-xs font-bold ${simulada ? "border-2 border-dashed border-[var(--system-500)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]" : escuro ? "border-0 text-white" : "border-0 text-[var(--system-900)]"} ${selecionado ? "outline outline-2 outline-[var(--system-500)]" : ""}`}
            style={{ left: `${esq}%`, width: `${larg}%`, ...(simulada ? {} : { background: cor }) }}
          >
            <span className="truncate">{textoDoTurno(turno)} · {Math.round((turno.saida - turno.entrada - ((turno.fimIntervalo ?? 0) - (turno.iniIntervalo ?? 0))) * 10) / 10}h</span>
          </button>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center rounded-btn border border-dashed border-[var(--border-default)] text-xs text-[var(--text-secondary)]">{simulada && total.dias === 0 ? "Sem turnos" : "Folga"}</div>
        )}
      </div>
      <div role="cell" className="pr-2 text-right text-xs leading-4 font-bold text-[var(--text-strong)]">{total.texto}</div>
    </div>
  );
}
