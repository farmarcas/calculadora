import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Cartao, entrada } from "../../components/ui/index.jsx";
import Configuracao from "../diagnostico/Configuracao.jsx";

// Tudo o que a Escala precisa para simular, por loja: convenção, turnos e mínimos por turno e (só o dono) os custos.
// Ao salvar, o Diagnóstico e as Simulações já usam os novos valores.
export default function ConfiguracaoLoja({ perfil, podeEscrever }) {
  const [lojas, setLojas] = useState(null);
  const [lojaId, setLojaId] = useState("");
  const [diag, setDiag] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api("/lojas?pageSize=100")
      .then((r) => {
        setLojas(r.data);
        setLojaId((atual) => atual || r.data[0]?.id || "");
      })
      .catch((e) => setErro(e.message));
  }, []);

  useEffect(() => {
    if (!lojaId) return;
    setDiag(null);
    setErro(null);
    api(`/lojas/${lojaId}/diagnostico`).then(setDiag).catch((e) => setErro(e.message));
  }, [lojaId, perfil]);

  if (lojas && lojas.length === 0)
    return (
      <Cartao>
        <div className="p-10 text-center">
          <p className="m-0 text-base font-medium">Nenhuma loja cadastrada ainda</p>
          <p className="mt-2 mb-0 text-sm text-ink-500">Cadastre uma loja na aba "Lojas e funcionários" para configurar o cálculo.</p>
        </div>
      </Cartao>
    );

  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-2 text-xs text-ink-500">
        Loja
        <select aria-label="Loja" className={`${entrada} min-w-56`} value={lojaId} onChange={(e) => setLojaId(e.target.value)}>
          {(lojas ?? []).map((l) => <option key={l.id} value={l.id}>{l.codigo} · {l.nome}</option>)}
        </select>
      </label>
      {erro && <Aviso>{erro}</Aviso>}
      {!diag && !erro && <p className="text-sm text-ink-500">Carregando…</p>}
      {diag && <Configuracao key={lojaId} diag={diag} podeEscrever={podeEscrever} lojaId={lojaId} onSalvo={setDiag} perfil={perfil} />}
    </div>
  );
}
