// Passo numerado do modal: círculo de 24 px, título (14 px, 700), descrição e, à direita, a ação do passo.
export default function PassoNumerado({ numero, titulo, descricao, acao, children }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--neutral-dark-900)] text-[13px] font-bold text-white">{numero}</span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-[var(--text-strong)]"><span className="sr-only">Passo {numero}: </span>{titulo}</div>
          <p className="m-0 mt-0.5 text-sm text-[var(--text-secondary)]">{descricao}</p>
        </div>
        {acao}
      </div>
      {children && <div className="pl-9">{children}</div>}
    </div>
  );
}
