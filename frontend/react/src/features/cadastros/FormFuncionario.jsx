import { useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Botao, Campo, Modal, entrada } from "../../components/ui/index.jsx";

const FUNCOES = ["Farmacêutico", "Atendimento", "Caixa", "Apoio", "Perfumaria"];

export default function FormFuncionario({ registro, lojas, onClose, onSalvo }) {
  const [v, setV] = useState({
    matricula: registro?.matricula ?? "",
    nome: registro?.nome ?? "",
    lojaId: registro?.lojaId ?? lojas[0]?.id ?? "",
    cargo: registro?.cargo ?? "",
    funcaoEscala: registro?.funcaoEscala ?? "",
    cargaSemanalH: registro?.cargaSemanalH ?? "",
  });
  const [erro, setErro] = useState(null);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });

  const salvar = async (e) => {
    e?.preventDefault();
    const body = { matricula: v.matricula, nome: v.nome, lojaId: v.lojaId, funcaoEscala: v.funcaoEscala || null };
    if (v.cargo) body.cargo = v.cargo;
    if (v.cargaSemanalH) body.cargaSemanalH = Number(v.cargaSemanalH);
    try {
      await api(registro ? `/funcionarios/${registro.id}` : "/funcionarios", { method: registro ? "PATCH" : "POST", body });
      onSalvo();
    } catch (err) {
      setErro(err.message);
    }
  };

  return (
    <Modal titulo={registro ? "Editar funcionário" : "Novo funcionário"} onClose={onClose}>
      <form onSubmit={salvar} className="flex flex-col gap-4">
        {erro && <Aviso>{erro}</Aviso>}
        <div className="grid grid-cols-2 gap-4">
          <Campo rotulo="Matrícula *"><input required className={entrada} value={v.matricula} onChange={set("matricula")} /></Campo>
          <Campo rotulo="Nome *"><input required minLength={2} className={entrada} value={v.nome} onChange={set("nome")} /></Campo>
          <Campo rotulo="Loja de lotação *">
            <select required className={entrada} value={v.lojaId} onChange={set("lojaId")}>
              {lojas.map((l) => <option key={l.id} value={l.id}>{l.codigo} · {l.nome}</option>)}
            </select>
          </Campo>
          <Campo rotulo="Cargo"><input className={entrada} value={v.cargo} onChange={set("cargo")} /></Campo>
          <Campo rotulo="Função de escala">
            <select className={entrada} value={v.funcaoEscala} onChange={set("funcaoEscala")}>
              <option value="">Fora do cálculo</option>
              {FUNCOES.map((f) => <option key={f}>{f}</option>)}
            </select>
          </Campo>
          <Campo rotulo="Carga semanal (h)"><input type="number" min={1} max={60} className={entrada} value={v.cargaSemanalH} onChange={set("cargaSemanalH")} /></Campo>
        </div>
        <div className="flex justify-end gap-2">
          <Botao tipo="texto" onClick={onClose}>Cancelar</Botao>
          <Botao onClick={salvar}>Salvar</Botao>
        </div>
      </form>
    </Modal>
  );
}
