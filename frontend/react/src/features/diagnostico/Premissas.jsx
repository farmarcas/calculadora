import { useEffect, useState } from "react";
import { Botao, Campo, Cartao, Ficha, entrada } from "../../components/ui/index.jsx";

const PADRAO = { recaptura: 0, fatorDiaNovo: 50, diasProtegidos: 3, limiteParcial: 3 };

const paraForm = (p) => ({
  recaptura: String(p.recaptura),
  fatorDiaNovo: String(p.fatorDiaNovo),
  diasProtegidos: String(p.diasProtegidos),
  limiteParcial: String(p.limiteParcial),
  margemPct: p.margemPct == null ? "" : String(p.margemPct),
});

// Premissas só para simular: recalculam o Diagnóstico sem gravar nada (ao recarregar a página valem os valores do cadastro).
export default function Premissas({ atual, simulando, onAplicar, onLimpar }) {
  const dono = atual?.margemPct !== undefined;
  const [v, setV] = useState(() => paraForm(atual ?? PADRAO));
  useEffect(() => setV(paraForm(atual ?? PADRAO)), [atual]);
  if (!atual) return null;
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });

  const aplicar = () => {
    const q = { recaptura: v.recaptura, fatorDiaNovo: v.fatorDiaNovo, diasProtegidos: v.diasProtegidos, limiteParcial: v.limiteParcial };
    // A margem só vai quando o dono mudou em relação ao cadastro.
    if (dono && v.margemPct !== "" && Number(v.margemPct) !== atual.margemPctCadastro) q.margemPct = v.margemPct;
    onAplicar(q);
  };

  return (
    <Cartao
      titulo="Premissas para simular"
      subtitulo={"Altere e recalcule para testar \"e se\". Nada é gravado: ao recarregar a página valem os valores do cadastro."}
      acoes={simulando ? <Ficha tom="atencao">Simulando</Ficha> : null}
    >
      <div className="flex flex-col gap-3 px-6 py-4">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
          <Campo rotulo="Recaptura da venda (%)">
            <input type="number" min={0} max={30} step="any" className={entrada} value={v.recaptura} onChange={set("recaptura")} aria-label="Recaptura da venda" />
          </Campo>
          <Campo rotulo="Fator de dia novo (%)">
            <input type="number" min={0} max={100} step="any" className={entrada} value={v.fatorDiaNovo} onChange={set("fatorDiaNovo")} aria-label="Fator de dia novo" />
          </Campo>
          <Campo rotulo="Dias protegidos (0 a 6)">
            <input type="number" min={0} max={6} step={1} className={entrada} value={v.diasProtegidos} onChange={set("diasProtegidos")} aria-label="Dias protegidos" />
          </Campo>
          <Campo rotulo="Limite do contrato parcial (turnos)">
            <input type="number" min={0} max={3} step={1} className={entrada} value={v.limiteParcial} onChange={set("limiteParcial")} aria-label="Limite do contrato parcial" />
          </Campo>
          {dono && (
            <Campo rotulo="Margem bruta (%)">
              <input type="number" min={0} max={100} step="any" className={entrada} value={v.margemPct} onChange={set("margemPct")} aria-label="Margem bruta" />
            </Campo>
          )}
        </div>
        <p className="m-0 text-xs text-ink-500">
          Recaptura: parte da venda de um dia fechado que passa para os outros dias. Fator de dia novo: quanto da média dos dias abertos vale um dia hoje fechado.
          Dias protegidos: os de maior faturamento, que não se sugere fechar. Limite do parcial: até quantos turnos de sobra viram contrato parcial (0 desliga).
        </p>
        <div className="flex gap-2">
          <Botao onClick={aplicar}>Recalcular</Botao>
          {simulando && <Botao tipo="texto" onClick={onLimpar}>Voltar aos valores do cadastro</Botao>}
        </div>
      </div>
    </Cartao>
  );
}
