// Barra de progresso sem porcentagem (a leitura e o envio não informam o andamento) com texto, lida por leitores de tela.
export default function Progresso({ texto }) {
  return (
    <div className="flex flex-col gap-2 rounded-[8px] border border-[var(--border-subtle)] px-4 py-4" role="status">
      <div className="text-sm font-bold text-[var(--text-strong)]">{texto}</div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]" aria-hidden="true">
        <div className="h-full w-1/3 animate-pulse rounded-full bg-system-500" />
      </div>
    </div>
  );
}
