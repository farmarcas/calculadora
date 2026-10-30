import { useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Botao, Campo, Modal, entrada } from "../../components/ui/index.jsx";
import FaturamentoLoja, { erroDeFaturamento, faturamentoParaApi, faturamentoParaEdicao } from "./FaturamentoLoja.jsx";
import EquipeLoja from "./EquipeLoja.jsx";
import HorarioSemana, { erroDeHorario, paraApi, paraEdicao } from "./HorarioSemana.jsx";
import { cuidaDoGrupo, ehOperador, formatarCnpj } from "../../api/perfis.js";

const REGIMES = [["", "Não informado"], ["simples", "Simples Nacional"], ["presumido", "Lucro Presumido"], ["real", "Lucro Real"]];
const UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

export default function FormLoja({ registro, perfil, onClose, onSalvo }) {
  const dono = perfil === "TENANT_ADMIN";
  const operador = ehOperador(perfil);
  // O CNPJ identifica a loja: só o operador informa e muda (o empresário vê, não edita).
  const cnpjEditavel = operador;
  const [v, setV] = useState({
    codigo: registro?.codigo ?? "",
    nome: registro?.nome ?? "",
    cnpj: registro?.cnpj ? formatarCnpj(registro.cnpj) : "",
    cidade: registro?.cidade ?? "",
    uf: registro?.uf ?? "",
    marca: registro?.marca ?? "",
    regimeTributario: registro?.regimeTributario ?? "",
  });
  const [dias, setDias] = useState(() => paraEdicao(registro?.horarios, !registro));
  const [fat, setFat] = useState(() => faturamentoParaEdicao(registro?.faturamento));
  const [mexeuNoHorario, setMexeuNoHorario] = useState(false);
  const [erro, setErro] = useState(null);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });

  const salvar = async (e) => {
    e.preventDefault();
    const body = { codigo: v.codigo, nome: v.nome };
    for (const k of ["cidade", "uf", "marca"]) if (v[k]) body[k] = v[k];
    if (cnpjEditavel && v.cnpj) body.cnpj = v.cnpj;
    // Em loja já cadastrada, "Não informado" limpa o regime.
    if (v.regimeTributario) body.regimeTributario = v.regimeTributario;
    else if (registro?.regimeTributario) body.regimeTributario = null;
    const problema = erroDeHorario(dias) ?? (dono ? erroDeFaturamento(fat) : null);
    if (dono) {
      const f = faturamentoParaApi(fat);
      // Só manda quando há algo a gravar ou a limpar.
      if (f || registro?.faturamento) body.faturamento = f;
    }
    if (problema) return setErro(problema);
    // Só manda o horário se for loja nova, se já tinha horário ou se a pessoa mexeu nele.
    if (!registro || registro.horarios || mexeuNoHorario) body.horarios = paraApi(dias);
    try {
      await api(registro ? `/lojas/${registro.id}` : "/lojas", { method: registro ? "PATCH" : "POST", body });
      onSalvo();
    } catch (err) {
      setErro(err.message);
    }
  };

  return (
    <Modal titulo={registro ? "Editar loja" : "Nova loja"} onClose={onClose} largo>
      <form onSubmit={salvar} className="flex flex-col gap-4">
        {erro && <Aviso>{erro}</Aviso>}
        <div className="grid grid-cols-2 gap-4">
          <Campo rotulo={registro && !operador ? "Código (só o operador altera)" : "Código *"}><input required className={entrada} value={v.codigo} onChange={set("codigo")} disabled={!!registro && !operador} /></Campo>
          <Campo rotulo="Nome *"><input required minLength={2} className={entrada} value={v.nome} onChange={set("nome")} /></Campo>
          <Campo rotulo={cnpjEditavel ? (registro ? "CNPJ" : "CNPJ *") : "CNPJ (só o operador altera)"}>
            <input className={entrada} required={!registro} value={v.cnpj} onChange={set("cnpj")} disabled={!cnpjEditavel} placeholder={!v.cnpj && !cnpjEditavel ? "CNPJ pendente" : undefined} />
          </Campo>
          <Campo rotulo="Cidade"><input className={entrada} value={v.cidade} onChange={set("cidade")} /></Campo>
          <Campo rotulo="UF">
            <select className={entrada} value={v.uf} onChange={set("uf")}>
              <option value="">—</option>
              {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </Campo>
          <Campo rotulo="Bandeira"><input className={entrada} value={v.marca} onChange={set("marca")} /></Campo>
          <Campo rotulo="Regime tributário">
            <select className={entrada} value={v.regimeTributario} onChange={set("regimeTributario")}>
              {REGIMES.map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
            </select>
          </Campo>
        </div>
        {dono && <FaturamentoLoja valor={fat} onChange={setFat} />}
        <HorarioSemana dias={dias} onChange={(d) => { setDias(d); setMexeuNoHorario(true); }} />
        <div className="flex justify-end gap-2">
          <Botao tipo="texto" onClick={onClose}>Cancelar</Botao>
          <Botao onClick={salvar}>Salvar</Botao>
        </div>
      </form>
      {registro ? (
        <div className="mt-4"><EquipeLoja lojaId={registro.id} podeEscrever={cuidaDoGrupo(perfil)} /></div>
      ) : (
        <p className="m-0 mt-4 text-xs text-ink-500">Salve a loja para cadastrar a equipe dela aqui.</p>
      )}
    </Modal>
  );
}
