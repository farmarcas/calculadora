import { horas } from "../cardDiagnostico.js";

const RAIA = { 44: "Hoje · 44h", 42: "42h", 40: "40h" };
const ROTULO = "text-xs leading-4 font-bold uppercase text-[var(--neutral-mid-300)]";

// "Faltam de farmacêutico por semana" nas três regras (barras de 8 px, largura proporcional ao maior valor).
// Cores: o board usa #C8283C para a regra do diagnóstico; no sistema de design o token mais próximo é --func-warning-300.
export default function BarrasDeFalta({ regras, selecionada }) {
  const maior = Math.max(0, ...regras.map((r) => r.calculo?.gap ?? 0));
  return (
    <div className="flex flex-col gap-2">
      <div className={ROTULO}>Faltam de farmacêutico por semana</div>
      {regras.map((r) => {
        const ativa = r.id === selecionada.id;
        const sem = !r.calculo;
        const gap = r.calculo?.gap ?? 0;
        const rotulo = r.jornada === 44 ? `Hoje, na regra de 44h` : `${r.jornada}h`;
        return (
          <div key={r.id} className="flex items-center gap-3">
            <span className={`w-20 shrink-0 text-[13px] leading-4 ${ativa ? "font-bold text-[var(--text-strong)]" : "text-[var(--text-secondary)]"}`}>{RAIA[r.jornada]}</span>
            <span
              role="img"
              aria-label={sem ? `${rotulo}: sem cálculo` : gap > 0 ? `${rotulo}: faltam ${horas(gap)} por semana` : `${rotulo}: não falta farmacêutico`}
              className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--surface-subtle)]"
            >
              {!sem && <span className="block h-full rounded-full" style={{ width: `${maior ? (gap / maior) * 100 : 0}%`, background: ativa ? "var(--func-warning-300)" : "var(--neutral-mid-100)" }} />}
            </span>
            <span className={`w-10 shrink-0 text-right text-[13px] leading-4 ${ativa ? "font-bold text-[var(--text-strong)]" : "text-[var(--text-secondary)]"}`}>{sem ? "—" : horas(gap)}</span>
          </div>
        );
      })}
    </div>
  );
}
