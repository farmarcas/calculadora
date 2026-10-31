import { useEffect, useMemo, useRef, useState } from "react";
import { Botao } from "../../../components/ui/index.jsx";
import AbaCobertura from "./AbaCobertura.jsx";
import AbaResultado from "./AbaResultado.jsx";
import { montarCobertura, montarEquipe, montarRegras } from "./montar.js";
import { ABAS_SECAO, gravarAbaNaUrl, lerAbaDaUrl } from "./url.js";

const SUBTITULO = {
  cobertura: "Uma visão por vez. A primeira aba cruza equipe e vendas.",
  regras: "Uma visão por vez. Esta aba compara as três regras.",
  equipe: "Uma visão por vez. Esta aba mostra quem entra na conta.",
};

// Tenta montar; se algo vier fora do esperado, a aba mostra o erro com "Tentar de novo" em vez de quebrar a página.
const tentar = (fn) => {
  try {
    return { dados: fn() };
  } catch (e) {
    return { erro: e };
  }
};

export default function OndeVemSecao({ diag, regraId, podeEscrever, onEnviar, onRecarregar, irCadastros }) {
  const [aba, setAba] = useState(lerAbaDaUrl);
  const refs = useRef({});
  useEffect(() => gravarAbaNaUrl(aba), [aba]);

  // Montado uma vez por diagnóstico (trocar de aba não refaz conta); só a aba 2 depende da regra escolhida no topo.
  const cobertura = useMemo(() => tentar(() => montarCobertura(diag)), [diag]);
  const regras = useMemo(() => tentar(() => (diag.regras?.length ? montarRegras(diag, regraId) : null)), [diag, regraId]);
  const equipe = useMemo(() => tentar(() => montarEquipe(diag)), [diag]);
  const noCalculo = equipe.dados?.noCalculo ?? 0;
  const rotulo = (id, t) => (id === "equipe" ? `${t} (${noCalculo})` : t);

  const aoTeclar = (e, i) => {
    const mover = { ArrowRight: 1, ArrowLeft: -1, Home: -i, End: ABAS_SECAO.length - 1 - i }[e.key];
    if (mover === undefined) return;
    e.preventDefault();
    const j = (i + (e.key === "ArrowRight" || e.key === "ArrowLeft" ? mover + ABAS_SECAO.length : mover)) % ABAS_SECAO.length;
    setAba(ABAS_SECAO[j][0]);
    refs.current[ABAS_SECAO[j][0]]?.focus();
  };

  const atual = { cobertura, regras, equipe }[aba];
  return (
    <section aria-labelledby="titulo-onde-vem" className="flex flex-col gap-3">
      <div>
        <h2 id="titulo-onde-vem" className="m-0 text-xl font-bold text-[var(--text-strong)]">De onde vêm esses números</h2>
        <p className="m-0 mt-1 text-sm text-[var(--text-secondary)]">{SUBTITULO[aba]}</p>
      </div>
      <div className="rounded-card border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-card">
        <div role="tablist" aria-label="Seções de onde vêm os números" className="flex flex-wrap gap-x-6 border-b border-[var(--border-subtle)] px-6">
          {ABAS_SECAO.map(([id, t], i) => {
            const ativa = id === aba;
            return (
              <button key={id} ref={(el) => (refs.current[id] = el)} id={`aba-${id}`} type="button" role="tab" aria-selected={ativa} aria-controls={`painel-${id}`} tabIndex={ativa ? 0 : -1}
                onClick={() => setAba(id)} onKeyDown={(e) => aoTeclar(e, i)}
                className={`cursor-pointer border-0 bg-transparent px-1 pt-4 pb-3 text-base focus-visible:outline-2 focus-visible:outline-[var(--border-focus)] ${ativa ? "font-bold text-[var(--text-strong)]" : "font-normal text-[var(--text-secondary)]"}`}
                style={{ boxShadow: ativa ? "inset 0 -3px 0 var(--color-primary)" : "none" }}>
                {rotulo(id, t)}
              </button>
            );
          })}
        </div>
        <div role="tabpanel" id={`painel-${aba}`} aria-labelledby={`aba-${aba}`}>
          {atual.erro ? (
            <div className="flex flex-wrap items-center gap-3 p-6 text-sm text-[var(--text-danger)]">
              Não foi possível carregar. <Botao tipo="secundario" tamanho="pequeno" onClick={onRecarregar}>Tentar de novo</Botao>
            </div>
          ) : aba === "cobertura" ? (
            <AbaCobertura dados={cobertura.dados} lojaId={diag.loja.id} onEnviar={onEnviar} irCadastros={irCadastros} podeEscrever={podeEscrever} />
          ) : aba === "regras" ? (
            <AbaResultado dados={regras.dados} lojaId={diag.loja.id} irCadastros={irCadastros} />
          ) : (
            <p className="m-0 p-6 text-sm text-[var(--text-secondary)]">Esta aba chega na próxima etapa.</p>
          )}
        </div>
      </div>
      <p className="m-0 flex items-center gap-2 text-xs text-[var(--text-secondary)]"><span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-[var(--color-primary)]" />Valores das regras ainda sem validação jurídica.</p>
    </section>
  );
}
