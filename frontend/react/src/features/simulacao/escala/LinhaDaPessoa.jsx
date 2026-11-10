import { useRef } from "react";
import { COR_DA_FUNCAO } from "./LinhaDaFuncao.jsx";
import { textoDoTurno, totalDaSemana } from "./escala-regras.js";
import { aplicarMovimento, movimentoPorTecla } from "./movimento-regras.js";

// Uma pessoa no dia: o turno em barra sobre as colunas das horas, "Função · 44h" e o total da semana. Folga mostra a barra
// tracejada. A contratação simulada é a linha azul, com "Remover" em vermelho.
export default function LinhaDaPessoa({ pessoa, turno, turnosDaPessoa, ini, fim, colunas, simulada = false, selecionado = false, onSelecionar, onRemover, rotuloSimulada, editavel = false, onMudar }) {
  const trilha = useRef(null);
  const janela = { min: ini, max: fim };

  // Arrastar a barra move o turno; as bordas mudam o início e o fim (de 15 em 15 minutos). A cobertura responde durante o
  // gesto (`onMudar(turno, false)`) e a mudança grava ao soltar (`onMudar(turno, true)`).
  const comecar = (e, modo) => {
    if (!editavel || !turno || e.button) return;
    e.preventDefault();
    e.stopPropagation();
    onSelecionar?.();
    const largura = trilha.current.getBoundingClientRect().width;
    const x0 = e.clientX;
    const base = { ...turno };
    let atual = base;
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      /* sem captura: os eventos seguem na janela */
    }
    const mover = (ev) => {
      const delta = ((ev.clientX - x0) / largura) * (fim - ini);
      atual = aplicarMovimento(base, modo, delta, janela);
      onMudar(atual, false);
    };
    const soltar = () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", soltar);
      if (atual.entrada !== base.entrada || atual.saida !== base.saida) onMudar(atual, true);
      else onMudar(base, false);
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", soltar);
  };
  const tecla = (e) => {
    if (!editavel || !turno) return;
    const m = movimentoPorTecla(e.key, e.shiftKey);
    if (!m) return;
    e.preventDefault();
    onMudar(aplicarMovimento(turno, m.modo, m.delta, janela), true);
  };
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
      <div ref={trilha} role="cell" className="relative h-7" style={{ gridColumn: `span ${Math.round(largura)}` }}>
        {turno ? (
          <button
            type="button"
            onClick={onSelecionar}
            onPointerDown={(e) => comecar(e, "mover")}
            onKeyDown={tecla}
            aria-label={`${pessoa.nome}: turno ${textoDoTurno(turno)}${editavel ? ". Setas movem 15 minutos; com Shift, mudam a saída" : ""}`}
            aria-pressed={selecionado}
            className={`absolute top-0 flex h-7 min-w-0 items-center overflow-hidden rounded-btn px-2 text-left text-xs font-bold ${simulada ? "border-2 border-dashed border-[var(--system-500)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]" : escuro ? "border-0 text-white" : "border-0 text-[var(--system-900)]"} ${selecionado ? "outline outline-2 outline-[var(--system-500)]" : ""} ${editavel ? "cursor-grab touch-none" : ""}`}
            style={{ left: `${esq}%`, width: `${larg}%`, ...(simulada ? {} : { background: cor }) }}
          >
            {editavel && <span aria-hidden="true" onPointerDown={(e) => comecar(e, "esq")} className="absolute inset-y-0 left-0 w-2 cursor-ew-resize" />}
            {editavel && <span aria-hidden="true" onPointerDown={(e) => comecar(e, "dir")} className="absolute inset-y-0 right-0 w-2 cursor-ew-resize" />}
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
