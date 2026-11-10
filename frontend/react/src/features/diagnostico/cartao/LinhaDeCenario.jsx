import { Botao } from "../../../components/ui/index.jsx";
import FaixaDosDias from "./FaixaDosDias.jsx";
import PillDeStatus from "./PillDeStatus.jsx";
import { estadoVisual, faixaDosDias, rotuloDoStatus, seloDaLinha, textoContratar, textoDaVariacao, textoDoTotal, textoIndisponivel } from "./linha-regras.js";
import { COR_DO_TOM } from "./tom.js";

const COR_VARIACAO = { ...COR_DO_TOM, mudo: "var(--text-secondary)" };

const Celula = ({ rotulo, children, className = "" }) => (
  <div className={`min-w-0 ${className}`}>
    {rotulo && <span className="linha-rotulo">{rotulo}</span>}
    {children}
  </div>
);

const Variacao = ({ v }) => (
  <>
    <div className="text-base leading-6 font-bold" style={{ color: COR_VARIACAO[v.tom] }}>{v.texto}</div>
    {v.apoio && <div className="mt-1 text-[11px] leading-4 text-[var(--text-secondary)]">{v.apoio}</div>}
  </>
);

// Uma linha por cenário, sem nenhum valor em reais: cenário (selo, nome e status), contratar, horário (total e os sete dias),
// variação da venda e do custo de pessoal em %, e o botão. A faixa amarela diz a causa quando há consequência.
export default function LinhaDeCenario({ linha, antes, sugerido, dono, podeEscrever, ocupado, onPersonalizar }) {
  const estado = estadoVisual(linha, { sugerido });
  const status = rotuloDoStatus(linha.status);
  const indisponivel = estado === "indisponivel";
  const rebaixado = estado === "rebaixado";
  const idTitulo = `cenario-${linha.id}-nome`;
  const total = textoDoTotal(linha.horasSemana, linha.horasDiferenca);

  const fundo = estado === "sugerido" ? "bg-[var(--color-primary-soft)]" : rebaixado || indisponivel ? "bg-[var(--surface-subtle)]" : "bg-[var(--surface-card)]";
  const barra = estado === "sugerido" ? "w-1 bg-[var(--system-500)]" : rebaixado ? "w-1.5 bg-[var(--func-warning-300)]" : null;

  return (
    <section aria-labelledby={idTitulo} data-estado={estado} className={`linha-cenario relative border-b border-[var(--border-subtle)] last:border-b-0 ${fundo}`}>
      {barra && <span aria-hidden="true" className={`absolute top-0 bottom-0 left-0 ${barra}`} />}

      <Celula>
        <div className={`text-[11px] leading-4 font-bold tracking-wide ${estado === "sugerido" ? "text-[var(--color-primary)]" : "text-[var(--text-secondary)]"}`}>{seloDaLinha(estado === "sugerido")}</div>
        <h3 id={idTitulo} className={`m-0 mt-0.5 text-base leading-5 font-bold ${rebaixado || indisponivel ? "text-[var(--text-secondary)]" : "text-[var(--text-strong)]"}`}>{linha.nome}</h3>
        {linha.igualA && <div className="text-[11px] leading-4 text-[var(--text-secondary)]">Igual a {linha.igualA}</div>}
        {status && <div className="mt-1.5"><PillDeStatus rotulo={status} rebaixado={rebaixado} /></div>}
        {indisponivel && <div className="mt-1.5 text-[11px] leading-4 text-[var(--text-secondary)]">Indisponível</div>}
      </Celula>

      {indisponivel ? (
        <p className="linha-indisponivel m-0 self-center text-sm leading-5 text-[var(--text-secondary)]">{textoIndisponivel({ dono })}</p>
      ) : (
        <>
          <Celula rotulo="Contratar">
            {textoContratar(linha.contratar).map((t, i) => <div key={i} className="text-sm leading-5 font-bold text-[var(--text-strong)]">{t}</div>)}
          </Celula>
          <Celula rotulo="Horário">
            <div className="text-sm leading-5 text-[var(--text-strong)]">
              <strong>{total.principal}</strong>{" "}
              <span className={total.tom === "neutro" ? "text-[var(--text-secondary)]" : "font-bold"} style={total.tom === "neutro" ? undefined : { color: COR_DO_TOM[total.tom] }}>{total.mudanca}</span>
            </div>
            <div className="mt-2"><FaixaDosDias dias={faixaDosDias(linha.horarioSemana, antes)} /></div>
          </Celula>
          <Celula rotulo="Venda"><Variacao v={textoDaVariacao(linha.vendaPct, linha.vendaEstado, "venda")} /></Celula>
          <Celula rotulo="Custo de pessoal"><Variacao v={textoDaVariacao(linha.custoPct, linha.custoEstado, "custo")} /></Celula>
        </>
      )}

      <div className="linha-acao flex items-start">
        {podeEscrever && (
          <Botao tipo={indisponivel || rebaixado ? "neutro" : sugerido ? "primario" : "secundario"} className="w-full" disabled={ocupado || indisponivel} aria-label={`Personalizar ${linha.nome}`} onClick={onPersonalizar}>
            Personalizar
          </Botao>
        )}
      </div>

      {linha.causa && !indisponivel && (
        <div className="linha-faixa rounded-btn bg-[var(--func-attention-100)] px-3 py-2 text-xs leading-4 font-bold text-[var(--neutral-dark-900)]" data-testid="causa">{linha.causa}</div>
      )}
    </section>
  );
}
