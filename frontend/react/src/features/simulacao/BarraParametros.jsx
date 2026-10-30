import { Segmentado } from "../../components/ui/index.jsx";
import { REGIMES, textoDeDias, textoDeHoras } from "./formato.js";

const R = "text-xs font-bold uppercase text-[var(--text-secondary)]";

// Regra, horário (manter ou mudar), regime da loja e o que mais vende, numa linha que quebra se faltar espaço.
export default function BarraParametros({ sim, editavel, modoHorario, onModoHorario, onRegra }) {
  const regime = sim.loja.regime ? REGIMES[sim.loja.regime] : null;
  const mv = sim.resultado.maiorVenda;
  return (
    <div className="rounded-card border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-card px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-3">
          <span className={R} id="rotulo-regra">Regra</span>
          <Segmentado rotulo="Regra" opcoes={[["r42", "42h"], ["r40", "40h"]]} valor={sim.regra} onChange={onRegra} desabilitado={!editavel} />
        </div>
        <div className="flex items-center gap-3">
          <span className={R}>Horário</span>
          <Segmentado rotulo="Horário" opcoes={[["manter", "Manter horários"], ["mudar", "Mudar horários"]]} valor={modoHorario} onChange={onModoHorario} desabilitado={!editavel} />
        </div>
        {(regime || sim.loja.encargosPct != null) && (
          <span className="text-sm text-[var(--text-secondary)]">
            {regime}
            {sim.loja.encargosPct != null && `${regime ? " · " : ""}encargos de ${String(sim.loja.encargosPct).replace(".", ",")}%`}
          </span>
        )}
      </div>
      {mv && mv.dias.length > 0 && (
        <p className="m-0 mt-3 text-sm text-[var(--text-secondary)]">
          Maior venda: <strong className="text-[var(--text-strong)]">{textoDeDias(mv.dias)}, {textoDeHoras(mv.horas)}</strong>
        </p>
      )}
    </div>
  );
}
