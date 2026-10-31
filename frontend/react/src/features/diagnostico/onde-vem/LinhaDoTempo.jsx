const LISTRA = "repeating-linear-gradient(135deg, var(--surface-muted) 0 4px, var(--surface-subtle) 4px 8px)";
const pct = (h, ini, fim) => `${((h - ini) / (fim - ini)) * 100}%`;
const larg = (de, ate, ini, fim) => `${((ate - de) / (fim - ini)) * 100}%`;

// Cabeçalho do eixo: um rótulo a cada 2 horas (o primeiro alinhado à esquerda e o último à direita, sem passar da coluna).
export function EixoDaLinhaDoTempo({ ini, fim }) {
  const horas = [];
  for (let h = ini; h <= fim; h += 2) horas.push(h);
  if (horas[horas.length - 1] !== fim && fim - horas[horas.length - 1] >= 1.5) horas.push(fim);
  return (
    <div aria-hidden="true" className="relative h-4 text-xs font-normal normal-case text-[var(--text-secondary)]">
      {horas.map((h, i) => (
        <span key={h} className="absolute whitespace-nowrap" style={{ left: pct(h, ini, fim), transform: i === 0 ? "none" : i === horas.length - 1 ? "translateX(-100%)" : "translateX(-50%)" }}>{String(h).padStart(2, "0")}h</span>
      ))}
    </div>
  );
}

// Barra do turno: a parte dentro do horário da loja em azul, a parte fora listrada com borda tracejada; as horas em que a loja
// está fechada ficam listradas no trilho. Sem turno, mostra o motivo em texto.
export default function LinhaDoTempo({ linha, eixo, janela }) {
  if (!linha.noCalculo || !linha.segmentos.length)
    return <span className="text-xs text-[var(--text-secondary)]">{linha.motivo ?? "Sem turno"}</span>;
  const { ini, fim } = eixo;
  const descricao = `Turno ${linha.turnoTexto}${janela ? `; ${linha.segmentos.some((s) => !s.dentro) ? "parte fora do horário da loja" : "dentro do horário da loja"}` : ""}`;
  return (
    <div role="img" aria-label={descricao} className="relative h-4 overflow-hidden rounded-[4px]" style={{ background: "var(--surface-subtle)" }}>
      {janela && (
        <>
          <div aria-hidden="true" className="absolute inset-y-0" style={{ left: 0, width: larg(ini, Math.max(ini, janela.abre), ini, fim), background: LISTRA, opacity: 0.6 }} />
          <div aria-hidden="true" className="absolute inset-y-0" style={{ left: pct(Math.min(fim, janela.fecha), ini, fim), right: 0, background: LISTRA, opacity: 0.6 }} />
        </>
      )}
      {linha.segmentos.map((s, i) => (
        <div key={i} className="absolute inset-y-0.5" style={{ left: pct(s.de, ini, fim), width: larg(s.de, s.ate, ini, fim), background: s.dentro ? "var(--system-500)" : LISTRA, border: s.dentro ? "none" : "1px dashed var(--system-500)", boxSizing: "border-box", borderRadius: 3 }} />
      ))}
    </div>
  );
}
