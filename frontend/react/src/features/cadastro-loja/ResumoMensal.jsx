import { MotivoCampo, SeloCampo, classeDoCampo, descricaoDoCampo, usarCampos } from "./campoPendente.jsx";
import { divergenciaMensal, faturamentoDaSemana, mensalDosDias } from "./calculos.js";

const CAMPO = "h-10 w-full rounded-[6px] border border-[var(--border-default)] bg-[var(--surface-card)] px-3 text-sm text-[var(--text-strong)] focus:border-2 focus:border-[var(--system-500)] focus:outline-none aria-[invalid=true]:border-[var(--border-danger)] disabled:bg-[var(--surface-muted)] disabled:text-[var(--text-secondary)]";
const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

// Resumo por mês (só o dono): mensal informado, soma dos dias × 52 ÷ 12; alerta quando passam de 10% de diferença.
export default function ResumoMensal({ horarios, faturamento, editavel, erros, onFaturamento }) {
  const semanal = faturamentoDaSemana(horarios, faturamento.dias);
  const calculado = mensalDosDias(semanal);
  const informado = faturamento.mensal === "" ? null : Number(faturamento.mensal);
  const div = divergenciaMensal(informado, calculado);
  const erro = (campo) => erros.find((e) => e.campo === campo)?.texto;
  const mudar = (parte) => onFaturamento({ ...faturamento, ...parte });
  const mapa = usarCampos();

  return (
    <section aria-labelledby="titulo-resumo" className="border-t border-[var(--border-subtle)] pt-6">
      <div className="flex items-center justify-between gap-3">
        <h3 id="titulo-resumo" className="m-0 text-base font-bold text-[var(--text-strong)]">Resumo por mês</h3>
        <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs text-[var(--text-secondary)]">Visível só para o dono</span>
      </div>
      <div className="cl-grid2 mt-3">
        <label className="flex flex-col gap-1 text-sm text-[var(--text-strong)]"><span className="flex flex-wrap items-center">Faturamento mensal informado<SeloCampo campo="mensal" /></span>
          <div className="relative"><span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)]">R$</span>
            <input data-campo="mensal" type="number" min={0} step="any" className={`${CAMPO} pl-9 ${classeDoCampo(mapa, "mensal")}`} disabled={!editavel} value={faturamento.mensal} aria-invalid={!!erro("mensal")} aria-describedby={descricaoDoCampo(mapa, "mensal")} onChange={(e) => mudar({ mensal: e.target.value })} /></div>
          {erro("mensal") && <span role="alert" className="text-xs text-[var(--text-danger)]">{erro("mensal")}</span>}
          <MotivoCampo campo="mensal" />
        </label>
        <div className="flex flex-col gap-1 text-sm text-[var(--text-strong)]">Soma dos dias por mês
          <output aria-live="polite" className={`${CAMPO} flex items-center bg-[var(--surface-muted)] text-[var(--text-secondary)]`}>{brl(calculado)}</output>
          <span className="text-xs text-[var(--text-secondary)]">{brl(semanal)} por semana × 52 semanas ÷ 12 meses</span>
        </div>
      </div>
      <div className="cl-grid2 mt-4">
        <label className="flex flex-col gap-1 text-sm text-[var(--text-strong)]">CMV médio (%)
          <div className="relative">
            <input data-campo="cmvPct" type="number" min={0} max={100} step="any" className={`${CAMPO} pr-9`} disabled={!editavel} value={faturamento.cmvPct ?? ""} aria-invalid={!!erro("cmvPct")} aria-describedby="ajuda-cmv" onChange={(e) => mudar({ cmvPct: e.target.value })} />
            <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)]">%</span>
          </div>
          {erro("cmvPct") && <span role="alert" className="text-xs text-[var(--text-danger)]">{erro("cmvPct")}</span>}
          <span id="ajuda-cmv" className="text-xs text-[var(--text-secondary)]">Parte da venda líquida que volta ao fornecedor como custo da mercadoria. Vale para as horas em que a base de vendas não traz o CMV.</span>
        </label>
      </div>
      {div.diverge && (
        <div role="status" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-card bg-[var(--func-attention-100)] px-4 py-3 text-sm text-[var(--text-strong)]">
          <span>O mensal informado está mais de 10% {div.direcao === "acima" ? "acima" : "abaixo"} da soma dos dias ({brl(calculado)}). Confira os valores.</span>
          {editavel && <button type="button" className="h-9 rounded-btn border border-[var(--border-default)] bg-[var(--surface-card)] px-3 text-sm font-bold text-[var(--text-strong)] cursor-pointer hover:bg-[var(--surface-subtle)]" onClick={() => mudar({ mensal: String(calculado) })}>Usar {brl(calculado)}</button>}
        </div>
      )}
    </section>
  );
}
