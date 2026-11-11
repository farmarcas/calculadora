import { Botao, Ficha } from "../../components/ui/index.jsx";
import BlocoHorarioEstendido from "./BlocoHorarioEstendido.jsx";
import ResultadoEmHoras from "./ResultadoEmHoras.jsx";

const tipoDeSolucao = (r) => {
  const contrata = r.funcoes.some((f) => f.contratacoes.length > 0);
  if (contrata && r.horario.mudou) return "Contratar e mudar horário";
  if (contrata) return "Só contratar";
  if (r.horario.mudou) return "Só mudar horário";
  return "Sem alterações";
};

export default function PainelResultado({ sim, calculando, podeEscrever, salvando, onSalvar, onClonar }) {
  const r = sim.resultado;
  const editavel = sim.editavel && podeEscrever;

  return (
    <aside aria-label="Resultado da simulação" className="sim-painel rounded-card border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-card p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 text-base font-bold text-[var(--text-strong)]">Resultado da simulação</h2>
        <Ficha>{tipoDeSolucao(r)}</Ficha>
      </div>

      <ResultadoEmHoras r={r} calculando={calculando} />

      {r.horarioEstendido && <BlocoHorarioEstendido h={r.horarioEstendido} />}

      <div className="mt-4">
        {editavel ? (
          <Botao className="w-full" onClick={onSalvar} disabled={salvando || calculando}>
            {salvando ? "Salvando…" : `Salvar como cenário ${sim.proximoNumeroCenario ?? ""}`.trim()}
          </Botao>
        ) : podeEscrever ? (
          <Botao tipo="secundario" className="w-full" onClick={onClonar}>Clonar para ajustar</Botao>
        ) : null}
        <p className="m-0 mt-3 text-center text-xs text-[var(--text-secondary)]">
          {editavel ? "Guarde este cenário e continue ajustando para comparar." : "Simulação gravada: não se edita. Clone para ajustar."}
        </p>
      </div>
    </aside>
  );
}
