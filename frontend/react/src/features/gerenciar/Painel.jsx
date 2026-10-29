import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Botao, Cartao, Ficha, entrada } from "../../components/ui/index.jsx";
import RotuloGerencial from "./RotuloGerencial.jsx";

const dia = (iso) => iso.split("-").reverse().join("/");

function Limites({ lojaId, limites, podeEditar, onSalvo }) {
  const [v, setV] = useState(limites);
  const [erro, setErro] = useState(null);
  const [ok, setOk] = useState(false);
  const salvar = async () => {
    setErro(null);
    setOk(false);
    try {
      await api(`/lojas/${lojaId}/gerenciar/limites`, { method: "PUT", body: { horaExtraPct: Number(v.horaExtraPct), semanasSeguidas: Number(v.semanasSeguidas), aderenciaMinPct: Number(v.aderenciaMinPct) } });
      setOk(true);
      onSalvo();
    } catch (e) {
      setErro(e.message);
    }
  };
  const campo = (k, rotulo, min, max) => (
    <label className="flex flex-col gap-1 text-xs font-medium text-ink-500">
      {rotulo}
      <input type="number" min={min} max={max} className={entrada} value={v[k]} disabled={!podeEditar} onChange={(e) => setV({ ...v, [k]: e.target.value })} />
    </label>
  );
  return (
    <Cartao titulo="Limites de alerta" subtitulo="Quando passam, a simulação em uso é marcada como desatualizada. Valores iniciais, a ajustar com as lojas piloto.">
      <div className="px-6 py-4 flex flex-col gap-4">
        {erro && <Aviso>{erro}</Aviso>}
        {ok && <Aviso tom="ok">Limites salvos.</Aviso>}
        <div className="grid gap-4 md:grid-cols-3">
          {campo("horaExtraPct", "Hora extra acima de (% do planejado)", 0, 100)}
          {campo("semanasSeguidas", "por quantas semanas seguidas", 1, 8)}
          {campo("aderenciaMinPct", "Aderência mínima na última semana (%)", 0, 100)}
        </div>
        {podeEditar ? <div><Botao onClick={salvar}>Salvar limites</Botao></div> : <p className="m-0 text-xs text-ink-500">Só o dono do grupo altera os limites.</p>}
      </div>
    </Cartao>
  );
}

