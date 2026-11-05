import CampoDeHorario from "./CampoDeHorario.jsx";
import { estadoDoDia, horarioPadraoAoAbrir, horasDoDia, passoDaAbertura, passoDoFechamento } from "./horario-regras.js";

const NOMES_LONGOS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];
const SELO = <span className="rounded-full bg-[var(--color-primary-soft)] px-2 text-[11px] leading-4 font-bold text-[var(--system-800)]">Alterado</span>;
const LINK = "cursor-pointer border-0 bg-transparent p-0 text-xs leading-4 font-bold text-[var(--text-link)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--border-focus)] disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50";
const COLUNAS = "grid grid-cols-[44px_104px_104px_1fr] items-center gap-3";

// Uma linha por dia (60 px): sigla e horas do dia, abertura, fechamento e, centralizados na última coluna, o selo "Alterado"
// sobre "Fechar dia" (ou "Reabrir" / "Abrir dia" quando o dia está fechado).
export default function LinhaDoDia({ dia, nome, simulado, cadastro, editavel, ultimoAberto, onMudar }) {
  const estado = estadoDoDia(simulado, cadastro);
  const longo = NOMES_LONGOS[dia];
  const horas = simulado.aberta ? horasDoDia(simulado.abre, simulado.fecha) : 0;
  const cabeca = (
    <div>
      <strong className="block text-sm leading-5 text-[var(--text-strong)]">{nome}</strong>
      <span className="block h-4 text-xs leading-4 text-[var(--text-secondary)]">{simulado.aberta ? `${String(horas).replace(".", ",")}h` : ""}</span>
    </div>
  );
  const acao = (rotulo, aoClicar, extra = {}) => (editavel ? <button type="button" className={LINK} onClick={aoClicar} {...extra}>{rotulo}</button> : null);

  if (!simulado.aberta)
    return (
      <li className={`${COLUNAS} h-[60px] border-t border-[var(--border-subtle)] px-4`}>
        {cabeca}
        <span className="col-span-2 flex h-10 items-center justify-center rounded-[6px] border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-2 text-center text-xs text-[var(--text-secondary)]">
          {estado.fechadoNaSimulacao ? "Fechado nesta simulação" : "Fechado"}
        </span>
        <span className="flex flex-col items-center gap-0.5">
          {estado.fechadoNaSimulacao && SELO}
          {estado.fechadoNaSimulacao
            ? acao("Reabrir", () => onMudar({ aberta: true, abre: cadastro.abre, fecha: cadastro.fecha }), { "aria-label": `Reabrir ${longo} no horário do Cadastro` })
            : acao("Abrir dia", () => onMudar({ aberta: true, ...horarioPadraoAoAbrir() }), { "aria-label": `Abrir ${longo}` })}
        </span>
      </li>
    );

  return (
    <li className={`${COLUNAS} h-[60px] border-t border-[var(--border-subtle)] px-4`}>
      {cabeca}
      <CampoDeHorario
        rotulo={`abertura de ${longo}`}
        valor={simulado.abre}
        alterado={estado.alterado}
        desabilitado={!editavel}
        outroLado={simulado.fecha}
        onConfirmar={(v) => onMudar({ ...simulado, abre: v })}
        onPasso={(d) => onMudar({ ...simulado, abre: passoDaAbertura(simulado.abre, simulado.fecha, d) })}
      />
      <CampoDeHorario
        rotulo={`fechamento de ${longo}`}
        valor={simulado.fecha}
        alterado={estado.alterado}
        desabilitado={!editavel}
        ehFechamento
        outroLado={simulado.abre}
        onConfirmar={(v) => onMudar({ ...simulado, fecha: v })}
        onPasso={(d) => onMudar({ ...simulado, fecha: passoDoFechamento(simulado.abre, simulado.fecha, d) })}
      />
      <span className="flex flex-col items-center gap-0.5">
        {estado.alterado && SELO}
        {acao("Fechar dia", () => onMudar({ aberta: false }), { disabled: ultimoAberto, title: ultimoAberto ? "A loja precisa ficar aberta em ao menos um dia" : undefined, "aria-label": `Fechar ${longo}` })}
      </span>
    </li>
  );
}
