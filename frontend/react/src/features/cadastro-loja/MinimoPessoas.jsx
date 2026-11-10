import { useEffect, useState } from "react";
import { Botao, Segmentado } from "../../components/ui/index.jsx";
import { FUNCOES, MAX_TURNOS, coberturaDoHorario, janelaDaLoja, texto, turnosIniciais } from "./turnos.js";
import GraficoDeTurnos from "./turnos/GraficoDeTurnos.jsx";
import SemFaturamento from "./turnos/SemFaturamento.jsx";
import TabelaDeTurnos from "./turnos/TabelaDeTurnos.jsx";
import { adicionarTurno, sugerirTurnos } from "./turnos/turnos-grafico.js";

const CAMPO = "h-10 w-full rounded-[6px] border border-[var(--border-default)] bg-[var(--surface-card)] px-3 text-sm text-[var(--text-strong)] focus:border-2 focus:border-[var(--system-500)] focus:outline-none aria-[invalid=true]:border-[var(--border-danger)] disabled:bg-[var(--surface-muted)]";
const NOMES_DIA = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

// "Pessoas por Turnos na Loja": por turnos (gráfico do faturamento por hora, tabela e detalhe) ou mínimo único do dia. Trocar de
// modo não apaga o outro. Sem base comercial a tela segue igual, sem o gráfico.
export default function MinimoPessoas({ config, horarios, editavel, erros, onMudar, faturamentoPorHora, dono, podeEnviarBase, onEnviarBase }) {
  const janela = janelaDaLoja(horarios);
  const modo = config.modoMinimo;
  const turnos = config.turnos;
  const faixas = turnos?.length ? coberturaDoHorario(turnos, horarios) : [];
  const aberto = (horarios?.dias ?? []).filter((d) => d.aberta).length;
  const temBase = !!faturamentoPorHora?.temBase;
  const [tipoDia, setTipoDia] = useState("uteis");
  const [selecionado, setSelecionado] = useState(0);
  const [sugestao, setSugestao] = useState(null);
  const serie = temBase ? faturamentoPorHora.tipos?.[tipoDia] ?? null : null;
  useEffect(() => { if (turnos && selecionado >= turnos.length) setSelecionado(Math.max(0, turnos.length - 1)); }, [turnos, selecionado]);
  useEffect(() => { if (!temBase) setSugestao(null); }, [temBase]);

  const trocar = (m) => {
    if (m === "turnos" && !turnos) onMudar({ modoMinimo: "turnos", turnos: turnosIniciais(janela, config.minimos) });
    else onMudar({ modoMinimo: m });
  };
  const mudarTurno = (i, novo) => onMudar({ turnos: turnos.map((t, j) => (j === i ? novo : t)) });
  const adicionar = () => {
    const novos = adicionarTurno(turnos, janela, horarios, MAX_TURNOS);
    if (!novos) return;
    onMudar({ turnos: novos });
    setSelecionado(novos.length - 1);
  };
  const sugerir = () => setSugestao(sugerirTurnos(serie, janela, turnos));
  const aplicar = () => { onMudar({ turnos: sugestao }); setSugestao(null); setSelecionado(0); };

  return (
    <section aria-labelledby="titulo-minimo" className="border-t border-[var(--border-subtle)] pt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-xl">
          <h3 id="titulo-minimo" className="m-0 text-base font-bold text-[var(--text-strong)]">Pessoas por Turnos na Loja</h3>
          <p className="m-0 mt-1 text-xs text-[var(--text-secondary)]">Defina quantas pessoas de cada cargo a loja exige em cada turno. O mínimo vale só durante o horário de funcionamento da loja.</p>
        </div>
        <Segmentado rotulo="Modo do mínimo" opcoes={[["turnos", "Por turnos"], ["unico", "Mínimo único do dia"]]} valor={modo} onChange={trocar} desabilitado={!editavel} />
      </div>

      {modo === "unico" ? (
        <div className="mt-4 overflow-hidden rounded-card border border-[var(--border-subtle)]">
          {FUNCOES.map((f) => (
            <div key={f} className="flex items-center justify-between gap-4 border-t border-[var(--border-subtle)] px-4 py-3 first:border-t-0">
              <div className="min-w-0"><strong className="block text-sm text-[var(--text-strong)]">{f}</strong><span className="text-xs text-[var(--text-secondary)]">{f === "Farmacêutico" ? "A lei exige farmacêutico em todo o horário de funcionamento (mínimo 1, fixo)." : "Meta opcional. Deixe 0 para manter o nível de hoje."}</span></div>
              <input type="number" aria-label={f === "Farmacêutico" ? "Mínimo de Farmacêutico" : `Meta de ${f}`} min={f === "Farmacêutico" ? 1 : 0} max={10} disabled={!editavel} value={config.minimos[f] ?? (f === "Farmacêutico" ? 1 : 0)} onChange={(e) => onMudar({ minimos: { ...config.minimos, [f]: Math.max(f === "Farmacêutico" ? 1 : 0, Math.min(10, Number(e.target.value) || 0)) } })} className={`${CAMPO} w-20`} />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--text-strong)]">
            <span>{janela ? <>Horário da loja: <strong>{texto(janela.abre)} a {texto(janela.fecha)}</strong> ({Math.round((janela.fecha - janela.abre) * 100) / 100}h)</> : "Cadastre o horário de funcionamento da loja para definir os turnos."}</span>
            {janela && (faixas.length === 0 ? <span className="inline-flex h-7 items-center rounded-full px-3 text-xs font-bold" style={{ background: "var(--func-success-100)" }}>Horário da loja coberto</span> : null)}
          </div>
          {faixas.length > 0 && (
            <ul role="status" className="m-0 mt-2 list-none rounded-card bg-[var(--func-attention-100)] p-3 text-sm text-[var(--text-strong)]">
              {faixas.map((f, i) => (
                <li key={i}>Sem turno entre {texto(f.de)} e {texto(f.ate)}{f.dias.length === aberto ? "" : ` (${f.dias.map((d) => NOMES_DIA[d]).join(", ")})`}: nessas horas vale 1 farmacêutico e os demais cargos mantêm o nível de hoje.</li>
              ))}
            </ul>
          )}

          {temBase && janela ? (
            <div className="overflow-x-auto px-6">
              <GraficoDeTurnos turnos={turnos} janela={janela} serie={serie} tipoDia={tipoDia} onTipoDia={setTipoDia} selecionado={selecionado} onSelecionar={setSelecionado}
                onMudar={(novos) => onMudar({ turnos: novos })} editavel={editavel} sugestao={sugestao} avisoPoucosDias={faturamentoPorHora.poucosDias} />
            </div>
          ) : (
            janela && <SemFaturamento turnos={turnos} janela={janela} podeEnviarBase={podeEnviarBase} onEnviarBase={onEnviarBase} />
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {editavel && turnos.length < MAX_TURNOS && <Botao tipo="secundario" onClick={adicionar}>+ Adicionar turno</Botao>}
              {editavel && !sugestao && <Botao tipo="secundario" onClick={sugerir} disabled={!temBase || !serie} title={!temBase ? "Envie a base comercial para usar esta função." : undefined}>Sugerir turnos pelo movimento</Botao>}
              {editavel && sugestao && (
                <>
                  <Botao onClick={aplicar}>Aplicar</Botao>
                  <Botao tipo="neutro" onClick={() => setSugestao(null)}>Descartar</Botao>
                  <span role="status" className="text-xs text-[var(--text-secondary)]">Sugestão em faixas tracejadas no gráfico: nada muda até você aplicar.</span>
                </>
              )}
            </div>
            <span className="text-xs text-[var(--text-secondary)]">Pessoas mínimas no horário da loja</span>
          </div>
          {editavel && !temBase && <p className="m-0 mt-1 text-xs text-[var(--text-secondary)]">Envie a base comercial para usar esta função.</p>}

          <div className="mt-3">
            <TabelaDeTurnos turnos={turnos} janela={janela} serie={serie} temBase={temBase && !!janela} editavel={editavel} erros={erros} selecionado={selecionado} onSelecionar={setSelecionado}
              onMudar={mudarTurno} onRemover={(i) => onMudar({ turnos: turnos.filter((_, j) => j !== i) })} />
          </div>
          <p className="m-0 mt-2 text-xs text-[var(--text-secondary)]">Farmacêutico: obrigatório, mínimo 1 (Lei 13.021/2014).</p>
          <p className="m-0 mt-1 text-xs text-[var(--text-secondary)]">Os turnos podem se sobrepor e começar antes da abertura ou terminar depois do fechamento. Fim 00:00 vale como meia-noite.</p>
        </>
      )}
    </section>
  );
}
