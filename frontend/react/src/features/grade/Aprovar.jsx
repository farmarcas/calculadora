import { useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Botao, Campo, Modal, entrada } from "../../components/ui/index.jsx";

export default function Aprovar({ id, onClose, onAprovada }) {
  const hoje = new Date().toISOString().slice(0, 10);
  const [inicio, setInicio] = useState(hoje);
  const [erro, setErro] = useState(null);
  const confirmar = async () => {
    setErro(null);
    try {
      await api(`/simulacoes/${id}/aprovar`, { method: "POST", body: { vigenciaInicio: inicio } });
      onAprovada();
    } catch (e) {
      setErro(e.details?.length ? `${e.message} ${e.details.slice(0, 2).map((d) => d.texto).join(" ")}` : e.message);
    }
  };
  return (
    <Modal titulo="Aprovar simulação" onClose={onClose}>
      <div className="flex flex-col gap-4">
        {erro && <Aviso>{erro}</Aviso>}
        <Aviso tom="neutro">Ao aprovar, esta passa a ser a simulação em uso da loja. A que estava em uso vira "substituída" e continua no histórico.</Aviso>
        <Campo rotulo="Início da vigência"><input type="date" className={entrada} value={inicio} onChange={(e) => setInicio(e.target.value)} /></Campo>
        <div className="flex justify-end gap-2"><Botao tipo="texto" onClick={onClose}>Cancelar</Botao><Botao onClick={confirmar}>Aprovar</Botao></div>
      </div>
    </Modal>
  );
}
