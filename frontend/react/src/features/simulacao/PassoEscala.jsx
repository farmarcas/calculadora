import { useEffect, useState } from "react";
import { Botao, Passo, entrada } from "../../components/ui/index.jsx";
import Grade from "../grade/Grade.jsx";
import { hhmm, horasLiquidas, lerHhmm } from "../grade/tempo.js";
import { NOMES_DIA, corDaFuncao, ORDEM_FUNCOES } from "./formato.js";

const MOSTRAR = 3;
const COLUNAS = "grid-cols-[180px_repeat(7,minmax(0,1fr))]";

// Escala semanal por função: a primeira linha de cada função mostra poucas pessoas; clicar no dia abre o ajuste por hora.
export default function PassoEscala({ sim, editavel, onSalvarTurnos }) {
  const [turnos, setTurnos] = useState(sim.turnos);
  const [dia, setDia] = useState(null);
  const [sel, setSel] = useState(null);
  const [abertas, setAbertas] = useState({});

  // Mudanças que vêm do servidor (vaga removida, regra trocada) valem sobre a cópia local.
  useEffect(() => setTurnos(sim.turnos), [sim.turnos]);

  const diasAbertos = new Map(sim.diasAbertos.map((d) => [d.dia, d]));
  const pessoas = sim.quadro.filter((p) => !p.desligado);
  const funcoes = [...new Set(pessoas.map((p) => p.funcao ?? "Sem função"))].sort((a, b) => {
    const ia = ORDEM_FUNCOES.indexOf(a);
    const ib = ORDEM_FUNCOES.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });

  const mudar = (novo) => {
    const lista = [...turnos.filter((t) => !(t.matricula === novo.matricula && t.dia === novo.dia)), novo];
    setTurnos(lista);
    onSalvarTurnos(lista);
  };
  const tirar = (matricula, d) => {
    const lista = turnos.filter((t) => !(t.matricula === matricula && t.dia === d));
    setTurnos(lista);
    onSalvarTurnos(lista);
  };
  const novo = (matricula) => {
    const a = diasAbertos.get(dia);
    const e = a?.abre ?? 8;
    mudar({ matricula, dia, entrada: e, saida: Math.min(e + 6, a?.fecha ?? e + 6), iniIntervalo: null, fimIntervalo: null });
    setSel(matricula);
  };

  const turnoSel = sel && dia !== null ? turnos.find((t) => t.matricula === sel && t.dia === dia) : null;
  const pessoaSel = sel ? sim.quadro.find((p) => p.matricula === sel) : null;
  const editarCampo = (campo, valor) => mudar({ ...turnoSel, [campo]: valor === "" ? null : lerHhmm(valor) });
  const erros = [...sim.avaliacao.erros, ...sim.avaliacao.avisos];

  return (
    <Passo numero={3} titulo="Escala da semana" subtitulo="Entrada e saída de cada pessoa. Clique em um dia para ajustar por hora." semMargem>
      <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 px-6 pb-3 text-xs text-[var(--text-secondary)]">
        {[...ORDEM_FUNCOES, "Outras"].map((f) => (
          <span key={f} className="flex items-center gap-1.5"><span aria-hidden="true" className="inline-block h-3 w-3 rounded-[2px]" style={{ background: corDaFuncao(f) }} />{f}</span>
        ))}
        <span className="flex items-center gap-1.5"><span aria-hidden="true" className="inline-block h-3 w-3 rounded-[2px] border border-dashed border-[var(--border-strong)]" />Folga</span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className={`grid ${COLUNAS} items-center gap-2 bg-[var(--surface-subtle)] px-6 py-3 text-xs font-bold uppercase text-[var(--text-strong)]`}>
            <span>Colaborador</span>
            {NOMES_DIA.map((n, d) => (
              <button key={n} type="button" disabled={!diasAbertos.has(d)} aria-pressed={dia === d} onClick={() => setDia(dia === d ? null : d)}
                className={`border-0 bg-transparent p-0 text-center text-xs font-bold uppercase cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--border-focus)] disabled:cursor-not-allowed disabled:opacity-50 ${dia === d ? "text-[var(--system-500)] underline" : "text-[var(--text-strong)]"}`}>
                {n}
              </button>
            ))}
          </div>
          {funcoes.map((f) => {
            const doGrupo = pessoas.filter((p) => (p.funcao ?? "Sem função") === f);
            const visiveis = abertas[f] ? doGrupo : doGrupo.slice(0, MOSTRAR);
            return (
              <div key={f} className="border-t border-[var(--border-subtle)] px-6 py-3">
                <div className="mb-2 text-sm text-[var(--text-strong)]"><strong>{f}</strong> · {doGrupo.length} {doGrupo.length === 1 ? "pessoa" : "pessoas"}</div>
                <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                  {visiveis.map((p) => (
                    <li key={p.matricula} className={`grid ${COLUNAS} items-center gap-2`}>
                      <span className="min-w-0 truncate text-sm font-medium text-[var(--text-strong)]" title={p.nome}>{p.nome}{p.vaga && <span className="ml-1 text-xs font-normal text-[var(--text-secondary)]">(simulada)</span>}</span>
                      {NOMES_DIA.map((n, d) => {
                        const t = turnos.find((x) => x.matricula === p.matricula && x.dia === d);
                        if (!diasAbertos.has(d)) return <span key={n} className="rounded-btn bg-[var(--surface-muted)] px-1 py-2 text-center text-xs text-[var(--text-secondary)]">Fechada</span>;
                        return t ? (
                          <span key={n} className="rounded-btn px-1 py-2 text-center text-xs font-medium text-[var(--text-strong)]" style={{ background: corDaFuncao(f) }}>{hhmm(t.entrada)}–{hhmm(t.saida)}</span>
                        ) : (
                          <span key={n} className="rounded-btn border border-dashed border-[var(--border-strong)] px-1 py-2 text-center text-xs text-[var(--text-secondary)]">Folga</span>
                        );
                      })}
                    </li>
                  ))}
                </ul>
                {doGrupo.length > MOSTRAR && (
                  <button type="button" className="mt-2 border-0 bg-transparent p-0 text-xs font-bold text-[var(--text-link)] underline cursor-pointer" onClick={() => setAbertas({ ...abertas, [f]: !abertas[f] })}>
                    {abertas[f] ? "Mostrar menos" : `Ver mais ${doGrupo.length - MOSTRAR} ${doGrupo.length - MOSTRAR === 1 ? "pessoa" : "pessoas"}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {dia !== null && (
        <div className="border-t border-[var(--border-subtle)] px-6 py-4">
          <h3 className="m-0 mb-1 text-base font-bold text-[var(--text-strong)]">Escala por hora · {NOMES_DIA[dia]}</h3>
          <p className="m-0 mb-3 text-xs text-[var(--text-secondary)]">{editavel ? "Arraste um turno para mover; puxe as bordas para mudar entrada ou saída (passos de 15 min)." : "Somente leitura."}</p>
          <div className="overflow-x-auto">
            <Grade quadro={sim.quadro.filter((p) => !p.desligado)} turnos={turnos} dia={dia} aberto={diasAbertos.get(dia)} editavel={editavel} selecionado={sel} onSelecionar={setSel} onMudar={mudar} onNovoTurno={novo} />
          </div>
          {turnoSel && editavel && (
            <div className="mt-3 flex flex-wrap items-end gap-4 rounded-card bg-[var(--surface-page)] p-4">
              <strong className="self-center text-sm">{pessoaSel?.nome} · {NOMES_DIA[dia]}</strong>
              {[["entrada", "Entrada"], ["iniIntervalo", "Início do intervalo"], ["fimIntervalo", "Fim do intervalo"], ["saida", "Saída"]].map(([k, r]) => (
                <label key={k} className="flex flex-col gap-1 text-xs font-medium text-[var(--text-secondary)]">
                  {r}
                  <input type="time" step={900} className={entrada} value={turnoSel[k] != null ? hhmm(turnoSel[k]) : ""} onChange={(e) => editarCampo(k, e.target.value)} />
                </label>
              ))}
              <span className="self-center text-xs text-[var(--text-secondary)]">{Math.round(horasLiquidas(turnoSel) * 100) / 100}h líquidas</span>
              <Botao tipo="perigo" onClick={() => tirar(turnoSel.matricula, dia)}>Folga neste dia</Botao>
            </div>
          )}
        </div>
      )}

      {erros.length > 0 && (
        <details className="border-t border-[var(--border-subtle)] px-6 py-4">
          <summary className="cursor-pointer text-sm font-bold text-[var(--text-strong)]">Erros e avisos da escala ({erros.length})</summary>
          <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0 text-sm text-[var(--text-strong)]">
            {erros.map((a, i) => <li key={i}><strong>{a.tipo === "erro" ? "Erro: " : "Aviso: "}</strong>{a.texto}</li>)}
          </ul>
        </details>
      )}
    </Passo>
  );
}
