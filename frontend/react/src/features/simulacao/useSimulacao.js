import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../api/client.js";

// Carrega a simulação e aplica ajustes com um pequeno atraso: só a última resposta vale.
export default function useSimulacao(id) {
  const [sim, setSim] = useState(null);
  const [erro, setErro] = useState(null);
  const [calculando, setCalculando] = useState(false);
  const seq = useRef(0);
  const timer = useRef(null);

  useEffect(() => {
    setSim(null);
    setErro(null);
    api(`/simulacoes/${id}`).then(setSim).catch((e) => setErro(e.message));
    return () => clearTimeout(timer.current);
  }, [id]);

  const salvar = useCallback(
    (corpo) => {
      clearTimeout(timer.current);
      const mine = ++seq.current;
      setCalculando(true);
      timer.current = setTimeout(async () => {
        try {
          const s = await api(`/simulacoes/${id}`, { method: "PUT", body: corpo });
          if (mine === seq.current) setSim(s);
        } catch (e) {
          setErro(e.message);
        } finally {
          if (mine === seq.current) setCalculando(false);
        }
      }, 250);
    },
    [id],
  );

  const recarregar = useCallback(() => api(`/simulacoes/${id}`).then(setSim), [id]);
  return { sim, setSim, erro, setErro, calculando, salvar, recarregar };
}
