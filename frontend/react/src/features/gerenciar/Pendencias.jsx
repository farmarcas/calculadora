import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Botao, Campo, Cartao, Ficha, Modal, entrada } from "../../components/ui/index.jsx";

const TH = "text-left text-[11px] font-bold uppercase tracking-wide text-ink-500 px-6 py-3";
const TD = "px-6 py-3 border-t border-line";
const MOTIVOS = {
  cpf_desconhecido: ["erro", "CPF não identificado"],
  sem_lotacao: ["atencao", "Pessoa sem lotação nesta loja"],
  dia_sem_escala: ["atencao", "Dia sem escala"],
};
const dia = (iso) => iso.split("-").reverse().join("/");

export default function Pendencias({ lojaId, onMudou }) {
  const [filtro, setFiltro] = useState("");
  const [lista, setLista] = useState({ data: [], meta: { total: 0 } });
  const [pessoas, setPessoas] = useState([]);
  const [erro, setErro] = useState(null);
  const [acao, setAcao] = useState(null); // { tipo: 'vincular' | 'ignorar' | 'cpf', pendencia }
  const [aviso, setAviso] = useState(null);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      const q = filtro ? `?motivo=${filtro}` : "";
      setLista(await api(`/lojas/${lojaId}/ponto/pendencias${q}`));
    } catch (e) {
      setErro(e.message);
    }
  }, [lojaId, filtro]);

  useEffect(() => {
    carregar();
    api(`/funcionarios?lojaId=${lojaId}&pageSize=100`).then((r) => setPessoas(r.data)).catch(() => {});
  }, [carregar, lojaId]);

  const feito = (msg) => {
    setAcao(null);
    setAviso(msg ?? null);
    carregar();
    onMudou?.();
  };

  const confirmarFolga = async (p) => {
    try {
      await api(`/lojas/${lojaId}/ponto/pendencias/${p.id}/confirmar-folga`, { method: "POST" });
      feito("Trabalho em folga confirmado: a batida entra na apuração.");
    } catch (e) {
      setErro(e.message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {aviso && <Aviso tom="ok">{aviso}</Aviso>}
      {erro && <Aviso>{erro}</Aviso>}
      <Cartao
        titulo={`Pendências (${lista.meta.total})`}
        subtitulo="Batidas que o sistema não conseguiu ligar a uma pessoa ou a um dia de escala. Nenhuma é descartada em silêncio."
        acoes={
          <select aria-label="Filtrar por motivo" className={entrada} value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="">Todos os motivos</option>
            {Object.entries(MOTIVOS).map(([k, [, r]]) => <option key={k} value={k}>{r}</option>)}
          </select>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm min-w-[760px]">
            <thead><tr>{["Data", "Hora", "CPF", "Motivo", "Quem é", ""].map((h) => <th key={h} className={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {lista.data.map((p) => {
                const [tom, rotulo] = MOTIVOS[p.motivo] ?? ["neutro", p.motivo];
                return (
                  <tr key={p.id}>
                    <td className={TD}>{dia(p.data)}</td>
                    <td className={TD}>{p.hora}</td>
                    <td className={TD}>{p.cpfMascarado}</td>
                    <td className={TD}><Ficha tom={tom}>{rotulo}</Ficha></td>
                    <td className={TD}>{p.pessoa ? p.pessoa.nome : "—"}</td>
                    <td className={`${TD} text-right whitespace-nowrap`}>
                      {p.motivo === "dia_sem_escala" && p.pessoa && <Botao tipo="texto" onClick={() => confirmarFolga(p)}>Confirmar trabalho em folga</Botao>}
                      {p.motivo === "cpf_desconhecido" && <Botao tipo="texto" onClick={() => setAcao({ tipo: "cpf", pendencia: p })}>Cadastrar CPF</Botao>}
                      <Botao tipo="texto" onClick={() => setAcao({ tipo: "vincular", pendencia: p })}>Vincular</Botao>
                      <Botao tipo="texto" onClick={() => setAcao({ tipo: "ignorar", pendencia: p })}>Ignorar</Botao>
                    </td>
                  </tr>
                );
              })}
              {lista.data.length === 0 && <tr><td className={`${TD} text-ink-500`} colSpan={6}>Nenhuma pendência aberta.</td></tr>}
            </tbody>
          </table>
        </div>
      </Cartao>
      {acao && <Decisao acao={acao} pessoas={pessoas} lojaId={lojaId} onClose={() => setAcao(null)} onFeito={feito} />}
    </div>
  );
}

function Decisao({ acao, pessoas, lojaId, onClose, onFeito }) {
  const { tipo, pendencia: p } = acao;
  const [matricula, setMatricula] = useState(pessoas[0]?.matricula ?? "");
  const [motivo, setMotivo] = useState("");
  const [cpf, setCpf] = useState("");
  const [erro, setErro] = useState(null);

  const confirmar = async () => {
    setErro(null);
    const base = `/lojas/${lojaId}/ponto/pendencias`;
    try {
      if (tipo === "vincular") {
        await api(`${base}/${p.id}/vincular`, { method: "POST", body: { matricula } });
        onFeito("Batida vinculada à pessoa.");
      } else if (tipo === "ignorar") {
        await api(`${base}/${p.id}/ignorar`, { method: "POST", body: { motivo } });
        onFeito("Batida ignorada, com o motivo registrado.");
      } else {
        const r = await api(`${base}/cpf`, { method: "POST", body: { cpf, matricula } });
        onFeito(`CPF cadastrado: ${r.resolvidas} batida(s) resolvida(s)${r.aindaPendentes ? `, ${r.aindaPendentes} ainda aguarda(m) decisão (dia sem escala)` : ""}.`);
      }
    } catch (e) {
      setErro(e.message);
    }
  };

  const titulo = { vincular: "Vincular à pessoa", ignorar: "Ignorar batida", cpf: "Cadastrar o CPF na pessoa" }[tipo];
  return (
    <Modal titulo={titulo} onClose={onClose}>
      <div className="flex flex-col gap-4">
        {erro && <Aviso>{erro}</Aviso>}
        <p className="m-0 text-sm text-ink-700">Batida de {dia(p.data)} às {p.hora} · CPF {p.cpfMascarado}</p>
        {tipo !== "ignorar" && (
          <Campo rotulo="Pessoa">
            <select className={entrada} value={matricula} onChange={(e) => setMatricula(e.target.value)}>
              {pessoas.map((x) => <option key={x.matricula} value={x.matricula}>{x.nome} · {x.matricula}</option>)}
            </select>
          </Campo>
        )}
        {tipo === "cpf" && (
          <>
            <Campo rotulo="CPF completo (dado fictício até o parecer de proteção de dados)"><input className={entrada} value={cpf} onChange={(e) => setCpf(e.target.value)} inputMode="numeric" autoComplete="off" /></Campo>
            <p className="m-0 text-xs text-ink-500">As pendências com este CPF serão resolvidas de uma vez.</p>
          </>
        )}
        {tipo === "ignorar" && <Campo rotulo="Motivo (obrigatório)"><input className={entrada} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: visitante, teste do relógio" /></Campo>}
        <div className="flex justify-end gap-2"><Botao tipo="texto" onClick={onClose}>Cancelar</Botao><Botao onClick={confirmar}>Confirmar</Botao></div>
      </div>
    </Modal>
  );
}
