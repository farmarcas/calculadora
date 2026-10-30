import { useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Botao, Cartao, Ficha, TH as TH_BASE, TD as TD_BASE } from "../../components/ui/index.jsx";
import QuadroCentral from "./QuadroCentral.jsx";
import Cenarios from "./Cenarios.jsx";
import QuadroTurnos from "./QuadroTurnos.jsx";
import Comparativo from "./Comparativo.jsx";

const TH = `${TH_BASE} px-6 py-3`;
const TD = `${TD_BASE} px-6 py-3`;
const DIAS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];
const hh = (h) => `${String(h).padStart(2, "0")}h`;
const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
// Datas "AAAA-MM-DD" não têm fuso: formatar sem passar por Date evita mostrar o dia anterior.
const diaIso = (s) => s.split("-").reverse().join("/");

function Verificacao({ regras }) {
  const funcoes = regras[0].funcoes.map((f) => f.funcao);
  return (
    <Cartao titulo="Verificação por regra" subtitulo="Capacidade do quadro · saldo entre parênteses · só o farmacêutico é obrigatório; os demais cargos mostram a meta">
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
                  <div className="text-xs text-ink-500">
                    {regras[0].funcoes[i].obrigatorio
                      ? `Necessidade ${regras[0].funcoes[i].necessidadeH}h · ${regras[0].funcoes[i].necessidadeT} turnos (obrigatório)`
                      : `Meta ${regras[0].funcoes[i].metaH}h · ${regras[0].funcoes[i].origemMeta === "dono" ? "meta do dono" : "nível de hoje"}`}
                  </div>
                </td>
                {regras.map((r) => {
                  const l = r.funcoes[i];
                  const sg = (n) => (n > 0 ? `+${n}` : String(n));
                  return (
                    <td key={r.id} className={TD} title={l.memoria}>
                      <div className={l.okH || !l.obrigatorio ? "text-ink-700" : "text-error-600 font-medium"}>{l.okH ? "✓" : l.obrigatorio ? "✕" : "•"} Horas {l.capacidadeH} ({sg(l.saldoH)})</div>
                      {l.obrigatorio && <div className={l.okT ? "text-ink-700" : "text-error-600 font-medium"}>{l.okT ? "✓" : "✕"} Turnos {l.capacidadeT} ({sg(l.saldoT)})</div>}
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
  const faltas = regra.funcoes.filter((f) => f.gapH > 0 && f.sugestao);
  const dono = faltas.some((l) => l.sugestao.custoMensal !== null && l.sugestao.custoMensal !== undefined);
  const horas = (n) => `${String(n).replace(".", ",")}h`;
  const texto = (s) => {
    const partes = [];
    if (s.inteiras > 0) partes.push(`${s.inteiras} integral${s.inteiras === 1 ? "" : "is"}`);
    if (s.parcialH) partes.push(`1 parcial de ${horas(s.parcialH)}`);
    return partes.join(" + ");
  };
  return (
    <Cartao
      titulo="Déficit e contratações por função"
      subtitulo={`Na regra de ${regra.nome}: quantas horas faltam e a contratação que cobre com menos horas ociosas`}
    >
      {faltas.length === 0 ? (
        <p className="m-0 px-6 py-5 text-sm text-ink-700">Na regra de {regra.nome}, o quadro atual cobre o horário da loja e as metas.</p>
      ) : (
        <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm min-w-[820px]">
          <thead><tr><th className={TH}>Função</th><th className={TH}>Falta cobrir</th><th className={TH}>Contratação sugerida</th><th className={TH}>Horas contratadas · usadas · ociosas</th>{dono && <th className={TH}>Custo mensal</th>}</tr></thead>
          <tbody>
            {faltas.map((l) => (
              <tr key={l.funcao}>
                <td className={TD}>
                  <div className="font-medium">{l.funcao}</div>
                  <Ficha tom={l.obrigatorio ? "erro" : "neutro"}>{l.obrigatorio ? "obrigatória" : l.origemMeta === "dono" ? "meta do dono" : "para manter o nível de hoje"}</Ficha>
                </td>
                <td className={`${TD} ${l.obrigatorio ? "text-error-600" : ""}`}>{horas(l.gapH)} <span className="text-ink-500">de {horas(l.metaH)} · capacidade {horas(l.capacidadeH)}</span></td>
                <td className={TD}>
                  <strong>{texto(l.sugestao)}</strong>
                  {l.alternativa && <div className="text-xs text-ink-500">Alternativa: parcial de {horas(l.alternativa.parcialH)} com até {horas(l.alternativa.extrasH)} de hora extra por semana (menos ociosidade)</div>}
                  {l.sugestao.distribuicao && l.sugestao.distribuicao.blocos.length > 0 && (
                    <div className="mt-1 text-xs text-ink-700">
                      <span className="font-medium">{l.sugestao.distribuicao.estimativa ? "Dias e horários (sugestão de partida)" : "Dias e horários que cobrem o descoberto"}: </span>
                      {l.sugestao.distribuicao.blocos.map((b) => `${DIAS[b.dia]} ${b.de}–${b.ate}`).join(" · ")}
                      {l.sugestao.distribuicao.semLugarH > 0 && <span className="text-ink-500"> · {horas(l.sugestao.distribuicao.semLugarH)} do parcial passam do que está descoberto: ajuste os horários na escala</span>}
                    </div>
                  )}
                  {l.sugestao.avisos.map((av) => <div key={av} className="mt-1 text-xs text-attention-700">{av}</div>)}
                </td>
                <td className={TD}>{horas(l.sugestao.horasContratadas)} · {horas(l.sugestao.horasUsadas)} · {horas(l.sugestao.horasOciosas)} ({String(l.sugestao.ociosidadePct).replace(".", ",")}%)</td>
                {dono && <td className={TD}>{l.sugestao.custoMensal === null ? "—" : brl(l.sugestao.custoMensal)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
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

function Redistribuicao({ regra, colaboradores }) {
  const r = regra.redistribuicao;
  if (!r || r.escala.length === 0) return null;
  const nome = Object.fromEntries((colaboradores ?? []).map((c) => [c.matricula, `${c.nome} · ${c.funcao ?? ""}`]));
  const porPessoa = {};
  for (const t of r.escala) (porPessoa[t.matricula] ??= []).push(t);
  const hora = (h) => `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;
  const total = r.descoberto.reduce((t, d) => t + d.horas, 0);
  return (
    <Cartao
      titulo="Escala redistribuída"
      subtitulo={`Na regra de ${regra.nome}: as pessoas remanejadas dentro da regra (até 5 dias, até 8h por dia, folga no domingo sempre que possível) antes de contratar. Entram o farmacêutico e os cargos com meta do dono`}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm min-w-[640px]">
          <thead><tr><th className={TH}>Pessoa</th><th className={TH}>Dias e horários</th><th className={TH}>Folga no domingo</th></tr></thead>
          <tbody>
            {Object.entries(porPessoa).map(([m, ts]) => (
              <tr key={m}>
                <td className={TD}>{nome[m] ?? m}</td>
                <td className={TD}>{ts.sort((a, b) => a.dia - b.dia).map((t) => `${DIAS[t.dia]} ${hora(t.de)}–${hora(t.ate)}`).join(" · ")}</td>
                <td className={TD}>{ts.some((t) => t.dia === 6) ? "não" : "sim"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="m-0 px-6 py-3 text-sm border-t border-line">
        {total > 0
          ? `Mesmo redistribuído, ficam ${String(total).replace(".", ",")}h descobertas por semana: ${r.descoberto.flatMap((d) => d.faixas.map((f) => `${DIAS[f.dia]} ${f.de}–${f.ate}`)).join(" · ")}.`
          : "Redistribuído, o quadro cobre todo o horário."}
      </p>
      {r.avisos.map((a) => <p key={a} className="m-0 px-6 py-2 text-xs text-attention-700 border-t border-line">{a}</p>)}
    </Cartao>
  );
}

function Cobertura({ cob }) {
  if (!cob.horas.length) return null;
  return (
    <Cartao titulo="Cobertura da escala atual" subtitulo="Pessoas presentes no pior dia de cada hora, já descontado o intervalo · mínimos em Cadastros › Lojas › Editar › Funcionários e configuração">
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
  // Só o dono recebe o valor em reais; os demais veem a participação de cada hora no total.
  const valorDe = (h) => h.vendaMedia ?? h.participacao;
  const max = Math.max(...vendas.horas.map(valorDe)) || 1;
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
              <div className={`h-4 rounded ${topo.has(h.hora) ? "bg-system-500" : "bg-system-200"}`} style={{ width: `${(valorDe(h) / max) * 100}%` }} />
            </div>
            <span className="w-24 text-right text-ink-700">{h.vendaMedia != null ? brl(h.vendaMedia) : `${String(Math.round(h.participacao * 1000) / 10).replace(".", ",")}% do dia`}</span>
          </div>
        ))}
      </div>
    </Cartao>
  );
}

export default function Diagnostico({ diag, podeEscrever, onEnviar, onSimular, onRecarregar, onDefinirFuncao }) {
  const [regraId, setRegraId] = useState("r42");

  if (diag.status === "pendente")
    return (
      <div className="flex flex-col gap-6">
      <Cartao>
        <div className="p-10 text-center">
          <p className="m-0 text-base font-medium">{diag.mensagem}</p>
          <p className="mt-2 mb-4 text-sm text-ink-500">Sem a escala atual não há quadro por função, capacidade de horas e turnos nem cobertura por faixa.</p>
          {podeEscrever && <Botao onClick={onEnviar}>Enviar planilhas</Botao>}
        </div>
      </Cartao>
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      <QuadroCentral diag={diag} regraId={regraId} onRegra={setRegraId} podeEscrever={podeEscrever} onEnviar={onEnviar} onRecarregar={onRecarregar} onDefinirFuncao={onDefinirFuncao} />

      {/* Logo depois do diagnóstico: os caminhos lado a lado e, abaixo, o detalhe de cada cenário. */}
      {regraId === "atual" ? (
        <Aviso tom="neutro">Os cenários de economia e equilíbrio valem para as regras que vêm aí (42h e 40h). Escolha uma delas acima para vê-los. Aqui você vê como a loja está hoje, na regra de 44h.</Aviso>
      ) : (
        <>
          <Comparativo comparativo={diag.cenarios?.[regraId]?.comparativo} cenarios={diag.cenarios?.[regraId]} lojaId={diag.loja.id} podeEscrever={podeEscrever} onSimular={onSimular} />
          <Cenarios cenarios={diag.cenarios?.[regraId]} origemVendas={diag.origemVendas} etapas={diag.etapas} />
        </>
      )}

      <QuadroTurnos quadro={diag.quadroTurnos} />

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
      <Redistribuicao regra={diag.regras.find((r) => r.id === regraId)} colaboradores={diag.colaboradores} />
      <div id="contratacoes" className="scroll-mt-4">
        <Contratacoes regras={diag.regras.map((r) => ({ ...r, lojaId: diag.loja.id }))} regraId={regraId} podeEscrever={podeEscrever} onSimular={onSimular} />
      </div>
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
