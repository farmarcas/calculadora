import GradeCobertura from "./GradeCobertura.jsx";
import { abrirNoCadastro } from "./atalhos.js";
import { hh } from "./montar.js";

const LINK = "border-0 bg-transparent p-0 text-sm font-bold text-[var(--text-link)] cursor-pointer";

// Aba 1: a observação do pico, a grade única e o rodapé (vendas fora do horário e atalho para os mínimos).
export default function AbaCobertura({ dados, lojaId, onEnviar, irCadastros, podeEscrever }) {
  if (!dados) return <p className="m-0 p-6 text-sm text-[var(--text-secondary)]">Sem horas de funcionamento para montar a grade. Cadastre o horário da loja.</p>;
  const { observacao, vendasForaDoHorario, vendas, turnos } = dados;
  const lista = (horas) => { const t = horas.map(hh); return t.length > 1 ? `${t.slice(0, -1).join(", ")} e ${t[t.length - 1]}` : t[0]; };

  return (
    <div className="flex flex-col gap-4 p-6">
      {observacao && (
        <p role="note" className="m-0 flex items-start gap-3 rounded-card bg-[var(--system-50)] px-4 py-3 text-sm text-[var(--text-strong)]">
          <span aria-hidden="true" className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full bg-[var(--color-primary)]" />
          <span><strong>No pico de vendas, das {hh(observacao.horaIni)} às {hh(observacao.horaFim)}, há {observacao.pessoasNoPico} {observacao.pessoasNoPico === 1 ? "atendente" : "atendentes"}.</strong>{" "}
            As {observacao.pessoasFora} pessoas só aparecem entre {hh(observacao.h1)} e {hh(observacao.h2)}, quando as vendas já são menores. Dá para testar outros horários em Personalizar.</span>
        </p>
      )}

      {!vendas && (
        <p className="m-0 text-sm text-[var(--text-secondary)]">Sem vendas por hora. Envie a base comercial para cruzar equipe e vendas.{" "}
          {podeEscrever && <button type="button" className={LINK} onClick={onEnviar}>Enviar base comercial</button>}</p>
      )}
      {!turnos && (
        <p className="m-0 text-sm text-[var(--text-secondary)]">Sem turnos cadastrados. Os mínimos usam o horário da loja.{" "}
          <button type="button" className={LINK} onClick={() => abrirNoCadastro({ lojaId, aba: "regras", irCadastros })}>Cadastrar turnos</button></p>
      )}

      <GradeCobertura dados={dados} />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-4 text-sm text-[var(--text-strong)]">
        {vendasForaDoHorario ? (
          <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex h-7 items-center rounded-full px-3 text-xs font-bold" style={{ background: "var(--func-attention-100)" }}>Vendas fora do horário</span>
            <span>Há vendas às {lista(vendasForaDoHorario.horas)}, fora do horário cadastrado ({vendasForaDoHorario.janela.replace(" às ", " às ")}).</span>
            <button type="button" className={LINK} onClick={() => abrirNoCadastro({ lojaId, aba: "dados", irCadastros })}>Conferir funcionamento</button>
          </p>
        ) : <span />}
        <button type="button" className={LINK} onClick={() => abrirNoCadastro({ lojaId, aba: "regras", irCadastros })}>Editar mínimos</button>
      </div>
    </div>
  );
}
