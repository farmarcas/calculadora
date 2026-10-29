import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Cartao, Ficha } from "../../components/ui/index.jsx";

const TH = "text-left text-[11px] font-bold uppercase tracking-wide text-ink-500 px-6 py-3";
const TD = "px-6 py-3 border-t border-line";
const STATUS = { processado: ["ok", "Processado"], com_pendencias: ["atencao", "Com pendências"], rejeitado: ["erro", "Rejeitado"] };
const dia = (iso) => iso.split("-").reverse().join("/");

export default function Importar({ lojaId, onMudou }) {
  const [log, setLog] = useState({ data: [], meta: { total: 0 } });
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setLog(await api(`/lojas/${lojaId}/ponto/importacoes`));
    } catch (e) {
      setErro(e.message);
    }
  }, [lojaId]);

  useEffect(() => {
    setResultado(null);
    setErro(null);
    carregar();
  }, [carregar]);

  const enviar = async (e) => {
    const arquivos = [...(e.target.files ?? [])];
    if (arquivos.length === 0) return;
    setErro(null);
    setResultado(null);
    setOcupado(true);
    try {
      const form = new FormData();
      arquivos.forEach((a) => form.append("arquivos", a));
      setResultado((await api(`/lojas/${lojaId}/ponto/importacoes`, { method: "POST", form })).arquivos);
      carregar();
      onMudou?.();
    } catch (err) {
      setErro(err.message);
    } finally {
      setOcupado(false);
      e.target.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Cartao titulo="Importar ponto (AFD)" subtitulo="Arquivo gerado pelo sistema de registro de ponto (Portaria 671/2021). Pode enviar vários de uma vez; reenviar o mesmo arquivo não duplica nada.">
        <div className="px-6 py-4 flex flex-col gap-3">
          <input type="file" multiple onChange={enviar} disabled={ocupado} aria-label="Arquivos AFD" />
          {ocupado && <p className="m-0 text-sm text-ink-500">Lendo os arquivos…</p>}
          {erro && <Aviso>{erro}</Aviso>}
          {resultado && (
            <ul className="list-none m-0 p-0 flex flex-col gap-2">
              {resultado.map((r, i) => {
                const [tom, rotulo] = STATUS[r.status];
                return (
                  <li key={i} className="border border-line rounded-input px-4 py-3 text-sm flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2"><strong>{r.arquivo}</strong><Ficha tom={tom}>{rotulo}</Ficha></div>
                    {r.status === "rejeitado" ? (
                      <span className="text-error-600">{r.motivoRejeicao}</span>
                    ) : (
                      <span>
                        {r.periodo && `${dia(r.periodo.inicio)} a ${dia(r.periodo.fim)} · `}
                        {r.aceitas} aceitas · {r.repetidas} repetidas (ignoradas) · {r.pendentes} pendentes
                        {r.semNovidades && " · sem novidades"}
                      </span>
                    )}
                    {r.avisos.map((a, k) => <span key={k} className="text-xs text-attention-700">{a}</span>)}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Cartao>

      <Cartao titulo="Histórico de importações" subtitulo="Nome, período, quantidade de batidas, autor e data de cada arquivo">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm min-w-[720px]">
            <thead><tr>{["Arquivo", "Período", "Aceitas", "Repetidas", "Pendentes", "Situação", "Autor", "Enviado em"].map((h) => <th key={h} className={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {log.data.map((i) => {
                const [tom, rotulo] = STATUS[i.status];
                return (
                  <tr key={i.id}>
                    <td className={TD}>{i.arquivo}</td>
                    <td className={TD}>{i.periodo ? `${dia(i.periodo.inicio)} a ${dia(i.periodo.fim)}` : "—"}</td>
                    <td className={TD}>{i.aceitas}</td>
                    <td className={TD}>{i.repetidas}</td>
                    <td className={TD}>{i.pendentes}</td>
                    <td className={TD} title={i.motivoRejeicao ?? ""}><Ficha tom={tom}>{rotulo}</Ficha></td>
                    <td className={TD}>{i.autor === "TENANT_ADMIN" ? "Dono do grupo" : "Gestor de escala"}</td>
                    <td className={TD}>{new Date(i.criadoEm).toLocaleString("pt-BR")}</td>
                  </tr>
                );
              })}
              {log.data.length === 0 && <tr><td className={`${TD} text-ink-500`} colSpan={8}>Nenhum arquivo enviado ainda.</td></tr>}
            </tbody>
          </table>
        </div>
      </Cartao>
    </div>
  );
}
