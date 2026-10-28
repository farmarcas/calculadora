import { useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Botao, Cartao, Ficha } from "../../components/ui/index.jsx";
import QuadroCentral from "./QuadroCentral.jsx";
import Cenarios from "./Cenarios.jsx";

const TH = "text-left text-[11px] font-bold uppercase tracking-wide text-ink-500 px-6 py-3";
const TD = "px-6 py-3 border-t border-line";
const hh = (h) => `${String(h).padStart(2, "0")}h`;
const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
// Datas "AAAA-MM-DD" não têm fuso: formatar sem passar por Date evita mostrar o dia anterior.
const diaIso = (s) => s.split("-").reverse().join("/");

function Verificacao({ regras }) {
  const funcoes = regras[0].funcoes.map((f) => f.funcao);
  return (
    <Cartao titulo="Verificação por regra" subtitulo="Capacidade do quadro · saldo entre parênteses · horas e turnos precisam passar">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm min-w-[720px]">
          <thead>
            <tr>
              <th className={TH}>Função · necessidade semanal</th>
              {regras.map((r) => (
                <th key={r.id} className="px-6 py-3 text-left align-top">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wide">{r.nome}</span>
                    <Ficha tom={r.passa ? "ok" : "erro"}>{r.passa ? "Passa" : "Falta"}</Ficha>
                  </div>
                  <div className="mt-1 text-[11px] font-normal text-ink-500">{r.descricao}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {funcoes.map((f, i) => (
              <tr key={f}>
                <td className={TD}>
                  <div className="font-medium">{f}</div>
                  <div className="text-xs text-ink-500">Necessidade {regras[0].funcoes[i].necessidadeH}h · {regras[0].funcoes[i].necessidadeT} turnos</div>
                </td>
                {regras.map((r) => {
                  const l = r.funcoes[i];
                  const sg = (n) => (n > 0 ? `+${n}` : String(n));
                  return (
                    <td key={r.id} className={TD} title={l.memoria}>
                      <div className={l.okH ? "text-ink-700" : "text-error-600 font-medium"}>{l.okH ? "✓" : "✕"} Horas {l.capacidadeH} ({sg(l.saldoH)})</div>
                      <div className={l.okT ? "text-ink-700" : "text-error-600 font-medium"}>{l.okT ? "✓" : "✕"} Turnos {l.capacidadeT} ({sg(l.saldoT)})</div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Cartao>
  );
}

function Contratacoes({ regras, regraId: id, podeEscrever, onSimular }) {
  const [erro, setErro] = useState(null);
  const simular = async () => {
    setErro(null);
    try {
      const s = await api(`/lojas/${regras[0].lojaId}/simulacoes`, { method: "POST", body: { nome: `Contratar para ${regra.nome}`, regra: id, origem: "escala_atual", comVagasSugeridas: true } });
      onSimular(s.id);
    } catch (e) {
      setErro(e.message);
    }
  };
  const regra = regras.find((r) => r.id === id);
  const faltas = regra.funcoes.filter((f) => f.falta);
  return (
    <Cartao
      titulo="Déficit e contratações por função"
      subtitulo={`Na regra de ${regra.nome}: o quanto falta para passar e quantas pessoas isso representa`}
    >
      {faltas.length === 0 ? (
        <p className="m-0 px-6 py-5 text-sm text-ink-700">Na regra de {regra.nome}, o quadro atual cobre o horário da loja.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead><tr><th className={TH}>Função</th><th className={TH}>Saldo de horas</th><th className={TH}>Saldo de turnos</th><th className={TH}>Contratações</th></tr></thead>
          <tbody>
            {faltas.map((l) => (
              <tr key={l.funcao}>
                <td className={TD}>{l.funcao}</td>
                <td className={`${TD} text-error-600`}>{l.saldoH}h</td>
                <td className={`${TD} text-error-600`}>{l.saldoT}</td>
                <td className={TD}>
                  <strong>{l.contratar}</strong> {l.contratar === 1 ? "pessoa" : "pessoas"}
                  {l.parcialH && <span className="text-ink-500"> · ou 1 parcial de {l.parcialH}h</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {faltas.length > 0 && podeEscrever && (
        <div className="px-6 py-3 border-t border-line flex flex-wrap items-center gap-3">
          <Botao tipo="secundario" onClick={simular}>Simular esta contratação</Botao>
          {erro && <Aviso>{erro}</Aviso>}
        </div>
      )}
      <p className="m-0 px-6 py-3 text-xs text-ink-500 border-t border-line">Contratação simulada não cria funcionário. Valores das regras ainda sem validação jurídica.</p>
    </Cartao>
  );
}

function Cobertura({ cob }) {
  if (!cob.horas.length) return null;
  return (
    <Cartao titulo="Cobertura da escala atual" subtitulo="Pessoas presentes no pior dia de cada hora, já descontado o intervalo · mínimos da Configuração">
      <div className="overflow-x-auto px-6 py-4">
        <table className="border-collapse text-xs min-w-[720px] w-full">
          <thead>
            <tr>
              <th className="text-left font-bold uppercase text-[11px] text-ink-500 pr-3">Função</th>
              {cob.horas.map((h) => <th key={h} className="font-normal text-ink-500 px-1">{hh(h)}</th>)}
            </tr>
          </thead>
          <tbody>
            {cob.funcoes.map((f) => (
              <tr key={f.funcao}>
                <td className="py-1 pr-3 whitespace-nowrap">{f.funcao} <span className="text-ink-500">(mín. {f.minimo})</span></td>
                {f.porHora.map((c) => (
                  <td key={c.hora} className="p-0.5">
                    <div
                      title={c.pessoas === null ? "Fechado" : `${c.pessoas} pessoa(s)`}
                      className={`h-7 rounded flex items-center justify-center font-medium ${
                        c.ok === null ? "bg-surface-subtle text-ink-300" : c.ok ? "bg-success-50 text-success-600" : "bg-error-50 text-error-600"
                      }`}
                    >
                      {c.pessoas ?? "–"}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Cartao>
  );
}

function Vendas({ vendas }) {
  if (!vendas) return null;
  const max = Math.max(...vendas.horas.map((h) => h.vendaMedia)) || 1;
  const topo = new Set(vendas.top.map((t) => t.hora));
  return (
    <Cartao
      titulo="Horários de maior venda"
      subtitulo={`Média por dia · ${diaIso(vendas.periodo.inicio)} a ${diaIso(vendas.periodo.fim)} (${vendas.periodo.dias} dias com venda)`}
    >
      <div className="px-6 py-4 flex flex-col gap-1">
        {vendas.horas.map((h) => (
          <div key={h.hora} className="flex items-center gap-3 text-xs">
            <span className="w-8 text-ink-500">{hh(h.hora)}</span>
            <div className="flex-1 h-4 bg-surface-subtle rounded">
              <div className={`h-4 rounded ${topo.has(h.hora) ? "bg-system-500" : "bg-system-200"}`} style={{ width: `${(h.vendaMedia / max) * 100}%` }} />
            </div>
            <span className="w-24 text-right text-ink-700">{brl(h.vendaMedia)}</span>
          </div>
        ))}
      </div>
    </Cartao>
  );
}

export default function Diagnostico({ diag, podeEscrever, onEnviar, onSimular }) {
  const [regraId, setRegraId] = useState("r40");

  if (diag.status === "pendente")
    return (
      <Cartao>
        <div className="p-10 text-center">
          <p className="m-0 text-base font-medium">{diag.mensagem}</p>
          <p className="mt-2 mb-4 text-sm text-ink-500">Sem a escala atual não há quadro por função, capacidade de horas e turnos nem cobertura por faixa.</p>
          {podeEscrever && <Botao onClick={onEnviar}>Enviar planilhas</Botao>}
        </div>
      </Cartao>
    );

  return (
    <div className="flex flex-col gap-6">
      <QuadroCentral diag={diag} regraId={regraId} onRegra={setRegraId} podeEscrever={podeEscrever} onEnviar={onEnviar} />

      <Cenarios cenarios={diag.cenarios?.[regraId]} origemVendas={diag.origemVendas} />

      <Cartao titulo="Quadro por função" subtitulo="Só entram no cálculo colaboradores com função de escala">
        <table className="w-full border-collapse text-sm">
          <thead><tr><th className={TH}>Função</th><th className={TH}>Pessoas</th><th className={TH}>Horas contratadas por semana</th></tr></thead>
          <tbody>
            {diag.quadro.map((q) => (
              <tr key={q.funcao}><td className={TD}>{q.funcao}</td><td className={TD}>{q.pessoas}</td><td className={TD}>{q.cargaTotalH}h</td></tr>
            ))}
          </tbody>
        </table>
      </Cartao>

      <Verificacao regras={diag.regras} />
      <Contratacoes regras={diag.regras.map((r) => ({ ...r, lojaId: diag.loja.id }))} regraId={regraId} podeEscrever={podeEscrever} onSimular={onSimular} />
      <Cobertura cob={diag.cobertura} />
      <Vendas vendas={diag.vendas} />

      <Cartao titulo="Escala atual por colaborador" subtitulo={`${diag.loja.codigo} · ${diag.loja.nome} · uma linha por pessoa`}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm min-w-[720px]">
            <thead><tr><th className={TH}>Colaborador</th><th className={TH}>Função</th><th className={TH}>Dias</th><th className={TH}>Turno</th><th className={TH}>Intervalo</th><th className={TH}>Carga</th><th className={TH}>Situação</th></tr></thead>
            <tbody>
              {diag.colaboradores.map((c) => (
                <tr key={c.matricula}>
                  <td className={TD}>{c.nome}<div className="text-xs text-ink-500">{c.matricula}</div></td>
                  <td className={TD}>{c.funcao ?? "—"}</td>
                  <td className={TD}>{c.dias}</td>
                  <td className={TD}>{c.turno}</td>
                  <td className={TD}>{c.intervalo}</td>
                  <td className={TD}>{c.cargaH}h</td>
                  <td className={TD}>{c.status === "ok" ? <Ficha tom="ok">Pronto</Ficha> : <Ficha tom="atencao">Fora do cálculo</Ficha>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Cartao>
    </div>
  );
}
