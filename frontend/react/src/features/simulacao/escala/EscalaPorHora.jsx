import { useEffect, useMemo, useState } from "react";
import EscalaMobile from "./EscalaMobile.jsx";
import FormularioContratar from "./FormularioContratar.jsx";
import GradeDeHoras from "./GradeDeHoras.jsx";
import LinhaDaFuncao from "./LinhaDaFuncao.jsx";
import LinhaDaPessoa from "./LinhaDaPessoa.jsx";
import { avisosDaPessoa, contratacoesSimuladas, erroDoFormulario, sugerirContratacao, turnosDoFormulario, diasDasAbas, faixaDeAviso, horasDoDia, horasReforcadas, novoTurnoNaFolga, recalcularCobertura, semTurnoNoDia, sugerirTurnosDasVagas, textoDoTurno, totalDaSemana, turnosParaGravar } from "./escala-regras.js";

const ORDEM = ["Farmacêutico", "Atendimento", "Caixa"];
const NOMES_LONGOS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];

// "Escala por hora" (spec 039), dentro da Simulação: a grade do dia com venda e clientes por hora, a cobertura por função e
// os turnos de cada pessoa. A contratação e os turnos valem só para esta simulação; nada vai ao Cadastro.
export default function EscalaPorHora({ sim, editavel, dono, calculando = false, erro = null, onLimparErro, onSalvar }) {
  const abas = useMemo(() => diasDasAbas(sim.diasAbertos), [sim.diasAbertos]);
  const [dia, setDia] = useState(abas[0]?.dia ?? 0);
  const [selecionado, setSelecionado] = useState(null);
  const [recolhidas, setRecolhidas] = useState(() => new Set());
  // Turnos com o ajuste em andamento (arrastar): a cobertura responde na hora; volta ao do servidor quando a simulação muda.
  const [tentou, setTentou] = useState(false); // houve uma gravação de turno: o erro, se vier, aparece aqui
  // O rascunho do formulário aberto (um por vez): { funcao, tipo, dias, entra, sai }. A barra de prévia da grade nasce dele.
  const [rascunho, setRascunho] = useState(null);
  const [ajuste, setAjuste] = useState(null);
  useEffect(() => setAjuste(null), [sim]);
  // Se a gravação terminou (ou falhou), o turno volta a ser o do servidor.
  useEffect(() => {
    if (!calculando) setAjuste(null);
  }, [calculando]);

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

  // A prévia do turno da contratação que está sendo montada: entra na cobertura que a grade mostra (marcada em tracejado azul),
  // mas só vale depois de "Adicionar à simulação". Rascunho inválido não gera prévia.
  const rascunhoValido = rascunho && !erroDoFormulario({ tipo: rascunho.tipo, dias: rascunho.dias, entra: rascunho.entra, sai: rascunho.sai, regra: sim.regraInfo });
  const turnosPrevia = rascunhoValido ? turnosDoFormulario(rascunho).map((t) => ({ ...t, matricula: "PREVIA" })) : [];

  // A cobertura de cada função, recalculada com os turnos de agora (mesma conta da avaliação do servidor).
  const coberturas = funcoes.map((f) => {
    const base = cobDoDia.find((c) => c.funcao === f);
    if (!base) return null;
    const daPrevia = rascunho?.funcao === f ? turnosPrevia.filter((t) => t.dia === dia) : [];
    return recalcularCobertura(base, [...turnosDoDia.filter((t) => funcaoDe.get(t.matricula) === f), ...daPrevia]);
  });
  const aviso = faixaDeAviso(coberturas.filter(Boolean), dia);
  // Os blocos por função (cobertura, pessoas e contratações simuladas), usados pela grade do computador e pela lista do celular.
  const blocos = funcoes.flatMap((f, i) => {
    const cob = coberturas[i];
    if (!cob) return [];
    const simuladas = contratacoesSimuladas(sim.quadro, turnos, f);
    const daPrevia = rascunho?.funcao === f ? turnosPrevia : [];
    const reforcadas = horasReforcadas([...turnos.filter((t) => simuladas.some((s) => s.matricula === t.matricula)), ...daPrevia], dia);
    return [{ f, cob, pessoas: quadro.filter((p) => p.funcao === f && !p.vaga), simuladas, reforcadas }];
  });
  const turnoSelecionado = turnos.find((t) => t.matricula === selecionado && t.dia === dia);
  const pessoaSelecionada = quadro.find((p) => p.matricula === selecionado);

  // As vagas simuladas de hoje, no formato que o servidor aceita de volta (quem já existe mantém a matrícula).
  const vagasAtuais = sim.quadro.filter((p) => p.vaga && !p.desligado).map((v) => ({ matricula: v.matricula, funcao: v.funcao, cargaH: v.cargaH }));
  const adicionar = (f, vaga) => {
    onSalvar({ vagas: [...vagasAtuais, vaga] });
    setRascunho(null);
  };
  const remover = (matricula) => onSalvar({ vagas: vagasAtuais.filter((v) => v.matricula !== matricula) });
  // A cobertura da função em cada dia aberto (com os turnos de agora): o formulário sugere e mede o efeito com ela.
  const coberturaPorDia = (f) =>
    Object.fromEntries(
      abas.flatMap((a) => {
        const base = sim.avaliacao?.cobertura?.[a.dia]?.find((c) => c.funcao === f);
        if (!base) return [];
        return [[a.dia, recalcularCobertura(base, turnos.filter((t) => t.dia === a.dia && funcaoDe.get(t.matricula) === f))]];
      }),
    );

  // Grava os turnos de agora (a tela já mostra o resultado e o servidor confirma); um erro volta o turno ao anterior.
  const gravarTurnos = (novos) => {
    setAjuste(novos);
    setTentou(true);
    onLimparErro?.();
    onSalvar({ turnos: turnosParaGravar(novos) });
  };
  // Muda o turno de uma pessoa neste dia: durante o gesto só a tela (a cobertura responde na hora); ao soltar, grava.
  const mudarTurno = (matricula, novo, definitivo) => {
    const base = ajuste ?? sim.turnos;
    const novos = base.map((t) => (t.matricula === matricula && t.dia === novo.dia ? { ...t, ...novo } : t));
    if (definitivo) gravarTurnos(novos);
    else setAjuste(novos);
  };
  // "Folga" clicável: a pessoa passa a trabalhar neste dia, no horário que ela mais repete.
  const criarTurno = (matricula) => gravarTurnos([...turnos, novoTurnoNaFolga({ turnos, matricula, dia, aba, regra: sim.regraInfo })]);
  // "Tirar do dia": o turno selecionado vira folga.
  const tirarDoDia = (matricula) => {
    gravarTurnos(semTurnoNoDia(turnos, matricula, dia));
    setSelecionado(null);
  };
  // "Sugerir turno": os dias e o horário que cobrem as horas sem cobertura, para uma contratação sem turno.
  const sugerirTurno = (matricula) => {
    const novos = sugerirTurnosDasVagas({ quadro: sim.quadro, turnos, cobertura: sim.avaliacao?.cobertura, abas, regra: sim.regraInfo, somente: matricula });
    if (novos.length) gravarTurnos([...turnos, ...novos]);
  };
  // As regras de jornada, intervalo e folga que a avaliação aponta; avisam e não impedem salvar o cenário.
  const regrasDeTurno = [...(sim.avaliacao?.erros ?? []), ...(sim.avaliacao?.avisos ?? [])].filter((a) => !["cobertura", "farmaceutico"].includes(a.regra));

  // Abre (ou fecha) o formulário de uma função, já com a sugestão que cobre as horas sem cobertura.
  const abrirContratar = (f) => {
    if (rascunho?.funcao === f) return setRascunho(null);
    const sug = sugerirContratacao({ funcao: f, coberturaPorDia: coberturaPorDia(f), abas, tipo: "parcial", regra: sim.regraInfo, diaPreferido: dia });
    return setRascunho({ funcao: f, tipo: "parcial", dias: sug?.dias ?? [dia], entra: sug?.entra ?? aba.abre, sai: sug?.sai ?? Math.min(aba.fecha, aba.abre + 6) });
  };
  const formularioDe = (f) =>
    rascunho?.funcao === f ? (
      <FormularioContratar simId={sim.id} funcao={f} abas={abas} coberturaPorDia={coberturaPorDia(f)} regra={sim.regraInfo} dono={dono} diaPreferido={dia} valor={rascunho} onMudar={(parcial) => setRascunho((r) => ({ ...r, ...parcial }))} onCancelar={() => setRascunho(null)} onAdicionar={(vaga) => adicionar(f, vaga)} />
    ) : null;
  // A linha da prévia: a barra tracejada do turno sugerido (arrastar muda Entra e Sai do formulário, sem gravar nada).
  const linhaDaPrevia = (f) => {
    if (rascunho?.funcao !== f) return null;
    const turno = rascunho.dias.includes(dia) ? { matricula: "PREVIA", dia, entrada: rascunho.entra, saida: rascunho.sai, iniIntervalo: null, fimIntervalo: null } : null;
    return (
      <LinhaDaPessoa key="previa" pessoa={{ matricula: "PREVIA", nome: "Turno sugerido", funcao: f, cargaH: 0 }} turno={turno} turnosDaPessoa={turnosPrevia} ini={ini} fim={fim} colunas={colunas} simulada previa editavel
        rotuloSimulada={`${f} · prévia, ainda não adicionada`} onMudar={(t) => setRascunho((r) => ({ ...r, entra: t.entrada, sai: t.saida }))} />
    );
  };

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
        <div role="tablist" aria-label="Dia da semana" className="flex max-w-full overflow-x-auto rounded-btn border border-[var(--border-default)]">
          {abas.map((a) => (
            <button key={a.dia} type="button" role="tab" aria-selected={a.dia === dia} onClick={() => setDia(a.dia)} className={`cursor-pointer border-0 px-3 py-1.5 text-sm ${a.dia === dia ? "bg-[var(--primary-ra-800)] font-bold text-white" : "bg-transparent text-[var(--text-strong)]"}`}>{a.nome}</button>
          ))}
        </div>
      </div>

      <div className="px-6 pb-3 text-xs">
        {turnoSelecionado && pessoaSelecionada ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-btn bg-[var(--color-primary-soft)] px-3 py-2 text-[var(--color-primary)]">
            <span>
              {pessoaSelecionada.vaga ? "Contratação simulada" : pessoaSelecionada.nome} · {pessoaSelecionada.funcao}, {textoDoTurno(turnoSelecionado)} · semana: {totalDaSemana(turnos, pessoaSelecionada.matricula).texto}
            </span>
            {editavel && <button type="button" onClick={() => tirarDoDia(pessoaSelecionada.matricula)} className="cursor-pointer border-0 bg-transparent p-0 text-xs font-bold text-[var(--text-danger)] hover:underline">Tirar do dia</button>}
          </div>
        ) : !aviso ? (
          <div className="rounded-btn bg-[var(--surface-subtle)] px-3 py-2 text-[var(--text-secondary)]">Nenhum turno selecionado</div>
        ) : null}
        {turnoSelecionado && pessoaSelecionada && avisosDaPessoa(sim.avaliacao, pessoaSelecionada.matricula).length > 0 && (
          <ul className="m-0 mt-1 list-disc pl-5 text-[var(--text-secondary)]" data-testid="avisos-da-pessoa">
            {avisosDaPessoa(sim.avaliacao, pessoaSelecionada.matricula).slice(0, 3).map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        )}
      </div>
      {tentou && erro && (
        <div role="alert" className="mx-6 mb-3 flex items-start justify-between gap-3 rounded-btn bg-[var(--func-warning-50)] px-4 py-2.5 text-sm leading-5 text-[#8b0020]" data-testid="erro-da-escala">
          <span>{erro} O turno voltou ao que estava.</span>
          <button type="button" onClick={() => { setTentou(false); onLimparErro?.(); }} className="shrink-0 cursor-pointer border-0 bg-transparent p-0 text-xs font-bold text-[#8b0020] hover:underline">Fechar</button>
        </div>
      )}
      {aviso && <div role="status" className="mx-6 mb-3 rounded-btn bg-[var(--func-attention-100)] px-4 py-2.5 text-sm leading-5 font-bold text-[var(--neutral-dark-900)]" data-testid="faixa-de-aviso">{aviso}</div>}

      <div className="escala-conteiner">
        <div className="escala-desktop overflow-x-auto px-6 pb-6">
          <div role="table" aria-label={`Escala de ${NOMES_LONGOS[dia]}`} className="min-w-[900px]">
            <GradeDeHoras horas={horas} dono={dono} venda={vendaPorHora?.venda?.[dia]} clientes={vendaPorHora?.clientes?.[dia]} temBase={!!sim.resultado?.temBase} colunas={colunas} />
            {blocos.map(({ f, cob, pessoas, simuladas, reforcadas }) => (
              <div key={f}>
                <LinhaDaFuncao funcao={f} pessoas={pessoas.length} cobertura={cob} reforcadas={reforcadas} recolhida={recolhidas.has(f)} onAlternar={() => alternar(f)} onContratar={editavel ? () => abrirContratar(f) : undefined} colunas={colunas} />
                {formularioDe(f)}
                {linhaDaPrevia(f)}
                {!recolhidas.has(f) && (
                  <>
                    {pessoas.map((p) => (
                      <LinhaDaPessoa key={p.matricula} pessoa={p} turno={turnoDoDiaDe(turnos, p.matricula, dia)} turnosDaPessoa={turnos.filter((t) => t.matricula === p.matricula)} ini={ini} fim={fim} colunas={colunas} selecionado={selecionado === p.matricula} onSelecionar={() => setSelecionado(p.matricula)} editavel={editavel} onMudar={(t, fim2) => mudarTurno(p.matricula, t, fim2)} onCriarTurno={() => criarTurno(p.matricula)} />
                    ))}
                    {simuladas.map((s) => {
                      const p = quadro.find((x) => x.matricula === s.matricula);
                      return <LinhaDaPessoa key={s.matricula} pessoa={p} turno={turnoDoDiaDe(turnos, s.matricula, dia)} turnosDaPessoa={s.turnos} ini={ini} fim={fim} colunas={colunas} simulada selecionado={selecionado === s.matricula} onSelecionar={() => setSelecionado(s.matricula)} rotuloSimulada={s.texto} onRemover={editavel ? () => remover(s.matricula) : undefined} editavel={editavel} onMudar={(t, fim2) => mudarTurno(s.matricula, t, fim2)} onCriarTurno={() => criarTurno(s.matricula)} onSugerir={() => sugerirTurno(s.matricula)} />;
                    })}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        <EscalaMobile horas={horas} dono={dono} vendaDia={vendaPorHora?.venda?.[dia]} clientesDia={vendaPorHora?.clientes?.[dia]} temBase={!!sim.resultado?.temBase} blocos={blocos} turnos={turnos} dia={dia} editavel={editavel} recolhidas={recolhidas} onAlternar={alternar} onContratar={abrirContratar} formulario={formularioDe} onRemover={remover} />
      </div>
      {regrasDeTurno.length > 0 && (
        <div className="mx-6 mb-6 rounded-btn bg-[var(--surface-subtle)] px-4 py-3 text-xs leading-4 text-[var(--text-secondary)]" data-testid="avisos-de-regra">
          <strong className="text-[var(--text-strong)]">Avisos de regra.</strong> Eles não impedem salvar o cenário.
          <ul className="m-0 mt-1 list-disc pl-5">{regrasDeTurno.slice(0, 5).map((a, i) => <li key={i}>{a.texto}</li>)}</ul>
          {regrasDeTurno.length > 5 && <div className="mt-1">E mais {regrasDeTurno.length - 5}.</div>}
        </div>
      )}
    </section>
  );
}

const turnoDoDiaDe = (turnos, matricula, dia) => turnos.find((t) => t.matricula === matricula && t.dia === dia) ?? null;
