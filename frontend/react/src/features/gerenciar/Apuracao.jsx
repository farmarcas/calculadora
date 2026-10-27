import { useCallback, useEffect, useState } from "react";
import { api, baixarArquivo } from "../../api/client.js";
import { Aviso, Botao, Cartao, Ficha, entrada } from "../../components/ui/index.jsx";
import RotuloGerencial from "./RotuloGerencial.jsx";

const TH = "text-left text-[11px] font-bold uppercase tracking-wide text-ink-500 px-6 py-3";
const TD = "px-6 py-3 border-t border-line";
const NOMES = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const dia = (iso) => iso.split("-").reverse().join("/");
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const SITUACAO = { cumprido: ["ok", "Cumprido"], falta: ["erro", "Falta"], folga_trabalhada: ["atencao", "Trabalhou na folga"], incompleto: ["atencao", "Batidas incompletas"], folga: ["neutro", "Folga"] };
const CAUSAS = { plano: "Plano: cobertura planejada insuficiente na faixa", quadro: "Quadro: ausência não reposta", execucao: "Execução: ficou além do turno com cobertura adequada" };

function Kpi({ titulo, valor, detalhe, tom }) {
  return (
    <div className="flex-1 min-w-40 border border-line rounded-card bg-white p-4">
      <div className="text-xs text-ink-500">{titulo}</div>
      <div className={`text-2xl font-bold mt-1 ${tom === "erro" ? "text-error-600" : ""}`}>{valor}</div>
      {detalhe && <div className="text-xs text-ink-500 mt-1">{detalhe}</div>}
    </div>
  );
}

