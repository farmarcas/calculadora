import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Botao, Campo, Cartao, Ficha, Modal, entrada } from "../../components/ui/index.jsx";
import Aprovar from "./Aprovar.jsx";
import Comparar from "./Comparar.jsx";
import Simulacao from "./Simulacao.jsx";

const STATUS = { rascunho: ["atencao", "Rascunho"], gravada: ["ok", "Gravada"], em_uso: ["ok", "Em uso"], substituida: ["neutro", "Substituída"], descartada: ["neutro", "Descartada"] };
const REGRAS = { atual: "44h", r42: "42h", r40: "40h" };

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
            <option value="r42">42h (a partir de 15/12/2026)</option>
            <option value="r40">40h (a partir de dez/2027)</option>
          </select>
        </Campo>
        <Campo rotulo="Começar de">
          <select className={entrada} value={origem} onChange={(e) => setOrigem(e.target.value)}>
            <option value="escala_atual">Escala atual importada</option>
            <option value="vazia">Do zero (funcionários do cadastro, sem turnos)</option>
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

export default function GradeTab({ lojaId, perfil, podeEscrever }) {
  const [lista, setLista] = useState([]);
  const [descartadas, setDescartadas] = useState(false);
  const [aberta, setAberta] = useState(null);
  const [nova, setNova] = useState(false);
  const [erro, setErro] = useState(null);
  const [marcadas, setMarcadas] = useState([]);
  const [comparando, setComparando] = useState(false);
  const [aprovando, setAprovando] = useState(null);

  const carregar = useCallback(async () => {
    try {
      setLista((await api(`/lojas/${lojaId}/simulacoes?descartadas=${descartadas ? 1 : 0}`)).data);
    } catch (e) {
      setErro(e.message);
    }
  }, [lojaId, descartadas]);

  useEffect(() => {
    setAberta(null);
    setMarcadas([]);
    setComparando(false);
  }, [lojaId]);

  const alternar = (id) => setMarcadas((m) => (m.includes(id) ? m.filter((x) => x !== id) : m.length < 3 ? [...m, id] : m));
  useEffect(() => {
    carregar();
  }, [carregar]);

  if (comparando)
    return (
      <>
        <Comparar lojaId={lojaId} ids={marcadas} podeAprovar={perfil === "TENANT_ADMIN"} onVoltar={() => { setComparando(false); carregar(); }} onAprovar={setAprovando} />
        {aprovando && <Aprovar id={aprovando} onClose={() => setAprovando(null)} onAprovada={() => { setAprovando(null); setComparando(false); setMarcadas([]); carregar(); }} />}
      </>
    );

  if (aberta)
    return (
      <div className="flex flex-col gap-4">
        <div><Botao tipo="texto" onClick={() => { setAberta(null); carregar(); }}>← Voltar às simulações</Botao></div>
        <Simulacao id={aberta} perfil={perfil} podeEscrever={podeEscrever} onMudou={carregar} onAbrir={setAberta} />
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      {erro && <Aviso>{erro}</Aviso>}
      <Cartao
        titulo="Simulações da loja"
        subtitulo="Cada simulação é uma pergunta e uma resposta gravadas. Rascunhos se ajustam; gravadas só se clonam."
        acoes={
          <>
            <label className="flex items-center gap-2 text-xs text-ink-500"><input type="checkbox" checked={descartadas} onChange={(e) => setDescartadas(e.target.checked)} /> Mostrar descartadas</label>
            <Botao tipo="secundario" disabled={marcadas.length < 2} onClick={() => setComparando(true)} title="Marque de 2 a 3 simulações">Comparar ({marcadas.length})</Botao>
            {podeEscrever && <Botao onClick={() => setNova(true)}>Nova simulação</Botao>}
          </>
        }
      >
        {lista.length === 0 ? (
          <p className="m-0 px-6 py-8 text-sm text-ink-500 text-center">Nenhuma simulação ainda. Crie a primeira a partir da escala atual importada.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>{["", "Nome", "Regra", "Situação", "Criada por", "Criada em", ""].map((h) => <th key={h} className="text-left text-[11px] font-bold uppercase tracking-wide text-ink-500 px-6 py-3">{h}</th>)}</tr>
            </thead>
            <tbody>
              {lista.map((s) => {
                const [tom, r] = STATUS[s.status];
                return (
                  <tr key={s.id} className="border-t border-line">
                    <td className="pl-6 py-3">
                      {s.status !== "descartada" && s.status !== "substituida" && (
                        <input type="checkbox" aria-label={`Comparar ${s.nome}`} checked={marcadas.includes(s.id)} onChange={() => alternar(s.id)} />
                      )}
                    </td>
                    <td className="px-6 py-3 font-medium">{s.nome}{s.status === "em_uso" && s.vigenciaInicio && <div className="text-xs font-normal text-ink-500">Em uso desde {s.vigenciaInicio.split("T")[0].split("-").reverse().join("/")}</div>}</td>
                    <td className="px-6 py-3">{REGRAS[s.regra]}</td>
                    <td className="px-6 py-3"><Ficha tom={tom}>{r}</Ficha>{s.desatualizada && <> <Ficha tom="atencao">Desatualizada</Ficha></>}</td>
                    <td className="px-6 py-3">{s.autor}</td>
                    <td className="px-6 py-3">{new Date(s.criadaEm).toLocaleDateString("pt-BR")}</td>
                    <td className="px-6 py-3 text-right"><Botao tipo="texto" onClick={() => setAberta(s.id)}>Abrir</Botao></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Cartao>
      {nova && <Nova lojaId={lojaId} lista={lista} onClose={() => setNova(false)} onCriada={(s) => { setNova(false); setAberta(s.id); carregar(); }} />}
    </div>
  );
}
