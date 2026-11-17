import { useState } from "react";
import { Modal } from "../../components/ui/index.jsx";
import { blocoDoHorarioEstendido } from "./resultado-regras.js";

const COR = { verde: "var(--text-success-strong)", vermelho: "var(--text-danger)", neutro: "var(--text-strong)" };
// Selo: verde claro com texto verde escuro (Recomendado) ou vermelho com texto branco (Não recomendado). Sempre com ✓ ou ✕.
const SELO = { verde: { background: "var(--chip-diminui-fundo)", color: "var(--chip-diminui-texto)", border: "1px solid var(--chip-diminui-borda)" }, vermelho: { background: "var(--func-warning-300)", color: "#fff", border: "1px solid var(--func-warning-300)" } };

// "Horário a mais" (specs 049 e 052), só para o dono e só quando a simulação abre horas a mais: quadro cinza com venda adicional,
// custo da mercadoria, lucro bruto, aumento de folha e resultado, o selo "Recomendado" (verde) ou "Não recomendado" (vermelho) e
// o modal "Como calculamos" com a conta aberta. A conta vem pronta do servidor.
export default function BlocoHorarioEstendido({ h, horario }) {
  const [aberto, setAberto] = useState(false);
  const b = blocoDoHorarioEstendido(h, horario);
  if (!b) return null;
  return (
    <section aria-label={b.titulo} data-testid="horario-estendido" className="mt-4 rounded-card bg-[var(--surface-subtle)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="m-0 text-sm leading-5 font-bold text-[var(--text-strong)]">{b.titulo}</h3>
        {b.selo && (
          <span data-testid="selo-horario-estendido" className="rounded-full px-3 py-0.5 text-xs leading-4 font-bold" style={SELO[b.selo.tom]}>
            {b.selo.tom === "verde" ? "✓ " : "✕ "}
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
          <p className="m-0 mt-3 text-xs leading-4 text-[var(--text-secondary)]">Estimativa: a venda das horas novas é estimada e o custo da mercadoria é o real da loja. Nada disso altera o Cadastro.</p>
        </Modal>
      )}
    </section>
  );
}
