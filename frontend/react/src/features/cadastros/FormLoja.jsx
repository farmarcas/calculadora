import { useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Botao, Campo, Modal, entrada } from "../../components/ui/index.jsx";

export default function FormLoja({ registro, onClose, onSalvo }) {
  const [v, setV] = useState({
    codigo: registro?.codigo ?? "",
    nome: registro?.nome ?? "",
    cnpj: registro?.cnpj ?? "",
    uf: registro?.uf ?? "",
    marca: registro?.marca ?? "",
    abre: registro?.horarios?.semana?.abre ?? "",
    fecha: registro?.horarios?.semana?.fecha ?? "",
  });
  const [erro, setErro] = useState(null);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });

  const salvar = async (e) => {
    e.preventDefault();
    const body = { codigo: v.codigo, nome: v.nome };
    for (const k of ["cnpj", "uf", "marca"]) if (v[k]) body[k] = v[k];
    if (v.abre && v.fecha) body.horarios = { ...(registro?.horarios ?? {}), semana: { abre: v.abre, fecha: v.fecha } };
    try {
      await api(registro ? `/lojas/${registro.id}` : "/lojas", { method: registro ? "PATCH" : "POST", body });
      onSalvo();
    } catch (err) {
      setErro(err.message);
    }
  };

  return (
    <Modal titulo={registro ? "Editar loja" : "Nova loja"} onClose={onClose}>
      <form onSubmit={salvar} className="flex flex-col gap-4">
        {erro && <Aviso>{erro}</Aviso>}
        <div className="grid grid-cols-2 gap-4">
          <Campo rotulo="Código *"><input required className={entrada} value={v.codigo} onChange={set("codigo")} /></Campo>
          <Campo rotulo="Nome *"><input required minLength={2} className={entrada} value={v.nome} onChange={set("nome")} /></Campo>
          <Campo rotulo="CNPJ"><input className={entrada} value={v.cnpj} onChange={set("cnpj")} /></Campo>
          <Campo rotulo="UF"><input maxLength={2} className={entrada} value={v.uf} onChange={set("uf")} /></Campo>
          <Campo rotulo="Marca"><input className={entrada} value={v.marca} onChange={set("marca")} /></Campo>
          <div />
          <Campo rotulo="Abre (seg a sex)"><input type="time" className={entrada} value={v.abre} onChange={set("abre")} /></Campo>
          <Campo rotulo="Fecha (seg a sex)"><input type="time" className={entrada} value={v.fecha} onChange={set("fecha")} /></Campo>
        </div>
        <div className="flex justify-end gap-2">
          <Botao tipo="texto" onClick={onClose}>Cancelar</Botao>
          <Botao onClick={salvar}>Salvar</Botao>
        </div>
      </form>
    </Modal>
  );
}
