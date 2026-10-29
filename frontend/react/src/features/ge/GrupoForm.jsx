import { useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Botao, Campo, Modal, entrada } from "../../components/ui/index.jsx";

// Criar ou renomear um grupo. A identificação (número do grupo na plataforma) não muda depois de criada.
export default function GrupoForm({ registro, onClose, onSalvo }) {
  const [v, setV] = useState({ nome: registro?.nome ?? "", identificacao: registro?.identificacao ?? "", responsavel: registro?.responsavel ?? "" });
  const [erro, setErro] = useState(null);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });

  const salvar = async (e) => {
    e.preventDefault();
    setErro(null);
    try {
      if (registro) await api(`/ge/${registro.id}`, { method: "PATCH", body: { nome: v.nome, responsavel: v.responsavel || null } });
      else await api("/ge", { method: "POST", body: { nome: v.nome, identificacao: v.identificacao, ...(v.responsavel ? { responsavel: v.responsavel } : {}) } });
      onSalvo();
    } catch (err) {
      setErro(err.message);
    }
  };

  return (
    <Modal titulo={registro ? "Editar grupo" : "Novo grupo"} onClose={onClose}>
      <form onSubmit={salvar} className="flex flex-col gap-4">
        {erro && <Aviso>{erro}</Aviso>}
        <Campo rotulo="Nome *"><input required minLength={2} className={entrada} value={v.nome} onChange={set("nome")} /></Campo>
        <Campo rotulo="Identificação (número do Grupo Econômico) *">
          <input required className={entrada} value={v.identificacao} onChange={set("identificacao")} disabled={!!registro} />
        </Campo>
        <Campo rotulo="Responsável pelo GE"><input className={entrada} value={v.responsavel} onChange={set("responsavel")} /></Campo>
        <div className="flex justify-end gap-2">
          <Botao tipo="texto" onClick={onClose}>Cancelar</Botao>
          <button type="submit" className="inline-flex items-center justify-center rounded-btn px-4 h-9 text-sm font-medium bg-system-500 text-white hover:bg-system-600">Salvar</button>
        </div>
      </form>
    </Modal>
  );
}
