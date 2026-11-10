import { reais, rotuloHora } from "./formato.js";

const Numero = ({ rotulo, valor, apoio }) => (
  <div className="min-w-0">
    <div className="text-xs font-bold uppercase text-[var(--text-secondary)]">{rotulo}</div>
    <div className="text-xl font-bold text-[var(--text-strong)]">{valor}</div>
    {apoio && <div className="text-xs text-[var(--text-secondary)]">{apoio}</div>}
  </div>
);

// Detalhe do turno selecionado: média por hora, pico, faturamento do turno e as horas dele num mini gráfico. Para quem não
// é dono não há valores em reais: ficam a parte do dia e a forma das barras.
export default function DetalheDoTurno({ f, nome }) {
  if (!f || !f.horas.length) return null;
  const dono = f.valor !== undefined;
  const peso = (h) => (dono ? h.valor : h.participacao);
  const maior = Math.max(...f.horas.map(peso), 0);
  return (
    <div className="flex flex-wrap items-end justify-between gap-6 border-t border-dashed border-[var(--chart-detail-border)] bg-[var(--color-primary-soft)] px-6 py-4" role="group" aria-label={`Detalhe do turno ${nome}`}>
      <div className="flex flex-wrap gap-8">
        {dono && <Numero rotulo="Média por hora" valor={reais(f.media)} apoio="neste turno" />}
        {f.pico && <Numero rotulo="Pico" valor={rotuloHora(f.pico.hora).replace("h", ":00")} apoio={dono ? reais(f.pico.valor) : `${Math.round(f.pico.participacao * 100)}% do dia`} />}
        <Numero rotulo="Faturamento do turno" valor={dono ? reais(f.valor) : `${f.pctDoDia}% do dia`} apoio={dono ? `por dia · ${f.pctDoDia}% do dia` : "por dia"} />
      </div>
      <div className="flex items-end gap-2" role="list" aria-label="Faturamento hora a hora do turno">
        {f.horas.map((h) => (
          <div key={h.hora} role="listitem" aria-label={`${rotuloHora(h.hora)}: ${dono ? reais(h.valor) : `${Math.round(h.participacao * 100)}% do dia`}`} className="flex w-9 flex-col items-center gap-1">
            {dono && <span className="text-xs text-[var(--text-secondary)]">{Math.round(h.valor).toLocaleString("pt-BR")}</span>}
            <div className="w-full rounded-t-[3px]" style={{ height: maior > 0 ? Math.max(3, Math.round((peso(h) / maior) * 56)) : 3, background: f.pico?.hora === h.hora ? "var(--system-500)" : "var(--chart-bar)" }} />
            <span className="text-xs text-[var(--text-secondary)]">{rotuloHora(h.hora)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
