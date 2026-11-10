import { useRef } from "react";
import { texto } from "../turnos.js";
import { TIPOS_DE_DIA, rotuloHora } from "./formato.js";
import { alcasDosTurnos, eixoDaJanela, horasDeMaiorFaturamento, horasDoTurno, moverLimite } from "./turnos-grafico.js";

const ALTURA = 112;
const peso = (c) => (c ? (c.valor ?? c.participacao ?? 0) : 0);

// Primeira linha livre para cada turno (turnos que se sobrepõem ficam em linhas diferentes).
const linhasDasFaixas = (faixas) => {
  const fins = [];
  return faixas.map((f) => {
    let l = fins.findIndex((fim) => fim <= f.ini);
    if (l < 0) { l = fins.length; fins.push(0); }
    fins[l] = f.fim;
    return l;
  });
};

// Gráfico do faturamento médio por hora, com uma faixa por turno em cima e alças entre turnos que se tocam. As barras são só
// desenho (aria-hidden): a tabela e o detalhe trazem os mesmos números. Alças e faixas funcionam por mouse, toque e teclado.
export default function GraficoDeTurnos({ turnos, janela, serie, tipoDia, onTipoDia, selecionado, onSelecionar, onMudar, editavel, sugestao, avisoPoucosDias }) {
  const eixo = eixoDaJanela(janela);
  const N = eixo.length;
  const area = useRef(null);
  if (!N) return null;
  const ini0 = eixo[0];
  const maior = Math.max(0, ...eixo.map((h) => peso(serie?.find((s) => s.hora === h))));
  const picos = horasDeMaiorFaturamento(serie, janela);
  const faixasDe = (lista) =>
    lista.map((t, i) => {
      const h = horasDoTurno(t, janela);
      return h.length ? { i, t, ini: h[0] - ini0, fim: h[h.length - 1] - ini0 + 1 } : null;
    }).filter(Boolean);
  const faixas = faixasDe(turnos);
  const linhas = linhasDasFaixas(faixas);
  const nLinhas = Math.max(1, ...linhas.map((l) => l + 1));
  const prev = sugestao ? faixasDe(sugestao) : [];
  const alcas = editavel ? alcasDosTurnos(turnos) : [];
  const turnoDaHora = (h) => turnos.findIndex((_, i) => horasDoTurno(turnos[i], janela).includes(h));
  const pos = (h) => `${((h - janela.abre) / (janela.fecha - janela.abre)) * 100}%`;

  const horaNoPonteiro = (e) => {
    const r = area.current.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - r.left, 0), r.width);
    return Math.round(janela.abre + (x / r.width) * (janela.fecha - janela.abre));
  };
  const arrastar = (alca) => (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    let atual = turnos;
    const mover = (ev) => {
      const novo = moverLimite(atual, alca.de, alca.para, horaNoPonteiro(ev));
      if (novo !== atual) { atual = novo; onMudar(novo); }
    };
    const soltar = () => { window.removeEventListener("pointermove", mover); window.removeEventListener("pointerup", soltar); };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
  };
  const teclaDaAlca = (alca) => (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const novo = moverLimite(turnos, alca.de, alca.para, alca.hora + (e.key === "ArrowRight" ? 1 : -1));
    if (novo !== turnos) onMudar(novo);
  };

  return (
    <div className="mt-3">
      <div className="mb-2 flex flex-wrap items-center justify-end gap-2 text-sm text-[var(--text-secondary)]">
        <label htmlFor="tipo-de-dia">Faturamento médio por hora ·</label>
        <select id="tipo-de-dia" value={tipoDia} onChange={(e) => onTipoDia(e.target.value)} className="h-10 rounded-[6px] border border-[var(--border-default)] bg-[var(--surface-card)] px-3 text-sm text-[var(--text-strong)]">
          {TIPOS_DE_DIA.map(([id, rotulo]) => <option key={id} value={id}>{rotulo}</option>)}
        </select>
      </div>
      {avisoPoucosDias && <p role="status" className="m-0 mb-2 rounded-card bg-[var(--func-attention-100)] px-3 py-2 text-sm text-[var(--text-strong)]">Poucos dias de venda na base. Os valores podem não representar o movimento normal da loja.</p>}
      {!serie && <p className="m-0 mb-2 text-sm text-[var(--text-secondary)]">Sem vendas neste tipo de dia.</p>}

      <div ref={area} className="relative" style={{ minWidth: Math.max(520, N * 36) }}>
        <div className="relative" style={{ height: nLinhas * 34 + (prev.length ? 34 : 0) }}>
          {faixas.map((f, k) => {
            const ativa = selecionado === f.i;
            return (
              <button key={f.i} type="button" aria-pressed={ativa} aria-label={`Turno ${f.t.nome}, ${f.t.inicio} a ${f.t.fim}`} onClick={() => onSelecionar(f.i)}
                className={`absolute h-8 overflow-hidden whitespace-nowrap rounded-[4px] border px-2 text-left text-xs font-bold leading-[28px] text-[var(--chart-band-text)] cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--border-focus)] ${ativa ? "border-2 border-[var(--color-primary)]" : "border-[var(--chart-band-border)]"}`}
                style={{ top: linhas[k] * 34, left: `calc(${(f.ini / N) * 100}% + 1px)`, width: `calc(${((f.fim - f.ini) / N) * 100}% - 2px)`, background: ativa ? "var(--chart-band-selected)" : "var(--color-primary-soft-strong)" }}>
                {f.t.nome || `Turno ${f.i + 1}`} · {f.t.inicio}–{f.t.fim}
              </button>
            );
          })}
          {prev.map((f) => (
            <div key={`p${f.i}`} aria-hidden="true" className="absolute h-8 overflow-hidden whitespace-nowrap rounded-[4px] border-2 border-dashed border-[var(--color-primary)] px-2 text-xs font-bold leading-[28px] text-[var(--chart-band-text)]"
              style={{ top: nLinhas * 34, left: `calc(${(f.ini / N) * 100}% + 1px)`, width: `calc(${((f.fim - f.ini) / N) * 100}% - 2px)` }}>
              {f.t.nome} · {f.t.inicio}–{f.t.fim}
            </div>
          ))}
          {alcas.map((a) => (
            <button key={`${a.de}-${a.para}`} type="button" aria-label={`Limite entre ${turnos[a.de].nome || `turno ${a.de + 1}`} e ${turnos[a.para].nome || `turno ${a.para + 1}`}, às ${texto(a.hora)}. Use as setas para mover de 1 em 1 hora.`}
              onPointerDown={arrastar(a)} onKeyDown={teclaDaAlca(a)}
              className="absolute z-10 grid h-5 w-2.5 -translate-x-1/2 touch-none place-items-center rounded-[2px] border border-[var(--border-strong)] bg-[var(--surface-card)] p-0 text-[10px] leading-none text-[var(--text-secondary)] cursor-col-resize focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]"
              style={{ top: 6, left: pos(a.hora) }}><span aria-hidden="true">⋮</span></button>
          ))}
        </div>

        <div aria-hidden="true" className="relative mt-1 grid items-end" style={{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))`, height: ALTURA + 8 }}>
          {eixo.map((h) => {
            const c = serie?.find((s) => s.hora === h);
            const v = peso(c);
            const t = turnoDaHora(h);
            return (
              <div key={h} className="flex h-full items-end justify-center px-[3px]" style={{ background: t < 0 ? "transparent" : t % 2 ? "var(--chart-turn-tint-b)" : "var(--chart-turn-tint-a)" }}>
                <div className="w-full rounded-t-[3px]" style={{ height: maior > 0 ? Math.max(v > 0 ? 3 : 0, Math.round((v / maior) * ALTURA)) : 0, background: picos.has(h) ? "var(--system-500)" : "var(--chart-bar)" }} />
              </div>
            );
          })}
        </div>
        <div aria-hidden="true" className="relative mt-1 h-4 text-xs text-[var(--text-secondary)]">
          {Array.from({ length: N + 1 }, (_, i) => Math.round(janela.abre) + i).map((h, i) => <span key={h} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${(i / N) * 100}%` }}>{rotuloHora(h)}</span>)}
        </div>
      </div>
      <p className="m-0 mt-3 flex items-center gap-2 text-xs text-[var(--text-secondary)]"><span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-[var(--color-primary)]" />Clique em uma faixa do gráfico ou em uma linha da tabela para ver o faturamento hora a hora do turno.</p>
    </div>
  );
}
