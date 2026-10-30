import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Botao, Campo, Cartao, Ficha, entrada } from "../../components/ui/index.jsx";

const dataBR = (iso) => iso.split("-").reverse().join("/");
const num = (n) => String(n).replace(".", ",");
const CAMPOS = [
  ["inssPatronalPct", "INSS patronal (%)"],
  ["ratPct", "RAT (%)"],
  ["fap", "FAP (multiplicador do RAT)"],
  ["terceirosPct", "Terceiros (%)"],
  ["fgtsPct", "FGTS (%)"],
  ["decimoTerceiroPct", "13º salário (%)"],
  ["feriasPct", "Férias + 1/3 (%)"],
  ["rescisaoPct", "Provisão de rescisão (%)"],
];

const paraForm = (v) => ({ ...Object.fromEntries(CAMPOS.map(([k]) => [k, String(v[k])])), vigenciaInicio: "" });

// Encargos da folha por regime tributário: os componentes de cada regime (o total é sempre calculado).
// Todos veem; só o dono altera, e alterar cria uma versão nova com data de início.
export default function EncargosPorRegime({ dono }) {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);
  const [ok, setOk] = useState(null);
  const [edicao, setEdicao] = useState(null); // { regime, v }

  const carregar = useCallback(async () => {
    try {
      setDados(await api("/parametros-encargos"));
    } catch (e) {
      setErro(e.message);
    }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const salvar = async () => {
    setErro(null);
    setOk(null);
    try {
      await api("/parametros-encargos", {
        method: "POST",
        body: { regime: edicao.regime, ...Object.fromEntries(CAMPOS.map(([k]) => [k, Number(edicao.v[k])])), vigenciaInicio: edicao.v.vigenciaInicio },
      });
      setEdicao(null);
      setOk("Nova versão salva. A folha e os cenários já usam os valores vigentes.");
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  };
  const set = (k) => (e) => setEdicao({ ...edicao, v: { ...edicao.v, [k]: e.target.value } });

  if (!dados) return erro ? <Aviso>{erro}</Aviso> : <p className="text-sm text-ink-500">Carregando…</p>;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="m-0 text-xl font-bold">Encargos por regime</h2>
        <p className="mt-1 mb-0 text-sm text-ink-500">
          Os encargos da folha vêm do regime tributário da loja. Cada regime guarda os componentes; o total é calculado: diretos (INSS + RAT × FAP + terceiros + FGTS), mais as provisões de 13º e férias + 1/3, mais os encargos sobre as provisões e, se ligada, a rescisão.
          Alterar um valor cria uma nova versão com data de início. Percentuais de referência: confirme com seu contador.
        </p>
      </div>
      {erro && <Aviso>{erro}</Aviso>}
      {ok && <Aviso tom="ok">{ok}</Aviso>}
      {dados.regimes.map((r) => (
        <Cartao key={r.regime} titulo={r.nome} subtitulo={`Total ${num(r.totalPct)}% · com rescisão ${num(r.totalComRescisaoPct)}% · hoje ${dataBR(dados.hoje)}`}>
          <div className="flex flex-col gap-3 px-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {CAMPOS.map(([k, rotulo]) => (
                <div key={k}>
                  <div className="text-xs text-ink-500">{rotulo}</div>
                  <div className="font-bold">{num(r.vigente[k])}</div>
                </div>
              ))}
            </div>
            <p className="m-0 text-xs text-ink-500">Versão em uso, com início em {dataBR(r.vigente.vigenciaInicio)}.</p>
            {dono && !edicao && <div><Botao tipo="secundario" onClick={() => setEdicao({ regime: r.regime, v: paraForm(r.vigente) })}>Alterar (nova versão)</Botao></div>}
            {edicao?.regime === r.regime && (
              <div className="flex flex-col gap-3 rounded-card bg-surface-subtle p-3" role="group" aria-label={`Nova versão de ${r.nome}`}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {CAMPOS.map(([k, rotulo]) => (
                    <Campo key={k} rotulo={rotulo}><input type="number" step="any" min={0} className={entrada} value={edicao.v[k]} onChange={set(k)} /></Campo>
                  ))}
                  <Campo rotulo="Início da vigência *"><input type="date" required className={entrada} value={edicao.v.vigenciaInicio} onChange={set("vigenciaInicio")} /></Campo>
                </div>
                <div className="flex justify-end gap-2">
                  <Botao tipo="texto" onClick={() => { setEdicao(null); setErro(null); }}>Cancelar</Botao>
                  <Botao onClick={salvar}>Salvar nova versão</Botao>
                </div>
              </div>
            )}
            {r.historico.length > 0 && (
              <details>
                <summary className="cursor-pointer text-xs font-bold text-ink-700">Histórico ({r.historico.length})</summary>
                <ul className="mt-2 mb-0 pl-5 text-xs text-ink-700">
                  {r.historico.map((h) => (
                    <li key={h.id}>{dataBR(h.vigenciaInicio)} · FGTS {num(h.fgtsPct)}% · RAT {num(h.ratPct)}% × FAP {num(h.fap)} {h.id === r.vigente.id && <Ficha tom="ok">em uso</Ficha>}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </Cartao>
      ))}
    </div>
  );
}
