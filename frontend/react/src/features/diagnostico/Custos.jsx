import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Botao, Cartao, entrada } from "../../components/ui/index.jsx";

const FUNCOES = ["Farmacêutico", "Atendimento", "Caixa", "Apoio", "Perfumaria"];
const REGIMES = { simples: "Simples Nacional", presumido: "Lucro Presumido", real: "Lucro Real" };

// Só o dono do grupo chega aqui. Valores são estimativa gerencial por média de função (não há salário individual).
export default function Custos({ lojaId }) {
  const [sal, setSal] = useState({});
  const [enc, setEnc] = useState("");
  const [regime, setRegime] = useState(null);
  const [informado, setInformado] = useState(false);
  const [erro, setErro] = useState(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    api(`/lojas/${lojaId}/custos`)
      .then((r) => {
        setInformado(r.informado);
        setRegime(r.regimeTributario ?? null);
        if (r.custos) {
          setSal(Object.fromEntries(Object.entries(r.custos.salarioMedio).map(([k, v]) => [k, String(v)])));
          setEnc(String(r.custos.encargosPct));
        }
      })
      .catch((e) => setErro(e.message));
  }, [lojaId]);

  const salvar = async () => {
    setErro(null);
    setOk(false);
    const salarioMedio = Object.fromEntries(Object.entries(sal).filter(([, v]) => v !== "").map(([k, v]) => [k, Number(v)]));
    try {
      await api(`/lojas/${lojaId}/custos`, {
        method: "PUT",
        body: { salarioMedio, encargosPct: Number(enc) },
      });
      setInformado(true);
      setOk(true);
    } catch (e) {
      setErro(e.message);
    }
  };

  const pronto = enc !== "" && Object.values(sal).some((v) => v !== "");

  return (
    <Cartao titulo="Custos" subtitulo="Só o dono do grupo vê. Estimativa gerencial por média de função: não há salário individual.">
      <div className="px-6 py-4 flex flex-col gap-4">
        {!informado && <Aviso tom="atencao">Custos não informados: a comparação de simulações mostra o aviso em vez de valores.</Aviso>}
        {erro && <Aviso>{erro}</Aviso>}
        {ok && <Aviso tom="ok">Custos salvos.</Aviso>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FUNCOES.map((f) => (
            <label key={f} className="flex flex-col gap-1 text-xs font-medium text-ink-500">
              Salário médio mensal · {f} (R$)
              <input type="number" min={0} step="0.01" className={entrada} value={sal[f] ?? ""} onChange={(e) => setSal({ ...sal, [f]: e.target.value })} aria-label={`Salário médio de ${f}`} />
            </label>
          ))}
          <label className="flex flex-col gap-1 text-xs font-medium text-ink-500">
            Encargos (% sobre o salário)
            <input type="number" min={0} max={300} step="0.1" className={entrada} value={enc} onChange={(e) => setEnc(e.target.value)} aria-label="Encargos" />
          </label>
          <p className="m-0 flex flex-col gap-1 text-xs font-medium text-ink-500">
            Regime tributário (informativo)
            <span className="text-sm font-normal text-ink-700">{REGIMES[regime] ?? "Não informado"}</span>
            <span className="font-normal">Altere em Cadastros, na configuração da loja.</span>
          </p>
        </div>
        <p className="m-0 text-xs text-ink-500">O salário médio vale para a jornada cheia de hoje (44h). Quem já é contratado mantém o salário; uma vaga nova custa proporcional à carga dela.</p>
        <div><Botao onClick={salvar} disabled={!pronto}>Salvar custos</Botao></div>
      </div>
    </Cartao>
  );
}
