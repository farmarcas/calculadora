import { abrirNoCadastro } from "./atalhos.js";

// "E se a convenção coletiva permitir 8h24 por dia?": o efeito na regra de 42h, com o atalho para onde se altera.
export default function BlocoOito24({ oito24, lojaId, irCadastros }) {
  if (!oito24) return null;
  return (
    <div role="note" className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-card bg-[var(--system-50)] px-5 py-4">
      <div className="min-w-0 max-w-3xl">
        <h3 className="m-0 text-base font-bold text-[var(--text-strong)]">E se a convenção coletiva permitir 8h24 por dia?</h3>
        <p className="m-0 mt-1 text-sm text-[var(--text-strong)]">
          {oito24.texto.split(`faltariam ${oito24.faltariaH}h em vez de ${oito24.faltaHoje}h`).length > 1 ? (
            <>
              {oito24.texto.split(`faltariam ${oito24.faltariaH}h em vez de ${oito24.faltaHoje}h`)[0]}
              <strong>faltariam {oito24.faltariaH}h em vez de {oito24.faltaHoje}h</strong>
              {oito24.texto.split(`faltariam ${oito24.faltariaH}h em vez de ${oito24.faltaHoje}h`)[1]}
            </>
          ) : oito24.texto}
        </p>
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-strong)]">
        <span>Hoje: <strong>Não permite</strong></span>
        <button type="button" className="border-0 bg-transparent p-0 text-sm font-bold text-[var(--text-link)] cursor-pointer" onClick={() => abrirNoCadastro({ lojaId, aba: "regras", irCadastros })}>Alterar em Regras e custos</button>
      </div>
    </div>
  );
}
