import { Botao, entrada } from "../components/ui/index.jsx";
import { IconeEnvio } from "./icones.jsx";
import { textoDeHoras } from "./horas.js";

// Faixa de 64 px abaixo da barra, nas telas da Escala: horas de funcionamento da loja, o filtro de Loja
// (o único da ferramenta) e o Importar. Abaixo de 1024 px quebra em duas linhas; abaixo de 600 px o Importar vira só o ícone.
export default function FaixaDeContexto({ lojas, lojaId, onLoja, horas, podeImportar, onImportar }) {
  const semLojas = !lojas || lojas.length === 0;
  return (
    <div className="flex shrink-0 flex-col gap-3 border-b border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-3 sm:px-8 lg:h-16 lg:flex-row lg:items-center lg:gap-4 lg:py-0">
      {horas != null && <span className="text-xs leading-4 text-[var(--text-secondary)]">{textoDeHoras(horas)} de funcionamento por semana</span>}
      <span aria-hidden="true" className="hidden flex-1 lg:block" />
      <div className="flex items-center gap-2 lg:gap-4">
        <label className="flex min-w-0 flex-1 items-center gap-2 text-xs text-[var(--text-secondary)] lg:flex-none">
          Loja
          <select
            aria-label="Loja"
            disabled={semLojas}
            value={lojaId}
            onChange={(e) => onLoja(e.target.value)}
            className={`${entrada} h-11 min-w-0 flex-1 lg:h-10 lg:w-[280px] lg:flex-none`}
          >
            {semLojas ? <option value="">Nenhuma loja cadastrada</option> : lojas.map((l) => <option key={l.id} value={l.id}>{l.codigo} · {l.nome}</option>)}
          </select>
        </label>
        {podeImportar && (
          <Botao aria-label="Importar planilhas" onClick={onImportar} className="h-11 shrink-0 max-[599px]:px-3 lg:h-10">
            <IconeEnvio tamanho={18} />
            <span className="hidden min-[600px]:inline">Importar</span>
          </Botao>
        )}
      </div>
    </div>
  );
}
