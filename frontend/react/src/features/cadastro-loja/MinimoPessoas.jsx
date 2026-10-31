import { Botao, Segmentado } from "../../components/ui/index.jsx";
import BarraTurnos, { horasTexto, janelaTextoDoTurno } from "./BarraTurnos.jsx";
import { FUNCOES, MAX_TURNOS, coberturaDoHorario, janelaDaLoja, texto, turnosIniciais } from "./turnos.js";

const CAMPO = "h-10 w-full rounded-[6px] border border-[var(--border-default)] bg-[var(--surface-card)] px-3 text-sm text-[var(--text-strong)] focus:border-2 focus:border-[var(--system-500)] focus:outline-none aria-[invalid=true]:border-[var(--border-danger)] disabled:bg-[var(--surface-muted)]";
const NOMES_DIA = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

// Contador − n + (o − trava em `min`).
function Contador({ valor, min = 0, max = 10, onChange, rotulo, desabilitado }) {
  const b = "h-8 w-8 border-0 bg-transparent text-base font-bold text-[var(--text-strong)] cursor-pointer hover:bg-[var(--surface-subtle)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]";
  return (
    <div role="group" aria-label={rotulo} className="inline-flex items-center overflow-hidden rounded-[6px] border border-[var(--border-default)] bg-[var(--surface-card)]">
      <button type="button" className={b} aria-label={`Diminuir ${rotulo}`} disabled={desabilitado || valor <= min} onClick={() => onChange(valor - 1)}>−</button>
      <output aria-live="polite" className="w-9 text-center text-sm font-bold text-[var(--text-strong)]">{valor}</output>
      <button type="button" className={b} aria-label={`Aumentar ${rotulo}`} disabled={desabilitado || valor >= max} onClick={() => onChange(valor + 1)}>+</button>
    </div>
  );
}

function CartaoTurno({ turno, i, total, janela, editavel, erros, onMudar, onRemover }) {
  const erro = (c) => erros.find((e) => e.campo === `turno-${i}-${c}`)?.texto;
  const presentes = FUNCOES.filter((f) => f !== "Farmacêutico" && turno.minimos[f] !== undefined);
  const ausentes = FUNCOES.filter((f) => f !== "Farmacêutico" && turno.minimos[f] === undefined);
  const setMin = (f, v) => onMudar({ ...turno, minimos: { ...turno.minimos, [f]: v } });
  const tirar = (f) => { const { [f]: _, ...resto } = turno.minimos; onMudar({ ...turno, minimos: resto }); };
  const campo = (k, rotulo, extra = {}) => (
    <label className="flex flex-col gap-1 text-sm text-[var(--text-strong)]">{rotulo}
      <input data-campo={`turno-${i}-${k}`} className={CAMPO} value={turno[k]} disabled={!editavel} aria-invalid={!!erro(k)} onChange={(e) => onMudar({ ...turno, [k]: e.target.value })} {...extra} />
      {erro(k) && <span role="alert" className="text-xs text-[var(--text-danger)]">{erro(k)}</span>}
    </label>
  );
  return (
    <div className="rounded-card border border-[var(--border-subtle)] p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0"><strong className="text-base text-[var(--text-strong)]">{turno.nome || `Turno ${i + 1}`}</strong> <span className="text-xs text-[var(--text-secondary)]">{horasTexto(turno)} · {janelaTextoDoTurno(turno, janela)}</span></div>
        {editavel && total > 1 && <button type="button" className="shrink-0 border-0 bg-transparent p-0 text-sm font-bold text-[var(--text-link)] cursor-pointer" onClick={onRemover}>Remover</button>}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <div className="col-span-3">{campo("nome", "Nome do turno", { maxLength: 30 })}</div>
        {campo("inicio", "Início", { type: "time" })}{campo("fim", "Fim", { type: "time" })}
      </div>
      <h4 className="m-0 mt-4 text-xs font-bold uppercase text-[var(--text-secondary)]">Pessoas mínimas no horário da loja</h4>
      <div className="mt-2 flex items-center justify-between gap-3 rounded-[6px] bg-[var(--surface-subtle)] px-3 py-2">
        <div className="min-w-0"><strong className="block text-sm text-[var(--text-strong)]">Farmacêutico</strong><span className="text-xs text-[var(--text-secondary)]">Obrigatório: mínimo 1 (Lei 13.021/2014)</span></div>
        <Contador rotulo={`farmacêuticos no ${turno.nome || `turno ${i + 1}`}`} valor={turno.minimos.Farmacêutico ?? 1} min={1} desabilitado={!editavel} onChange={(v) => setMin("Farmacêutico", v)} />
      </div>
      {presentes.map((f) => (
        <div key={f} className="mt-2 flex items-center justify-between gap-3 rounded-[6px] bg-[var(--surface-subtle)] px-3 py-2">
          <strong className="text-sm text-[var(--text-strong)]">{f}</strong>
          <div className="flex items-center gap-2">
            <Contador rotulo={`${f} no ${turno.nome || `turno ${i + 1}`}`} valor={turno.minimos[f]} min={0} desabilitado={!editavel} onChange={(v) => setMin(f, v)} />
            {editavel && <button type="button" aria-label={`Tirar ${f} do ${turno.nome || `turno ${i + 1}`}`} className="border-0 bg-transparent p-0 text-lg leading-none text-[var(--text-secondary)] cursor-pointer" onClick={() => tirar(f)}>×</button>}
          </div>
        </div>
      ))}
      {editavel && ausentes.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">Adicionar cargo:
          {ausentes.map((f) => <button key={f} type="button" className="h-8 rounded-[6px] border border-[var(--border-default)] bg-[var(--surface-card)] px-3 text-sm text-[var(--text-strong)] cursor-pointer hover:bg-[var(--surface-subtle)]" onClick={() => setMin(f, 1)}>+ {f}</button>)}
        </div>
      )}
    </div>
  );
}

