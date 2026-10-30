import { Aviso, Botao, Ficha } from "../../components/ui/index.jsx";
import { impacto, reais } from "./formato.js";

const Valor = ({ calculando, children }) =>
  calculando ? <span aria-hidden="true" className="inline-block h-5 w-20 animate-pulse rounded bg-[var(--surface-muted)]" /> : <strong className="text-base text-[var(--text-strong)]">{children}</strong>;

const Linha = ({ rotulo, sub, valor, calculando }) => (
  <div className="flex items-start justify-between gap-3 border-t border-[var(--border-subtle)] py-3 first:border-t-0">
    <div className="min-w-0">
      <div className="text-sm text-[var(--text-strong)]">{rotulo}</div>
      <div className="text-xs text-[var(--text-secondary)]">{sub}</div>
    </div>
    <Valor calculando={calculando}>{valor}</Valor>
  </div>
);

const tipoDeSolucao = (r) => {
  const contrata = r.funcoes.some((f) => f.contratacoes.length > 0);
  if (contrata && r.horario.mudou) return "Contratar e mudar horário";
  if (contrata) return "Só contratar";
  if (r.horario.mudou) return "Só mudar horário";
  return "Sem alterações";
};

export default function PainelResultado({ sim, calculando, modoHorario, dono, podeEscrever, salvando, onSalvar, onClonar }) {
  const r = sim.resultado;
  const nContratacoes = r.funcoes.reduce((s, f) => s + f.contratacoes.length, 0);
  const editavel = sim.editavel && podeEscrever;
  const erros = sim.avaliacao.erros;
  const pctMargem = r.margemPerdida && r.vendaQueSai ? Math.round((r.margemPerdida / r.vendaQueSai) * 100) : null;
  const dinheiro = (v, vazio = "Sem dado") => (v == null ? vazio : reais(v));

  return (
    <aside aria-label="Resultado da simulação" className="sim-painel rounded-card border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-card p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 text-base font-bold text-[var(--text-strong)]">Resultado da simulação</h2>
        <Ficha>{tipoDeSolucao(r)}</Ficha>
      </div>

      <div className="mt-4 rounded-card bg-[var(--surface-subtle)] p-4">
        <div className="text-xs font-bold uppercase text-[var(--text-secondary)]">Impacto por mês</div>
        <div aria-live="polite" className="mt-1 min-h-10 text-[40px] font-bold leading-10 text-[var(--text-strong)]">
          {calculando ? <span aria-hidden="true" className="inline-block h-9 w-44 animate-pulse rounded bg-[var(--surface-muted)]" /> : dono ? (r.impactoMensal == null ? "—" : impacto(r.impactoMensal)) : "—"}
        </div>
        <p className="m-0 mt-1 text-xs text-[var(--text-secondary)]">
          {dono ? (r.impactoMensal == null ? "Informe o salário médio das funções em Cadastros para ver o valor." : "Folha extra + hora extra + margem perdida, comparado à situação atual") : "Valores em reais: só o dono do grupo vê."}
        </p>
      </div>

      {modoHorario === "mudar" && !r.horario.mudou && (
        <div className="mt-4 rounded-card bg-[var(--color-primary-soft)] px-4 py-3 text-sm text-[var(--system-800)]">
          Nenhuma alteração de horário ainda. Edite a lista para recalcular o impacto.
        </div>
      )}

      <div className="mt-2">
        {dono && (
          <>
            <Linha calculando={calculando} rotulo="Folha extra" sub={`${nContratacoes} ${nContratacoes === 1 ? "contratação" : "contratações"}`} valor={dinheiro(r.folhaExtra, "—")} />
            <Linha calculando={calculando} rotulo="Hora extra" sub={r.horaExtra === 0 ? "Não é necessária" : "Horas que ainda faltam"} valor={dinheiro(r.horaExtra, "—")} />
            <Linha calculando={calculando} rotulo="Venda que sai" sub={!r.temBase ? "Sem base comercial" : r.vendaQueSai === 0 ? "Nenhum horário cortado" : "Por mês, nas horas fechadas"} valor={dinheiro(r.vendaQueSai)} />
            <Linha calculando={calculando} rotulo="Margem perdida" sub={!r.temBase ? "Sem base comercial" : !r.margemInformada ? "Margem bruta não informada" : pctMargem != null ? `${pctMargem}% sobre a venda que sai` : "Nenhum horário cortado"} valor={dinheiro(r.margemPerdida)} />
          </>
        )}
        <Linha calculando={calculando} rotulo="Horas abertas" sub={r.horario.mudou ? `Antes: ${r.horasAbertasAntes}h por semana` : modoHorario === "mudar" ? "Sem alteração" : "Horário mantido"} valor={`${r.horasAbertas}h por semana`} />
      </div>

      {erros.length > 0 && (
        <div className="mt-3"><Aviso tom="atencao">{erros.length === 1 ? erros[0].texto : `${erros.length} erros nas regras impedem salvar: ${erros[0].texto}`}</Aviso></div>
      )}

      <div className="mt-4">
        {editavel ? (
          <Botao className="w-full" onClick={onSalvar} disabled={!sim.avaliacao.podeGravar || salvando || calculando}>
            {salvando ? "Salvando…" : `Salvar como cenário ${sim.proximoNumeroCenario ?? ""}`.trim()}
          </Botao>
        ) : podeEscrever ? (
          <Botao tipo="secundario" className="w-full" onClick={onClonar}>Clonar para ajustar</Botao>
        ) : null}
        <p className="m-0 mt-3 text-center text-xs text-[var(--text-secondary)]">
          {editavel ? "Guarde este cenário e continue ajustando para comparar." : `Simulação ${sim.status === "em_uso" ? "em uso" : "gravada"}: não se edita. Clone para ajustar.`}
        </p>
      </div>
    </aside>
  );
}
