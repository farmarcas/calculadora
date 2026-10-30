import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Botao, Campo, Cartao, Ficha, entrada } from "../../components/ui/index.jsx";

const NOMES = { atual: "Regra atual (44h)", r42: "Transição (42h)", r40: "Regra final (40h)" };
const dataBR = (iso) => iso.split("-").reverse().join("/");
const horas = (n) => `${String(n).replace(".", ",")}h`;

const paraForm = (v) => ({
  jornadaSemanalH: String(v.jornadaSemanalH),
  horasDiaMax: String(v.horasDiaMax),
  horasDiaMaxConvencao: v.horasDiaMaxConvencao == null ? "" : String(v.horasDiaMaxConvencao),
  diasTrabalho: String(v.diasTrabalho),
  divisor: String(v.divisor),
  vigenciaInicio: "",
});

// Parâmetros legais de cada fase. Todos veem; só o dono altera, e alterar cria uma nova versão com data de início.
export default function ParametrosLegais({ perfil }) {
  const dono = perfil === "TENANT_ADMIN";
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);
  const [ok, setOk] = useState(null);
  const [edicao, setEdicao] = useState(null); // { fase, v }

  const carregar = useCallback(async () => {
    try {
      setDados(await api("/parametros-legais"));
    } catch (e) {
      setErro(e.message);
    }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const salvar = async () => {
    setErro(null);
    setOk(null);
    const v = edicao.v;
    try {
      await api("/parametros-legais", {
        method: "POST",
        body: {
          fase: edicao.fase,
          jornadaSemanalH: Number(v.jornadaSemanalH),
          horasDiaMax: Number(v.horasDiaMax),
          horasDiaMaxConvencao: v.horasDiaMaxConvencao === "" ? null : Number(v.horasDiaMaxConvencao),
          diasTrabalho: Number(v.diasTrabalho),
          divisor: Number(v.divisor),
          vigenciaInicio: v.vigenciaInicio,
        },
      });
      setEdicao(null);
      setOk("Nova versão salva. O Diagnóstico já usa os valores vigentes.");
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  };
  const set = (k) => (e) => setEdicao({ ...edicao, v: { ...edicao.v, [k]: e.target.value } });

  if (!dados) return <p className="text-sm text-ink-500">Carregando…</p>;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="m-0 text-2xl font-bold">Parâmetros legais</h1>
        <p className="mt-1 mb-0 text-sm text-ink-500">
          As regras da EC 141/2026 usadas no cálculo. Alterar um valor cria uma nova versão com data de início; as versões antigas ficam no histórico.
          Vale a versão mais recente que já começou. Se todas ainda começam no futuro, vale a mais antiga.
        </p>
      </div>
      {!dono && <Aviso tom="neutro">Só o dono do grupo altera os parâmetros. Você pode consultar os valores e o histórico.</Aviso>}
      {erro && <Aviso>{erro}</Aviso>}
      {ok && <Aviso tom="ok">{ok}</Aviso>}

      {dados.fases.map((f) => (
        <Cartao key={f.fase} titulo={NOMES[f.fase]} subtitulo={`Hoje: ${dataBR(dados.hoje)}`}>
          <div className="flex flex-col gap-3 px-6 py-4">
            <div className="grid grid-cols-5 gap-4 text-sm">
              <Valor rotulo="Jornada semanal máxima" valor={horas(f.vigente.jornadaSemanalH)} />
              <Valor rotulo="Horas por dia" valor={horas(f.vigente.horasDiaMax)} />
              <Valor rotulo="Horas por dia com convenção" valor={f.vigente.horasDiaMaxConvencao == null ? "—" : horas(f.vigente.horasDiaMaxConvencao)} />
              <Valor rotulo="Dias de trabalho por semana" valor={f.vigente.diasTrabalho} />
              <Valor rotulo="Divisor mensal (horas)" valor={f.vigente.divisor} />
            </div>
            <p className="m-0 text-xs text-ink-500">
              Versão em uso, com início em {dataBR(f.vigente.vigenciaInicio)}.
              {dados.hoje < f.vigente.vigenciaInicio ? " Esta fase ainda não começou." : ""}
            </p>

            {dono && !edicao && (
              <div><Botao tipo="secundario" onClick={() => setEdicao({ fase: f.fase, v: paraForm(f.vigente) })}>Alterar (nova versão)</Botao></div>
            )}
            {edicao?.fase === f.fase && (
              <div className="flex flex-col gap-3 rounded-lg bg-surface-subtle p-3" role="group" aria-label={`Nova versão de ${NOMES[f.fase]}`}>
                <div className="grid grid-cols-3 gap-3">
                  <Campo rotulo="Jornada semanal (h)"><input type="number" step="any" min={0} className={entrada} value={edicao.v.jornadaSemanalH} onChange={set("jornadaSemanalH")} /></Campo>
                  <Campo rotulo="Horas por dia"><input type="number" step="any" min={0} className={entrada} value={edicao.v.horasDiaMax} onChange={set("horasDiaMax")} /></Campo>
                  <Campo rotulo="Horas por dia com convenção (opcional)"><input type="number" step="any" min={0} className={entrada} value={edicao.v.horasDiaMaxConvencao} onChange={set("horasDiaMaxConvencao")} /></Campo>
                  <Campo rotulo="Dias de trabalho por semana"><input type="number" min={1} max={7} className={entrada} value={edicao.v.diasTrabalho} onChange={set("diasTrabalho")} /></Campo>
                  <Campo rotulo="Divisor mensal (h)"><input type="number" step="any" min={0} className={entrada} value={edicao.v.divisor} onChange={set("divisor")} /></Campo>
                  <Campo rotulo="Início da vigência *"><input type="date" required className={entrada} value={edicao.v.vigenciaInicio} onChange={set("vigenciaInicio")} /></Campo>
                </div>
                <div className="flex justify-end gap-2">
                  <Botao tipo="texto" onClick={() => { setEdicao(null); setErro(null); }}>Cancelar</Botao>
                  <Botao onClick={salvar}>Salvar nova versão</Botao>
                </div>
              </div>
            )}

            <details>
              <summary className="cursor-pointer text-xs font-medium text-ink-500">Histórico ({f.historico.length})</summary>
              <table className="mt-2 w-full text-left text-xs">
                <thead className="text-ink-500">
                  <tr><th className="py-1">Início</th><th>Jornada</th><th>Horas/dia</th><th>Dias</th><th>Divisor</th><th>Por</th><th>Em</th></tr>
                </thead>
                <tbody>
                  {f.historico.map((h) => (
                    <tr key={h.id} className="border-t border-line">
                      <td className="py-1">{dataBR(h.vigenciaInicio)} {h.id === f.vigente.id && <Ficha tom="ok">em uso</Ficha>}</td>
                      <td>{horas(h.jornadaSemanalH)}</td>
                      <td>{horas(h.horasDiaMax)}</td>
                      <td>{h.diasTrabalho}</td>
                      <td>{h.divisor}</td>
                      <td>{h.criadoPor === "sistema" ? "Valor inicial" : h.criadoPor}</td>
                      <td>{new Date(h.criadoEm).toLocaleDateString("pt-BR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </div>
        </Cartao>
      ))}
    </div>
  );
}

const Valor = ({ rotulo, valor }) => (
  <div>
    <div className="text-[11px] font-bold uppercase tracking-wide text-ink-500">{rotulo}</div>
    <div className="text-base font-medium">{valor}</div>
  </div>
);
