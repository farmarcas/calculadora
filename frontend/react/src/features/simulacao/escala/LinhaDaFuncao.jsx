import { celulasDaFuncao, minimoDaFuncao } from "./escala-regras.js";

export const COR_DA_FUNCAO = { Farmacêutico: "var(--escala-farmaceutico)", Atendimento: "var(--escala-atendimento)", Caixa: "var(--escala-caixa)" };
// A dica da célula: o que a hora tem e, quando há, quem está no intervalo (a razão de faltar com a barra passando por cima).
const dicaDaHora = (c, emIntervalo) => {
  const base = c.ok ? `${c.pessoas} de ${c.exigido} pessoas` : `Abaixo do mínimo: ${c.pessoas} de ${c.exigido}`;
  return emIntervalo?.length ? `${base}. Em intervalo: ${emIntervalo.join(", ")}` : base;
};
const corDe = (f) => COR_DA_FUNCAO[f] ?? "var(--escala-caixa)";

// A linha-resumo de uma função: chevron de recolher, cor, nome, "N pessoas", "+ Contratar" e, em cada hora, quantas pessoas
// estão (verde) ou "N !" com borda vermelha quando fica abaixo do mínimo; borda tracejada azul nas horas reforçadas.
export default function LinhaDaFuncao({ funcao, pessoas, cobertura, reforcadas, recolhida, onAlternar, onContratar, colunas, intervalos = {} }) {
  const celulas = celulasDaFuncao(cobertura, reforcadas);
  return (
    <div role="row" className="grid items-center gap-x-1 border-t border-[var(--border-subtle)] bg-[var(--surface-subtle)] py-2" style={{ gridTemplateColumns: colunas }}>
      <div className="flex min-w-0 items-center gap-2 pl-2">
        <button type="button" aria-expanded={!recolhida} aria-label={`${recolhida ? "Mostrar" : "Recolher"} ${funcao}`} onClick={onAlternar} className="grid h-5 w-5 shrink-0 cursor-pointer place-items-center border-0 bg-transparent p-0 text-[var(--text-secondary)]">
          <span aria-hidden="true" className={`inline-block text-xs transition-transform ${recolhida ? "-rotate-90" : ""}`}>⌃</span>
        </button>
        <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-sm" style={{ background: corDe(funcao) }} />
        <span className="truncate text-sm font-bold text-[var(--text-strong)]">{funcao}</span>
        <span className="shrink-0 text-xs text-[var(--text-secondary)]">{pessoas} {pessoas === 1 ? "pessoa" : "pessoas"}</span>
        {onContratar && <button type="button" onClick={onContratar} className="shrink-0 cursor-pointer border-0 bg-transparent p-0 text-xs font-bold text-[var(--color-primary)] hover:underline">+ Contratar</button>}
      </div>
      {celulas.map((c) => (
        <div
          key={c.hora}
          role="cell"
          title={dicaDaHora(c, intervalos[c.hora])}
          aria-label={`${c.ok ? `${c.hora}h: ${c.pessoas} ${c.pessoas === 1 ? "pessoa" : "pessoas"}` : `${c.hora}h: ${c.pessoas} de ${c.exigido} pessoas, abaixo do mínimo`}${intervalos[c.hora]?.length ? `. Em intervalo: ${intervalos[c.hora].join(", ")}` : ""}`}
          className={`rounded-btn py-1.5 text-center text-xs leading-4 font-bold ${c.reforcada ? "border border-dashed border-[var(--system-500)]" : "border border-transparent"}`}
          style={c.ok ? { background: "var(--func-success-100)", color: "var(--text-success-strong)", ...(c.reforcada ? {} : {}) } : { background: "var(--func-warning-100)", color: "var(--neutral-dark-900)", borderColor: "var(--func-warning-300)", borderStyle: "solid" }}
        >
          {c.texto}
        </div>
      ))}
      <div role="cell" className="pr-2 text-right text-[11px] leading-4 text-[var(--text-secondary)]">{minimoDaFuncao(cobertura.porHora)}</div>
    </div>
  );
}
