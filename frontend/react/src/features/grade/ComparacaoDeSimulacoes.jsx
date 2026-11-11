import { useEffect, useId, useMemo, useRef, useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Botao, Ficha } from "../../components/ui/index.jsx";
import { fraseDaRegua, palavraDaRegua } from "../regua.js";
import { DICA_DESATUALIZADA, SITUACOES, VAZIO, tipoTexto } from "./formato.js";
import { temParecer } from "./parecer-regras.js";
import { MAX_COMPARACAO, MIN_COMPARACAO, contarMudancas, diferenca, gruposDisponiveis, gruposVisiveis, mudou, remover, rotuloDaMetrica, textoDoValor, trocarBase, valorDe } from "./comparacao.js";

const COR = { bom: "text-[var(--text-success-strong)]", ruim: "text-[var(--text-danger)]", neutro: "text-[var(--text-secondary)]" };
const DESTAQUE_LINHA = { background: "color-mix(in srgb, var(--color-primary-soft) 55%, transparent)" };
const CABECALHO_FIXO = "sticky top-0 z-20 bg-[var(--surface-card)] align-top";

function ValorSaldo({ valor, metrica }) {
  if (valor == null) return <span className="text-[var(--text-secondary)]">{VAZIO}</span>;
  const cor = valor > 0 ? COR.bom : valor < 0 ? COR.ruim : "";
  return <span className={`${metrica.destaque ? "text-lg font-bold" : ""} ${metrica.destaque ? cor : ""}`}>{textoDoValor(metrica, valor)}</span>;
}

function CelulaDiferenca({ metrica, sim, base }) {
  const d = diferenca(metrica, valorDe(sim, metrica), valorDe(base, metrica));
  if (d.igual) return <span className="text-[var(--text-secondary)]">igual</span>;
  return <span className={`font-bold ${COR[d.tom]}`}>{d.seta && <span aria-hidden="true">{d.seta} </span>}{d.texto}</span>;
}

