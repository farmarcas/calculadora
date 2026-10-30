import { useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../../api/client.js";
import { Aviso, Botao, entrada } from "../../components/ui/index.jsx";

export const NOME_REGIME = { simples: "Simples Nacional", presumido: "Lucro Presumido", real: "Lucro Real" };
export const NOTA_ENCARGOS = "Percentuais de referência. Confirme com seu contador.";
export const pct = (n) => `${String(Math.round(n * 100) / 100).replace(".", ",")}%`;

// Lista de componentes do encargo (INSS, RAT × FAP, terceiros, FGTS, provisões…), com o total no fim.
export function ComposicaoEncargos({ encargos }) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer font-bold text-system-500">Ver composição</summary>
      <table className="mt-2 w-full max-w-xl border-collapse text-sm">
        <tbody>
          {encargos.componentes.map((c) => (
            <tr key={c.chave} className="border-t border-line first:border-0">
              <td className="py-1.5 pr-4 text-ink-700">{c.nome}</td>
              <td className="py-1.5 text-right">{pct(c.pct)}</td>
            </tr>
          ))}
          <tr className="border-t-2 border-line font-bold">
            <td className="py-1.5 pr-4">Total ({NOME_REGIME[encargos.regime]})</td>
            <td className="py-1.5 text-right">{pct(encargos.totalPct)}</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-2 mb-0 text-xs text-ink-500">{NOTA_ENCARGOS}</p>
    </details>
  );
}

// Regime ausente: o cálculo usou o Lucro Presumido. Aqui a pessoa escolhe o regime e a escolha fica gravada na loja.
export function AlertaRegime({ lojaId, texto, onSalvo }) {
  const [regime, setRegime] = useState("");
  const [erro, setErro] = useState(null);
  const salvar = async () => {
    setErro(null);
    try {
      await api(`/lojas/${lojaId}`, { method: "PATCH", body: { regimeTributario: regime } });
      onSalvo();
    } catch (e) {
      setErro(e.message);
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <Aviso tom="atencao">{texto}</Aviso>
      {erro && <Aviso>{erro}</Aviso>}
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Regime tributário da loja" className={entrada} value={regime} onChange={(e) => setRegime(e.target.value)}>
          <option value="">Escolha o regime…</option>
          {Object.entries(NOME_REGIME).map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
        </select>
        <Botao tipo="secundario" onClick={salvar} disabled={!regime}>Confirmar regime</Botao>
      </div>
    </div>
  );
}

// Composição do encargo como dica ("i") ao lado do rótulo da folha: abre ao passar o mouse, ao focar (teclado) e ao tocar.
// Fica num portal com posição fixa para não ser cortada pelo quadro de números.
export function DicaComposicao({ encargos }) {
  const id = useId();
  const botao = useRef(null);
  const [pos, setPos] = useState(null);
  const abrir = () => {
    const r = botao.current?.getBoundingClientRect();
    if (!r) return;
    const largura = 320;
    setPos({ top: r.bottom + 8, left: Math.max(8, Math.min(window.innerWidth - largura - 8, r.left + r.width / 2 - largura / 2)), largura });
  };
  const fechar = () => setPos(null);
  return (
    <>
      <button
        ref={botao}
        type="button"
        aria-label="Ver composição dos encargos"
        aria-describedby={pos ? id : undefined}
        aria-expanded={!!pos}
        onMouseEnter={abrir}
        onMouseLeave={fechar}
        onFocus={abrir}
        onBlur={fechar}
        onClick={() => (pos ? fechar() : abrir())}
        onKeyDown={(e) => e.key === "Escape" && fechar()}
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[var(--text-secondary)] bg-transparent p-0 text-[10px] leading-none font-bold text-[var(--text-secondary)] cursor-pointer hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]"
      >
        i
      </button>
      {pos &&
        createPortal(
          <div
            id={id}
            role="tooltip"
            className="fixed z-50 rounded-card border border-line bg-[var(--surface-card)] p-3 shadow-pop text-left normal-case"
            style={{ top: pos.top, left: pos.left, width: pos.largura }}
          >
            <div className="mb-1 text-xs leading-4 font-bold text-[var(--text-strong)]">Composição dos encargos · {NOME_REGIME[encargos.regime]}</div>
            <table className="w-full border-collapse text-xs leading-4">
              <tbody>
                {encargos.componentes.map((c) => (
                  <tr key={c.chave} className="border-t border-line first:border-0">
                    <td className="py-1 pr-3 text-[var(--text-secondary)]">{c.nome}</td>
                    <td className="py-1 text-right text-[var(--text-strong)]">{pct(c.pct)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-line font-bold text-[var(--text-strong)]">
                  <td className="py-1 pr-3">Total</td>
                  <td className="py-1 text-right">{pct(encargos.totalPct)}</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-2 mb-0 text-xs leading-4 text-[var(--text-secondary)]">{NOTA_ENCARGOS}</p>
          </div>,
          document.body,
        )}
    </>
  );
}