export default function Apuracao({ lojaId, podeVerPessoas }) {
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [loja, setLoja] = useState(null);
  const [pessoas, setPessoas] = useState(null);
  const [aba, setAba] = useState("loja");
  const [sel, setSel] = useState("");
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    setErro(null);
    const q = new URLSearchParams({ ...(de ? { de } : {}), ...(ate ? { ate } : {}) }).toString();
    const sufixo = q ? `?${q}` : "";
    try {
      setLoja(await api(`/lojas/${lojaId}/apuracao/loja${sufixo}`));
      if (podeVerPessoas) {
        const p = await api(`/lojas/${lojaId}/apuracao/pessoas${sufixo}`);
        setPessoas(p);
        setSel((s) => s || p.pessoas[0]?.matricula || "");
      }
    } catch (e) {
      setErro(e.message);
    }
  }, [lojaId, de, ate, podeVerPessoas]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (erro) return <Aviso tom={erro.includes("simulação em uso") ? "atencao" : "erro"}>{erro}</Aviso>;
  if (!loja) return <p className="text-sm text-ink-500">Apurando…</p>;
  const l = loja.loja;
  const pessoa = pessoas?.pessoas.find((p) => p.matricula === sel);
  const causas = l.causaProvavelHoraExtra;

  return (
    <div className="flex flex-col gap-6">
      <RotuloGerencial />
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-ink-500">De<input type="date" className={entrada} value={de} onChange={(e) => setDe(e.target.value)} /></label>
        <label className="flex flex-col gap-1 text-xs font-medium text-ink-500">Até<input type="date" className={entrada} value={ate} onChange={(e) => setAte(e.target.value)} /></label>
        <span className="text-xs text-ink-500 pb-2">Simulação em uso: <strong>{loja.simulacao.nome}</strong> · período apurado: {dia(loja.periodo.de)} a {dia(loja.periodo.ate)} ({loja.periodo.diasApurados} dias com ponto importado)</span>
        {podeVerPessoas && <Botao tipo="secundario" className="ml-auto" onClick={() => baixarArquivo(`/lojas/${lojaId}/apuracao/exportar.xlsx${de || ate ? `?${new URLSearchParams({ ...(de ? { de } : {}), ...(ate ? { ate } : {}) })}` : ""}`, "apuracao.xlsx")}>Exportar Excel</Botao>}
      </div>

      {loja.periodo.diasApurados === 0 ? (
        <Aviso tom="atencao">Nenhum dia apurado: importe o ponto (AFD) do período para ver a apuração.</Aviso>
      ) : (
        <>
          <div className="flex gap-2" role="tablist">
            {[["loja", "Loja × período"], ...(podeVerPessoas ? [["pessoa", "Pessoa × dia"]] : [])].map(([id, r]) => (
              <button key={id} role="tab" aria-selected={aba === id} onClick={() => setAba(id)} className={`px-3 py-1.5 rounded-btn text-sm ${aba === id ? "bg-system-50 text-system-700 font-medium" : "text-ink-700"}`}>{r}</button>
            ))}
          </div>

          {aba === "loja" && (
            <>
              <div className="flex flex-wrap gap-4">
                <Kpi titulo="Aderência ao plano" valor={l.aderenciaPct == null ? "—" : `${l.aderenciaPct}%`} detalhe={`${l.horasCumpridas}h cumpridas de ${l.horasPlanejadas}h planejadas`} tom={l.aderenciaPct != null && l.aderenciaPct < 90 ? "erro" : undefined} />
                <Kpi titulo="Hora extra estimada" valor={`${l.horaExtraH}h`} detalhe="no período" />
                <Kpi titulo="Faltas" valor={l.faltas} detalhe="dias planejados sem batida" tom={l.faltas ? "erro" : undefined} />
                <Kpi titulo="Atrasos" valor={l.atrasos} detalhe={`${l.saidasAntecipadas} saída(s) antecipada(s)`} />
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <Cartao titulo="Hora extra por função e dia da semana">
                  <table className="w-full border-collapse text-sm">
                    <tbody>
                      {Object.entries(l.horaExtraPorFuncao).map(([f, h]) => <tr key={f}><td className={TD}>{f}</td><td className={TD}>{h}h</td></tr>)}
                      {Object.keys(l.horaExtraPorFuncao).length === 0 && <tr><td className={`${TD} text-ink-500`}>Sem hora extra no período.</td></tr>}
                      <tr><td className={`${TD} text-xs text-ink-500`} colSpan={2}>{l.horaExtraPorDiaSemana.filter((d) => d.horas > 0).map((d) => `${d.dia}: ${d.horas}h`).join(" · ") || "—"}</td></tr>
                    </tbody>
                  </table>
                </Cartao>
                <Cartao titulo="Causa provável da hora extra" subtitulo="Sugestão por regra, não um fato">
                  <ul className="list-none m-0 p-0">
                    {Object.entries(CAUSAS).map(([k, r]) => <li key={k} className={`${TD} text-sm flex justify-between gap-3`}><span>{r}</span><strong>{causas[k]}</strong></li>)}
                  </ul>
                </Cartao>
              </div>
              <Cartao titulo="Cobertura realizada × mínimo" subtitulo="Horas em que havia menos gente do que o mínimo, já descontados os intervalos batidos">
                {l.cobertura.descobertas.length === 0 ? (
                  <p className="m-0 px-6 py-5 text-sm text-ink-700">Nenhuma faixa abaixo do mínimo no período.</p>
                ) : (
                  <table className="w-full border-collapse text-sm">
                    <thead><tr>{["Data", "Função", "Faixa"].map((h) => <th key={h} className={TH}>{h}</th>)}</tr></thead>
                    <tbody>
                      {l.cobertura.descobertas.map((d, i) => (
                        <tr key={i}><td className={TD}>{dia(d.data)}</td><td className={TD}>{d.funcao === "Farmacêutico" ? <Ficha tom="erro">Farmacêutico</Ficha> : d.funcao}</td><td className={TD}>{d.de} às {d.ate}</td></tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Cartao>
            </>
          )}

          {aba === "pessoa" && pessoas && (
            <Cartao
              titulo="Apuração por pessoa e dia"
              acoes={<select aria-label="Pessoa" className={entrada} value={sel} onChange={(e) => setSel(e.target.value)}>{pessoas.pessoas.map((p) => <option key={p.matricula} value={p.matricula}>{p.nome}</option>)}</select>}
            >
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm min-w-[820px]">
                  <thead><tr>{["Data", "Planejado", "Batidas", "Realizado", "Hora extra", "Situação", "Ocorrências"].map((h) => <th key={h} className={TH}>{h}</th>)}</tr></thead>
                  <tbody>
                    {pessoa?.dias.map((d) => {
                      const [tom, r] = SITUACAO[d.situacao];
                      return (
                        <tr key={d.data}>
                          <td className={TD}>{dia(d.data)} <span className="text-ink-500">{NOMES[d.diaSemana]}</span></td>
                          <td className={TD}>{d.planejadoH ? `${d.planejadoH}h` : "—"}</td>
                          <td className={TD}>{d.batidas.map(hhmm).join(" · ") || "—"}</td>
                          <td className={TD}>{d.realizadoH == null ? "—" : `${d.realizadoH}h`}</td>
                          <td className={TD}>{d.horaExtraH ? `${d.horaExtraH}h` : "—"}</td>
                          <td className={TD}><Ficha tom={tom}>{r}</Ficha></td>
                          <td className={`${TD} text-xs text-ink-700`}>{d.ocorrencias.map((o) => o.texto).join(" ") || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Cartao>
          )}
        </>
      )}
    </div>
  );
}
