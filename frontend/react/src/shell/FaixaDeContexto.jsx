import { entrada } from "../components/ui/index.jsx";
import MenuImportar from "./MenuImportar.jsx";
import { itensDoMenuImportar } from "./importar.js";
import { textoDeHoras } from "./horas.js";

function FiltroDeGrupo({ grupos, grupoId, onGrupo }) {
  if (grupos.length === 1) {
    return <span className="min-w-0 truncate text-xs text-[var(--text-secondary)]">Grupo <strong className="text-[var(--text-strong)]">{grupos[0].nome}</strong></span>;
  }
  return (
    <label className="flex min-w-0 flex-1 items-center gap-2 text-xs text-[var(--text-secondary)] lg:flex-none">
      Grupo
      <select
        aria-label="Grupo"
        value={grupoId}
        onChange={(e) => onGrupo(e.target.value)}
        className={`${entrada} h-11 min-w-0 flex-1 lg:h-10 lg:w-[220px] lg:flex-none`}
      >
        {grupos.map((g) => <option key={g.id} value={g.id}>{g.nome}</option>)}
      </select>
    </label>
  );
}

// Faixa de 64 px abaixo da barra: nas telas da Escala, horas de funcionamento da loja, filtros e o Importar; em Minhas Lojas,
// só o filtro de Grupo. Abaixo de 1024 px quebra em duas linhas; abaixo de 600 px o Importar vira só o ícone.
export default function FaixaDeContexto({ lojas, lojaId, onLoja, horas, perfil, acessoTotal = true, onImportar, grupos, grupoId, onGrupo, soGrupo = false }) {
  const semLojas = !lojas || lojas.length === 0;
  const filtroDeGrupo = grupos?.length > 0 && <FiltroDeGrupo grupos={grupos} grupoId={grupoId} onGrupo={onGrupo} />;
  if (soGrupo) {
    return (
      <div className="flex shrink-0 items-center justify-end gap-2 border-b border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-3 sm:px-8 lg:h-16 lg:py-0">
        {filtroDeGrupo}
      </div>
    );
  }
  return (
    <div className="flex shrink-0 flex-col gap-3 border-b border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-3 sm:px-8 lg:h-16 lg:flex-row lg:items-center lg:gap-4 lg:py-0">
      {horas != null && <span className="text-xs leading-4 text-[var(--text-secondary)]">{textoDeHoras(horas)} de funcionamento por semana</span>}
      <span aria-hidden="true" className="hidden flex-1 lg:block" />
      <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:gap-4">
        {filtroDeGrupo}
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
        <MenuImportar itens={itensDoMenuImportar(perfil, acessoTotal)} onEscolher={onImportar} />
      </div>
    </div>
  );
}
