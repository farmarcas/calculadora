import { useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Botao, entrada } from "../../components/ui/index.jsx";

export const NOME_REGIME = { simples: "Simples Nacional", presumido: "Lucro Presumido", real: "Lucro Real" };
export const NOTA_ENCARGOS = "Percentuais de referência. Confirme com seu contador.";
export const pct = (n) => `${String(Math.round(n * 100) / 100).replace(".", ",")}%`;

// Lista de componentes do encargo (INSS, RAT × FAP, terceiros, FGTS, provisões…), com o total no fim.
export function ComposicaoEncargos({ encargos }) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer font-bold text-system-500">Ver composição</summary>
      <table className="mt-2 w-full max-w-xl border-collapse text-sm">
        <tbody>
          {encargos.componentes.map((c) => (
            <tr key={c.chave} className="border-t border-line first:border-0">
              <td className="py-1.5 pr-4 text-ink-700">{c.nome}</td>
              <td className="py-1.5 text-right">{pct(c.pct)}</td>
            </tr>
          ))}
          <tr className="border-t-2 border-line font-bold">
            <td className="py-1.5 pr-4">Total ({NOME_REGIME[encargos.regime]})</td>
            <td className="py-1.5 text-right">{pct(encargos.totalPct)}</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-2 mb-0 text-xs text-ink-500">{NOTA_ENCARGOS}</p>
    </details>
  );
}

// Regime ausente: o cálculo usou o Lucro Presumido. Aqui a pessoa escolhe o regime e a escolha fica gravada na loja.
export function AlertaRegime({ lojaId, texto, onSalvo }) {
  const [regime, setRegime] = useState("");
  const [erro, setErro] = useState(null);
  const salvar = async () => {
    setErro(null);
    try {
      await api(`/lojas/${lojaId}`, { method: "PATCH", body: { regimeTributario: regime } });
      onSalvo();
    } catch (e) {
      setErro(e.message);
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <Aviso tom="atencao">{texto}</Aviso>
      {erro && <Aviso>{erro}</Aviso>}
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Regime tributário da loja" className={entrada} value={regime} onChange={(e) => setRegime(e.target.value)}>
          <option value="">Escolha o regime…</option>
          {Object.entries(NOME_REGIME).map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
        </select>
        <Botao tipo="secundario" onClick={salvar} disabled={!regime}>Confirmar regime</Botao>
      </div>
    </div>
  );
}
