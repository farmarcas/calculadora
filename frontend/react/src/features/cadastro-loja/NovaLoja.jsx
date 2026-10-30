import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Botao } from "../../components/ui/index.jsx";
import { UFS } from "./config.js";
import { marcarAlteracoes } from "./guardaSaida.js";

const REGIMES = [["", "Não informado"], ["simples", "Simples Nacional"], ["presumido", "Lucro Presumido"], ["real", "Lucro Real"]];
const CAMPO = "h-10 w-full rounded-[6px] border border-[var(--border-default)] bg-[var(--surface-card)] px-3 text-sm text-[var(--text-strong)] focus:border-2 focus:border-[var(--system-500)] focus:outline-none aria-[invalid=true]:border-[var(--border-danger)]";
const VAZIO = { codigo: "", nome: "", cnpj: "", cidade: "", uf: "", marca: "", regimeTributario: "" };

// Modo "Nova loja" (só o operador): dados da loja; Equipe e Regras e custos ficam bloqueadas até a primeira gravação.
export default function NovaLoja({ onCriada, onCancelar, onVoltar }) {
  const [v, setV] = useState(VAZIO);
  const [tentou, setTentou] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });

  const sujo = Object.values(v).some(Boolean);
  useEffect(() => { marcarAlteracoes(sujo ? 1 : 0); return () => marcarAlteracoes(0); }, [sujo]);

  const erros = [
    !v.codigo.trim() && { campo: "codigo", texto: "Informe o ID da loja." },
    v.nome.trim().length < 2 && { campo: "nome", texto: "Informe o nome da loja (ao menos 2 letras)." },
    v.cnpj.replace(/\D/g, "").length !== 14 && { campo: "cnpj", texto: "Informe o CNPJ com 14 números." },
  ].filter(Boolean);
  const erroDe = (c) => (tentou ? erros.find((e) => e.campo === c)?.texto : null);

  const criar = async (e) => {
    e?.preventDefault();
    if (erros.length) {
      setTentou(true);
      setTimeout(() => document.querySelector(`[data-campo-nova="${erros[0].campo}"]`)?.focus(), 30);
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      const corpo = { codigo: v.codigo.trim(), nome: v.nome.trim(), cnpj: v.cnpj };
      for (const k of ["cidade", "uf", "marca"]) if (v[k]) corpo[k] = v[k].trim();
      if (v.regimeTributario) corpo.regimeTributario = v.regimeTributario;
      onCriada(await api("/lojas", { method: "POST", body: corpo }));
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };
  const campo = (k, rotulo, extra = {}) => (
    <label className="flex flex-col gap-1 text-sm text-[var(--text-strong)]">{rotulo}
      <input data-campo-nova={k} className={CAMPO} value={v[k]} onChange={set(k)} aria-invalid={!!erroDe(k)} aria-describedby={erroDe(k) ? `erro-nova-${k}` : undefined} {...extra} />
      {erroDe(k) && <span id={`erro-nova-${k}`} role="alert" className="text-xs text-[var(--text-danger)]">{erroDe(k)}</span>}
    </label>
  );

  return (
    <form onSubmit={criar} className="flex min-h-full flex-col">
      <div className="px-6 pt-5">
        <button type="button" onClick={onVoltar} className="cl-voltar mb-2 border-0 bg-transparent p-0 text-sm font-bold text-[var(--text-link)] cursor-pointer">← Voltar para a lista</button>
        <h2 className="m-0 text-lg font-bold text-[var(--text-strong)]">Nova loja</h2>
        <p className="m-0 mt-1 text-xs text-[var(--text-secondary)]">Preencha os dados para cadastrar. O funcionamento, o faturamento, a equipe e as regras ficam liberados depois da primeira gravação.</p>
        <div role="tablist" aria-label="Seções da loja" className="mt-4 flex gap-4 border-b border-[var(--border-subtle)]">
          <button type="button" role="tab" aria-selected="true" className="border-0 bg-transparent px-1.5 pt-2 pb-2.5 text-base font-bold text-[var(--text-strong)]" style={{ boxShadow: "inset 0 -3px 0 var(--color-primary)" }}>Dados e funcionamento</button>
          {["Equipe", "Regras e custos"].map((t) => (
            <button key={t} type="button" role="tab" aria-selected="false" aria-disabled="true" disabled title="Disponível depois de cadastrar a loja" className="border-0 bg-transparent px-1.5 pt-2 pb-2.5 text-base text-[var(--text-disabled)] cursor-not-allowed">{t}</button>
          ))}
        </div>
      </div>
      {erro && <div className="px-6 pt-4"><Aviso>{erro}</Aviso></div>}
      <div className="flex-1 px-6 py-6">
        <h3 className="m-0 mb-3 text-base font-bold text-[var(--text-strong)]">Dados da loja</h3>
        <div className="cl-grid3">
          {campo("codigo", "ID loja *")}
          {campo("nome", "Nome *")}
          {campo("cnpj", "CNPJ *", { inputMode: "numeric", placeholder: "00.000.000/0000-00" })}
          {campo("cidade", "Cidade")}
          <label className="flex flex-col gap-1 text-sm text-[var(--text-strong)]">UF
            <select className={CAMPO} value={v.uf} onChange={set("uf")}><option value="">—</option>{UFS.map((u) => <option key={u} value={u}>{u}</option>)}</select>
          </label>
          {campo("marca", "Bandeira")}
          <label className="flex flex-col gap-1 text-sm text-[var(--text-strong)]">Regime tributário
            <select className={CAMPO} value={v.regimeTributario} onChange={set("regimeTributario")}>{REGIMES.map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select>
          </label>
        </div>
      </div>
      <div className="cl-rodape sticky bottom-0 flex min-h-16 flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] bg-[var(--surface-card)] px-6 py-3">
        <span className="text-sm text-[var(--text-secondary)]">{sujo ? "Nova loja ainda não cadastrada" : "Preencha ID loja, nome e CNPJ"}</span>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onCancelar} className="border-0 bg-transparent p-0 text-sm font-bold text-[var(--text-link)] cursor-pointer">Cancelar</button>
          <Botao disabled={salvando} onClick={criar}>{salvando ? "Cadastrando…" : "Cadastrar loja"}</Botao>
        </div>
      </div>
    </form>
  );
}
