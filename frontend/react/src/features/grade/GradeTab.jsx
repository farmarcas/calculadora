import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Botao, Campo, Modal, entrada } from "../../components/ui/index.jsx";
import BarraDeComparar from "./BarraDeComparar.jsx";
import ListaDeSimulacoes from "./ListaDeSimulacoes.jsx";
import { MENSAGEM_LIMITE, alternarSelecao, marcadasValidas, mostrarBarra } from "./selecao.js";
import ComparacaoDeSimulacoes from "./ComparacaoDeSimulacoes.jsx";
import SimulacaoPage from "../simulacao/SimulacaoPage.jsx";

function Nova({ lojaId, lista, onClose, onCriada }) {
  const [nome, setNome] = useState("");
  const [regra, setRegra] = useState("r42");
  const [origem, setOrigem] = useState("escala_atual");
  const [erro, setErro] = useState(null);

  const criar = async (e) => {
    e.preventDefault();
    setErro(null);
    try {
      onCriada(await api(`/lojas/${lojaId}/simulacoes`, { method: "POST", body: { nome, regra, origem } }));
    } catch (err) {
      setErro(err.message);
    }
  };

  return (
    <Modal titulo="Nova simulação" onClose={onClose}>
      <form onSubmit={criar} className="flex flex-col gap-4">
        {erro && <Aviso>{erro}</Aviso>}
        <Campo rotulo="Nome *"><input required minLength={2} className={entrada} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: 5x2 com domingo até 20h" /></Campo>
        <Campo rotulo="Regra">
          <select className={entrada} value={regra} onChange={(e) => setRegra(e.target.value)}>
            <option value="atual">44h (regra atual)</option>
            <option value="r42">42h (transição)</option>
            <option value="r40">40h (regra final)</option>
          </select>
        </Campo>
        <Campo rotulo="Começar de">
          <select className={entrada} value={origem} onChange={(e) => setOrigem(e.target.value)}>
            <option value="escala_atual">Equipe do Cadastro, com horários</option>
            <option value="vazia">Do zero (funcionários do Cadastro, sem horários)</option>
            {lista.map((s) => <option key={s.id} value={s.id}>Clonar: {s.nome}</option>)}
          </select>
        </Campo>
        <div className="flex justify-end gap-2">
          <Botao tipo="texto" onClick={onClose}>Cancelar</Botao>
          <Botao onClick={criar}>Criar</Botao>
        </div>
      </form>
    </Modal>
  );
}

export default function GradeTab({ lojaId, perfil, podeEscrever, abrirId, avisoInicial }) {
  const [lista, setLista] = useState([]);
  const [descartadas, setDescartadas] = useState(false);
  const [aberta, setAberta] = useState(null);
  const [nova, setNova] = useState(false);
  const [erro, setErro] = useState(null);
  const [marcadas, setMarcadas] = useState([]);
  const [comparando, setComparando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [limite, setLimite] = useState(false);
  const [avisoLista, setAvisoLista] = useState(null);

  const carregar = useCallback(async () => {
    try {
      const dados = (await api(`/lojas/${lojaId}/simulacoes?descartadas=${descartadas ? 1 : 0}`)).data;
      setLista(dados);
      setMarcadas((m) => marcadasValidas(m, dados));
    } catch (e) {
      setErro(e.message);
    }
  }, [lojaId, descartadas]);

  useEffect(() => {
    setAberta(null);
    setMarcadas([]);
    setComparando(false);
  }, [lojaId]);

  const alternar = (id) => {
    const r = alternarSelecao(marcadas, id);
    setMarcadas(r.marcadas);
    setLimite(r.barrada);
    setAvisoLista(null);
  };
  useEffect(() => {
    carregar();
  }, [carregar]);
  useEffect(() => {
    if (abrirId) {
      setAberta(abrirId);
      setAviso(avisoInicial ?? null);
    }
  }, [abrirId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (comparando)
    return (
      <ComparacaoDeSimulacoes
        lojaId={lojaId}
        ids={marcadas}
        lista={lista}
        onVoltar={(mensagem) => { setComparando(false); setMarcadas(mensagem ? [] : marcadas); setAvisoLista(mensagem ?? null); carregar(); }}
      />
    );

  if (aberta)
    return (
      <SimulacaoPage
        id={aberta}
        perfil={perfil}
        podeEscrever={podeEscrever}
        aviso={aviso}
        onVoltar={() => { setAberta(null); setAviso(null); carregar(); }}
        onMudou={carregar}
        onAbrir={(id, mensagem) => { setAviso(mensagem ?? null); setAberta(id); }}
      />
    );

  return (
    <div className="flex flex-col gap-6">
      {erro && <Aviso>{erro}</Aviso>}
      {avisoLista && <Aviso tom="neutro">{avisoLista}</Aviso>}
      <div>
        <ListaDeSimulacoes
          lista={lista}
          marcadas={marcadas}
          onAlternar={alternar}
          onAbrir={setAberta}
          podeEscrever={podeEscrever}
          onNova={() => setNova(true)}
          descartadas={descartadas}
          onDescartadas={setDescartadas}
        />
        {mostrarBarra(marcadas) && <BarraDeComparar quantidade={marcadas.length} onLimpar={() => { setMarcadas([]); setLimite(false); }} onComparar={() => setComparando(true)} />}
        <p role="status" className="m-0 mt-2 text-sm text-[var(--text-secondary)]">{limite ? MENSAGEM_LIMITE : ""}</p>
      </div>
      {nova && <Nova lojaId={lojaId} lista={lista} onClose={() => setNova(false)} onCriada={(s) => { setNova(false); setAberta(s.id); carregar(); }} />}
    </div>
  );
}
