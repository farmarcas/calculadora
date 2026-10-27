import { useRef, useState } from "react";
import { hhmm, limitar, quarto } from "./tempo.js";

const LARGURA_ROTULO = 168;

// Grade de um dia: uma linha por pessoa, turno como barra que se arrasta (mover) e se estica pelas pontas.
export default function Grade({ quadro, turnos, dia, aberto, editavel, selecionado, onSelecionar, onMudar, onNovoTurno }) {
  const doDia = turnos.filter((t) => t.dia === dia);
  const ini = Math.floor(Math.min(aberto?.abre ?? 8, ...doDia.map((t) => t.entrada)));
  const fim = Math.ceil(Math.max(aberto?.fecha ?? 20, ...doDia.map((t) => t.saida)));
  const horas = Array.from({ length: fim - ini }, (_, i) => ini + i);
  const trilha = useRef(null);
  const [arrasto, setArrasto] = useState(null); // { matricula, turno }

  const comecar = (e, t, modo) => {
    if (!editavel || e.button) return;
    e.preventDefault();
    e.stopPropagation();
    onSelecionar(t.matricula);
    const caixa = trilha.current.getBoundingClientRect();
    const x0 = e.clientX;
    const base = { ...t };
    let atual = base;
    e.currentTarget.setPointerCapture?.(e.pointerId);

    const mover = (ev) => {
      const dq = quarto(((ev.clientX - x0) / caixa.width) * (fim - ini));
      let n = { ...base };
      if (modo === "mover") {
        const len = base.saida - base.entrada;
        const entrada = limitar(base.entrada + dq, ini, fim - len);
        const d = entrada - base.entrada;
        n = { ...base, entrada, saida: base.saida + d, iniIntervalo: base.iniIntervalo != null ? base.iniIntervalo + d : null, fimIntervalo: base.fimIntervalo != null ? base.fimIntervalo + d : null };
      } else if (modo === "esq") {
        n.entrada = limitar(base.entrada + dq, ini, base.saida - 0.5);
        if (n.iniIntervalo != null && n.entrada > n.iniIntervalo) n.iniIntervalo = n.fimIntervalo = null;
      } else {
        n.saida = limitar(base.saida + dq, base.entrada + 0.5, fim);
        if (n.fimIntervalo != null && n.saida < n.fimIntervalo) n.iniIntervalo = n.fimIntervalo = null;
      }
      atual = n;
      setArrasto({ matricula: t.matricula, turno: n });
    };
    const soltar = () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      setArrasto(null);
      if (atual.entrada !== base.entrada || atual.saida !== base.saida) onMudar(atual);
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
  };

  const pct = (h) => `${((h - ini) / (fim - ini)) * 100}%`;
  const larg = (a, b) => `${((b - a) / (fim - ini)) * 100}%`;

  return (
    <div className="overflow-x-auto" aria-label="Grade do dia">
      <div className="min-w-[760px]">
        <div className="flex border-b border-line bg-surface-page text-[11px] text-ink-500">
          <div style={{ width: LARGURA_ROTULO }} className="shrink-0 px-4 py-2 font-bold uppercase tracking-wide">Pessoa</div>
          <div className="flex-1 flex">
            {horas.map((h) => <div key={h} className="flex-1 py-2 text-center border-l border-line">{String(h).padStart(2, "0")}h</div>)}
          </div>
        </div>
        {quadro.map((p, i) => {
          const real = doDia.find((t) => t.matricula === p.matricula);
          const t = arrasto?.matricula === p.matricula ? arrasto.turno : real;
          const sel = selecionado === p.matricula;
          return (
            <div key={p.matricula} className={`flex items-stretch border-b border-line ${sel ? "bg-system-50" : ""}`} data-testid={`linha-${p.matricula}`}>
              <button type="button" onClick={() => onSelecionar(p.matricula)} style={{ width: LARGURA_ROTULO }} className="shrink-0 px-4 py-2 text-left">
                <div className="text-sm font-medium truncate">{p.nome}</div>
                <div className="text-xs text-ink-500">{p.funcao ?? "Fora do cálculo"}</div>
              </button>
              <div className="flex-1 relative h-14" ref={i === 0 ? trilha : null}>
                {aberto && <div className="absolute inset-y-1 bg-surface-subtle rounded" style={{ left: pct(aberto.abre), width: larg(aberto.abre, aberto.fecha) }} aria-hidden />}
                {horas.map((h) => <div key={h} className="absolute inset-y-0 border-l border-line" style={{ left: pct(h) }} aria-hidden />)}
                {t ? (
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label={`Turno de ${p.nome}: ${hhmm(t.entrada)} às ${hhmm(t.saida)}`}
                    onPointerDown={(e) => comecar(e, t, "mover")}
                    onClick={() => onSelecionar(p.matricula)}
                    className={`absolute top-2 bottom-2 rounded text-white text-xs flex items-center justify-center select-none touch-none ${editavel ? "cursor-grab active:cursor-grabbing" : ""} ${sel ? "bg-system-700" : "bg-system-500"}`}
                    style={{ left: pct(t.entrada), width: larg(t.entrada, t.saida) }}
                  >
                    {t.iniIntervalo != null && t.fimIntervalo != null && (
                      <div className="absolute inset-y-0 bg-white/60 border-x border-white" style={{ left: `${((t.iniIntervalo - t.entrada) / (t.saida - t.entrada)) * 100}%`, width: `${((t.fimIntervalo - t.iniIntervalo) / (t.saida - t.entrada)) * 100}%` }} title="Intervalo" />
                    )}
                    <span className="relative px-1 truncate">{hhmm(t.entrada)}–{hhmm(t.saida)}</span>
                    {editavel && (
                      <>
                        <span onPointerDown={(e) => comecar(e, t, "esq")} className="absolute left-0 inset-y-0 w-2 cursor-ew-resize" aria-label="Mudar entrada" />
                        <span onPointerDown={(e) => comecar(e, t, "dir")} className="absolute right-0 inset-y-0 w-2 cursor-ew-resize" aria-label="Mudar saída" />
                      </>
                    )}
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center px-3 text-xs text-ink-500">
                    Folga
                    {editavel && (
                      <button type="button" className="ml-3 text-system-700 font-medium" onClick={() => onNovoTurno(p.matricula)}>+ turno</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
