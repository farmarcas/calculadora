import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { api } from "../../api/client.js";
import { ehOperador } from "../../api/perfis.js";
import { LARGURA_DUAS_COLUNAS } from "./config.js";
import DetalheLoja from "./DetalheLoja.jsx";
import ListaLojas from "./ListaLojas.jsx";
import NovaLoja from "./NovaLoja.jsx";
import { confirmarSaida } from "./guardaSaida.js";
import { gravarUrl, lerUrl } from "./urlDaLoja.js";
import { configuracaoParaApi, custosParaApi } from "./AbaRegras.jsx";
import { lojaParaApi } from "./calculos.js";
import useRascunhoLoja from "./useRascunhoLoja.js";

// Como cada bloco do rascunho vira corpo da API (constante para não recriar a cada tela).
const PARA_API = { loja: lojaParaApi, configuracao: configuracaoParaApi, custos: custosParaApi };

// Lista de lojas (esquerda) e a loja escolhida (direita) no mesmo cartão. Abaixo de ~1100 px de largura viram duas telas.
export default function CadastroLojaPage({ perfil, versaoBase = 0, onEnviarBase }) {
  const [nova, setNova] = useState(false);
  const inicial = useRef(lerUrl());
  const [lojaId, setLojaId] = useState(inicial.current.loja ?? null);
  const [aba, setAba] = useState(inicial.current.aba);
  const [vista, setVista] = useState(inicial.current.loja ? "detalhe" : "lista");
  const [largo, setLargo] = useState(true);
  const [painel, setPainel] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [versao, setVersao] = useState(0);
  const caixa = useRef(null);
  const [lojasDaLista, setLojasDaLista] = useState([]);
  const primeiras = useRef([]);
  const largoRef = useRef(true);

  // O layout segue a largura do conteúdo (o menu lateral também tira espaço).
  useLayoutEffect(() => {
    setLargo(caixa.current.getBoundingClientRect().width >= LARGURA_DUAS_COLUNAS);
    const ro = new ResizeObserver(([e]) => setLargo(e.contentRect.width >= LARGURA_DUAS_COLUNAS));
    ro.observe(caixa.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => { largoRef.current = largo; }, [largo]);
  useEffect(() => gravarUrl({ tela: "cadastros", loja: lojaId, aba }), [lojaId, aba]);

  // `silencioso`: atualiza em segundo plano (sem trocar o detalhe por um esqueleto), p. ex. depois de mexer na equipe.
  const carregarPainel = useCallback(async (id, silencioso = false) => {
    if (!silencioso) setCarregando(true);
    setErro(null);
    try {
      setPainel(await api(`/lojas/${id}/painel`));
    } catch (e) {
      // Loja do endereço que não existe neste grupo: volta para a lista.
      if (e.code === "LOJA_NAO_ENCONTRADA") {
        const primeira = largoRef.current ? primeiras.current[0] : null;
        setLojaId(primeira?.id ?? null);
        setVista(primeira ? "detalhe" : "lista");
      }
      else setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    setPainel(null);
    if (lojaId) carregarPainel(lojaId);
  }, [lojaId, carregarPainel]);

  // Base comercial enviada (ou outra importação): recarrega o painel em segundo plano, sem perder o rascunho da pessoa.
  const versaoBaseVista = useRef(versaoBase);
  useEffect(() => {
    if (versaoBaseVista.current === versaoBase) return;
    versaoBaseVista.current = versaoBase;
    if (lojaId) carregarPainel(lojaId, true);
  }, [versaoBase, lojaId, carregarPainel]);

  const aoSalvar = useCallback((r) => {
    setPainel(r);
    setVersao((v) => v + 1);
  }, []);
  const rascunho = useRascunhoLoja(lojaId, { aoSalvar, paraApi: PARA_API });

  const selecionar = (id) => {
    if ((id !== lojaId || nova) && !confirmarSaida()) return;
    setNova(false);
    setLojaId(id);
    setAba("dados");
    setVista("detalhe");
  };
  // Em tela larga, sem loja escolhida, a primeira da lista já abre.
  const aoCarregarLista = (lojas) => {
    primeiras.current = lojas;
    setLojasDaLista(lojas);
  };
  // Sem loja escolhida (ou com a do endereço inexistente) e com espaço para as duas colunas, a primeira da lista abre sozinha.
  useEffect(() => {
    if (!lojaId && !nova && largo && lojasDaLista[0]) { setLojaId(lojasDaLista[0].id); setVista("detalhe"); }
  }, [lojaId, nova, largo, lojasDaLista]);

  return (
    <>
      <div ref={caixa} className="cl-conteiner" data-vista={vista} data-largo={largo}>
        <div className="cl-cartao">
          <div className="cl-lista">
            <ListaLojas lojaId={lojaId} versao={versao} podeCriar={ehOperador(perfil)} onSelecionar={selecionar} onNova={() => { if (!confirmarSaida()) return; setNova(true); setVista("detalhe"); }} onCarregou={aoCarregarLista} />
          </div>
          <div className="cl-detalhe">
            {nova ? (
              <NovaLoja onCancelar={() => { if (confirmarSaida()) { setNova(false); setVista("lista"); } }} onVoltar={() => { if (confirmarSaida()) { setNova(false); setVista("lista"); } }}
                onCriada={(l) => { setNova(false); setLojaId(l.id); setAba("dados"); setVista("detalhe"); setVersao((v) => v + 1); }} />
            ) : (
            <DetalheLoja lojaId={lojaId} aba={aba} onAba={setAba} perfil={perfil} painel={painel} carregando={carregando} erro={erro} rascunho={rascunho} onEnviarBase={onEnviarBase}
              aoMudarEquipe={() => { setVersao((v) => v + 1); if (lojaId) carregarPainel(lojaId, true); }}
              onVoltar={() => { if (confirmarSaida()) setVista("lista"); }} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
