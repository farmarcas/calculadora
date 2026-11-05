import { estadoDaFolha, estadoDaVenda, estadoDoSaldo } from "./cartao-regras.js";
import { COR_DO_TOM } from "./tom.js";

const Coluna = ({ e }) => (
  <div className="min-w-0">
    <div className="flex min-h-8 items-start text-xs leading-4 font-bold text-[var(--neutral-mid-300)]">{e.rotulo}</div>
    <div className="text-2xl leading-8 font-bold" style={{ color: COR_DO_TOM[e.tom] }}>{e.valor}</div>
    <div className="text-xs leading-4 text-[var(--text-secondary)]">{e.apoio}</div>
  </div>
);

// Faixa de resultado (altura fixa): o saldo em destaque e, abaixo, folha e venda do MESMO tamanho. Valores em reais só para o dono.
export default function FaixaDeResultado({ c, dono }) {
  const saldo = estadoDoSaldo(c);
  return (
    <div className="min-h-[236px] rounded-card bg-[var(--surface-subtle)] px-5 py-4">
      <div className="text-xs leading-4 font-bold text-[var(--neutral-mid-300)]">SALDO DA OPERAÇÃO POR MÊS</div>
      {dono ? (
        <>
          <div className="mt-1 text-[40px] leading-[52px] font-bold" style={{ color: COR_DO_TOM[saldo?.tom ?? "neutro"] }} data-testid="saldo-operacao">{saldo ? saldo.texto : "—"}</div>
          <div className="text-xs leading-4 text-[var(--text-secondary)]">
            {saldo ? "folha e venda somadas" : c.semVendaHoraria ? "sem venda hora a hora, não dá para somar" : "informe os custos para somar"}
          </div>
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
