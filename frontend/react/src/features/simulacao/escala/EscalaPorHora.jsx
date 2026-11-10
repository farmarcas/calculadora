import { useEffect, useMemo, useState } from "react";
import GradeDeHoras from "./GradeDeHoras.jsx";
import LinhaDaFuncao from "./LinhaDaFuncao.jsx";
import LinhaDaPessoa from "./LinhaDaPessoa.jsx";
import { contratacoesSimuladas, diasDasAbas, faixaDeAviso, horasDoDia, horasReforcadas, recalcularCobertura, textoDoTurno } from "./escala-regras.js";

const ORDEM = ["Farmacêutico", "Atendimento", "Caixa"];
const NOMES_LONGOS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];

// "Escala por hora" (spec 039), dentro da Simulação: a grade do dia com venda e clientes por hora, a cobertura por função e
// os turnos de cada pessoa. A contratação e os turnos valem só para esta simulação; nada vai ao Cadastro.
export default function EscalaPorHora({ sim, editavel, dono, onSalvar }) {
  const abas = useMemo(() => diasDasAbas(sim.diasAbertos), [sim.diasAbertos]);
  const [dia, setDia] = useState(abas[0]?.dia ?? 0);
  const [selecionado, setSelecionado] = useState(null);
  const [recolhidas, setRecolhidas] = useState(() => new Set());
  // Turnos com o ajuste em andamento (arrastar): a cobertura responde na hora; volta ao do servidor quando a simulação muda.
  const [ajuste, setAjuste] = useState(null);
  useEffect(() => setAjuste(null), [sim]);

  const aba = abas.find((a) => a.dia === dia) ?? abas[0];
  useEffect(() => {
    if (abas.length && !abas.some((a) => a.dia === dia)) setDia(abas[0].dia);
  }, [abas, dia]);

  if (!aba) return <section aria-label="Escala por hora" className="rounded-card border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 text-sm text-[var(--text-secondary)]">A loja não abre nenhum dia nesta simulação.</section>;

  const turnos = ajuste ?? sim.turnos;
  const horas = horasDoDia(aba);
  const ini = horas[0];
  const fim = horas[horas.length - 1] + 1;
  const colunas = `300px repeat(${horas.length}, minmax(34px, 1fr)) 130px`;
  const quadro = sim.quadro.filter((p) => !p.desligado && p.funcao);
  const cobDoDia = sim.avaliacao?.cobertura?.[dia] ?? [];
  const vendaPorHora = sim.resultado?.vendaPorHora;

  const funcoes = [...new Set([...cobDoDia.map((c) => c.funcao), ...quadro.map((p) => p.funcao)])].sort((a, b) => (ORDEM.indexOf(a) + 1 || 99) - (ORDEM.indexOf(b) + 1 || 99));
  const turnosDoDia = turnos.filter((t) => t.dia === dia);
  const funcaoDe = new Map(quadro.map((p) => [p.matricula, p.funcao]));

  // A cobertura de cada função, recalculada com os turnos de agora (mesma conta da avaliação do servidor).
  const coberturas = funcoes.map((f) => {
    const base = cobDoDia.find((c) => c.funcao === f);
    if (!base) return null;
    return recalcularCobertura(base, turnosDoDia.filter((t) => funcaoDe.get(t.matricula) === f));
  });
  const aviso = faixaDeAviso(coberturas.filter(Boolean), dia);
  const turnoSelecionado = turnos.find((t) => t.matricula === selecionado && t.dia === dia);
  const pessoaSelecionada = quadro.find((p) => p.matricula === selecionado);

  const alternar = (f) => setRecolhidas((r) => { const n = new Set(r); if (n.has(f)) n.delete(f); else n.add(f); return n; });

  return (
    <section aria-label="Escala por hora" className="rounded-card border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4 p-6 pb-4">
        <div className="min-w-0 max-w-[560px]">
          <h2 className="m-0 text-xl leading-[26px] font-bold text-[var(--text-strong)]">Escala por hora</h2>
          <p className="mt-1 mb-0 text-sm leading-5 text-[var(--text-secondary)]">
            {editavel ? "Arraste um turno para mover; puxe as bordas para mudar início e fim. Em cada função, use “+ Contratar” para simular uma pessoa a mais. Cada mudança é revalidada contra a regra-alvo." : "A escala desta simulação, hora a hora. Para ajustar, clone a simulação ou peça a quem tem permissão de edição."}
          </p>
        </div>
        <div role="tablist" aria-label="Dia da semana" className="flex overflow-hidden rounded-btn border border-[var(--border-default)]">
          {abas.map((a) => (
            <button key={a.dia} type="button" role="tab" aria-selected={a.dia === dia} onClick={() => setDia(a.dia)} className={`cursor-pointer border-0 px-3 py-1.5 text-sm ${a.dia === dia ? "bg-[var(--primary-ra-800)] font-bold text-white" : "bg-transparent text-[var(--text-strong)]"}`}>{a.nome}</button>
          ))}
        </div>
      </div>

      <div className="px-6 pb-3 text-xs">
        {turnoSelecionado && pessoaSelecionada ? (
          <div className="rounded-btn bg-[var(--color-primary-soft)] px-3 py-2 text-[var(--color-primary)]">{pessoaSelecionada.vaga ? "Contratação simulada" : pessoaSelecionada.nome} · {pessoaSelecionada.funcao}, {textoDoTurno(turnoSelecionado)}</div>
        ) : !aviso ? (
          <div className="rounded-btn bg-[var(--surface-subtle)] px-3 py-2 text-[var(--text-secondary)]">Nenhum turno selecionado</div>
        ) : null}
      </div>
      {aviso && <div role="status" className="mx-6 mb-3 rounded-btn bg-[var(--func-attention-100)] px-4 py-2.5 text-sm leading-5 font-bold text-[var(--neutral-dark-900)]" data-testid="faixa-de-aviso">{aviso}</div>}

      <div className="escala-conteiner">
        <div className="escala-desktop overflow-x-auto px-6 pb-6">
          <div role="table" aria-label={`Escala de ${NOMES_LONGOS[dia]}`} className="min-w-[900px]">
            <GradeDeHoras horas={horas} dono={dono} venda={vendaPorHora?.venda?.[dia]} clientes={vendaPorHora?.clientes?.[dia]} temBase={!!sim.resultado?.temBase} colunas={colunas} />
            {funcoes.map((f, i) => {
              const cob = coberturas[i];
              if (!cob) return null;
              const pessoas = quadro.filter((p) => p.funcao === f && !p.vaga);
              const simuladas = contratacoesSimuladas(sim.quadro, turnos, f);
              const reforcadas = horasReforcadas(turnos.filter((t) => simuladas.some((s) => s.matricula === t.matricula)), dia);
              return (
                <div key={f}>
                  <LinhaDaFuncao funcao={f} pessoas={pessoas.length} cobertura={cob} reforcadas={reforcadas} recolhida={recolhidas.has(f)} onAlternar={() => alternar(f)} colunas={colunas} />
                  {!recolhidas.has(f) && (
                    <>
                      {pessoas.map((p) => (
                        <LinhaDaPessoa key={p.matricula} pessoa={p} turno={turnoDoDiaDe(turnos, p.matricula, dia)} turnosDaPessoa={turnos.filter((t) => t.matricula === p.matricula)} ini={ini} fim={fim} colunas={colunas} selecionado={selecionado === p.matricula} onSelecionar={() => setSelecionado(p.matricula)} />
                      ))}
                      {simuladas.map((s) => {
                        const p = quadro.find((x) => x.matricula === s.matricula);
                        return <LinhaDaPessoa key={s.matricula} pessoa={p} turno={turnoDoDiaDe(turnos, s.matricula, dia)} turnosDaPessoa={s.turnos} ini={ini} fim={fim} colunas={colunas} simulada selecionado={selecionado === s.matricula} onSelecionar={() => setSelecionado(s.matricula)} rotuloSimulada={s.texto} />;
                      })}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

const turnoDoDiaDe = (turnos, matricula, dia) => turnos.find((t) => t.matricula === matricula && t.dia === dia) ?? null;
