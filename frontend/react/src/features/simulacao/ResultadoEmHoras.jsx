import FaixaDosDias from "../diagnostico/cartao/FaixaDosDias.jsx";
import PillDeStatus from "../diagnostico/cartao/PillDeStatus.jsx";
import { faixaDosDias, rotuloDoStatus, textoDaVariacao, textoDoTotal } from "../diagnostico/cartao/linha-regras.js";
import { COR_DO_TOM } from "../diagnostico/cartao/tom.js";
import { apoioDaVenda, apoioDoCusto, diasDaSimulacao, tabelaDoResultado, textoContratarSimulacao } from "./resultado-regras.js";

const COR = { ...COR_DO_TOM, mudo: "var(--text-secondary)" };

const Carregando = ({ largura = "w-24", altura = "h-7" }) => <span aria-hidden="true" className={`inline-block ${altura} ${largura} animate-pulse rounded bg-[var(--surface-muted)]`} />;

const Numero = ({ rotulo, v, apoio, calculando }) => (
  <div className="min-w-0 flex-1 rounded-card bg-[var(--surface-subtle)] px-3 py-2.5">
    <div className="text-xs leading-4 text-[var(--text-secondary)]">{rotulo}</div>
    <div aria-live="polite" className="mt-0.5 min-h-8 text-[22px] leading-8 font-bold" style={{ color: COR[v.tom] }}>{calculando ? <Carregando /> : v.texto}</div>
    <div className="text-xs leading-4 text-[var(--text-secondary)]">{calculando ? "" : v.apoio ?? apoio}</div>
  </div>
);

// O resultado da simulação em horas e porcentagem, sem nenhum valor em reais (spec 038): pill de status, variação da venda e
// do custo de pessoal, horário dos 7 dias, tabela Hoje × Simulação × Mudança, o que contratar e a causa. Igual para todos os perfis.
export default function ResultadoEmHoras({ r, calculando }) {
  const e = r.emHoras;
  if (!e) return null;
  const status = rotuloDoStatus(e.status);
  const venda = textoDaVariacao(e.vendaPct, e.vendaEstado, "venda");
  const custo = textoDaVariacao(e.custoPct, e.custoEstado, "custo");
  const total = textoDoTotal(e.horasAbertas.simulacao, Math.round((e.horasAbertas.simulacao - e.horasAbertas.hoje) * 100) / 100);
  const { novos, antes } = diasDaSimulacao(r.horario);
  const tabela = tabelaDoResultado(e);
  const contratar = textoContratarSimulacao(e.contratar);

  return (
    <div className="mt-3 flex flex-col gap-4">
      {status && <div><PillDeStatus rotulo={status} /></div>}

      <div className="flex gap-2">
        <Numero rotulo="Venda" v={venda} apoio={apoioDaVenda(e.vendaPct, e.vendaEstado)} calculando={calculando} />
        <Numero rotulo="Custo de pessoal" v={custo} apoio={apoioDoCusto(e.contratar)} calculando={calculando} />
      </div>

      <div>
        <div className="text-sm leading-5 text-[var(--text-secondary)]">
          Horário · <strong className="text-[var(--text-strong)]">{total.principal}</strong>{" "}
          <span className={total.tom === "neutro" ? "" : "font-bold"} style={total.tom === "neutro" ? undefined : { color: COR[total.tom] }}>{total.mudanca}</span>
        </div>
        <div className="mt-2"><FaixaDosDias dias={faixaDosDias(novos, antes)} /></div>
      </div>

      <div role="table" aria-label="Hoje e simulação" className="text-sm">
        <div role="row" className="grid grid-cols-[1.3fr_0.9fr_1fr_1fr] gap-1 border-b border-[var(--border-subtle)] pb-1.5 text-[11px] leading-4 text-[var(--text-secondary)]">
          <span role="columnheader" />
          <span role="columnheader">Hoje</span>
          <span role="columnheader">Simulação</span>
          <span role="columnheader">Mudança</span>
        </div>
        {tabela.map((l) => (
          <div key={l.rotulo} role="row" className="grid grid-cols-[1.3fr_0.9fr_1fr_1fr] gap-1 border-b border-[var(--border-subtle)] py-2 text-[13px] leading-5 last:border-b-0">
            <span role="cell" className="text-[var(--text-strong)]">{l.rotulo}</span>
            <span role="cell">{calculando ? <Carregando altura="h-4" largura="w-10" /> : l.hoje}</span>
            <span role="cell">{calculando ? <Carregando altura="h-4" largura="w-10" /> : l.simulacao}</span>
            <span role="cell" className={l.tom === "mudo" ? "" : "font-bold"} style={{ color: COR[l.tom] }}>{calculando ? "" : l.mudanca}</span>
          </div>
        ))}
      </div>

      <div className="flex items-start justify-between gap-3 border-t border-[var(--border-subtle)] pt-3 text-[13px] leading-5">
        <span className="text-[var(--text-secondary)]">Contratar</span>
        <span className="text-right font-bold text-[var(--text-strong)]">{contratar.map((t, i) => <span key={i} className="block">{t}</span>)}</span>
      </div>

      {e.causa && !calculando && (
        <div className="rounded-btn bg-[var(--func-attention-100)] px-3 py-2 text-xs leading-4 font-bold text-[var(--neutral-dark-900)]" data-testid="causa">{e.causa}</div>
      )}
    </div>
  );
}
