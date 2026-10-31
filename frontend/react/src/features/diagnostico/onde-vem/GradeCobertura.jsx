import { hh } from "./montar.js";

const LISTRA = "repeating-linear-gradient(135deg, var(--surface-muted) 0 4px, var(--surface-subtle) 4px 8px)";
const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const pctTxt = (p) => `${String(Math.round(p * 1000) / 10).replace(".", ",")}%`;
const COL1 = "sticky left-0 z-10 bg-[var(--surface-card)]";

// Grade única: horas no cabeçalho; linhas de turnos, vendas e cobertura por função, na mesma régua de horas.
export default function GradeCobertura({ dados }) {
  const { eixo, turnos, vendas, funcoes, fonteVendas } = dados;
  const N = eixo.length;
  const col = (h) => h - eixo[0] + 2;
  const base = { display: "grid", gridTemplateColumns: `170px repeat(${N}, minmax(36px, 1fr))`, columnGap: 4 };
  const ALTURA_BARRA = 40;

  return (
    <div className="overflow-x-auto" role="region" aria-label="Grade de cobertura e vendas por hora" tabIndex={0}>
      <div className="flex min-w-max flex-col gap-3 pr-1" style={{ minWidth: 170 + N * 40 }}>
        <div style={base} aria-hidden="true">
          <span className={`${COL1} text-xs font-bold uppercase text-[var(--text-secondary)]`}>Função</span>
          {eixo.map((h) => <span key={h} className="text-center text-xs text-[var(--text-secondary)]">{hh(h)}</span>)}
        </div>

        {turnos && (
          <div className="flex flex-col gap-1">
            {turnos.lanes.map((lane, i) => (
              <div key={i} style={{ ...base, height: 32 }} className="items-center">
                <span className={`${COL1} text-sm text-[var(--text-secondary)]`}>{i === 0 ? "Turnos" : ""}</span>
                {lane.flatMap((t) => t.faixas.map((f, k) => (
                  <div key={`${t.indice}-${k}`} title={t.rotulo} className="h-8 overflow-hidden rounded-[4px] border border-[var(--system-100)] px-2 text-xs font-bold leading-[30px] text-[var(--text-strong)]"
                    style={{ gridColumn: `${col(f.de)} / ${col(f.ate)}`, gridRow: 1, background: t.indice % 2 ? "var(--system-50)" : "var(--system-100)" }}>
                    <span className="whitespace-nowrap">{k === 0 ? t.rotulo : ""}</span>
                  </div>
                )))}
              </div>
            ))}
          </div>
        )}

        {vendas && (
          <div style={{ ...base, alignItems: "end", minHeight: 64 + 16 }}>
            <div className={`${COL1} self-center`} title={fonteVendas ? `Média por dia · ${fonteVendas}` : "Média por dia"}>
              <strong className="block text-sm text-[var(--text-strong)]">Vendas</strong>
              <span className="text-xs text-[var(--text-secondary)]">{vendas.emReais ? "R$ por hora, média por dia" : "participação no dia, por hora"}</span>
            </div>
            {vendas.horas.map((h) => {
              const altura = vendas.max > 0 ? Math.max(h.valor > 0 ? 2 : 0, Math.round((h.valor / vendas.max) * ALTURA_BARRA)) : 0;
              const texto = h.valor > 0 ? (vendas.emReais ? h.valor.toLocaleString("pt-BR", { maximumFractionDigits: 0 }) : pctTxt(h.valor)) : "";
              return (
                <div key={h.hora} className="flex flex-col items-center justify-end" title={h.valor > 0 ? `${hh(h.hora)} · ${vendas.emReais ? brl(h.valor) : `${pctTxt(h.valor)} do dia`}${h.pico ? " (pico)" : ""}${h.foraDoHorario ? " (fora do horário da loja)" : ""}` : `${hh(h.hora)} · sem venda`}>
                  <span className="mb-0.5 text-xs text-[var(--text-secondary)]">{texto}</span>
                  <div className="w-full rounded-t-[4px]" style={{ height: altura, background: h.foraDoHorario ? "transparent" : h.pico ? "var(--system-500)" : "var(--system-100)", border: h.foraDoHorario && altura ? "1px dashed var(--border-strong)" : "none" }} />
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-1">
          {funcoes.map((f) => (
            <div key={f.funcao} style={base} className="items-center">
              <div className={COL1}>
                <strong className="block text-sm text-[var(--text-strong)]">{f.funcao}</strong>
                <span className="text-xs text-[var(--text-secondary)]">{f.rotuloMinimo}</span>
              </div>
              {f.celulas.map((c) => {
                if (c.estado === "fora")
                  return <div key={c.hora} role="img" aria-label={`${hh(c.hora)}: fora do horário da loja, o mínimo não conta`} className="h-9 rounded-[4px] border border-[var(--border-subtle)]" style={{ background: LISTRA }} />;
                const abaixo = c.estado === "abaixo";
                return (
                  <div key={c.hora} role="img" aria-label={`${hh(c.hora)}: ${c.pessoas} ${c.pessoas === 1 ? "pessoa" : "pessoas"}${abaixo ? `, abaixo do mínimo de ${c.exigido}` : c.exigido ? `, atende o mínimo de ${c.exigido}` : ""}`}
                    className={`flex h-9 items-center justify-center rounded-[4px] text-sm text-[var(--text-strong)] ${abaixo ? "font-bold" : ""}`} style={{ background: abaixo ? "var(--func-attention-100)" : "var(--func-success-100)" }}>
                    {abaixo && <span aria-hidden="true" className="mr-0.5 text-xs">▲</span>}{c.pessoas}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <ul className="m-0 flex list-none flex-wrap items-center gap-x-5 gap-y-1 p-0 text-xs text-[var(--text-secondary)]">
          <li className="flex items-center gap-1.5"><span aria-hidden="true" className="inline-block h-3 w-3 rounded-[2px]" style={{ background: "var(--func-success-100)" }} />Atende o mínimo</li>
          <li className="flex items-center gap-1.5"><span aria-hidden="true" className="inline-block h-3 w-3 rounded-[2px]" style={{ background: "var(--func-attention-100)" }} />Abaixo do mínimo (▲)</li>
          <li className="flex items-center gap-1.5"><span aria-hidden="true" className="inline-block h-3 w-3 rounded-[2px] border border-[var(--border-subtle)]" style={{ background: LISTRA }} />Fora do horário da loja: o mínimo não conta</li>
          <li>Mostra o pior dia da semana em cada hora, já descontando intervalos.</li>
        </ul>
      </div>
    </div>
  );
}
