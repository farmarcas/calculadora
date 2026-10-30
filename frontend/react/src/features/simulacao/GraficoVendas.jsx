import { useState } from "react";
import { Aviso, Segmentado } from "../../components/ui/index.jsx";
import { NOMES_DIA, reais } from "./formato.js";

const ALTURA = 150;

// Valor acima de cada barra, curto: "15,5" com "mil" embaixo (ou o número inteiro abaixo de mil).
function Rotulo({ valor, usada, destaque, apagado }) {
  const mil = usada === "venda" && valor >= 1000;
  const numero = mil ? (valor / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : Math.round(valor).toLocaleString("pt-BR");
  return (
    <span aria-hidden="true" className={`flex h-7 flex-col items-center justify-end whitespace-nowrap leading-3 ${apagado ? "text-[var(--text-disabled)]" : destaque ? "font-bold text-[var(--text-strong)]" : "text-[var(--text-secondary)]"}`}>
      <span className="text-[11px]">{numero}</span>
      {mil && <span className="text-[10px]">mil</span>}
    </span>
  );
}

// Venda (R$, só o dono) ou clientes por hora do dia escolhido. A altura é fixa: trocar de dia não faz a tela pular.
export default function GraficoVendas({ resultado: r, dia, onDia, modo }) {
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
  const serie = usada === "venda" ? v.venda[dia] : v.clientes[dia];
  const cad = r.horario.cadastro;
  // Horas mostradas: da primeira abertura à última hora de fechamento do Cadastro (padrão 07h–21h).
  const abertos = cad.filter((c) => c.aberta);
  const de = abertos.length ? Math.min(...abertos.map((c) => Number(c.abre.slice(0, 2)))) : 7;
  const ate = abertos.length ? Math.max(...abertos.map((c) => Math.ceil(Number(c.fecha.slice(0, 2)) + Number(c.fecha.slice(3)) / 60))) : 22;
  const horas = Array.from({ length: Math.max(1, ate - de) }, (_, k) => de + k);
  const max = Math.max(...horas.map((h) => serie[h]), 0);
  const pico = (h) => max > 0 && serie[h] >= max * 0.85;
  const maior = horas.find((h) => serie[h] === max);
  const valor = (n) => (usada === "venda" ? reais(n) : `${Math.round(n)} clientes`);
  const fechadasNoDia = horas.filter((h) => v.fechadas[dia][h]).length;
  const alterado = r.horario.dias[dia]?.alterado;

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmentado rotulo="Dia da semana" opcoes={NOMES_DIA.map((n, i) => [i, n, r.horario.cadastro[i].aberta ? undefined : { desabilitado: true, dica: `${n}: loja fechada` }])} valor={dia} onChange={onDia} />
        {metricas.length > 1 && <Segmentado rotulo="Métrica" opcoes={metricas} valor={usada} onChange={setMetrica} />}
      </div>
      <p className="m-0 mt-3 text-xs text-[var(--text-secondary)]">
        {usada === "venda" ? "Venda por hora" : "Clientes por hora"}
        {usada === "venda" && v.ticketMedio ? ` · ticket médio R$ ${v.ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""} · dados do sistema de vendas
      </p>

      <div role="img" aria-label={`${usada === "venda" ? "Venda" : "Clientes"} por hora, ${NOMES_DIA[dia]}. Maior valor às ${maior}h.`} className="mt-4 flex items-end gap-1.5" style={{ height: ALTURA + 28 }}>
        {horas.map((h) => {
          const fechada = v.fechadas[dia][h];
          const altura = max > 0 ? Math.max(4, Math.round((serie[h] / max) * ALTURA)) : 4;
          return (
            <div key={h} className="flex min-w-0 flex-1 flex-col items-center justify-end" style={{ height: "100%" }} title={`${h}h · ${valor(serie[h])}${fechada ? " (fechada na simulação)" : pico(h) ? " (pico)" : ""}`}>
              <Rotulo valor={serie[h]} usada={usada} destaque={h === maior && !fechada} apagado={fechada} />
              <div className="w-full rounded-t-[3px]" style={{ height: altura, background: fechada ? "var(--surface-muted)" : pico(h) ? "var(--system-500)" : "var(--system-100)" }} />
            </div>
          );
        })}
      </div>
      <div aria-hidden="true" className="mt-1 flex gap-1.5">
        {horas.map((h) => <span key={h} className={`min-w-0 flex-1 text-center text-xs ${h === maior ? "font-bold text-[var(--text-strong)]" : "text-[var(--text-secondary)]"}`}>{String(h).padStart(2, "0")}h</span>)}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
        <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0">
          {[["var(--system-500)", "Pico"], ["var(--system-100)", "Demais horas"], ["var(--surface-muted)", "Fechada na simulação"]].map(([cor, t]) => (
            <li key={t} className="flex items-center gap-1.5"><span aria-hidden="true" className="inline-block h-3 w-3 rounded-[2px]" style={{ background: cor }} />{t}</li>
          ))}
        </ul>
        <strong className="text-sm text-[var(--text-strong)]">
          {modo === "manter" ? "Horário mantido neste dia" : alterado ? `${fechadasNoDia}h fechadas neste dia` : "Sem alteração neste dia"}
        </strong>
      </div>
    </div>
  );
}
