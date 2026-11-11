const CORES = {
  Farmacêutico: { fundo: "var(--escala-semana-farmaceutico-fundo)", texto: "var(--escala-semana-farmaceutico-texto)" },
  Atendimento: { fundo: "var(--escala-semana-atendimento-fundo)", texto: "var(--escala-semana-atendimento-texto)" },
  Caixa: { fundo: "var(--escala-semana-caixa-fundo)", texto: "var(--escala-semana-caixa-texto)" },
};
const NOMES_LONGOS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];

// Uma pessoa na semana: nome, sete células (turno, folga ou fechada) e o total. A Contratação simulada tem borda tracejada e
// nome em azul. Clicar na célula só existe para quem pode editar: leva à Escala por hora do dia.
export default function LinhaDaSemana({ linha, colunas, editavel, onDia }) {
  const cor = CORES[linha.funcao] ?? CORES.Caixa;
  return (
    <div role="row" className="grid items-center gap-x-2 border-t border-[var(--border-subtle)] py-2 pr-6" style={{ gridTemplateColumns: colunas }}>
      <div role="rowheader" className="sticky left-0 z-[1] min-w-0 bg-[var(--surface-card)] py-1 pr-2 pl-6">
        <div className={`truncate text-[13px] leading-4 font-bold ${linha.simulada ? "text-[var(--color-primary)]" : "text-[var(--text-strong)]"}`}>{linha.simulada ? "Contratação simulada" : linha.nome}</div>
        <div className="truncate text-[11px] leading-4 text-[var(--text-secondary)]">{linha.funcao} · {linha.simulada ? `${linha.cargaH}h parcial` : `${linha.cargaH}h`}</div>
      </div>
      {linha.celulas.map((c) => {
        const rotulo = c.estado === "turno" ? `${c.texto}${c.intervalo ? `, intervalo ${c.intervalo}` : ""}` : c.estado === "folga" ? "folga" : "loja fechada";
        const miolo =
          c.estado === "turno" ? (
            <>
              <span className="text-[13px] leading-4 font-bold">{c.texto}</span>
              {c.intervalo && <span className="text-[11px] leading-4 opacity-80">int. {c.intervalo.split("–")[0]}</span>}
            </>
          ) : c.estado === "folga" ? (
            <span className="text-[11px] leading-4 font-bold tracking-wide text-[var(--text-secondary)]">FOLGA</span>
          ) : null;
        if (c.estado === "fechada") return <div key={c.dia} role="cell" aria-label={`${linha.nome}, ${NOMES_LONGOS[c.dia]}: ${rotulo}`} className="text-center text-[11px] leading-4 font-bold tracking-wide text-[var(--text-secondary)]">FECHADA</div>;
        const estilo = c.estado === "turno" ? { background: cor.fundo, color: cor.texto, borderColor: cor.texto } : undefined;
        const base = `flex h-12 w-full flex-col items-center justify-center rounded-btn px-1 ${c.estado === "turno" ? `border ${linha.simulada ? "border-dashed border-2" : "border-solid border-opacity-30"}` : "border border-dashed border-[var(--border-default)] bg-[var(--surface-subtle)]"}`;
        const rotuloCompleto = `${linha.nome}, ${NOMES_LONGOS[c.dia]}: ${rotulo}`;
        return (
          <div key={c.dia} role="cell">
            {editavel ? (
              <button type="button" onClick={() => onDia(c.dia)} aria-label={`${rotuloCompleto}. Abrir a Escala por hora desse dia`} className={`${base} cursor-pointer`} style={estilo}>{miolo}</button>
            ) : (
              <div aria-label={rotuloCompleto} role="img" className={base} style={estilo}>{miolo}</div>
            )}
          </div>
        );
      })}
      <div role="cell" className={`text-right whitespace-nowrap text-[13px] leading-4 font-bold ${linha.passaDaJornada ? "" : "text-[var(--text-strong)]"}`} style={linha.passaDaJornada ? { color: "var(--escala-semana-atencao)" } : undefined} title={linha.passaDaJornada ? `Passa da jornada de ${linha.cargaH}h` : undefined} data-testid={linha.passaDaJornada ? "total-passa-da-jornada" : undefined}>
        {linha.total.texto}
      </div>
    </div>
  );
}
