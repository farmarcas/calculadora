import { Botao } from "../../components/ui/index.jsx";

// Barra escura que aparece quando há duas ou mais simulações marcadas. No computador fica no pé da lista; no celular
// fica presa no pé da tela, para o botão "Comparar" não sumir no fim de uma lista comprida.
export default function BarraDeComparar({ quantidade, onLimpar, onComparar }) {
  return (
    <>
      <div aria-hidden="true" className="h-24 md:hidden" />
      <div role="region" aria-label="Comparar simulações" className="fixed inset-x-3 bottom-3 z-40 flex flex-wrap items-center justify-between gap-3 rounded-[8px] bg-[var(--neutral-dark-900)] px-4 py-3 text-sm text-white shadow-[var(--shadow-3)] md:static md:z-auto md:mt-2 md:px-6 md:shadow-none">
        <p className="m-0"><strong>{quantidade} simulações selecionadas.</strong> <span className="hidden md:inline">A primeira escolhida é a base da comparação.</span><span className="md:hidden">A primeira é a base.</span></p>
        <div className="flex items-center gap-4">
          <button type="button" onClick={onLimpar} className="min-h-11 border-0 bg-transparent px-1 text-sm text-white underline-offset-2 cursor-pointer hover:underline">Limpar</button>
          <Botao onClick={onComparar}>Comparar</Botao>
        </div>
      </div>
    </>
  );
}
