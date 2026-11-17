import { useRef } from "react";
import { AlertaRegime } from "./Encargos.jsx";
import { calculoDaRegra, estadoDoCard, hojeSP, isoDeVigencia } from "./cardDiagnostico.js";
import BarrasDeFalta from "./tabela-cargos/BarrasDeFalta.jsx";
import TabelaPorCargo from "./tabela-cargos/TabelaPorCargo.jsx";
import RodapeDoCard from "./tabela-cargos/RodapeDoCard.jsx";
import { linhasPorCargo } from "./tabela-cargos/tabela-regras.js";

const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
const ROTULO = "text-xs leading-4 font-bold uppercase text-[var(--neutral-mid-300)]";

// As três regras com o que o card precisa de cada uma.
const regrasDoCard = (diag) =>
  diag.regras.map((r) => {
    const jornada = r.id === "atual" ? 44 : r.id === "r42" ? 42 : 40;
    const iso = isoDeVigencia(r.vigencia);
    return { id: r.id, jornada, iso, vigenciaTxt: r.vigencia, calculo: calculoDaRegra(r), regra: r };
  });

function Abas({ regras, valor, onChange }) {
  const refs = useRef([]);
  const onKey = (e, i) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const j = (i + (e.key === "ArrowRight" ? 1 : regras.length - 1)) % regras.length;
    onChange(regras[j].id);
    refs.current[j]?.focus();
  };
  return (
    <div role="tablist" aria-label="Regra do diagnóstico" className="flex overflow-hidden border border-line rounded-btn bg-[var(--surface-card)]">
      {regras.map((r, i) => {
        const ativa = r.id === valor;
        return (
          <button
            key={r.id}
            ref={(el) => (refs.current[i] = el)}
            role="tab"
            type="button"
            aria-selected={ativa}
            tabIndex={ativa ? 0 : -1}
            onClick={() => onChange(r.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={`min-h-11 min-w-0 flex-1 sm:flex-none px-3 sm:px-5 py-1.5 text-left border-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--border-focus)] ${ativa ? "bg-[var(--neutral-dark-900)] text-white" : "bg-transparent text-[var(--text-secondary)]"}`}
          >
            <span className="block text-sm leading-[18px] font-bold">Regra de {r.jornada}h</span>
            <span className="block text-xs leading-4 font-normal">{r.jornada === 44 ? "em vigor hoje" : r.iso && r.iso <= hojeSP() ? "em vigor" : `a partir de ${r.vigenciaTxt}`}</span>
          </button>
        );
      })}
    </div>
  );
}

// O quadro central da aba Diagnóstico: a resposta primeiro ("quanto falta de farmacêutico e o que faço?"), depois a evolução
// 44h → 42h → 40h, os números de apoio (com a folha) e, no fim, as pendências.
export default function QuadroCentral({ diag, regraId, onRegra, podeEscrever, onEnviar, onRecarregar, onDefinirFuncao }) {
  const regras = regrasDoCard(diag);
  const sel = regras.find((r) => r.id === regraId) ?? regras[0];
  const c = sel.calculo;
  const estado = estadoDoCard(sel, regras);
  const folha = diag.folhaMensal;
  const mostrarNota = sel.jornada !== 44 && !diag.config?.convencao8h24;
  const linhas = c ? linhasPorCargo(sel.regra) : [];
  const cargaH = sel.regra.funcoes?.find((f) => f.funcao === "Farmacêutico")?.cargaCheiaH ?? sel.jornada;
  // Chip: o board usa rosa #FFD6DE; no sistema de design o token mais próximo é o de aviso (--func-warning-50), vindo de estadoDoCard.

  return (
    <section aria-label="Diagnóstico da escala" className="diag-conteiner flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <h2 className="m-0 text-xl leading-[26px] font-bold text-[var(--text-strong)]">Diagnóstico da escala</h2>
        <Abas regras={regras} valor={sel.id} onChange={onRegra} />
      </div>

      <div className="bg-[var(--surface-card)] border border-line rounded-card shadow-card p-6 flex flex-col gap-4">
        <div className="diag-grade">
          <div className="flex flex-col gap-3 min-w-0">
            <span className="self-start rounded-full px-3 py-1 text-xs leading-4 font-bold text-[var(--neutral-dark-900)]" style={{ background: estado.fundo }}>
              {estado.pill}
            </span>
            <h3 className="m-0 text-2xl leading-8 font-bold text-[var(--text-strong)]">{estado.titulo}</h3>
            <p className="m-0 text-[13px] leading-5 text-[var(--text-secondary)]">{estado.apoio}</p>
            <BarrasDeFalta regras={regras} selecionada={sel} />
          </div>

          <div className="flex flex-col gap-3 min-w-0">
            {c ? (
              <>
                {estado.falta && (
                  <div className="flex items-baseline justify-between gap-3">
                    <span className={ROTULO}>Contratações sugeridas</span>
                    <span className="text-lg leading-6 font-bold text-[var(--text-strong)]">{c.contratacoes > 0 ? plural(c.contratacoes, "pessoa", "pessoas") : "Nenhuma"}</span>
                  </div>
                )}
                <TabelaPorCargo regra={sel.regra} linhas={linhas} horasAbertas={diag.loja?.horasAbertas ?? null} jornada={cargaH} />
              </>
            ) : (
              <p className="m-0 text-sm text-[var(--text-secondary)]">Sem cálculo para esta regra</p>
            )}
          </div>
        </div>

        {mostrarNota && (
          <p className="m-0 text-xs leading-4 text-[var(--text-secondary)]">Sem convenção que permita jornada de 8h24, na prática a escala fica em 40h por semana (5 × 8h).</p>
        )}

        <RodapeDoCard diag={diag} podeEscrever={podeEscrever} onEnviar={onEnviar} onDefinirFuncao={onDefinirFuncao} />
      </div>

      {folha?.informado && folha.alertaRegime && (
        <div className="px-1">
          <AlertaRegime lojaId={diag.loja.id} texto={folha.alertaRegime} onSalvo={onRecarregar} />
        </div>
      )}
    </section>
  );
}
