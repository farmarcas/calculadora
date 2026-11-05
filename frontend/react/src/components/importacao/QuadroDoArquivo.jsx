import { IconeArquivo } from "./icones.jsx";

// Cartão do arquivo escolhido: ícone, nome (700), linha de apoio e o link "Trocar arquivo".
export default function QuadroDoArquivo({ nome, apoio, onTrocar, desabilitado = false }) {
  return (
    <div className="flex items-center gap-3 rounded-[8px] border border-[var(--border-subtle)] px-4 py-3">
      <span className="text-system-500"><IconeArquivo tamanho={22} /></span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-[var(--text-strong)]" title={nome}>{nome}</div>
        {apoio && <div className="text-xs text-[var(--text-secondary)]">{apoio}</div>}
      </div>
      <button type="button" onClick={onTrocar} disabled={desabilitado} className="shrink-0 border-0 bg-transparent p-1 text-sm font-bold text-[var(--text-link,#006ff7)] cursor-pointer hover:underline disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--border-focus)]">
        Trocar arquivo
      </button>
    </div>
  );
}
