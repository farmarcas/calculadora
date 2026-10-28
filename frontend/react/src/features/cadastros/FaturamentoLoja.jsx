import { Campo, entrada } from "../../components/ui/index.jsx";
import { NOMES_DIA } from "./HorarioSemana.jsx";

const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

// API → estado de edição (textos, para os campos poderem ficar vazios).
export const faturamentoParaEdicao = (f) => ({
  dias: Array.from({ length: 7 }, (_, i) => (f?.dias?.[i] == null ? "" : String(f.dias[i]))),
  mensal: f?.mensal == null ? "" : String(f.mensal),
  margemPct: f?.margemPct == null ? "" : String(f.margemPct),
});

const num = (t) => (t === "" ? null : Number(t));

// Estado de edição → corpo da API; nulo quando nada foi preenchido.
export const faturamentoParaApi = (e) => {
  const f = { dias: e.dias.map(num), mensal: num(e.mensal), margemPct: num(e.margemPct) };
  return f.dias.every((d) => d === null) && f.mensal === null && f.margemPct === null ? null : f;
};

export const erroDeFaturamento = (e) => {
  const invalidos = [...e.dias, e.mensal].some((t) => t !== "" && !(Number(t) >= 0));
  if (invalidos) return "Faturamento: use apenas valores iguais ou maiores que zero.";
  if (e.margemPct !== "" && !(Number(e.margemPct) >= 0 && Number(e.margemPct) <= 100)) return "A margem bruta deve ficar entre 0 e 100%.";
  return null;
};

// Só o dono vê esta parte. A soma dos dias × 52/12 aparece ao lado do mensal só como conferência.
export default function FaturamentoLoja({ valor, onChange }) {
  const set = (parte) => onChange({ ...valor, ...parte });
  const soma = valor.dias.reduce((s, t) => s + (t === "" ? 0 : Number(t) || 0), 0);
  const estimado = (soma * 52) / 12;
  const temDias = valor.dias.some((t) => t !== "");
  const informado = valor.mensal !== "" ? Number(valor.mensal) : null;
  const diverge = temDias && informado ? Math.abs(estimado - informado) / informado > 0.1 : false;

  return (
    <fieldset className="rounded-lg border border-ink-200 p-4">
      <legend className="px-1 text-xs font-medium text-ink-500">Faturamento médio (só o dono vê)</legend>
      <div className="grid grid-cols-4 gap-3">
        {NOMES_DIA.map((nome, i) => (
          <Campo key={nome} rotulo={`${nome} (R$)`}>
            <input type="number" min={0} step="any" className={entrada} value={valor.dias[i]} aria-label={`Faturamento de ${nome}`}
              onChange={(e) => set({ dias: valor.dias.map((d, j) => (j === i ? e.target.value : d)) })} />
          </Campo>
        ))}
        <Campo rotulo="Mensal (R$)">
          <input type="number" min={0} step="any" className={entrada} value={valor.mensal} aria-label="Faturamento mensal" onChange={(e) => set({ mensal: e.target.value })} />
        </Campo>
        <Campo rotulo="Margem bruta média (%)">
          <input type="number" min={0} max={100} step="any" className={entrada} value={valor.margemPct} aria-label="Margem bruta média" onChange={(e) => set({ margemPct: e.target.value })} />
        </Campo>
      </div>
      {temDias && (
        <p className={`m-0 mt-3 text-xs ${diverge ? "text-system-700" : "text-ink-500"}`}>
          Soma dos dias × 52 ÷ 12 = {brl(estimado)} por mês{informado ? ` (informado: ${brl(informado)})` : ""}.
          {diverge ? " A diferença passa de 10%: confira os valores." : ""}
        </p>
      )}
      <p className="m-0 mt-2 text-xs text-ink-500">
        Referência de venda da loja. A margem bruta serve para estimar o ganho dos cenários.
      </p>
    </fieldset>
  );
}
