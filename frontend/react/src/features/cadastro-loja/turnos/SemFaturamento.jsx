import { Botao } from "../../../components/ui/index.jsx";
import BarraTurnos from "../BarraTurnos.jsx";

// Estado sem dados: a loja ainda não tem base comercial. No lugar do gráfico, uma caixa que leva ao envio da base; embaixo, a
// linha do tempo simples dos turnos (a mesma de antes).
export default function SemFaturamento({ turnos, janela, podeEnviarBase, onEnviarBase }) {
  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-card border-[1.5px] border-dashed border-[var(--border-strong)] bg-[var(--surface-subtle)] px-5 py-4">
        <div className="min-w-0">
          <strong className="block text-sm text-[var(--text-strong)]">Sem faturamento por hora</strong>
          <span className="text-sm text-[var(--text-secondary)]">Envie a base comercial para ver o movimento de cada hora ao lado dos turnos.</span>
        </div>
        {podeEnviarBase && <Botao tipo="secundario" onClick={onEnviarBase}>Enviar base comercial</Botao>}
      </div>
      <div className="mt-4"><BarraTurnos turnos={turnos} janela={janela} /></div>
    </div>
  );
}
