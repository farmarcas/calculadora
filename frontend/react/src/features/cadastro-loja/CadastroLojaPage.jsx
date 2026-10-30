import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { api } from "../../api/client.js";
import { cuidaDoGrupo, editaLoja, ehOperador } from "../../api/perfis.js";
import { AVISO_DADOS_FICTICIOS, LARGURA_DUAS_COLUNAS } from "./config.js";
import DetalheLoja from "./DetalheLoja.jsx";
import ListaLojas from "./ListaLojas.jsx";
import { confirmarSaida } from "./guardaSaida.js";
import { gravarUrl, lerUrl } from "./urlDaLoja.js";
import useRascunhoLoja from "./useRascunhoLoja.js";

// Lista de lojas (esquerda) e a loja escolhida (direita) no mesmo cartão. Abaixo de ~1100 px de largura viram duas telas.
export default function CadastroLojaPage({ perfil, onNova }) {
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
  const podeEscrever = editaLoja(perfil);
  const dono = cuidaDoGrupo(perfil);

  // O layout segue a largura do conteúdo (o menu lateral também tira espaço).
  useLayoutEffect(() => {
    setLargo(caixa.current.getBoundingClientRect().width >= LARGURA_DUAS_COLUNAS);
    const ro = new ResizeObserver(([e]) => setLargo(e.contentRect.width >= LARGURA_DUAS_COLUNAS));
    ro.observe(caixa.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => gravarUrl({ tela: "cadastros", loja: lojaId, aba }), [lojaId, aba]);

  const carregarPainel = useCallback(async (id) => {
    setCarregando(true);
    setErro(null);
    try {
      setPainel(await api(`/lojas/${id}/painel`));
    } catch (e) {
      // Loja do endereço que não existe neste grupo: volta para a lista.
      if (e.code === "LOJA_NAO_ENCONTRADA") { setLojaId(null); setVista("lista"); }
      else setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    setPainel(null);
    if (lojaId) carregarPainel(lojaId);
  }, [lojaId, carregarPainel]);

  const aoSalvar = useCallback((r) => {
    setPainel(r);
    setVersao((v) => v + 1);
  }, []);
  const rascunho = useRascunhoLoja(lojaId, { aoSalvar });

  const selecionar = (id) => {
    if (id !== lojaId && !confirmarSaida()) return;
    setLojaId(id);
    setAba("dados");
    setVista("detalhe");
  };
  // Em tela larga, sem loja escolhida, a primeira da lista já abre.
  const aoCarregarLista = (lojas) => {
    if (!lojaId && largo && lojas[0]) { setLojaId(lojas[0].id); setVista("detalhe"); }
  };

  return (
    <>
      {AVISO_DADOS_FICTICIOS && (
        <p className="m-0 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-[var(--color-primary)]" />
          Dados fictícios enquanto o parecer de proteção de dados não existir.
        </p>
      )}
      <div ref={caixa} className="cl-conteiner" data-vista={vista} data-largo={largo}>
        <div className="cl-cartao">
          <div className="cl-lista">
            <ListaLojas lojaId={lojaId} versao={versao} podeCriar={ehOperador(perfil)} onSelecionar={selecionar} onNova={onNova} onCarregou={aoCarregarLista} />
          </div>
          <div className="cl-detalhe">
            <DetalheLoja lojaId={lojaId} aba={aba} onAba={setAba} perfil={perfil} podeEscrever={podeEscrever && (dono || ehOperador(perfil))} painel={painel} carregando={carregando} erro={erro} rascunho={rascunho}
              onVoltar={() => { if (confirmarSaida()) setVista("lista"); }} />
          </div>
        </div>
      </div>
    </>
  );
}