// "Mínimo de pessoas": por turnos (barra e cartões) ou mínimo único do dia. Trocar de modo não apaga o outro.
export default function MinimoPessoas({ config, horarios, editavel, erros, onMudar }) {
  const janela = janelaDaLoja(horarios);
  const modo = config.modoMinimo;
  const turnos = config.turnos;
  const faixas = turnos?.length ? coberturaDoHorario(turnos, horarios) : [];
  const aberto = (horarios?.dias ?? []).filter((d) => d.aberta).length;

  const trocar = (m) => {
    if (m === "turnos" && !turnos) onMudar({ modoMinimo: "turnos", turnos: turnosIniciais(janela, config.minimos) });
    else onMudar({ modoMinimo: m });
  };
  const mudarTurno = (i, novo) => onMudar({ turnos: turnos.map((t, j) => (j === i ? novo : t)) });
  const adicionar = () => {
    const u = turnos[turnos.length - 1];
    onMudar({ turnos: [...turnos, { nome: `Turno ${turnos.length + 1}`, inicio: u.fim === "00:00" ? "08:00" : u.fim, fim: janela ? (janela.fecha === 24 ? "00:00" : texto(janela.fecha)) : "20:00", minimos: { Farmacêutico: 1 } }] });
  };

  return (
    <section aria-labelledby="titulo-minimo" className="border-t border-[var(--border-subtle)] pt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-xl">
          <h3 id="titulo-minimo" className="m-0 text-base font-bold text-[var(--text-strong)]">Mínimo de pessoas</h3>
          <p className="m-0 mt-1 text-xs text-[var(--text-secondary)]">Defina quantas pessoas de cada cargo a loja exige em cada turno. O mínimo vale só durante o horário de funcionamento da loja.</p>
        </div>
        <Segmentado rotulo="Modo do mínimo" opcoes={[["turnos", "Por turnos"], ["unico", "Mínimo único do dia"]]} valor={modo} onChange={trocar} desabilitado={!editavel} />
      </div>

      {modo === "unico" ? (
        <div className="mt-4 overflow-hidden rounded-card border border-[var(--border-subtle)]">
          {FUNCOES.map((f) => (
            <div key={f} className="flex items-center justify-between gap-4 border-t border-[var(--border-subtle)] px-4 py-3 first:border-t-0">
              <div className="min-w-0"><strong className="block text-sm text-[var(--text-strong)]">{f}</strong><span className="text-xs text-[var(--text-secondary)]">{f === "Farmacêutico" ? "A lei exige farmacêutico em todo o horário de funcionamento (mínimo 1, fixo)." : "Meta opcional. Deixe 0 para manter o nível de hoje."}</span></div>
              <input type="number" aria-label={f === "Farmacêutico" ? "Mínimo de Farmacêutico" : `Meta de ${f}`} min={f === "Farmacêutico" ? 1 : 0} max={10} disabled={!editavel || f === "Farmacêutico"} value={config.minimos[f] ?? (f === "Farmacêutico" ? 1 : 0)} onChange={(e) => onMudar({ minimos: { ...config.minimos, [f]: Math.max(0, Math.min(10, Number(e.target.value) || 0)) } })} className={`${CAMPO} w-20`} />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--text-strong)]">
            <span>{janela ? <>Horário da loja: <strong>{texto(janela.abre)} a {texto(janela.fecha)}</strong> ({Math.round((janela.fecha - janela.abre) * 100) / 100}h)</> : "Cadastre o horário de funcionamento da loja para definir os turnos."}</span>
            {janela && (faixas.length === 0 ? <span className="inline-flex h-7 items-center rounded-full px-3 text-xs font-bold" style={{ background: "var(--func-success-100)" }}>Horário da loja coberto</span> : null)}
          </div>
          {faixas.length > 0 && (
            <ul role="status" className="m-0 mt-2 list-none rounded-card bg-[var(--func-attention-100)] p-3 text-sm text-[var(--text-strong)]">
              {faixas.map((f, i) => (
                <li key={i}>Sem turno entre {texto(f.de)} e {texto(f.ate)}{f.dias.length === aberto ? "" : ` (${f.dias.map((d) => NOMES_DIA[d]).join(", ")})`}: nessas horas vale 1 farmacêutico e os demais cargos mantêm o nível de hoje.</li>
              ))}
            </ul>
          )}
          <div className="mt-4"><BarraTurnos turnos={turnos} janela={janela} /></div>
          <div className="cl-grid2 mt-4">
            {turnos.map((t, i) => <CartaoTurno key={i} turno={t} i={i} total={turnos.length} janela={janela} editavel={editavel} erros={erros} onMudar={(n) => mudarTurno(i, n)} onRemover={() => onMudar({ turnos: turnos.filter((_, j) => j !== i) })} />)}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {editavel && turnos.length < MAX_TURNOS && <Botao tipo="secundario" onClick={adicionar}>+ Adicionar turno</Botao>}
            <span className="text-xs text-[var(--text-secondary)]">Os turnos podem se sobrepor e começar antes da abertura ou terminar depois do fechamento. Fim 00:00 vale como meia-noite.</span>
          </div>
        </>
      )}
    </section>
  );
}
