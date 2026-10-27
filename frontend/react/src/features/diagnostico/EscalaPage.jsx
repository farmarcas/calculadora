import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Botao, Cartao, entrada } from "../../components/ui/index.jsx";
import Configuracao from "./Configuracao.jsx";
import Diagnostico from "./Diagnostico.jsx";
import EnviarPlanilhas from "./EnviarPlanilhas.jsx";
import GradeTab from "../grade/GradeTab.jsx";

export default function EscalaPage({ perfil }) {
  const podeEscrever = perfil !== "SCHEDULE_VIEWER";
  const [lojas, setLojas] = useState([]);
  const [lojaId, setLojaId] = useState("");
  const [aba, setAba] = useState("diagnostico");
  const [diag, setDiag] = useState(null);
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api("/lojas?pageSize=100")
      .then((r) => {
        setLojas(r.data);
        setLojaId((atual) => atual || r.data[0]?.id || "");
      })
      .catch((e) => setErro(e.message));
  }, []);

  const carregar = useCallback(async () => {
    if (!lojaId) return;
    setErro(null);
    try {
      setDiag(await api(`/lojas/${lojaId}/diagnostico`));
    } catch (e) {
      setErro(e.message);
    }
  }, [lojaId]);

  useEffect(() => {
    setDiag(null);
    carregar();
  }, [carregar]);

  if (lojas.length === 0 && !erro)
    return (
      <Cartao>
        <div className="p-10 text-center">
          <p className="m-0 text-base font-medium">Nenhuma loja cadastrada</p>
          <p className="mt-2 mb-0 text-sm text-ink-500">Cadastre as lojas em Cadastros antes de ver o diagnóstico da escala.</p>
        </div>
      </Cartao>
    );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-2xl font-bold">Escala</h1>
          <p className="mt-1 mb-0 text-sm text-ink-500">Diagnóstico da escala atual frente às regras de 42h e 40h (EC 141/2026).</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-ink-500">
            Loja
            <select aria-label="Loja" className={`${entrada} min-w-56`} value={lojaId} onChange={(e) => setLojaId(e.target.value)}>
              {lojas.map((l) => <option key={l.id} value={l.id}>{l.codigo} · {l.nome}</option>)}
            </select>
          </label>
          {podeEscrever && <Botao onClick={() => setEnviando(true)}>Enviar planilhas</Botao>}
        </div>
      </div>

      {erro && <Aviso>{erro}</Aviso>}

      <div className="flex gap-6 border-b border-line" role="tablist">
        {[["diagnostico", "Diagnóstico"], ["grade", "Simulações"], ["configuracao", "Configuração"]].map(([id, r]) => (
          <button
            key={id}
            role="tab"
            aria-selected={aba === id}
            onClick={() => setAba(id)}
            className={`py-3 text-sm font-medium ${aba === id ? "text-ink-900" : "text-ink-500"}`}
            style={{ boxShadow: aba === id ? "inset 0 -2px 0 0 #006FF7" : "none" }}
          >
            {r}
          </button>
        ))}
      </div>

      {!diag && !erro && aba !== "grade" && <p className="text-sm text-ink-500">Carregando…</p>}
      {diag && aba === "diagnostico" && <Diagnostico diag={diag} podeEscrever={podeEscrever} onEnviar={() => setEnviando(true)} />}
      {diag && aba === "configuracao" && <Configuracao diag={diag} podeEscrever={podeEscrever} lojaId={lojaId} onSalvo={setDiag} />}
      {aba === "grade" && <GradeTab lojaId={lojaId} perfil={perfil} podeEscrever={podeEscrever} />}
      {enviando && <EnviarPlanilhas onClose={() => setEnviando(false)} onConcluido={carregar} />}
    </>
  );
}
