const TRILHO = "var(--surface-subtle)";
const SOFT = "var(--color-primary-soft)";

// Barra de 10 px: capacidade em azul, traço do que a função precisa e, se faltar, a parte que falta tracejada.
function Barra({ barra }) {
  return (
    <div aria-hidden="true" className="relative mt-2 h-2.5 rounded-full" style={{ background: TRILHO }}>
      <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${barra.capacidade * 100}%`, background: "var(--color-primary)" }} />
      {barra.falta && (
        <div className="absolute inset-y-0" style={{ left: `${barra.capacidade * 100}%`, width: `${(barra.precisa - barra.capacidade) * 100}%`, background: "var(--func-attention-100)", border: "1px dashed var(--func-warning-300)", boxSizing: "border-box" }} />
      )}
      <div className="absolute -top-0.5 -bottom-0.5 w-0.5" style={{ left: `calc(${barra.precisa * 100}% - 1px)`, background: "var(--neutral-dark-900)" }} />
    </div>
  );
}

const Precisa = ({ texto }) => {
  const k = "Precisa de ";
  return <span className="text-sm text-[var(--text-strong)]">{k}<strong>{texto.slice(k.length)}</strong></span>;
};

// Aba 2: uma tabela só com as três regras (capacidade, saldo em texto e barra), a coluna da regra escolhida no topo destacada.
export default function TabelaRegras({ regras }) {
  const { colunas, linhas } = regras;
  const grade = { display: "grid", gridTemplateColumns: "minmax(260px,1fr) repeat(3, minmax(0,1.1fr))" };
  return (
    <div className="overflow-x-auto" role="region" aria-label="Resultado por regra" tabIndex={0}>
      <div className="min-w-[900px] overflow-hidden rounded-card border border-[var(--border-subtle)]">
        <div style={grade} role="row">
          <div className="flex items-end bg-[var(--surface-subtle)] px-4 py-3 text-xs font-bold uppercase text-[var(--text-secondary)]">Função e o que ela precisa</div>
          {colunas.map((c) => (
            <div key={c.id} className="border-l border-[var(--border-subtle)] px-4 py-3" style={{ background: c.destacada ? SOFT : "var(--surface-subtle)" }}>
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-base text-[var(--text-strong)]">{c.nome}</strong>
                <span className="inline-flex h-6 items-center rounded-full px-3 text-xs font-bold text-[var(--text-strong)]" style={{ background: c.status === "atende" ? "var(--func-success-100)" : "var(--func-attention-100)" }}>{c.statusTexto}</span>
              </div>
              <div className="mt-1 text-xs font-bold text-[var(--text-strong)]">{c.vigencia}</div>
              <div className="text-xs text-[var(--text-secondary)]">{c.resumo}</div>
            </div>
          ))}
        </div>
        {linhas.map((l) => (
          <div key={l.funcao} style={grade} role="row" className="border-t border-[var(--border-subtle)]">
            <div className="flex flex-col gap-0.5 px-4 py-4">
              <strong className="text-base text-[var(--text-strong)]">{l.funcao}</strong>
              <span className="text-xs text-[var(--text-secondary)]">{l.apoio}</span>
              <div className="mt-2"><Precisa texto={l.precisaTexto} /></div>
            </div>
            {l.celulas.map((c, i) => (
              <div key={c.regraId} className="border-l border-[var(--border-subtle)] px-4 py-4" style={{ background: colunas[i].destacada ? SOFT : "transparent" }}>
                <div className="flex items-center gap-1.5 text-lg font-bold text-[var(--text-strong)]">
                  <span aria-hidden="true" className="text-base" style={{ color: c.ok ? "var(--text-success, #3d5f00)" : "var(--func-warning-300)" }}>{c.ok ? "✓" : "▲"}</span>
                  <span className="sr-only">{c.ok ? "Atende: " : "Falta: "}</span>{c.capacidadeH}h
                </div>
                <div className="text-xs text-[var(--text-secondary)]">{c.pessoasTexto}</div>
                {c.turnosTexto && <div className="text-xs text-[var(--text-secondary)]">{c.turnosTexto}</div>}
                <Barra barra={c.barra} />
              </div>
            ))}
          </div>
        ))}
      </div>
      <ul className="m-0 mt-3 flex list-none flex-wrap items-center gap-x-5 gap-y-1 p-0 text-xs text-[var(--text-secondary)]">
        <li className="flex items-center gap-1.5"><span aria-hidden="true" className="inline-block h-2.5 w-5 rounded-full" style={{ background: "var(--color-primary)" }} />Capacidade da equipe</li>
        <li className="flex items-center gap-1.5"><span aria-hidden="true" className="inline-block h-3.5 w-0.5" style={{ background: "var(--neutral-dark-900)" }} />O que a função precisa</li>
        <li className="flex items-center gap-1.5"><span aria-hidden="true" className="inline-block h-2.5 w-5" style={{ background: "var(--func-attention-100)", border: "1px dashed var(--func-warning-300)" }} />Horas que faltam</li>
        <li>Capacidade = pessoas × horas por semana que a regra permite. Só entram funções com pessoa no cálculo ou com meta do dono.</li>
      </ul>
    </div>
  );
}
