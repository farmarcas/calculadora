import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Botao, Cartao, entrada } from "../../components/ui/index.jsx";
import { AlertaRegime, ComposicaoEncargos, NOME_REGIME, pct } from "./Encargos.jsx";

const FUNCOES = ["Farmacêutico", "Atendimento", "Caixa", "Apoio", "Perfumaria"];

// Só o dono do grupo chega aqui. Valores são estimativa gerencial por média de função (não há salário individual).
// O encargo NÃO é digitado: vem do regime tributário da loja. Aqui só se ajusta RAT, FAP e a provisão de rescisão desta loja.
export default function Custos({ lojaId }) {
  const [sal, setSal] = useState({});
  const [rat, setRat] = useState("");
  const [fap, setFap] = useState("");
  const [rescisao, setRescisao] = useState(false);
  const [dados, setDados] = useState(null); // resposta de GET /custos: regime, encargos, alertaRegime
  const [padrao, setPadrao] = useState(null); // RAT e FAP padrão do regime
  const [informado, setInformado] = useState(false);
  const [erro, setErro] = useState(null);
  const [ok, setOk] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const [r, p] = await Promise.all([api(`/lojas/${lojaId}/custos`), api("/parametros-encargos")]);
      const regime = r.encargos.regime;
      const vigente = p.regimes.find((x) => x.regime === regime).vigente;
      setPadrao({ ratPct: vigente.ratPct, fap: vigente.fap });
      setInformado(r.informado);
      setDados(r);
      setSal(Object.fromEntries(Object.entries(r.custos?.salarioMedio ?? {}).map(([k, v]) => [k, String(v)])));
      setRat(String(r.encargos.ratPct));
      setFap(String(r.encargos.fap));
      setRescisao(r.encargos.rescisaoLigada);
    } catch (e) {
      setErro(e.message);
    }
  }, [lojaId]);
  useEffect(() => { carregar(); }, [carregar]);

  const corpo = (ajustes) => ({
    salarioMedio: Object.fromEntries(Object.entries(sal).filter(([, v]) => v !== "").map(([k, v]) => [k, Number(v)])),
    ...(Object.keys(ajustes).length ? { encargos: ajustes } : {}),
  });
  // Só vai para a loja o que difere do padrão do regime; igual ao padrão = sem ajuste.
  const ajustesDaTela = () => {
    const a = {};
    if (rat !== "" && Number(rat) !== padrao.ratPct) a.ratPct = Number(rat);
    if (fap !== "" && Number(fap) !== padrao.fap) a.fap = Number(fap);
    if (rescisao) a.rescisaoLigada = true;
    return a;
  };
  const gravar = async (ajustes) => {
    setErro(null);
    setOk(false);
    try {
      await api(`/lojas/${lojaId}/custos`, { method: "PUT", body: corpo(ajustes) });
      setOk(true);
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  };
  const restaurar = () => gravar({});

  const pronto = Object.values(sal).some((v) => v !== "");
  const ajustado = dados && padrao && (dados.encargos.ratPct !== padrao.ratPct || dados.encargos.fap !== padrao.fap || dados.encargos.rescisaoLigada);

  return (
    <Cartao titulo="Custos" subtitulo="Só o dono do grupo vê. Estimativa gerencial por média de função: não há salário individual.">
      <div className="px-6 py-4 flex flex-col gap-4">
        {!informado && <Aviso tom="atencao">Custos não informados: a comparação de simulações mostra o aviso em vez de valores.</Aviso>}
        {erro && <Aviso>{erro}</Aviso>}
        {ok && <Aviso tom="ok">Custos salvos.</Aviso>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FUNCOES.map((f) => (
            <label key={f} className="flex flex-col gap-1 text-sm text-ink-700">
              Salário médio mensal · {f} (R$)
              <input type="number" min={0} step="0.01" className={entrada} value={sal[f] ?? ""} onChange={(e) => setSal({ ...sal, [f]: e.target.value })} aria-label={`Salário médio de ${f}`} />
            </label>
          ))}
        </div>
        <p className="m-0 text-xs text-ink-500">O salário médio vale para a jornada cheia de hoje (44h). Quem já é contratado mantém o salário; uma vaga nova custa proporcional à carga dela.</p>

        {dados && padrao && (
          <section className="flex flex-col gap-3 border-t border-line pt-4" aria-label="Encargos da folha">
            <div>
              <h3 className="m-0 text-base font-bold">Encargos: {pct(dados.encargos.totalPct)} ({NOME_REGIME[dados.encargos.regime]})</h3>
              <p className="mt-1 mb-0 text-xs text-ink-500">
                O percentual vem do regime tributário da loja{dados.encargos.regimeAusente ? "" : ", cadastrado em Dados da loja"}. Aqui você só ajusta RAT, FAP e a provisão de rescisão desta loja.
              </p>
            </div>
            {dados.alertaRegime && <AlertaRegime lojaId={lojaId} texto={dados.alertaRegime} onSalvo={carregar} />}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex flex-col gap-1 text-sm text-ink-700">
                RAT (%) <span className="text-xs text-ink-500">padrão {pct(padrao.ratPct)} · faixa 1 a 3</span>
                <input type="number" min={0} max={3} step="0.1" className={entrada} value={rat} onChange={(e) => setRat(e.target.value)} aria-label="RAT" />
              </label>
              <label className="flex flex-col gap-1 text-sm text-ink-700">
                FAP <span className="text-xs text-ink-500">padrão {String(padrao.fap).replace(".", ",")} · faixa 0,5 a 2,0</span>
                <input type="number" min={0.5} max={2} step="0.1" className={entrada} value={fap} onChange={(e) => setFap(e.target.value)} aria-label="FAP" />
              </label>
              <label className="flex items-center gap-2 text-sm text-ink-700 md:mt-6">
                <input type="checkbox" checked={rescisao} onChange={(e) => setRescisao(e.target.checked)} />
                Incluir provisão de rescisão
              </label>
            </div>
            <ComposicaoEncargos encargos={dados.encargos} />
          </section>
        )}

        <div className="flex flex-wrap gap-2">
          <Botao onClick={() => gravar(ajustesDaTela())} disabled={!pronto && !ajustado}>Salvar custos</Botao>
          {ajustado && <Botao tipo="secundario" onClick={restaurar}>Restaurar padrão</Botao>}
        </div>
      </div>
    </Cartao>
  );
}
