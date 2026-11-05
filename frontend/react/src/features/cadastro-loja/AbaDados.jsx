import { useEffect } from "react";
import { UFS } from "./config.js";
import { MotivoCampo, SeloCampo, classeDoCampo, descricaoDoCampo, usarCampos } from "./campoPendente.jsx";
import { diaParaTela, errosDaLoja } from "./calculos.js";
import ResumoMensal from "./ResumoMensal.jsx";
import TabelaFuncionamento from "./TabelaFuncionamento.jsx";
import { formatarCnpj } from "../../api/perfis.js";

const REGIMES = [["", "Não informado"], ["simples", "Simples Nacional"], ["presumido", "Lucro Presumido"], ["real", "Lucro Real"]];
const CAMPO = "h-10 w-full rounded-[6px] border border-[var(--border-default)] bg-[var(--surface-card)] px-3 text-sm text-[var(--text-strong)] focus:border-2 focus:border-[var(--system-500)] focus:outline-none aria-[invalid=true]:border-[var(--border-danger)] disabled:bg-[var(--surface-muted)] disabled:text-[var(--text-secondary)]";

const horariosParaTela = (h) => ({ versao: 2, dias: Array.from({ length: 7 }, (_, i) => diaParaTela(h?.dias?.[i])) });
const faturamentoParaTela = (f) => ({
  dias: Array.from({ length: 7 }, (_, i) => (f?.dias?.[i] == null ? "" : String(f.dias[i]))),
  mensal: f?.mensal == null ? "" : String(f.mensal),
});

// O que a aba edita, no formato da tela (textos). O rascunho compara com isto para contar as alterações.
export const baseDaLoja = (loja, { dono, operador }) => ({
  nome: loja.nome ?? "",
  cidade: loja.cidade ?? "",
  uf: loja.uf ?? "",
  marca: loja.marca ?? "",
  regimeTributario: loja.regimeTributario ?? "",
  ...(operador ? { codigo: loja.codigo ?? "", cnpj: loja.cnpj ?? "" } : {}),
  horarios: horariosParaTela(loja.horarios),
  ...(dono ? { faturamento: faturamentoParaTela(loja.faturamento) } : {}),
});

export default function AbaDados({ painel, rascunho, dono, operador, podeEditar, mostrarErros }) {
  const { loja } = painel;
  const { registrar, alterar, rascunho: r, salvo } = rascunho;
  useEffect(() => { registrar("loja", baseDaLoja(loja, { dono, operador })); }, [loja.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const l = r.loja;
  if (!l) return null;
  const set = (k) => (e) => alterar("loja", { [k]: e.target.value });
  const erros = mostrarErros ? errosDaLoja(l, { dono }) : [];
  const erro = (campo) => erros.find((e) => e.campo === campo)?.texto;
  const regimeMudou = salvo.loja && l.regimeTributario !== salvo.loja.regimeTributario;
  const idLoja = operador ? "ID loja *" : "ID loja";
  const mapa = usarCampos();
  const pend = (c) => classeDoCampo(mapa, c);
  const desc = (c) => descricaoDoCampo(mapa, c);

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="titulo-dados">
        <h3 id="titulo-dados" className="m-0 text-base font-bold text-[var(--text-strong)]">Dados da loja</h3>
        <div className="cl-grid3 mt-3">
          <label className="flex flex-col gap-1 text-sm text-[var(--text-strong)]">{idLoja}
            <input className={CAMPO} value={l.codigo ?? loja.codigo} disabled={!operador || !podeEditar} onChange={set("codigo")} />
            {!operador && <span className="text-xs text-[var(--text-secondary)]">Só o operador altera</span>}
          </label>
          <label className="flex flex-col gap-1 text-sm text-[var(--text-strong)]"><span className="flex flex-wrap items-center">Nome *<SeloCampo campo="nome" /></span>
            <input data-campo="nome" className={`${CAMPO} ${pend("nome")}`} value={l.nome} disabled={!podeEditar} aria-invalid={!!erro("nome")} aria-describedby={erro("nome") ? "erro-nome" : desc("nome")} onChange={set("nome")} />
            <MotivoCampo campo="nome" />
            {erro("nome") && <span id="erro-nome" role="alert" className="text-xs text-[var(--text-danger)]">{erro("nome")}</span>}
          </label>
          <label className="flex flex-col gap-1 text-sm text-[var(--text-strong)]">CNPJ
            <input className={CAMPO} value={operador ? l.cnpj ?? "" : formatarCnpj(loja.cnpj)} disabled={!operador || !podeEditar} placeholder={loja.cnpj ? undefined : "CNPJ pendente"} onChange={set("cnpj")} />
            {!operador && <span className="text-xs text-[var(--text-secondary)]">Só o operador altera</span>}
          </label>
          <label className="flex flex-col gap-1 text-sm text-[var(--text-strong)]"><span className="flex flex-wrap items-center">Cidade<SeloCampo campo="cidade" /></span><input data-campo="cidade" className={`${CAMPO} ${pend("cidade")}`} value={l.cidade} disabled={!podeEditar} aria-describedby={desc("cidade")} onChange={set("cidade")} /><MotivoCampo campo="cidade" /></label>
          <label className="flex flex-col gap-1 text-sm text-[var(--text-strong)]"><span className="flex flex-wrap items-center">UF<SeloCampo campo="uf" /></span>
            <select data-campo="uf" className={`${CAMPO} ${pend("uf")}`} value={l.uf} disabled={!podeEditar} aria-describedby={desc("uf")} onChange={set("uf")}><option value="">—</option>{UFS.map((u) => <option key={u} value={u}>{u}</option>)}</select>
            <MotivoCampo campo="uf" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-[var(--text-strong)]">Bandeira<input className={CAMPO} value={l.marca} disabled={!podeEditar} onChange={set("marca")} /></label>
          <label className="flex flex-col gap-1 text-sm text-[var(--text-strong)]"><span className="flex flex-wrap items-center">Regime tributário<SeloCampo campo="regime" /></span>
            <select data-campo="regime" className={`${CAMPO} ${pend("regime")}`} value={l.regimeTributario} disabled={!podeEditar} aria-describedby={desc("regime")} onChange={set("regimeTributario")}>{REGIMES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select>
            <MotivoCampo campo="regime" />
          </label>
        </div>
        {regimeMudou && <p role="status" className="m-0 mt-3 rounded-card bg-[var(--color-primary-soft)] px-4 py-2 text-sm text-[var(--system-800)]">Os encargos foram recalculados pelo novo regime.</p>}
      </section>

      <div className="border-t border-[var(--border-subtle)] pt-6">
        <TabelaFuncionamento horarios={l.horarios} faturamento={l.faturamento} dono={dono} editavel={podeEditar} mostrarErros={mostrarErros}
          onHorarios={(horarios) => alterar("loja", { horarios })} onFaturamento={(faturamento) => alterar("loja", { faturamento })} />
      </div>

      {dono && l.faturamento && <ResumoMensal horarios={l.horarios} faturamento={l.faturamento} editavel={podeEditar} erros={erros} onFaturamento={(faturamento) => alterar("loja", { faturamento })} />}
    </div>
  );
}
