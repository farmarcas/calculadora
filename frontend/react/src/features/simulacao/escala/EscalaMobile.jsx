import { COR_DA_FUNCAO } from "./LinhaDaFuncao.jsx";
import { celulasDaFuncao, mediaDoDia, minimoDaFuncao, quartis, rotuloHora, textoDoTurno, tomDoQuartil, totalDaSemana } from "./escala-regras.js";

const FUNDO = ["var(--escala-tom-0)", "var(--escala-tom-1)", "var(--escala-tom-2)", "var(--escala-tom-3)"];
const TEXTO = ["var(--text-strong)", "var(--text-strong)", "#fff", "#fff"];
const num = (v) => (v == null ? "—" : Math.round(v).toLocaleString("pt-BR"));

// A faixa horizontal de uma métrica por hora (clientes ou venda), com rolagem.
const FaixaDaMetrica = ({ rotulo, sub, valores, horas }) => {
  const qs = quartis(valores);
  return (
    <div className="mb-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] leading-4 font-bold text-[var(--text-strong)]">{rotulo}</span>
        <span className="text-[11px] leading-4 text-[var(--text-secondary)]">{sub} · média {num(mediaDoDia(valores))}</span>
      </div>
      <div className="mt-1 overflow-x-auto">
        <div className="flex min-w-max gap-1">
          {valores.map((v, i) => {
            const tom = tomDoQuartil(v, qs);
            return (
              <div key={horas[i]} className="w-11 text-center">
                <div className="text-[10px] leading-4 text-[var(--text-secondary)]">{rotuloHora(horas[i])}</div>
                <div className="rounded-btn py-1 text-xs leading-4 font-bold" style={{ background: FUNDO[tom], color: TEXTO[tom] }}>{num(v)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// A escala no celular (spec 039): uma lista por função com o turno de cada pessoa em texto, a cobertura por hora numa faixa
// com rolagem e "+ Contratar" por função. Nesta versão não se arrasta: o ajuste fino dos turnos é no computador.
export default function EscalaMobile({ horas, dono, vendaDia, clientesDia, temBase, blocos, turnos, dia, editavel, recolhidas, onAlternar, onContratar, formulario, onRemover }) {
  const pegar = (m) => horas.map((h) => m?.[h] ?? 0);
  return (
    <div className="escala-mobile px-4 pb-4">
      {dono && vendaDia && <FaixaDaMetrica rotulo="Venda por hora" sub="R$ · só o dono vê" valores={pegar(vendaDia)} horas={horas} />}
      {clientesDia ? (
        <FaixaDaMetrica rotulo="Clientes por hora" sub="cupons vendidos" valores={pegar(clientesDia)} horas={horas} />
      ) : (
        <p className="mb-3 text-sm text-[var(--text-secondary)]"><strong className="text-[var(--text-strong)]">Clientes por hora</strong> · {temBase ? "Sem clientes por hora neste dia." : "Sem clientes por hora nesta base."}</p>
      )}

      {blocos.map(({ f, cob, pessoas, simuladas, reforcadas }) => {
        const celulas = celulasDaFuncao(cob, reforcadas);
        const recolhida = recolhidas.has(f);
        return (
          <section key={f} aria-label={f} className="mb-3 rounded-card border border-[var(--border-subtle)] bg-[var(--surface-card)]">
            <div className="flex items-center gap-2 rounded-t-card bg-[var(--surface-subtle)] px-3 py-2">
              <button type="button" aria-expanded={!recolhida} aria-label={`${recolhida ? "Mostrar" : "Recolher"} ${f}`} onClick={() => onAlternar(f)} className="cursor-pointer border-0 bg-transparent p-0 text-xs text-[var(--text-secondary)]">
                <span aria-hidden="true" className={`inline-block transition-transform ${recolhida ? "-rotate-90" : ""}`}>⌃</span>
              </button>
              <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-sm" style={{ background: COR_DA_FUNCAO[f] ?? "var(--escala-caixa)" }} />
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-[var(--text-strong)]">{f} <span className="font-normal text-[var(--text-secondary)]">· {pessoas.length} {pessoas.length === 1 ? "pessoa" : "pessoas"} · {minimoDaFuncao(cob.porHora)}</span></span>
              {editavel && <button type="button" onClick={() => onContratar(f)} className="shrink-0 cursor-pointer border-0 bg-transparent p-0 text-xs font-bold text-[var(--color-primary)]">+ Contratar</button>}
            </div>

            <div className="overflow-x-auto px-3 pt-2">
              <div className="flex min-w-max gap-1">
                {celulas.map((c) => (
                  <div key={c.hora} className="w-11 text-center">
                    <div className="text-[10px] leading-4 text-[var(--text-secondary)]">{rotuloHora(c.hora)}</div>
                    <div
                      aria-label={c.ok ? `${c.hora}h: ${c.pessoas}` : `${c.hora}h: ${c.pessoas} de ${c.exigido}, abaixo do mínimo`}
                      className={`rounded-btn border py-1 text-xs leading-4 font-bold ${c.reforcada ? "border-dashed border-[var(--system-500)]" : "border-transparent"}`}
                      style={c.ok ? { background: "var(--func-success-100)", color: "var(--text-success-strong)" } : { background: "var(--func-warning-100)", color: "var(--neutral-dark-900)", borderColor: "var(--func-warning-300)", borderStyle: "solid" }}
                    >
                      {c.texto}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {formulario(f)}

            {!recolhida && (
              <ul className="m-0 list-none p-0 pt-2">
                {[...pessoas.map((p) => ({ p, simulada: false })), ...simuladas.map((s) => ({ p: { matricula: s.matricula, nome: "Contratação simulada", funcao: f }, simulada: true, texto: s.texto }))].map(({ p, simulada, texto }) => {
                  const t = turnos.find((x) => x.matricula === p.matricula && x.dia === dia);
                  const total = totalDaSemana(turnos, p.matricula);
                  return (
                    <li key={p.matricula} className={`flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] px-3 py-2 ${simulada ? "bg-[var(--color-primary-soft)]" : ""}`}>
                      <div className="min-w-0">
                        <div className={`truncate text-[13px] leading-4 font-bold ${simulada ? "text-[var(--color-primary)]" : "text-[var(--text-strong)]"}`}>{p.nome}</div>
                        <div className="truncate text-[11px] leading-4 text-[var(--text-secondary)]">{simulada ? texto : `${p.funcao} · ${p.cargaH ?? ""}h`.replace(" · h", "")}</div>
                        {simulada && editavel && <button type="button" onClick={() => onRemover(p.matricula)} className="cursor-pointer border-0 bg-transparent p-0 text-[11px] leading-4 font-bold text-[var(--text-danger)]">Remover</button>}
                      </div>
                      <div className="shrink-0 text-right text-xs leading-4">
                        <div className="font-bold text-[var(--text-strong)]">{t ? textoDoTurno(t) : simulada && total.dias === 0 ? "Sem turnos" : "Folga"}</div>
                        <div className="text-[var(--text-secondary)]">{total.texto}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
