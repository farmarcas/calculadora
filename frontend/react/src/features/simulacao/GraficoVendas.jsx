import { useState } from "react";
import { Aviso, Segmentado } from "../../components/ui/index.jsx";
import { NOMES_DIA } from "./formato.js";
import { apoioDoGrafico, estadosDoDia, horasDoGrafico, legenda, resumoDoDia, rotuloDaBarra } from "./grafico-regras.js";

const NOMES_LONGOS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];
const LISTRADO = "repeating-linear-gradient(135deg, var(--surface-muted) 0 4px, var(--surface-card) 4px 8px)";
const VERDE_CLARO = "color-mix(in srgb, var(--func-success-100) 40%, white)";
const FUNDO = {
  aberta: { background: "var(--system-100)" },
  pico: { background: "var(--system-500)" },
  fechada: { background: LISTRADO, border: "1px solid var(--border-subtle)" },
  nova: { background: VERDE_CLARO, border: "1px dashed var(--text-success-strong)" },
};
const COR_RESUMO = { perigo: "var(--text-danger)", sucesso: "var(--text-success-strong)", neutro: "var(--text-strong)" };

// Venda (R$, só o dono) ou clientes por hora do dia escolhido. As barras crescem até a altura da coluna: o gráfico preenche o
// espaço ao lado da lista de horários, sem sobra embaixo.
export default function GraficoVendas({ resultado: r, dia, onDia }) {
  const [metrica, setMetrica] = useState("venda");
  const v = r.vendaPorHora;
  const metricas = [...(v.venda ? [["venda", "Venda (R$)"]] : []), ...(v.clientes ? [["clientes", "Clientes"]] : [])];

  if (!r.temBase || metricas.length === 0)
    return (
      <div>
        <Aviso tom="neutro">{!r.temBase ? "Esta loja ainda não tem base comercial por hora. Envie a base em Enviar planilhas para ver a venda por hora e o que sai ao cortar horários." : "Sem número de clientes na base. A venda em reais só aparece para o dono do grupo."}</Aviso>
      </div>
    );

  const usada = metricas.some(([m]) => m === metrica) ? metrica : metricas[0][0];
  const matriz = usada === "venda" ? v.venda : v.clientes;
  const serie = matriz[dia];
  const horas = horasDoGrafico(r.horario.cadastro, r.horario.dias, matriz);
  const estados = estadosDoDia({ dia, horas, resultado: r, serie });
  const estimada = usada === "venda" ? v.estimada?.[dia] ?? null : null;
  const valorDe = (h, e) => (e === "nova" ? estimada?.[h] ?? 0 : serie[h] ?? 0);
  const max = Math.max(...horas.map((h, i) => valorDe(h, estados[i])), 0);
  const resumo = resumoDoDia({ dia, resultado: r });
  const itens = legenda({ temNova: resumo.temNova });
  const pico = horas[estados.indexOf("pico")];

  return (
    <div className="flex min-h-[360px] min-w-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Dia da semana" className="inline-flex overflow-hidden rounded-btn border border-[var(--border-default)] bg-[var(--surface-card)]">
          {NOMES_DIA.map((n, i) => (
            <button key={n} type="button" role="tab" aria-selected={i === dia} onClick={() => onDia(i)} className={`h-10 min-w-10 cursor-pointer border-0 px-3 text-sm focus-visible:outline-2 focus-visible:outline-[var(--border-focus)] ${i === dia ? "bg-[var(--neutral-dark-900)] font-bold text-white" : "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]"}`}>{n}</button>
          ))}
        </div>
        {metricas.length > 1 && <Segmentado rotulo="Métrica" opcoes={metricas} valor={usada} onChange={setMetrica} />}
      </div>
      <p className="m-0 mt-3 text-xs text-[var(--text-secondary)]">
        {apoioDoGrafico({ temNova: resumo.temNova, metrica: usada })}
        {usada === "venda" && v.ticketMedio ? ` · ticket médio R$ ${v.ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}
      </p>

      <div role="img" aria-label={`${usada === "venda" ? "Venda" : "Clientes"} por hora, ${NOMES_LONGOS[dia]}.${pico !== undefined ? ` Maior valor às ${pico}h.` : ""}`} className="mt-4 flex min-h-[220px] flex-1 items-stretch gap-1.5">
        {horas.map((h, i) => {
          const e = estados[i];
          const valor = valorDe(h, e);
          const frac = max > 0 ? valor / max : 0;
          const nova = e === "nova";
          return (
            <div key={h} className="flex min-w-0 flex-1 flex-col justify-end" title={`${h}h · ${nova ? "hora nova, venda estimada" : e === "fechada" ? "fechada na simulação" : e === "pico" ? "pico" : "aberta"}`}>
              <div className="flex flex-col" style={{ height: `calc((100% - 40px) * ${frac} + 40px)`, minHeight: 44 }}>
                <span aria-hidden="true" className={`flex h-9 shrink-0 flex-col items-center justify-end text-[11px] leading-3 whitespace-nowrap ${nova ? "font-bold text-[var(--text-success-strong)]" : e === "pico" ? "font-bold text-[var(--text-strong)]" : "text-[var(--text-secondary)]"}`}>
                  {nova && usada !== "venda" ? "" : <Rotulo texto={rotuloDaBarra(valor, { metrica: usada, nova })} />}
                </span>
                <div className="mt-1 min-h-1 flex-1 rounded-t-[3px]" style={FUNDO[e]} />
              </div>
            </div>
          );
        })}
      </div>
      <div aria-hidden="true" className="mt-1 flex gap-1.5">
        {horas.map((h, i) => <span key={h} className={`min-w-0 flex-1 text-center text-xs ${estados[i] === "nova" ? "font-bold text-[var(--text-success-strong)]" : estados[i] === "pico" ? "font-bold text-[var(--text-strong)]" : "text-[var(--text-secondary)]"}`}>{String(h).padStart(2, "0")}h</span>)}
      </div>

      <ul className="m-0 mt-4 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-[var(--text-secondary)]">
        {itens.map(([tipo, t]) => (
          <li key={tipo} className="flex items-center gap-1.5"><span aria-hidden="true" className="inline-block h-3 w-3 rounded-[2px]" style={FUNDO[tipo]} />{t}</li>
        ))}
      </ul>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Resumo titulo={`Horas abertas, ${NOMES_LONGOS[dia]}`} valor={`${String(resumo.horasAbertas.valor).replace(".", ",")}h`} apoio={resumo.horasAbertas.apoio} />
        {resumo.temNova
          ? resumo.vendaEstimadaNasHorasNovas && <Resumo titulo="Venda estimada nas horas novas" valor={resumo.vendaEstimadaNasHorasNovas.texto} apoio={resumo.vendaEstimadaNasHorasNovas.apoio} cor={COR_RESUMO.sucesso} />
          : (
            <>
              {resumo.vendaEstimadaNoDia && <Resumo titulo="Venda estimada no dia" valor={resumo.vendaEstimadaNoDia.texto} />}
              {resumo.vendaQueDeixaDeEntrar && <Resumo titulo="Venda que deixa de entrar no dia" valor={resumo.vendaQueDeixaDeEntrar.texto} apoio={resumo.vendaQueDeixaDeEntrar.apoio} cor={COR_RESUMO[resumo.vendaQueDeixaDeEntrar.tom]} />}
            </>
          )}
      </div>
    </div>
  );
}

// Rótulo com a máscara de reais em até três linhas ("R$", o número e "mil"), para caber na largura da barra mesmo com o gráfico estreito.
const Rotulo = ({ texto }) => {
  const m = /^(\+?)R\$ (.+?)( mil)?$/.exec(texto);
  if (!m) return <span>{texto}</span>;
  return (
    <>
      <span className="text-[9px] leading-[10px]">{m[1]}R$</span>
      <span>{m[2]}</span>
      {m[3] && <span className="text-[9px] leading-[10px]">mil</span>}
    </>
  );
};

const Resumo = ({ titulo, valor, apoio, cor = "var(--text-strong)" }) => (
  <div className="flex flex-col gap-0.5 rounded-card bg-[var(--surface-subtle)] px-4 py-3">
    <span className="text-xs leading-4 text-[var(--text-secondary)]">{titulo}</span>
    <span className="text-xl leading-7 font-bold" style={{ color: cor }}>{valor}</span>
    {apoio && <span className="text-xs leading-4 text-[var(--text-secondary)]">{apoio}</span>}
  </div>
);
