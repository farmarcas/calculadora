import { useEffect, useRef, useState } from "react";
import { confirmarCampo } from "./horario-regras.js";

// Campo de horário (104 × 40): "HH:mm" centralizado e, à direita, uma coluna de 32 px com + em cima e − embaixo (20 px cada).
// O texto só vale ao sair do campo, no Enter ou nos botões; valor inválido volta ao último válido. ↑ e ↓ mudam 1 hora.
export default function CampoDeHorario({ rotulo, valor, alterado, desabilitado, ehFechamento, outroLado, onConfirmar, onPasso }) {
  const [texto, setTexto] = useState(valor);
  const ref = useRef(null);
  useEffect(() => setTexto(valor), [valor]);

  const confirmar = () => {
    const novo = confirmarCampo(texto, { ehFechamento, ultimoValido: valor, outroLado });
    setTexto(novo);
    if (novo !== valor) onConfirmar(novo);
  };
  const tecla = (e) => {
    if (e.key === "Enter") { e.preventDefault(); confirmar(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); onPasso(1); }
    else if (e.key === "ArrowDown") { e.preventDefault(); onPasso(-1); }
    else if (e.key === "Escape") setTexto(valor);
  };
  const BOTAO = "grid h-5 w-full cursor-pointer place-items-center border-0 bg-[var(--surface-subtle)] p-0 text-xs leading-none font-bold text-[var(--text-strong)] hover:bg-[var(--surface-muted)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--border-focus)] disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div className={`flex h-10 w-[104px] overflow-hidden rounded-[6px] bg-[var(--surface-card)] ${alterado ? "border border-[var(--system-500)]" : "border border-[var(--border-default)]"}`}>
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        maxLength={5}
        disabled={desabilitado}
        aria-label={`Horário de ${rotulo}`}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={confirmar}
        onKeyDown={tecla}
        className={`min-w-0 flex-1 border-0 bg-transparent px-1 text-center text-sm text-[var(--text-strong)] focus:outline-none disabled:text-[var(--text-secondary)] ${alterado ? "font-bold" : ""}`}
      />
      <div className="flex w-8 shrink-0 flex-col border-l border-[var(--border-default)]">
        <button type="button" disabled={desabilitado} aria-label={`Aumentar ${rotulo}`} onClick={() => onPasso(1)} className={`${BOTAO} border-b border-[var(--border-default)]`}>+</button>
        <button type="button" disabled={desabilitado} aria-label={`Diminuir ${rotulo}`} onClick={() => onPasso(-1)} className={BOTAO}>−</button>
      </div>
    </div>
  );
}