// Menu "+ Adicionar simulação": as simulações da loja que ainda não estão na comparação.
function Adicionar({ opcoes, desabilitado, onEscolher }) {
  const [aberto, setAberto] = useState(false);
  const raiz = useRef(null);
  const botao = useRef(null);
  const idMenu = useId();
  useEffect(() => {
    if (!aberto) return undefined;
    const fora = (e) => { if (raiz.current && !raiz.current.contains(e.target)) setAberto(false); };
    const tecla = (e) => { if (e.key === "Escape") { setAberto(false); botao.current?.focus(); } };
    document.addEventListener("pointerdown", fora);
    document.addEventListener("keydown", tecla);
    return () => { document.removeEventListener("pointerdown", fora); document.removeEventListener("keydown", tecla); };
  }, [aberto]);
  const dica = desabilitado ? `A comparação aceita no máximo ${MAX_COMPARACAO} simulações.` : opcoes.length === 0 ? "Não há outras simulações para adicionar." : undefined;
  return (
    <div ref={raiz} className="relative">
      <Botao ref={botao} tipo="secundario" disabled={desabilitado || opcoes.length === 0} title={dica} aria-haspopup="menu" aria-expanded={aberto} aria-controls={aberto ? idMenu : undefined} onClick={() => setAberto((a) => !a)}>+ Adicionar simulação</Botao>
      {aberto && (
        <div id={idMenu} role="menu" aria-label="Adicionar simulação" className="absolute right-0 top-full z-30 mt-2 max-h-72 w-72 overflow-auto rounded-[8px] border border-[var(--border-subtle)] bg-[var(--surface-card)] py-2" style={{ boxShadow: "var(--shadow-3)" }}>
          {opcoes.map((s) => (
            <button key={s.id} type="button" role="menuitem" onClick={() => { setAberto(false); onEscolher(s.id); }} className="flex w-full flex-col items-start border-0 bg-transparent px-4 py-2 text-left text-sm text-[var(--text-strong)] cursor-pointer hover:bg-[var(--surface-subtle)]">
              <span className="font-bold">{s.nome}</span>
              <span className="text-xs text-[var(--text-secondary)]">{tipoTexto(s.tipo)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Comparação de 2 a 4 simulações da mesma loja: a primeira é a base; as outras mostram a diferença frente a ela.
export default function ComparacaoDeSimulacoes({ lojaId, ids, lista, onVoltar, onParecer }) {
  const [ordem, setOrdem] = useState(ids);
  const [dados, setDados] = useState({}); // id → simulação comparada
  const [erro, setErro] = useState(null);
  const [soOQueMudou, setSoOQueMudou] = useState(false);
  const chave = useMemo(() => [...ordem].sort().join(","), [ordem]);

  // Só busca de novo quando muda o conjunto de simulações (adicionar ou remover); trocar a base só reordena.
  useEffect(() => {
    let cancelado = false;
    setErro(null);
    api(`/lojas/${lojaId}/simulacoes/comparar?ids=${ordem.join(",")}`)
      .then((r) => { if (!cancelado) setDados(Object.fromEntries(r.simulacoes.map((s) => [s.id, s]))); })
      .catch((e) => { if (!cancelado) setErro(e.message); });
    return () => { cancelado = true; };
  }, [lojaId, chave]); // eslint-disable-line react-hooks/exhaustive-deps

  if (erro) return <div className="flex flex-col gap-4"><Botao tipo="texto" onClick={() => onVoltar()}>← Voltar às simulações</Botao><Aviso>{erro}</Aviso></div>;
  const simulacoes = ordem.map((id) => dados[id]).filter(Boolean);
  if (simulacoes.length < ordem.length) return <p className="text-sm text-[var(--text-secondary)]">Comparando…</p>;

  const base = simulacoes[0];
  const naoBase = simulacoes.slice(1);
  const grupos = gruposDisponiveis(simulacoes);
  const { mudaram, total } = contarMudancas(simulacoes, grupos);
  const visiveis = gruposVisiveis(grupos, simulacoes, soOQueMudou);
  const colunasTotal = 1 + simulacoes.length + naoBase.length;
  const opcoes = lista.filter((s) => s.status !== "descartada" && !ordem.includes(s.id));

  const tirar = (id) => {
    const resto = remover(ordem, id);
    if (resto.length < MIN_COMPARACAO) onVoltar("A comparação precisa de pelo menos 2 simulações.");
    else setOrdem(resto);
  };

  return (
    <div className="flex flex-col gap-4">
      <div><Botao tipo="texto" onClick={() => onVoltar()}>← Voltar às simulações</Botao></div>
      <section aria-labelledby="titulo-comparacao" className="overflow-hidden rounded-[8px] border border-[var(--border-subtle)] bg-[var(--surface-card)]">
        <header className="flex flex-wrap items-start justify-between gap-3 px-6 py-5">
          <div>
            <h2 id="titulo-comparacao" className="m-0 text-xl font-bold text-[var(--text-strong)]">Comparação de simulações</h2>
            <p className="m-0 mt-1 text-sm text-[var(--text-secondary)]">As diferenças são frente à base ({base.nome}). {mudaram} de {total} itens mudaram.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-strong)]">
              <button type="button" role="switch" aria-checked={soOQueMudou} onClick={() => setSoOQueMudou((v) => !v)} className={`relative h-5 w-9 shrink-0 rounded-full border-0 p-0 transition-colors cursor-pointer ${soOQueMudou ? "bg-system-500" : "bg-[var(--border-strong)]"}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${soOQueMudou ? "left-[18px]" : "left-0.5"}`} />
                <span className="sr-only">Mostrar só o que mudou</span>
              </button>
              <span aria-hidden="true">Mostrar só o que mudou</span>
            </label>
            <Adicionar opcoes={opcoes} desabilitado={simulacoes.length >= MAX_COMPARACAO} onEscolher={(id) => setOrdem((o) => [...o, id])} />
          </div>
        </header>

        <p className="m-0 border-t border-[var(--border-subtle)] px-4 py-2 text-xs text-[var(--text-secondary)] md:hidden">Deslize a tabela para o lado para ver as outras simulações.</p>
        <div className="max-h-[70vh] overflow-auto border-t border-[var(--border-subtle)]">
          <table className="w-full min-w-[560px] border-collapse text-sm md:min-w-[720px]">
            <thead>
              <tr>
                <th scope="col" className={`${CABECALHO_FIXO} left-0 w-[110px] min-w-[110px] px-3 py-3 text-left md:w-[280px] md:min-w-[200px] md:px-6`}><span className="sr-only">Métrica</span></th>
                {simulacoes.map((s, i) => {
                  const [tom, rotulo] = SITUACOES[s.status] ?? ["neutro", s.status];
                  return (
                    <th key={s.id} scope="col" className={`${CABECALHO_FIXO} min-w-[170px] px-3 py-3 text-left md:min-w-[200px] md:px-4`}>
                      <div className="font-bold text-[var(--text-strong)]">{s.nome}</div>
                      {onParecer && temParecer(s) && <button type="button" onClick={() => onParecer(s.id)} aria-label={`Ver parecer de ${s.nome}`} className="mt-1 min-h-11 cursor-pointer border-0 bg-transparent p-0 text-xs font-bold text-[var(--text-link,#006ff7)] hover:underline md:min-h-0">Ver parecer</button>}
                      <div className="mt-1.5 flex flex-wrap gap-1.5 font-normal">
                        {i === 0 && <span className="inline-flex h-7 items-center rounded-full bg-[var(--color-primary-soft)] px-3.5 text-xs font-bold text-[var(--system-800)]">Base</span>}
                        <Ficha tom={tom}>{rotulo}</Ficha>
                        {s.desatualizada && <span title={DICA_DESATUALIZADA}><Ficha tom="atencao">Desatualizada</Ficha></span>}
                        <Ficha tom="neutro">{tipoTexto(s.tipo)}</Ficha>
                      </div>
                      {i > 0 && (
                        <div className="mt-2 flex flex-wrap gap-3 font-normal">
                          <button type="button" onClick={() => setOrdem((o) => trocarBase(o, s.id))} className="min-h-11 border-0 bg-transparent p-0 text-xs font-bold text-[var(--text-link,#006ff7)] cursor-pointer hover:underline">Usar como base</button>
                          <button type="button" onClick={() => tirar(s.id)} className="min-h-11 border-0 bg-transparent p-0 text-xs text-[var(--text-secondary)] cursor-pointer hover:underline">Remover da comparação</button>
                        </div>
                      )}
                    </th>
                  );
                })}
                {naoBase.map((s) => (
                  <th key={`d-${s.id}`} scope="col" className={`${CABECALHO_FIXO} w-[170px] min-w-[130px] px-3 py-3 text-left text-[11px] md:min-w-[150px] md:px-4 font-bold uppercase tracking-wide text-[var(--text-secondary)]`}>
                    Diferença{naoBase.length > 1 ? <span className="block normal-case tracking-normal font-normal">{s.nome}</span> : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visiveis.length === 0 && (
                <tr><td colSpan={colunasTotal} className="px-6 py-8 text-center text-[var(--text-secondary)]">Nada mudou frente à base. Desligue "Mostrar só o que mudou" para ver todos os itens.</td></tr>
              )}
              {visiveis.map((g) => (
                <GrupoLinhas key={g.chave} grupo={g} simulacoes={simulacoes} base={base} naoBase={naoBase} colunasTotal={colunasTotal} regua={base.regua} />
              ))}
            </tbody>
          </table>
        </div>
        <p className="m-0 border-t border-[var(--border-subtle)] px-6 py-3 text-xs text-[var(--text-secondary)]">{`Venda e folha são estimativas gerenciais; o saldo é ${palavraDaRegua(base.regua)} estimada menos folha extra, hora extra e ${palavraDaRegua(base.regua)} que deixa de entrar. ${fraseDaRegua(base.regua) ?? ""} Valores em reais só para o dono do grupo.`}</p>
      </section>
    </div>
  );
}

function GrupoLinhas({ grupo, simulacoes, base, naoBase, colunasTotal, regua }) {
  return (
    <>
      <tr>
        <th scope="colgroup" colSpan={colunasTotal} className="border-t border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-6 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">{grupo.titulo}</th>
      </tr>
      {grupo.metricas.map((m) => {
        const mudouAqui = mudou(m, simulacoes);
        return (
          <tr key={m.chave} className="border-t border-[var(--border-subtle)]" style={mudouAqui ? DESTAQUE_LINHA : undefined}>
            <th scope="row" className={`sticky left-0 z-10 px-3 py-3 text-left md:px-6 ${mudouAqui ? "font-bold" : "font-normal"} text-[var(--text-strong)] ${m.destaque ? "text-base" : ""}`} style={{ background: mudouAqui ? "color-mix(in srgb, var(--color-primary-soft) 100%, var(--surface-card))" : "var(--surface-card)" }}>{rotuloDaMetrica(m, regua)}</th>
            {simulacoes.map((s) => (
              <td key={s.id} className="px-4 py-3 text-[var(--text-strong)]">
                {m.chave === "saldo" ? <ValorSaldo valor={valorDe(s, m)} metrica={m} /> : textoDoValor(m, valorDe(s, m))}
              </td>
            ))}
            {naoBase.map((s) => (
              <td key={`d-${s.id}`} className="px-4 py-3"><CelulaDiferenca metrica={m} sim={s} base={base} /></td>
            ))}
          </tr>
        );
      })}
    </>
  );
}
