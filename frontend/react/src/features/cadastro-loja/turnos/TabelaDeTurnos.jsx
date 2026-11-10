import { FUNCOES } from "../turnos.js";
import Contador from "./Contador.jsx";
import DetalheDoTurno from "./DetalheDoTurno.jsx";
import { reais } from "./formato.js";
import { faturamentoDoTurno } from "./turnos-grafico.js";

const CAMPO = "h-10 w-full rounded-[6px] border border-[var(--border-default)] bg-[var(--surface-card)] px-3 text-sm text-[var(--text-strong)] focus:border-2 focus:border-[var(--system-500)] focus:outline-none aria-[invalid=true]:border-[var(--border-danger)] disabled:bg-[var(--surface-muted)] disabled:text-[var(--text-secondary)]";
const COLUNAS = "grid items-center gap-3 px-4 [grid-template-columns:minmax(130px,1.3fr)_112px_112px_minmax(110px,1fr)_136px_136px_136px_40px]";
const OUTROS = FUNCOES.filter((f) => f !== "Farmacêutico");

// Tabela de turnos: uma linha por turno, com o faturamento dele e os mínimos de cada cargo. A linha selecionada ganha o detalhe
// logo abaixo (só com faturamento por hora). Os campos e as regras são os de hoje.
export default function TabelaDeTurnos({ turnos, janela, serie, temBase, editavel, erros, selecionado, onSelecionar, onMudar, onRemover }) {
  const erro = (i, c) => erros.find((e) => e.campo === `turno-${i}-${c}`)?.texto;
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[960px] overflow-hidden rounded-card border border-[var(--border-subtle)] bg-[var(--surface-card)]" role="table" aria-label="Turnos da loja">
        <div role="row" className={`${COLUNAS} h-10 bg-[var(--surface-subtle)] text-xs font-bold uppercase text-[var(--text-secondary)]`}>
          {["Turno", "Início", "Fim", "Faturamento", "Farmacêutico", "Atendimento", "Caixa"].map((c) => <span key={c} role="columnheader">{c}</span>)}
          <span role="columnheader"><span className="sr-only">Remover turno</span></span>
        </div>
        {turnos.map((t, i) => {
          const ativa = selecionado === i;
          const f = temBase ? faturamentoDoTurno(t, serie, janela) : null;
          const nome = t.nome || `Turno ${i + 1}`;
          const setMin = (c, v) => onMudar(i, { ...t, minimos: { ...t.minimos, [c]: v } });
          const tirar = (c) => { const { [c]: _, ...resto } = t.minimos; onMudar(i, { ...t, minimos: resto }); };
          const campo = (k, extra = {}) => (
            <div>
              <input data-campo={`turno-${i}-${k}`} aria-label={`${k === "nome" ? "Nome" : k === "inicio" ? "Início" : "Fim"} do turno ${nome}`} className={CAMPO} value={t[k]} disabled={!editavel} aria-invalid={!!erro(i, k)} onFocus={() => onSelecionar(i)} onChange={(e) => onMudar(i, { ...t, [k]: e.target.value })} {...extra} />
            </div>
          );
          return (
            <div key={i} className="border-t border-[var(--border-subtle)]">
              <div role="row" aria-selected={ativa} onClick={() => onSelecionar(i)} className={`${COLUNAS} relative min-h-[72px] py-3 cursor-pointer ${ativa ? "bg-[var(--color-primary-soft)]" : ""}`}>
                {ativa && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-[var(--color-primary)]" />}
                <div role="cell">{campo("nome", { maxLength: 30 })}</div>
                <div role="cell">{campo("inicio", { type: "time" })}</div>
                <div role="cell">{campo("fim", { type: "time" })}</div>
                <div role="cell" className="text-sm text-[var(--text-strong)]">
                  {!temBase ? <span aria-label="sem faturamento por hora">—</span> : f.valor !== undefined ? (<><strong className="block">{reais(f.valor)}</strong><span className="text-xs text-[var(--text-secondary)]">{f.pctDoDia}% do dia</span></>) : <strong>{f.pctDoDia}% do dia</strong>}
                </div>
                <div role="cell"><Contador rotulo={`farmacêuticos no ${nome}`} valor={t.minimos.Farmacêutico ?? 1} min={1} desabilitado={!editavel} onChange={(v) => setMin("Farmacêutico", v)} /></div>
                {OUTROS.map((c) => (
                  <div role="cell" key={c} className="flex items-center gap-2">
                    {t.minimos[c] !== undefined ? (
                      <>
                        <Contador rotulo={`${c} no ${nome}`} valor={t.minimos[c]} min={0} desabilitado={!editavel} onChange={(v) => setMin(c, v)} />
                        {editavel && <button type="button" aria-label={`Tirar ${c} do ${nome}`} className="h-10 w-6 border-0 bg-transparent p-0 text-lg leading-none text-[var(--text-secondary)] cursor-pointer" onClick={(e) => { e.stopPropagation(); tirar(c); }}>×</button>}
                      </>
                    ) : editavel ? (
                      <button type="button" className="h-10 rounded-[6px] border border-[var(--border-default)] bg-[var(--surface-card)] px-3 text-sm text-[var(--text-strong)] cursor-pointer hover:bg-[var(--surface-subtle)]" onClick={(e) => { e.stopPropagation(); setMin(c, 1); }}>+ {c}</button>
                    ) : <span className="text-sm text-[var(--text-secondary)]">—</span>}
                  </div>
                ))}
                <div role="cell">{editavel && turnos.length > 1 && <button type="button" aria-label={`Remover o turno ${nome}`} className="h-10 w-10 border-0 bg-transparent p-0 text-lg leading-none text-[var(--text-secondary)] cursor-pointer" onClick={(e) => { e.stopPropagation(); onRemover(i); }}>×</button>}</div>
              </div>
              {["nome", "inicio", "fim", "farma"].map((c) => erro(i, c) && <p key={c} role="alert" className="m-0 px-4 pb-2 text-xs text-[var(--text-danger)]">{erro(i, c)}</p>)}
              {ativa && temBase && <DetalheDoTurno f={f} nome={nome} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