export default function Painel({ lojaId, perfil, onIr, onAbrirSimulacao }) {
  const [p, setP] = useState(null);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      setP(await api(`/lojas/${lojaId}/gerenciar/painel`));
    } catch (e) {
      setErro(e.message);
    }
  }, [lojaId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const clonar = async () => {
    try {
      const s = await api(`/simulacoes/${p.simulacao.id}/clonar`, { method: "POST" });
      onAbrirSimulacao?.(s.id);
    } catch (e) {
      setErro(e.message);
    }
  };

  if (erro) return <Aviso>{erro}</Aviso>;
  if (!p) return <p className="text-sm text-ink-500">Carregando…</p>;
  if (p.semSimulacaoEmUso) return <Aviso tom="atencao">{p.mensagem}</Aviso>;

  const maxHe = Math.max(1, ...p.tendencia.map((s) => s.horaExtraH));
  return (
    <div className="flex flex-col gap-6">
      <RotuloGerencial />

      {p.alertas.length > 0 && (
        <Cartao titulo="Alertas">
          <ul className="list-none m-0 p-0">
            {p.alertas.map((a, i) => <li key={i} className="px-6 py-3 border-t border-line first:border-0"><Aviso tom="atencao">{a.texto}</Aviso></li>)}
          </ul>
          <div className="px-6 py-3 border-t border-line flex flex-wrap items-center gap-3">
            <span className="text-sm text-ink-700">A simulação em uso está desatualizada. Nada foi alterado automaticamente.</span>
            {perfil !== "SCHEDULE_VIEWER" && <Botao tipo="secundario" onClick={clonar}>Clonar e resimular</Botao>}
          </div>
        </Cartao>
      )}

      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-52 border border-line rounded-card bg-white p-4">
          <div className="text-xs text-ink-500">Simulação em uso</div>
          <div className="font-medium mt-1">{p.simulacao.nome}</div>
          <div className="text-xs text-ink-500 mt-1">{p.simulacao.vigenciaInicio ? `desde ${dia(p.simulacao.vigenciaInicio)}` : ""}</div>
        </div>
        <div className="flex-1 min-w-52 border border-line rounded-card bg-white p-4">
          <div className="text-xs text-ink-500">Última importação de ponto</div>
          {p.ultimaImportacao ? (
            <>
              <div className="font-medium mt-1">{p.ultimaImportacao.arquivo}</div>
              <div className="text-xs text-ink-500 mt-1">{new Date(p.ultimaImportacao.enviadaEm).toLocaleString("pt-BR")}</div>
            </>
          ) : (
            <div className="mt-1 text-sm text-ink-700">Nenhuma ainda. <button className="text-system-700 font-medium" onClick={() => onIr?.("importar")}>Importar o ponto</button></div>
          )}
        </div>
        <div className="flex-1 min-w-40 border border-line rounded-card bg-white p-4">
          <div className="text-xs text-ink-500">Pendências abertas</div>
          <div className={`text-2xl font-bold mt-1 ${p.pendenciasAbertas ? "text-error-600" : ""}`}>{p.pendenciasAbertas}</div>
          {perfil !== "SCHEDULE_VIEWER" && p.pendenciasAbertas > 0 && <button className="text-xs text-system-700 font-medium" onClick={() => onIr?.("pendencias")}>Tratar agora</button>}
        </div>
        <div className="flex-1 min-w-40 border border-line rounded-card bg-white p-4">
          <div className="text-xs text-ink-500">Aderência · hora extra</div>
          <div className="text-2xl font-bold mt-1">{p.aderenciaPct == null ? "—" : `${p.aderenciaPct}%`}</div>
          <div className="text-xs text-ink-500 mt-1">{p.horaExtraH}h extras · {p.faltas} falta(s)</div>
        </div>
      </div>

      {p.periodo.diasApurados === 0 ? (
        <Aviso tom="atencao">Sem ponto importado: a loja só tem planejamento. Importe o AFD para acompanhar o planejado × realizado.</Aviso>
      ) : (
        <Cartao titulo="Tendência das últimas semanas" subtitulo="Aderência ao plano e hora extra estimada, semana a semana (segunda a domingo)">
          <table className="w-full border-collapse text-sm">
            <thead><tr>{["Semana", "Aderência", "Hora extra", "Faltas"].map((h) => <th key={h} className="text-left text-[11px] font-bold uppercase tracking-wide text-ink-500 px-6 py-3">{h}</th>)}</tr></thead>
            <tbody>
              {p.tendencia.map((s) => (
                <tr key={s.inicio} className="border-t border-line">
                  <td className="px-6 py-3">{dia(s.inicio)} a {dia(s.fim)}</td>
                  <td className="px-6 py-3"><Ficha tom={s.aderenciaPct != null && s.aderenciaPct < p.limites.aderenciaMinPct ? "erro" : "ok"}>{s.aderenciaPct == null ? "—" : `${s.aderenciaPct}%`}</Ficha></td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2"><div className="h-3 bg-system-500 rounded" style={{ width: `${(s.horaExtraH / maxHe) * 120}px`, minWidth: s.horaExtraH ? 4 : 0 }} /> {s.horaExtraH}h</div>
                  </td>
                  <td className="px-6 py-3">{s.faltas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Cartao>
      )}

      <Limites key={JSON.stringify(p.limites)} lojaId={lojaId} limites={p.limites} podeEditar={perfil === "TENANT_ADMIN"} onSalvo={carregar} />
    </div>
  );
}
