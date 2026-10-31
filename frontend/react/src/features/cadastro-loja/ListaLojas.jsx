import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../api/client.js";
import { Botao, entrada } from "../../components/ui/index.jsx";
import { UFS } from "./config.js";

const POR_PAGINA = 20;
const SEL = `${entrada} h-10`;

// Lista de lojas: busca (nome, código ou CNPJ), filtros de cadastro e UF, seleção por clique ou teclado e "Ver mais".
export default function ListaLojas({ lojaId, versao, podeCriar, onSelecionar, onNova, onCarregou }) {
  const [busca, setBusca] = useState("");
  const [situacao, setSituacao] = useState("");
  const [uf, setUf] = useState("");
  const [paginas, setPaginas] = useState(1);
  const [dados, setDados] = useState({ data: [], total: 0 });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const lista = useRef(null);

  const consultar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const q = new URLSearchParams({ page: "1", pageSize: String(POR_PAGINA * paginas) });
      if (busca.trim()) q.set("busca", busca.trim());
      if (situacao) q.set("situacao", situacao);
      if (uf) q.set("uf", uf);
      const r = await api(`/lojas?${q}`);
      setDados({ data: r.data, total: r.meta.total });
      onCarregou?.(r.data);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [busca, situacao, uf, paginas, versao]); // eslint-disable-line react-hooks/exhaustive-deps

  // A busca espera a pessoa terminar de digitar.
  useEffect(() => {
    const t = setTimeout(consultar, 250);
    return () => clearTimeout(t);
  }, [consultar]);

  const filtrando = !!(busca || situacao || uf);
  const limpar = () => { setBusca(""); setSituacao(""); setUf(""); setPaginas(1); };

  // Setas movem o foco entre as linhas; Enter/clique seleciona.
  const aoTeclar = (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const itens = [...lista.current.querySelectorAll("[data-loja]")];
    const i = itens.indexOf(document.activeElement);
    const j = Math.min(itens.length - 1, Math.max(0, i + (e.key === "ArrowDown" ? 1 : -1)));
    if (itens[j]) {
      e.preventDefault();
      itens[j].focus();
    }
  };

  const mostrando = dados.data.length;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col gap-3 px-6 pt-5 pb-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="m-0 text-xl font-bold text-[var(--text-strong)]">Lojas ({dados.total})</h2>
          {podeCriar && <Botao tamanho="pequeno" onClick={onNova}>Cadastrar loja</Botao>}
        </div>
        <input aria-label="Buscar loja" placeholder="Buscar por nome, código ou CNPJ" value={busca} onChange={(e) => { setBusca(e.target.value); setPaginas(1); }} className={`${SEL} w-full`} />
        <div className="grid grid-cols-2 gap-2">
          <select aria-label="Cadastro" value={situacao} onChange={(e) => { setSituacao(e.target.value); setPaginas(1); }} className={SEL}>
            <option value="">Cadastro: todos</option>
            <option value="completo">Completo</option>
            <option value="revisar">Revisar</option>
          </select>
          <select aria-label="UF" value={uf} onChange={(e) => { setUf(e.target.value); setPaginas(1); }} className={SEL}>
            <option value="">UF: todas</option>
            {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      <div ref={lista} onKeyDown={aoTeclar} role="listbox" aria-label="Lojas" className="min-h-0 flex-1 overflow-y-auto border-t border-[var(--border-subtle)]">
        {erro && (
          <div className="p-6 text-sm text-[var(--text-danger)]">
            {erro} <button type="button" className="border-0 bg-transparent p-0 font-bold text-[var(--text-link)] underline cursor-pointer" onClick={consultar}>Tentar de novo</button>
          </div>
        )}
        {carregando && mostrando === 0 && !erro && Array.from({ length: 5 }, (_, i) => (
          <div key={i} aria-hidden="true" className="h-[68px] border-b border-[var(--border-subtle)] px-6 py-3"><div className="h-4 w-40 animate-pulse rounded bg-[var(--surface-muted)]" /><div className="mt-2 h-3 w-56 animate-pulse rounded bg-[var(--surface-muted)]" /></div>
        ))}
        {!carregando && !erro && mostrando === 0 && (
          <div className="p-6 text-sm text-[var(--text-secondary)]">
            {filtrando ? (
              <>Nenhuma loja encontrada. Limpe os filtros ou busque outro nome. <button type="button" className="border-0 bg-transparent p-0 font-bold text-[var(--text-link)] underline cursor-pointer" onClick={limpar}>Limpar filtros</button></>
            ) : "Nenhuma loja ainda. Cadastre uma loja ou importe em massa."}
          </div>
        )}
        {dados.data.map((l) => {
          const sel = l.id === lojaId;
          const ok = l.situacao?.status === "completo";
          return (
            <button key={l.id} type="button" role="option" aria-selected={sel} data-loja={l.id} onClick={() => onSelecionar(l.id)}
              className={`flex h-[68px] w-full items-center justify-between gap-3 border-0 border-b border-[var(--border-subtle)] px-6 text-left cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--border-focus)] ${sel ? "bg-[var(--color-primary-soft)]" : "bg-transparent hover:bg-[var(--surface-hover)]"}`}
              style={{ boxShadow: sel ? "inset 3px 0 0 var(--color-primary)" : "none" }}>
              <span className="min-w-0">
                <strong className="block truncate text-sm text-[var(--text-strong)]">{l.nome}</strong>
                <span className="block truncate text-xs text-[var(--text-secondary)]">Código {l.codigo}{l.uf ? ` · ${l.uf}` : ""} · {l.funcionarios ?? 0} {l.funcionarios === 1 ? "funcionário" : "funcionários"}</span>
              </span>
              <span className="inline-flex h-7 shrink-0 items-center rounded-full px-3 text-xs font-bold text-[var(--text-strong)]" style={{ background: ok ? "var(--func-success-100)" : "var(--func-attention-100)" }}>{ok ? "Completo" : "Revisar"}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-6 py-3 text-xs text-[var(--text-secondary)]">
        <span aria-live="polite">{dados.total === 0 ? "0 lojas" : `1–${mostrando} de ${dados.total} lojas`}</span>
        {mostrando < dados.total && <button type="button" className="border-0 bg-transparent p-0 text-sm font-bold text-[var(--text-link)] cursor-pointer" onClick={() => setPaginas((p) => p + 1)}>Ver mais</button>}
      </div>
    </div>
  );
}
