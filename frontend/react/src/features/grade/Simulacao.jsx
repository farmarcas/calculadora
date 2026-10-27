import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Botao, Cartao, Ficha, entrada } from "../../components/ui/index.jsx";
import Grade from "./Grade.jsx";
import { NOMES_DIA, hhmm, horasLiquidas, lerHhmm } from "./tempo.js";

const STATUS = { rascunho: ["atencao", "Rascunho"], gravada: ["ok", "Gravada"], em_uso: ["ok", "Em uso"], substituida: ["neutro", "Substituída"], descartada: ["neutro", "Descartada"] };
const REGRAS = [["atual", "44h (atual)"], ["r42", "42h"], ["r40", "40h"]];
const TH = "text-left text-[11px] font-bold uppercase tracking-wide text-ink-500 px-4 py-2";

export default function Simulacao({ id, podeEscrever, onMudou, onAbrir }) {
  const [sim, setSim] = useState(null);
  const [turnos, setTurnos] = useState([]);
  const [dia, setDia] = useState(0);
  const [sel, setSel] = useState(null);
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const seq = useRef(0);
  const timer = useRef(null);

  const aplicar = useCallback((s) => {
    setSim(s);
    setTurnos(s.turnos);
    setDia((d) => (s.diasAbertos.some((x) => x.dia === d) ? d : (s.diasAbertos[0]?.dia ?? 0)));
  }, []);

  useEffect(() => {
    setSim(null);
    setErro(null);
    api(`/simulacoes/${id}`).then(aplicar).catch((e) => setErro(e.message));
  }, [id, aplicar]);

  const salvar = useCallback(
    (corpo) => {
      clearTimeout(timer.current);
      const mine = ++seq.current;
      setSalvando(true);
      timer.current = setTimeout(async () => {
        try {
          const s = await api(`/simulacoes/${id}`, { method: "PUT", body: corpo });
          // Só a última resposta vale: evita uma resposta antiga sobrescrever um ajuste novo.
          if (mine === seq.current) {
            setSim(s);
            if (corpo.turnos === undefined) setTurnos(s.turnos);
          }
        } catch (e) {
          setErro(e.message);
        } finally {
          if (mine === seq.current) setSalvando(false);
        }
      }, 250);
    },
    [id],
  );

  const mudarTurno = (novo) => {
    const outros = turnos.filter((t) => !(t.matricula === novo.matricula && t.dia === novo.dia));
    const lista = [...outros, novo];
    setTurnos(lista);
    salvar({ turnos: lista });
  };
  const tirarTurno = (matricula, d) => {
    const lista = turnos.filter((t) => !(t.matricula === matricula && t.dia === d));
    setTurnos(lista);
    salvar({ turnos: lista });
  };
  const novoTurno = (matricula) => {
    const a = sim.diasAbertos.find((x) => x.dia === dia);
    const e = a?.abre ?? 8;
    mudarTurno({ matricula, dia, entrada: e, saida: Math.min(e + 6, a?.fecha ?? e + 6), iniIntervalo: null, fimIntervalo: null });
    setSel(matricula);
  };

  const acao = async (caminho) => {
    setErro(null);
    try {
      const s = await api(`/simulacoes/${id}/${caminho}`, { method: "POST" });
      if (caminho === "clonar") onAbrir(s.id);
      else aplicar(s);
      onMudou();
    } catch (e) {
      setErro(e.details?.length ? `${e.message} ${e.details.slice(0, 3).map((d) => d.texto).join(" ")}` : e.message);
    }
  };

  if (erro && !sim) return <Aviso>{erro}</Aviso>;
  if (!sim) return <p className="text-sm text-ink-500">Carregando simulação…</p>;

  const editavel = sim.editavel && podeEscrever;
  const [tom, rotulo] = STATUS[sim.status];
  const aberto = sim.diasAbertos.find((x) => x.dia === dia);
  const turnoSel = sel ? turnos.find((t) => t.matricula === sel && t.dia === dia) : null;
  const pessoaSel = sel ? sim.quadro.find((p) => p.matricula === sel) : null;
  const porPessoa = Object.fromEntries(sim.avaliacao.porPessoa.map((p) => [p.matricula, p]));
  const cobDia = sim.avaliacao.cobertura[dia] ?? [];
  const errosDia = sim.avaliacao.erros.filter((e) => e.dia === undefined || e.dia === dia);

  const editarCampo = (campo, valor) => {
    const v = lerHhmm(valor);
    mudarTurno({ ...turnoSel, [campo]: valor === "" ? null : v });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="m-0 text-lg font-bold">{sim.nome}</h2>
          <Ficha tom={tom}>{rotulo}</Ficha>
          {salvando && <span className="text-xs text-ink-500">Salvando…</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-ink-500">
            Regra
            <select className={entrada} value={sim.regra} disabled={!editavel} onChange={(e) => salvar({ regra: e.target.value })} aria-label="Regra da simulação">
              {REGRAS.map(([k, r]) => <option key={k} value={k}>{r}</option>)}
            </select>
          </label>
          {podeEscrever && <Botao tipo="secundario" onClick={() => acao("clonar")}>Clonar</Botao>}
          {editavel && <Botao tipo="perigo" onClick={() => window.confirm("Descartar esta simulação?") && acao("descartar")}>Descartar</Botao>}
          {editavel && <Botao onClick={() => acao("gravar")} disabled={!sim.avaliacao.podeGravar} title={sim.avaliacao.podeGravar ? "" : "Corrija os erros antes de gravar"}>Gravar</Botao>}
        </div>
      </div>

      {erro && <Aviso>{erro}</Aviso>}
      {!sim.editavel && <Aviso tom="neutro">Simulação {rotulo.toLowerCase()}: não se edita. Clone para ajustar.</Aviso>}
      <p className="m-0 text-xs text-ink-500">{sim.regraInfo.descricao}. Valores das regras ainda sem validação jurídica.</p>

      <Cartao titulo="Escala da semana" subtitulo="Entrada–saída de cada pessoa · clique num dia para ajustar na grade">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm min-w-[720px]">
            <thead>
              <tr>
                <th className={TH}>Pessoa</th>
                {NOMES_DIA.map((n, d) => {
                  const fechado = !sim.diasAbertos.some((x) => x.dia === d);
                  return (
                    <th key={d} className={`${TH} ${dia === d ? "text-system-700" : ""}`}>
                      <button type="button" disabled={fechado} onClick={() => setDia(d)} className={fechado ? "text-ink-300" : ""} aria-pressed={dia === d}>{n}</button>
                    </th>
                  );
                })}
                <th className={TH}>Horas</th>
              </tr>
            </thead>
            <tbody>
              {sim.quadro.map((p) => {
                const pp = porPessoa[p.matricula];
                const estourou = pp && pp.horas > pp.limiteH + 1e-9;
                return (
                  <tr key={p.matricula} className="border-t border-line">
                    <td className="px-4 py-2"><div className="font-medium">{p.nome}</div><div className="text-xs text-ink-500">{p.funcao}</div></td>
                    {NOMES_DIA.map((_, d) => {
                      const t = turnos.find((x) => x.matricula === p.matricula && x.dia === d);
                      return <td key={d} className={`px-4 py-2 text-xs ${dia === d ? "bg-system-50" : ""}`}>{t ? `${hhmm(t.entrada)}–${hhmm(t.saida)}` : <span className="text-ink-300">folga</span>}</td>;
                    })}
                    <td className={`px-4 py-2 text-xs ${estourou ? "text-error-600 font-medium" : ""}`}>{pp?.horas ?? 0}h / {pp?.limiteH ?? 0}h</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Cartao>

      <Cartao
        titulo={`Escala por hora · ${NOMES_DIA[dia]}`}
        subtitulo={editavel ? "Arraste um turno para mover; puxe as bordas para mudar entrada ou saída (passos de 15 min)" : "Somente leitura"}
        acoes={
          <div className="flex border border-line rounded-input overflow-hidden" role="group" aria-label="Dia">
            {sim.diasAbertos.map((x) => (
              <button key={x.dia} onClick={() => setDia(x.dia)} aria-pressed={dia === x.dia} className={`px-3 py-1.5 text-sm ${dia === x.dia ? "bg-system-50 text-system-700 font-medium" : "text-ink-700"}`}>{NOMES_DIA[x.dia]}</button>
            ))}
          </div>
        }
      >
        {aberto ? (
          <Grade quadro={sim.quadro} turnos={turnos} dia={dia} aberto={aberto} editavel={editavel} selecionado={sel} onSelecionar={setSel} onMudar={mudarTurno} onNovoTurno={novoTurno} />
        ) : (
          <p className="m-0 px-6 py-5 text-sm text-ink-500">A loja não abre neste dia. Cadastre o horário em Cadastros.</p>
        )}
        {turnoSel && editavel && (
          <div className="flex flex-wrap items-end gap-4 px-6 py-4 border-t border-line bg-surface-page">
            <strong className="text-sm self-center">{pessoaSel.nome} · {NOMES_DIA[dia]}</strong>
            {[["entrada", "Entrada"], ["iniIntervalo", "Início do intervalo"], ["fimIntervalo", "Fim do intervalo"], ["saida", "Saída"]].map(([k, r]) => (
              <label key={k} className="flex flex-col gap-1 text-xs font-medium text-ink-500">
                {r}
                <input type="time" step={900} className={entrada} value={turnoSel[k] != null ? hhmm(turnoSel[k]) : ""} onChange={(e) => editarCampo(k, e.target.value)} />
              </label>
            ))}
            <span className="text-xs text-ink-500 self-center">{Math.round(horasLiquidas(turnoSel) * 100) / 100}h líquidas</span>
            <Botao tipo="perigo" onClick={() => tirarTurno(turnoSel.matricula, dia)}>Folga neste dia</Botao>
          </div>
        )}
      </Cartao>

      {aberto && (
        <Cartao titulo={`Cobertura · ${NOMES_DIA[dia]}`} subtitulo="Pessoas presentes em cada hora, já descontado o intervalo">
          <div className="overflow-x-auto px-6 py-4">
            <table className="border-collapse text-xs min-w-[640px] w-full">
              <tbody>
                {cobDia.map((f) => (
                  <tr key={f.funcao}>
                    <td className="py-1 pr-3 whitespace-nowrap">{f.funcao} <span className="text-ink-500">(mín. {f.minimo})</span></td>
                    {f.porHora.map((c) => (
                      <td key={c.hora} className="p-0.5">
                        <div title={`${String(c.hora).padStart(2, "0")}h · ${c.pessoas} pessoa(s)`} className={`h-7 rounded flex items-center justify-center font-medium ${c.ok ? "bg-success-50 text-success-600" : "bg-error-50 text-error-600"}`}>{c.pessoas}</div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Cartao>
      )}

      <Cartao titulo="Erros e avisos" subtitulo={sim.avaliacao.podeGravar ? "Sem erros: pode gravar" : "Erros bloqueiam a gravação"}>
        <ul className="list-none m-0 p-0">
          {sim.avaliacao.erros.length + sim.avaliacao.avisos.length === 0 && <li className="px-6 py-4 text-sm text-ink-700">Nenhum erro ou aviso.</li>}
          {[...sim.avaliacao.erros, ...sim.avaliacao.avisos].map((a, i) => (
            <li key={i} className="px-6 py-2 border-t border-line first:border-0"><Aviso tom={a.tipo === "erro" ? "erro" : "atencao"}>{a.tipo === "erro" ? "Erro: " : "Aviso: "}{a.texto}</Aviso></li>
          ))}
        </ul>
        {errosDia.length === 0 && sim.avaliacao.erros.length > 0 && <p className="m-0 px-6 pb-4 text-xs text-ink-500">Os erros acima são de outros dias.</p>}
      </Cartao>
    </div>
  );
}
