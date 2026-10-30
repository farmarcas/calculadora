import { useState } from "react";
import { Botao } from "../../components/ui/index.jsx";
import { CARGAS, DIAS_CURTOS, FUNCOES, OUTRO, errosDoFuncionario, formatarCpf } from "./equipe.js";

const CAMPO = "h-10 w-full rounded-[6px] border border-[var(--border-default)] bg-[var(--surface-card)] px-3 text-sm text-[var(--text-strong)] focus:border-2 focus:border-[var(--system-500)] focus:outline-none aria-[invalid=true]:border-[var(--border-danger)]";

// Formulário de funcionário (novo ou edição). Grava na hora ao salvar; erros em texto ligados ao campo.
export default function FormFuncionario({ inicial, editando, salvando, onSalvar, onCancelar }) {
  const [v, setV] = useState(inicial);
  const [tentou, setTentou] = useState(false);
  const erros = tentou ? errosDoFuncionario(v) : [];
  const erro = (c) => erros.find((e) => e.campo === c)?.texto;
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const cargas = CARGAS.includes(Number(v.cargaMensalH)) || !v.cargaMensalH ? CARGAS : [Number(v.cargaMensalH), ...CARGAS];

  const enviar = (e) => {
    e.preventDefault();
    const lista = errosDoFuncionario(v);
    if (lista.length) {
      setTentou(true);
      setTimeout(() => document.querySelector(`[data-campo-func="${lista[0].campo}"]`)?.focus(), 30);
      return;
    }
    onSalvar(v);
  };
  const Erro = ({ c }) => (erro(c) ? <span id={`erro-func-${c}`} role="alert" className="text-xs text-[var(--text-danger)]">{erro(c)}</span> : null);
  const aria = (c) => ({ "data-campo-func": c, "aria-invalid": !!erro(c), "aria-describedby": erro(c) ? `erro-func-${c}` : undefined });

  return (
    <form onSubmit={enviar} aria-label={editando ? "Editar funcionário" : "Novo funcionário"} className="rounded-card bg-[var(--color-primary-soft)] p-4">
      <h3 className="m-0 mb-3 text-base font-bold text-[var(--text-strong)]">{editando ? "Editar funcionário" : "Novo funcionário"}</h3>
      <div className="cl-grid4">
        <label className="flex flex-col gap-1 text-sm text-[var(--text-strong)]">Nome completo *<input {...aria("nome")} className={CAMPO} value={v.nome} onChange={set("nome")} /><Erro c="nome" /></label>
        <label className="flex flex-col gap-1 text-sm text-[var(--text-strong)]">CPF<input {...aria("cpf")} inputMode="numeric" placeholder="000.000.000-00" className={CAMPO} value={v.cpf} onChange={set("cpf")} onBlur={() => setV({ ...v, cpf: formatarCpf(v.cpf) })} /><Erro c="cpf" /></label>
        <label className="flex flex-col gap-1 text-sm text-[var(--text-strong)]">Cargo *
          <select {...aria("cargo")} className={CAMPO} value={v.cargoSel} onChange={set("cargoSel")}>
            <option value="">Selecione</option>
            {FUNCOES.map((f) => <option key={f} value={f}>{f}</option>)}
            <option value={OUTRO}>Outro (fora do cálculo)</option>
          </select>
          <Erro c="cargo" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-[var(--text-strong)]">Carga mensal
          <select className={CAMPO} value={v.cargaMensalH} onChange={set("cargaMensalH")}>
            <option value="">Não informada</option>
            {cargas.map((c) => <option key={c} value={c}>{c}h{c === 220 ? " (44h por semana)" : c === 210 ? " (42h)" : c === 200 ? " (40h)" : ""}</option>)}
          </select>
        </label>
      </div>
      {v.cargoSel === OUTRO && (
        <label className="mt-3 flex max-w-sm flex-col gap-1 text-sm text-[var(--text-strong)]">Qual é o cargo? *<input {...aria("cargoTexto")} className={CAMPO} value={v.cargoTexto} onChange={set("cargoTexto")} /><Erro c="cargoTexto" /></label>
      )}
      <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-3">
        <label className="flex flex-col gap-1 text-sm text-[var(--text-strong)]">Entrada<input {...aria("entrada")} type="time" className={`${CAMPO} w-32`} value={v.entrada} onChange={set("entrada")} /><Erro c="entrada" /></label>
        <label className="flex flex-col gap-1 text-sm text-[var(--text-strong)]">Saída<input {...aria("saida")} type="time" className={`${CAMPO} w-32`} value={v.saida} onChange={set("saida")} /><Erro c="saida" /></label>
        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="mb-1 p-0 text-sm text-[var(--text-strong)]">Dias de trabalho</legend>
          <div className="flex flex-wrap gap-1.5">
            {DIAS_CURTOS.map((n, d) => {
              const on = v.dias.includes(d);
              return (
                <button key={n} type="button" aria-pressed={on} onClick={() => setV({ ...v, dias: on ? v.dias.filter((x) => x !== d) : [...v.dias, d].sort() })}
                  className={`h-10 min-w-10 rounded-[6px] border px-3 text-sm cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--border-focus)] ${on ? "border-[var(--neutral-dark-900)] bg-[var(--neutral-dark-900)] font-bold text-white" : "border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-strong)]"}`}>{n}</button>
              );
            })}
          </div>
        </fieldset>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-[var(--text-strong)]"><input type="checkbox" className="h-4 w-4" checked={v.horarioFixo} onChange={(e) => setV({ ...v, horarioFixo: e.target.checked })} />Horário fixo (não remanejar na redistribuição da escala)</label>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-[var(--text-secondary)]">Salvo na hora, sem usar o botão Salvar alterações.</span>
        <div className="flex items-center gap-2">
          <Botao tipo="secundario" onClick={onCancelar}>Cancelar</Botao>
          <Botao disabled={salvando} onClick={enviar}>{salvando ? "Salvando…" : "Salvar funcionário"}</Botao>
        </div>
      </div>
    </form>
  );
}
