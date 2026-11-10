import { useMemo } from "react";
import GradeCobertura from "../diagnostico/onde-vem/GradeCobertura.jsx";
import { diagDaSimulacao, hh, montarCobertura } from "../diagnostico/onde-vem/montar.js";

const lista = (horas) => {
  const t = horas.map(hh);
  return t.length > 1 ? `${t.slice(0, -1).join(", ")} e ${t[t.length - 1]}` : t[0];
};

// Seção "Cobertura e vendas" da Simulação: a mesma grade do Diagnóstico, com o horário e o quadro desta simulação.
// Só desenha o que o servidor calculou; nenhum número do resultado depende dela.
export default function CoberturaDaSimulacao({ cobertura }) {
  const dados = useMemo(() => {
    try { return cobertura ? montarCobertura(diagDaSimulacao(cobertura)) : null; } catch { return null; }
  }, [cobertura]);
  const o = dados?.observacao;
  const vagas = cobertura?.vagasSemTurnos ?? 0;

  return (
    <section aria-labelledby="sim-cobertura" className="rounded-card border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-card">
      <header className="px-6 pt-5 pb-4">
        <h2 id="sim-cobertura" className="m-0 text-lg font-bold text-[var(--text-strong)]">Cobertura e vendas</h2>
        <p className="m-0 mt-0.5 text-sm text-[var(--text-secondary)]">Quantas pessoas de cada função há em cada hora, com o horário e o quadro desta simulação.</p>
      </header>
      <div className="flex flex-col gap-4 px-6 pb-6">
        {!dados && <p className="m-0 text-sm text-[var(--text-secondary)]">Sem horas de funcionamento para montar a grade.</p>}
        {o && (
          <p role="note" className="m-0 flex items-start gap-3 rounded-card bg-[var(--system-50)] px-4 py-3 text-sm text-[var(--text-strong)]">
            <span aria-hidden="true" className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full bg-[var(--color-primary)]" />
            <span><strong>No pico de vendas, das {hh(o.horaIni)} às {hh(o.horaFim)}, há {o.pessoasNoPico} {o.pessoasNoPico === 1 ? "atendente" : "atendentes"}.</strong>{" "}
              As {o.pessoasFora} pessoas só aparecem entre {hh(o.h1)} e {hh(o.h2)}, quando as vendas já são menores.</span>
          </p>
        )}
        {dados && !dados.vendas && <p className="m-0 text-sm text-[var(--text-secondary)]">Sem vendas por hora. Envie a base comercial para cruzar equipe e vendas.</p>}
        {vagas > 0 && (
          <p role="note" className="m-0 rounded-card px-4 py-3 text-sm text-[var(--text-strong)]" style={{ background: "var(--func-attention-100)" }}>
            {vagas === 1 ? "1 vaga ainda sem horário" : `${vagas} vagas ainda sem horário`}: não {vagas === 1 ? "cobre" : "cobrem"} nada nesta grade.
          </p>
        )}
        {dados && <GradeCobertura dados={dados} />}
        {dados?.vendasForaDoHorario && (
          <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--border-subtle)] pt-4 text-sm text-[var(--text-strong)]">
            <span className="inline-flex h-7 items-center rounded-full px-3 text-xs font-bold" style={{ background: "var(--func-attention-100)" }}>Vendas fora do horário</span>
            <span>Há vendas às {lista(dados.vendasForaDoHorario.horas)}, fora do horário desta simulação ({dados.vendasForaDoHorario.janela}).</span>
          </p>
        )}
      </div>
    </section>
  );
}
