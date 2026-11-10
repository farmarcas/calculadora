// Contador − n + (o − trava em `min`). Os mesmos botões de hoje, com alvo de 40 px.
export default function Contador({ valor, min = 0, max = 10, onChange, rotulo, desabilitado }) {
  const b = "h-10 w-10 border-0 bg-transparent text-base font-bold text-[var(--text-strong)] cursor-pointer hover:bg-[var(--surface-subtle)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--border-focus)]";
  return (
    <div role="group" aria-label={rotulo} className="inline-flex items-center overflow-hidden rounded-[6px] border border-[var(--border-default)] bg-[var(--surface-card)]">
      <button type="button" className={b} aria-label={`Diminuir ${rotulo}`} disabled={desabilitado || valor <= min} onClick={() => onChange(valor - 1)}>−</button>
      <output aria-live="polite" className="w-9 text-center text-sm font-bold text-[var(--text-strong)]">{valor}</output>
      <button type="button" className={b} aria-label={`Aumentar ${rotulo}`} disabled={desabilitado || valor >= max} onClick={() => onChange(valor + 1)}>+</button>
    </div>
  );
}
