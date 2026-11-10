import { useId } from "react";
import DicaDeCampo from "../../../components/ui/DicaDeCampo.jsx";
import { fraseDaRegua, palavraDaRegua } from "../../regua.js";
import { estadoDaFolha, estadoDaVenda, estadoDoSaldo } from "./cartao-regras.js";
import { COR_DO_TOM } from "./tom.js";

// O ⓘ (quando a coluna tem `dica`) explica de onde vem o número, ao lado do rótulo.
const Coluna = ({ e }) => {
  const id = useId();
  return (
  <div className="min-w-0">
    <div className="relative flex min-h-8 items-start gap-1.5 text-xs leading-4 font-bold text-[var(--neutral-mid-300)]">
      {e.rotulo}
      {e.dica && <DicaDeCampo id={id} rotulo={e.rotulo.toLowerCase()} texto={e.dica} aDireita />}
    </div>
    <div className="text-2xl leading-8 font-bold" style={{ color: COR_DO_TOM[e.tom] }}>{e.valor}</div>
    <div className="text-xs leading-4 text-[var(--text-secondary)]">{e.apoio}</div>
  </div>
  );
};

// Faixa de resultado (altura fixa): o saldo em destaque e, abaixo, folha e venda do MESMO tamanho. Valores em reais só para o dono.
export default function FaixaDeResultado({ c, dono, rebaixado = false }) {
  const saldo = estadoDoSaldo(c);
  return (
    <div className={`min-h-[236px] rounded-card px-5 py-4 ${rebaixado ? "bg-[var(--surface-card)]" : "bg-[var(--surface-subtle)]"}`}>
      <div className="text-xs leading-4 font-bold text-[var(--neutral-mid-300)]">SALDO DA OPERAÇÃO POR MÊS</div>
      {dono ? (
        <>
          <div className="mt-1 text-[40px] leading-[52px] font-bold" style={{ color: rebaixado && saldo ? COR_DO_TOM.perigo : COR_DO_TOM[saldo?.tom ?? "neutro"] }} data-testid="saldo-operacao">{saldo ? saldo.texto : "—"}</div>
          <div className="text-xs leading-4 text-[var(--text-secondary)]">
            {saldo ? `folha e ${palavraDaRegua(c.regua)} somadas` : c.semVendaHoraria ? "sem venda hora a hora, não dá para somar" : "informe os custos para somar"}
          </div>
          {fraseDaRegua(c.regua) && <div className="mt-1 text-xs leading-4 text-[var(--text-secondary)]" data-testid="frase-regua">{fraseDaRegua(c.regua)}</div>}
          <div className="mt-3 grid grid-cols-2 gap-4 border-t border-[var(--border-default)] pt-3">
            <Coluna e={estadoDaFolha(c)} />
            <Coluna e={estadoDaVenda(c)} />
          </div>
        </>
      ) : (
        <p className="m-0 mt-3 text-sm leading-5 text-[var(--text-secondary)]">Os valores em reais são só do dono do grupo.</p>
      )}
    </div>
  );
}
