import { duracaoDoTurno, janelaDoMinimo, pedacosDe, sobreposicoes, texto } from "./turnos.js";

const LISTRA = "repeating-linear-gradient(45deg, rgba(0,0,0,.18) 0 4px, transparent 4px 8px)";
const pct = (h, ini, fim) => `${((h - ini) / (fim - ini)) * 100}%`;
const larg = (de, ate, ini, fim) => `${((ate - de) / (fim - ini)) * 100}%`;

// Linha do tempo dos turnos: faixa tracejada do horário da loja, um bloco por turno, a sobreposição em destaque e a parte de
// cada turno fora do horário da loja listrada. A legenda em texto repete tudo (nada depende só de cor).
export default function BarraTurnos({ turnos, janela }) {
  if (!turnos.length) return null;
  const pedacos = turnos.flatMap(pedacosDe);
  const ini = Math.floor(Math.min(...pedacos.map((p) => p.de), janela?.abre ?? 24));
  const fim = Math.ceil(Math.max(...pedacos.map((p) => p.ate), janela?.fecha ?? 0));
  const sobre = sobreposicoes(turnos).filter((f) => f.ate > ini && f.de < fim);
  const sobreNaJanela = janela ? sobre.map((f) => ({ de: Math.max(f.de, janela.abre), ate: Math.min(f.ate, janela.fecha) })).filter((f) => f.ate > f.de) : sobre;
  const temFora = !!janela && turnos.some((t) => pedacosDe(t).some((p) => p.de < janela.abre - 1e-9 || p.ate > janela.fecha + 1e-9));
  const marcas = [...new Set([...(janela ? [janela.abre, janela.fecha] : []), ...pedacos.flatMap((p) => [p.de, p.ate]).filter((h) => h > ini && h < fim), ini, fim])].sort((a, b) => a - b)
    .filter((h, i, a) => i === 0 || (h - a[i - 1]) / (fim - ini) > 0.05);

  return (
    <div>
      <div role="img" aria-label={`Linha do tempo dos turnos, de ${texto(ini)} a ${texto(fim)}${janela ? `. Horário da loja de ${texto(janela.abre)} a ${texto(janela.fecha)}` : ""}.`} className="relative" style={{ height: turnos.length * 40 + 8 }}>
        {janela && <div aria-hidden="true" className="absolute inset-y-0 rounded-[4px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-subtle)]" style={{ left: pct(janela.abre, ini, fim), width: larg(janela.abre, janela.fecha, ini, fim) }} />}
        {sobreNaJanela.map((f, i) => <div key={i} aria-hidden="true" className="absolute inset-y-0" style={{ left: pct(f.de, ini, fim), width: larg(f.de, f.ate, ini, fim), background: "var(--func-attention-100)", opacity: 0.8 }} />)}
        {turnos.map((t, i) => (
          <div key={i} className="absolute left-0 right-0" style={{ top: 4 + i * 40, height: 32 }}>
            {pedacosDe(t).map((p, k) => (
              <div key={k} className="absolute inset-y-0 overflow-hidden rounded-[4px] border border-[var(--system-500)] px-2 text-xs font-bold leading-[30px] text-[var(--system-800)]" style={{ left: pct(p.de, ini, fim), width: larg(p.de, p.ate, ini, fim), background: i % 2 ? "var(--system-50)" : "var(--system-100)" }}>
                <span className="relative z-10 whitespace-nowrap">{k === 0 ? `${t.nome || `Turno ${i + 1}`} · ${t.inicio}–${t.fim}` : ""}</span>
                {janela && [[p.de, Math.min(p.ate, janela.abre)], [Math.max(p.de, janela.fecha), p.ate]].filter(([a, b]) => b - a > 1e-9).map(([a, b], j) => (
                  <span key={j} aria-hidden="true" className="absolute inset-y-0" style={{ left: `${((a - p.de) / (p.ate - p.de)) * 100}%`, width: `${((b - a) / (p.ate - p.de)) * 100}%`, background: LISTRA }} />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="relative mt-1 h-4 text-xs text-[var(--text-secondary)]">
        {marcas.map((h) => <span key={h} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: pct(h, ini, fim) }}>{texto(h)}</span>)}
      </div>
      <ul className="m-0 mt-3 flex list-none flex-wrap gap-x-5 gap-y-1 p-0 text-xs text-[var(--text-secondary)]">
        {sobreNaJanela.length > 0 && (
          <li className="flex items-center gap-1.5"><span aria-hidden="true" className="inline-block h-3 w-3 rounded-[2px]" style={{ background: "var(--func-attention-100)" }} />Sobreposição: {sobreNaJanela.map((f) => `${texto(f.de)}–${texto(f.ate)} (${Math.round((f.ate - f.de) * 100) / 100}h)`).join(", ")}</li>
        )}
        {temFora && <li className="flex items-center gap-1.5"><span aria-hidden="true" className="inline-block h-3 w-3 rounded-[2px] border border-[var(--border-strong)]" style={{ background: LISTRA }} />Faixa listrada: fora do horário da loja, o mínimo não conta</li>}
      </ul>
    </div>
  );
}

export const janelaTextoDoTurno = (turno, janela) => {
  const f = janelaDoMinimo(turno, janela);
  if (!f.length) return "fora do horário da loja: o mínimo não conta";
  return `o mínimo vale ${f.map((x) => `das ${texto(x.de)} às ${texto(x.ate)}`).join(" e ")}`;
};
export const horasTexto = (t) => `${duracaoDoTurno(t)}h`;
