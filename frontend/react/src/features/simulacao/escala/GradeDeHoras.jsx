import { mediaDoDia, quartis, rotuloHora, tomDoQuartil } from "./escala-regras.js";

const FUNDO = ["var(--escala-tom-0)", "var(--escala-tom-1)", "var(--escala-tom-2)", "var(--escala-tom-3)"];
const TEXTO = ["var(--text-strong)", "var(--text-strong)", "#fff", "#fff"];

const num = (v) => (v == null ? "—" : Math.round(v).toLocaleString("pt-BR"));

const Faixa = ({ rotulo, sub, valores, horas, direita, colunas }) => {
  const qs = quartis(valores);
  return (
    <div role="row" className="grid items-center gap-x-1 py-1" style={{ gridTemplateColumns: colunas }}>
      <div role="rowheader" className="pr-3">
        <div className="text-[13px] leading-4 font-bold text-[var(--text-strong)]">{rotulo}</div>
        <div className="text-[11px] leading-4 text-[var(--text-secondary)]">{sub}</div>
      </div>
      {valores.map((v, i) => {
        const tom = tomDoQuartil(v, qs);
        return <div key={horas[i]} role="cell" className="rounded-btn py-1.5 text-center text-xs leading-4 font-bold" style={{ background: FUNDO[tom], color: TEXTO[tom] }}>{num(v)}</div>;
      })}
      <div role="cell" className="pl-2 text-right text-[11px] leading-4 text-[var(--text-secondary)]">
        <div className="font-bold text-[var(--text-strong)]">{num(mediaDoDia(valores))}</div>
        {direita}
      </div>
    </div>
  );
};

// O cabeçalho das horas e as linhas de venda por hora (R$, só o dono) e de clientes por hora ("cupons vendidos"), com quatro
// tons por quartil do dia. `colunas` é o modelo de colunas da grade (pessoa, uma por hora, semana).
export default function GradeDeHoras({ horas, dono, venda, clientes, temBase, colunas }) {
  const pegar = (matriz) => horas.map((h) => matriz?.[h] ?? 0);
  return (
    <>
      <div role="row" className="grid items-center gap-x-1 border-b border-[var(--border-subtle)] py-2 text-[11px] leading-4 font-bold text-[var(--text-secondary)]" style={{ gridTemplateColumns: colunas }}>
        <div role="columnheader">PESSOA · FUNÇÃO</div>
        {horas.map((h) => <div key={h} role="columnheader" className="text-center font-normal">{rotuloHora(h)}</div>)}
        <div role="columnheader" className="text-right">SEMANA</div>
      </div>
      {dono && venda && <Faixa rotulo="Venda por hora" sub="R$ · só o dono vê" valores={pegar(venda)} horas={horas} direita="média do dia" colunas={colunas} />}
      {clientes ? (
        <Faixa rotulo="Clientes por hora" sub="cupons vendidos" valores={pegar(clientes)} horas={horas} direita="por hora" colunas={colunas} />
      ) : (
        <div role="row" className="py-2 text-sm text-[var(--text-secondary)]">
          <strong className="text-[var(--text-strong)]">Clientes por hora</strong> · {temBase ? "Sem clientes por hora neste dia." : "Sem clientes por hora nesta base."}
        </div>
      )}
    </>
  );
}
