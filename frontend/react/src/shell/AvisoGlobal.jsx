import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { IconeCheck, IconeAlerta, IconeFechar } from "../components/importacao/icones.jsx";

// Aviso que aparece no alto da tela depois que um modal fecha (por exemplo, "12 lojas e 48 funcionários gravados.").
export const DURACAO_DO_AVISO_MS = 8000;

const Contexto = createContext({ mostrar: () => {} });
export const useAviso = () => useContext(Contexto);

export function AvisoProvider({ children }) {
  const [aviso, setAviso] = useState(null);
  const mostrar = useCallback((texto, tom = "ok") => setAviso({ texto, tom, id: Date.now() }), []);
  const valor = useMemo(() => ({ mostrar }), [mostrar]);

  useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(() => setAviso(null), DURACAO_DO_AVISO_MS);
    return () => clearTimeout(t);
  }, [aviso]);

  const ok = aviso?.tom !== "atencao";
  return (
    <Contexto.Provider value={valor}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex justify-center px-4" aria-live="polite" role="status">
        {aviso && (
          <div key={aviso.id} className={`pointer-events-auto flex max-w-xl items-center gap-2.5 rounded-[8px] px-4 py-3 text-sm font-bold shadow-pop ${ok ? "bg-[var(--func-success-100)] text-[#3d5f00]" : "bg-[var(--func-attention-100)] text-[#7a5200]"}`}>
            {ok ? <IconeCheck /> : <IconeAlerta />}
            <span>{aviso.texto}</span>
            <button type="button" aria-label="Fechar aviso" onClick={() => setAviso(null)} className="ml-1 flex h-7 w-7 items-center justify-center rounded-btn border-0 bg-transparent text-current cursor-pointer hover:bg-black/5">
              <IconeFechar tamanho={16} />
            </button>
          </div>
        )}
      </div>
    </Contexto.Provider>
  );
}
