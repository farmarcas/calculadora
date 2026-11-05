import { useId } from "react";
import { Aviso, Botao, Ficha } from "../../components/ui/index.jsx";
import DicaDeCampo from "../../components/ui/DicaDeCampo.jsx";
import { reais, saldoComSinal } from "./formato.js";

const Valor = ({ calculando, children, cor = "var(--text-strong)" }) =>
  calculando ? <span aria-hidden="true" className="inline-block h-5 w-20 animate-pulse rounded bg-[var(--surface-muted)]" /> : <strong className="text-base" style={{ color: cor }}>{children}</strong>;

const Linha = ({ rotulo, sub, valor, calculando, cor }) => (
  <div className="flex items-start justify-between gap-3 border-t border-[var(--border-subtle)] py-3 first:border-t-0">
    <div className="min-w-0">
      <div className="text-sm text-[var(--text-strong)]">{rotulo}</div>
      <div className="text-xs text-[var(--text-secondary)]">{sub}</div>
    </div>
    <Valor calculando={calculando} cor={cor}>{valor}</Valor>
  </div>
);

// A conta do saldo, num ⓘ ao lado do título (as linhas abaixo mostram cada parte).
const FORMULA_DO_SALDO = "Venda estimada − venda que deixa de entrar − folha extra − hora extra, contra a folha atual.";
// Percentual com o sinal de menos tipográfico: "−1,2%".
const pctComSinal = (n) => `${n < 0 ? "−" : ""}${String(Math.abs(n)).replace(".", ",")}%`;

const tipoDeSolucao = (r) => {
  const contrata = r.funcoes.some((f) => f.contratacoes.length > 0);
  if (contrata && r.horario.mudou) return "Contratar e mudar horário";
  if (contrata) return "Só contratar";
  if (r.horario.mudou) return "Só mudar horário";
  return "Sem alterações";
};

export default function PainelResultado({ sim, calculando, dono, podeEscrever, salvando, onSalvar, onClonar }) {
  const idDica = useId();
  const r = sim.resultado;
  const nContratacoes = r.funcoes.reduce((s, f) => s + f.contratacoes.length, 0);
  const editavel = sim.editavel && podeEscrever;
  const dinheiro = (v, vazio = "Sem dado") => (v == null ? vazio : reais(v));
  const corSaldo = r.saldoMensal == null ? "var(--text-strong)" : r.saldoMensal > 0.005 ? "var(--text-success-strong)" : r.saldoMensal < -0.005 ? "var(--text-danger)" : "var(--text-strong)";

  return (
    <aside aria-label="Resultado da simulação" className="sim-painel rounded-card border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-card p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 text-base font-bold text-[var(--text-strong)]">Resultado da simulação</h2>
        <Ficha>{tipoDeSolucao(r)}</Ficha>
      </div>

      <div className="mt-4 rounded-card bg-[var(--surface-subtle)] p-4">
        <div className="relative flex items-center gap-1.5 text-xs font-bold uppercase text-[var(--text-secondary)]">
          Saldo por mês
          {dono && <DicaDeCampo id={idDica} rotulo="Saldo por mês" texto={FORMULA_DO_SALDO} abaixo />}
        </div>
        <div aria-live="polite" className="mt-1 min-h-10 text-[40px] font-bold leading-10" style={{ color: corSaldo }}>
          {calculando ? <span aria-hidden="true" className="inline-block h-9 w-44 animate-pulse rounded bg-[var(--surface-muted)]" /> : dono ? (r.saldoMensal == null ? "—" : saldoComSinal(r.saldoMensal)) : "—"}
        </div>
        <p className="m-0 mt-1 text-xs text-[var(--text-secondary)]">
          {dono
            ? r.saldoMensal != null
              ? <><strong style={{ color: corSaldo }}>{r.saldoMensal > 0.005 ? "Esta simulação rende mais do que custa" : r.saldoMensal < -0.005 ? "Esta simulação custa mais do que economiza" : "Esta simulação empata com a folha atual"}.</strong><br />Por ano: {saldoComSinal(r.saldoAnual)}{r.pesoNoFaturamentoPct != null ? ` · ${pctComSinal(r.pesoNoFaturamentoPct)} do faturamento mensal` : ""}</>
              : !r.temBase ? "Sem venda hora a hora (base comercial), não é possível estimar a venda que deixa de entrar e o saldo." : "Informe o salário médio das funções em Cadastros para ver o valor."
            : "Valores em reais: só o dono do grupo vê."}
        </p>
      </div>

      <div className="mt-2">
        {dono && (
          <>
            <Linha calculando={calculando} rotulo="Folha extra" sub={`${nContratacoes} ${nContratacoes === 1 ? "contratação" : "contratações"}`} valor={dinheiro(r.folhaExtra, "—")} />
            <Linha calculando={calculando} rotulo="Hora extra" sub={r.horaExtra === 0 ? "Não é necessária" : "Horas que ainda faltam"} valor={dinheiro(r.horaExtra, "—")} />
            <Linha calculando={calculando} rotulo="Venda que deixa de entrar" sub={!r.temBase ? "Sem base comercial" : r.vendaQueSai === 0 ? "Nenhum horário fechado" : "Por mês, nas horas fechadas"} valor={dinheiro(r.vendaQueSai)} cor={r.vendaQueSai > 0.005 ? "var(--text-danger)" : undefined} />
            <Linha calculando={calculando} rotulo="Venda estimada" sub={!r.temBase ? "Sem base comercial" : "Por mês, nas horas abertas a mais"} valor={r.vendaEstimada > 0.005 ? `+${reais(r.vendaEstimada)}` : dinheiro(r.vendaEstimada)} cor={r.vendaEstimada > 0.005 ? "var(--text-success-strong)" : undefined} />
            <Linha calculando={calculando} rotulo="Economia de folha" sub="Contra manter o horário e contratar" valor={dinheiro(r.economiaFolha, "—")} />
          </>
        )}
        <Linha calculando={calculando} rotulo="Horas abertas" sub={r.horario.mudou ? `Antes: ${r.horasAbertasAntes}h por semana` : "Sem alteração"} valor={`${r.horasAbertas}h por semana`} />
      </div>


      <div className="mt-4">
        {editavel ? (
          <Botao className="w-full" onClick={onSalvar} disabled={salvando || calculando}>
            {salvando ? "Salvando…" : `Salvar como cenário ${sim.proximoNumeroCenario ?? ""}`.trim()}
          </Botao>
        ) : podeEscrever ? (
          <Botao tipo="secundario" className="w-full" onClick={onClonar}>Clonar para ajustar</Botao>
        ) : null}
        <p className="m-0 mt-3 text-center text-xs text-[var(--text-secondary)]">
          {editavel ? "Guarde este cenário e continue ajustando para comparar." : "Simulação gravada: não se edita. Clone para ajustar."}
        </p>
      </div>
    </aside>
  );
}
