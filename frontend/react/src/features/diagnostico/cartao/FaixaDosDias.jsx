import { COR_DO_TOM } from "./tom.js";

const FUNDO = { igual: "var(--surface-muted)", aumento: "var(--func-success-100)", reducao: "var(--func-warning-50)", fechado: "var(--func-warning-50)" };
const TOM = { igual: "neutro", aumento: "sucesso", reducao: "perigo", fechado: "perigo" };

// Os sete dias com as horas abertas (nunca um traço). Cinza = sem mudança; verde = aumento; rosa = redução ou dia fechado.
export default function FaixaDosDias({ dias }) {
  return (
    <ul className="m-0 grid list-none grid-cols-7 gap-1 p-0">
      {dias.map((d) => (
        <li key={d.dia} aria-label={d.rotulo} className="flex min-h-[40px] flex-col items-center justify-center rounded-btn px-0.5 py-1 text-center" style={{ background: FUNDO[d.tipo] }}>
          <span aria-hidden="true" className="text-[11px] leading-[14px] font-bold text-[var(--text-strong)]">{d.nome}</span>
          <span aria-hidden="true" className={`text-[11px] leading-[14px] ${d.tipo === "igual" ? "text-[var(--text-secondary)]" : "font-bold text-[var(--text-strong)]"}`}>{d.principal}</span>
          {d.diferenca && <span aria-hidden="true" className="text-[10px] leading-3 font-bold" style={{ color: COR_DO_TOM[TOM[d.tipo]] }}>{d.diferenca}</span>}
        </li>
      ))}
    </ul>
  );
}
