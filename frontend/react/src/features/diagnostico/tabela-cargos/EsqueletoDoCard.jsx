const barra = "rounded-btn bg-[var(--surface-subtle)] animate-pulse";

// O card enquanto carrega: as duas colunas sem números.
export default function EsqueletoDoCard() {
  return (
    <div role="status" aria-label="Carregando o diagnóstico" className="grid gap-9 md:grid-cols-[400px_1fr]">
      <div className="flex flex-col gap-3">
        <div className={`${barra} h-6 w-48`} />
        <div className={`${barra} h-8 w-80`} />
        <div className={`${barra} h-12 w-full`} />
        <div className={`${barra} h-20 w-full`} />
      </div>
      <div className="flex flex-col gap-3">
        <div className={`${barra} h-6 w-40`} />
        {[0, 1, 2, 3].map((i) => <div key={i} className={`${barra} h-8 w-full`} />)}
      </div>
    </div>
  );
}
