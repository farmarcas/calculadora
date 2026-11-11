import { useMemo, useState } from "react";
import LinhaDaSemana from "./LinhaDaSemana.jsx";
import { DIAS_DA_SEMANA, montarSemana, semEscala } from "./semana-regras.js";

const COLUNAS = "minmax(190px, 240px) repeat(7, minmax(92px, 1fr)) 110px";
const LEGENDA = [["Farmacêutico", "farmaceutico"], ["Atendimento", "atendimento"], ["Caixa", "caixa"]];

// "Escala da semana" (spec 041), na Simulação, logo depois da "Escala por hora": a semana de cada pessoa, com folgas, intervalos
// e a Contratação simulada. Usa a mesma escala da Escala por hora; sem R$, igual para todos os perfis.
export default function EscalaDaSemana({ sim, editavel, onDia, onCadastrar }) {
  const grupos = useMemo(() => montarSemana({ quadro: sim.quadro, turnos: sim.turnos, diasAbertos: sim.diasAbertos }), [sim.quadro, sim.turnos, sim.diasAbertos]);
  const [recolhidos, setRecolhidos] = useState(() => new Set(["Atendimento"]));
  const alternar = (f) => setRecolhidos((r) => { const n = new Set(r); if (n.has(f)) n.delete(f); else n.add(f); return n; });

  return (
    <section aria-label="Escala da semana" className="rounded-card border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4 p-6 pb-4">
        <div className="min-w-0">
          <h2 className="m-0 text-xl leading-[26px] font-bold text-[var(--text-strong)]">Escala da semana</h2>
          <p className="mt-1 mb-0 text-sm leading-5 text-[var(--text-secondary)]">Veja a semana de cada pessoa, com folgas e intervalos.{editavel ? " Clique em um dia para ajustar na Escala por hora." : ""}</p>
        </div>
        <ul className="m-0 flex list-none flex-wrap items-center gap-x-4 gap-y-1 p-0 text-xs text-[var(--text-secondary)]">
          {LEGENDA.map(([nome, chave]) => (
            <li key={nome} className="flex items-center gap-1.5"><span aria-hidden className="inline-block h-3 w-3 rounded-[3px] border" style={{ background: `var(--escala-semana-${chave}-fundo)`, borderColor: `var(--escala-semana-${chave}-texto)` }} />{nome}</li>
          ))}
          <li className="flex items-center gap-1.5"><span aria-hidden className="inline-block h-3 w-3 rounded-[3px] border border-dashed border-[var(--border-default)]" />Folga</li>
        </ul>
      </div>

      {semEscala(sim.turnos) ? (
        <div className="flex flex-col items-start gap-3 px-6 pb-6" data-testid="semana-vazia">
          <p className="m-0 text-sm leading-5 text-[var(--text-secondary)]">Ainda não há escala para esta semana. Cadastre os turnos para ver a escala da semana.</p>
          <button type="button" onClick={onCadastrar} className="cursor-pointer rounded-btn border border-[var(--border-default)] bg-transparent px-4 py-2 text-sm font-bold text-[var(--text-strong)]">Cadastrar turnos</button>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div role="table" aria-label="Escala da semana" className="min-w-[1020px]">
            <div role="row" className="grid items-center gap-x-2 border-y border-[var(--border-subtle)] bg-[var(--surface-subtle)] py-2 text-[11px] leading-4 font-bold tracking-wide text-[var(--text-secondary)]" style={{ gridTemplateColumns: COLUNAS }}>
              <div role="columnheader" className="sticky left-0 z-[1] bg-[var(--surface-subtle)] pl-6">COLABORADOR</div>
              {DIAS_DA_SEMANA.map((d) => <div key={d} role="columnheader" className="text-center uppercase">{d}</div>)}
              <div role="columnheader" className="pr-0 text-right uppercase">Semana</div>
            </div>
            {grupos.map((g) => (
              <div key={g.funcao}>
                <button type="button" onClick={() => alternar(g.funcao)} aria-expanded={!recolhidos.has(g.funcao)} className="sticky left-0 flex w-full cursor-pointer items-center gap-2 border-0 border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-6 py-2 text-left">
                  <span aria-hidden className="text-xs text-[var(--text-secondary)]">{recolhidos.has(g.funcao) ? "⌄" : "⌃"}</span>
                  <span className="text-sm font-bold text-[var(--text-strong)]">{g.funcao}</span>
                  <span className="text-xs text-[var(--text-secondary)]">{g.pessoas} {g.pessoas === 1 ? "pessoa" : "pessoas"}</span>
                </button>
                {!recolhidos.has(g.funcao) && g.linhas.map((l) => <LinhaDaSemana key={l.matricula} linha={l} colunas={COLUNAS} editavel={editavel} onDia={onDia} />)}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
