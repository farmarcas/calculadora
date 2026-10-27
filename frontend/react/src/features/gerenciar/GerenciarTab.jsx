import { useState } from "react";
import Importar from "./Importar.jsx";

const SECOES = [
  ["importar", "Importar ponto"],
];

// Pilar Gerenciar: a escala em uso comparada com o ponto. Só dono e gestor chegam aqui.
export default function GerenciarTab({ lojaId }) {
  const [secao, setSecao] = useState("importar");
  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Seções do Gerenciar">
        {SECOES.map(([id, r]) => (
          <button key={id} role="tab" aria-selected={secao === id} onClick={() => setSecao(id)} className={`px-3 py-1.5 rounded-btn text-sm ${secao === id ? "bg-system-50 text-system-700 font-medium" : "text-ink-700 hover:bg-surface-subtle"}`}>{r}</button>
        ))}
      </div>
      {secao === "importar" && <Importar lojaId={lojaId} />}
    </div>
  );
}
