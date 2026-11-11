import { corDaMudanca } from "./parecer-regras.js";

// "O QUE MUDA" (spec 057): hoje, com o cenário e a mudança. "Com o cenário" em negrito; "Mudança" à direita, verde para melhora,
// âmbar para piora e neutro para "—". A folha em % não se repete aqui: fica só no número grande.
export default function ParecerTabela({ linhas }) {
  return (
    <section aria-label="O que muda" data-testid="parecer-tabela">
      <h3 className="m-0 text-[11px] leading-4 font-bold tracking-wide text-[var(--text-secondary)] uppercase">O que muda</h3>
      <table className="mt-2 w-full border-collapse text-sm">
        <thead>
          <tr className="text-left text-xs text-[var(--text-secondary)]">
            <th scope="col" className="w-[38%] py-1.5 pr-2 font-normal"><span className="sr-only">Item</span></th>
            <th scope="col" className="py-1.5 pr-2 font-normal">Hoje</th>
            <th scope="col" className="py-1.5 pr-2 font-normal">Com o cenário</th>
            <th scope="col" className="py-1.5 text-right font-normal">Mudança</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.rotulo} className="border-t border-[var(--border-subtle)]">
              <th scope="row" className="py-2.5 pr-2 text-left font-normal text-[var(--text-strong)]">{l.rotulo}</th>
              <td className="py-2.5 pr-2 text-[var(--text-secondary)]">{l.hoje}</td>
              <td className="py-2.5 pr-2 font-bold text-[var(--text-strong)]">{l.comOCenario}</td>
              <td className="py-2.5 text-right font-bold" style={{ color: corDaMudanca(l.mudanca.tom) }}>{l.mudanca.texto}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
