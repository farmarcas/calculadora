import { Botao } from "../../components/ui/index.jsx";

// Barra escura que aparece no pé da lista quando há duas ou mais simulações marcadas.
export default function BarraDeComparar({ quantidade, onLimpar, onComparar }) {
  return (
    <div role="region" aria-label="Comparar simulações" className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-[8px] bg-[var(--neutral-dark-900)] px-6 py-3 text-sm text-white">
      <p className="m-0"><strong>{quantidade} simulações selecionadas.</strong> A primeira escolhida é a base da comparação.</p>
      <div className="flex items-center gap-4">
        <button type="button" onClick={onLimpar} className="border-0 bg-transparent p-0 text-sm text-white underline-offset-2 cursor-pointer hover:underline">Limpar</button>
        <Botao onClick={onComparar}>Comparar</Botao>
      </div>
    </div>
  );
}
