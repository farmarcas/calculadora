import { useState } from "react";
import { Modal } from "../../components/ui/index.jsx";
import { blocoDoHorarioEstendido } from "./resultado-regras.js";

const COR = { azul: "var(--system-500)", vermelho: "var(--func-warning-300)", neutro: "var(--text-strong)" };

// "Resultado do horário estendido" (spec 049), só para o dono e só quando a simulação abre horas a mais: venda adicional, CMV,
// lucro bruto, aumento de folha e resultado, com o selo "Recomendado" (azul) ou "Não recomendado" (vermelho) e o modal
// "Como calculamos" com a conta aberta. A conta vem pronta do servidor.
export default function BlocoHorarioEstendido({ h }) {
  const [aberto, setAberto] = useState(false);
  const b = blocoDoHorarioEstendido(h);
  if (!b) return null;
  return (
    <section aria-label={b.titulo} data-testid="horario-estendido" className="mt-4 rounded-card border border-[var(--border-subtle)] p-4" style={{ borderLeft: `4px solid ${COR[b.tom]}` }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="m-0 text-sm leading-5 font-bold text-[var(--text-strong)]">{b.titulo}</h3>
        {b.selo && (
          <span data-testid="selo-horario-estendido" className="rounded-full px-3 py-0.5 text-xs leading-4 font-bold text-white" style={{ background: COR[b.selo.tom] }}>
            {b.selo.tom === "azul" ? "✓ " : "✕ "}
            {b.selo.texto}
          </span>
        )}
      </div>
      {b.aviso && <p className="m-0 mt-2 text-xs leading-4 text-[var(--text-secondary)]" role="status">{b.aviso}</p>}
      <dl className="m-0 mt-2 flex flex-col gap-1">
        {b.linhas.map((l) => (
          <div key={l.rotulo} className="flex items-baseline justify-between gap-3 text-xs leading-4">
            <dt className={l.destaque ? "font-bold text-[var(--text-strong)]" : "text-[var(--text-secondary)]"}>{l.rotulo}</dt>
            <dd className="m-0 font-bold" style={{ color: l.destaque ? COR[b.tom] : "var(--text-strong)" }}>{l.valor}</dd>
          </div>
        ))}
      </dl>
      {b.passos.length > 0 && (
        <button type="button" onClick={() => setAberto(true)} className="mt-2 cursor-pointer border-0 bg-transparent p-0 text-xs font-bold text-[var(--color-primary)] underline">Como calculamos</button>
      )}
      {aberto && (
        <Modal titulo="Como calculamos" onClose={() => setAberto(false)}>
          <ol className="m-0 flex flex-col gap-2 pl-5 text-sm leading-5 text-[var(--text-strong)]">
            {b.passos.map((p, i) => <li key={i}>{p}</li>)}
          </ol>
          <p className="m-0 mt-3 text-xs leading-4 text-[var(--text-secondary)]">Estimativa: a venda das horas novas é estimada e o CMV é o real da loja. Nada disso altera o Cadastro.</p>
        </Modal>
      )}
    </section>
  );
}
