import { useState } from "react";
import Importar from "./Importar.jsx";
import Apuracao from "./Apuracao.jsx";
import Painel from "./Painel.jsx";
import Pendencias from "./Pendencias.jsx";

// Quem só consulta vê apenas a apuração agregada da loja.
const secoesDe = (gestao) => [["painel", "Painel"], ["apuracao", "Apuração"], ...(gestao ? [["importar", "Importar ponto"], ["pendencias", "Pendências"]] : [])];

// Pilar Gerenciar: a escala em uso comparada com o ponto. Só dono e gestor chegam aqui.
export default function GerenciarTab({ lojaId, perfil, onAbrirSimulacao }) {
  const gestao = perfil !== "SCHEDULE_VIEWER";
  const SECOES = secoesDe(gestao);
  const [secao, setSecao] = useState("painel");
  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Seções do Gerenciar">
        {SECOES.map(([id, r]) => (
          <button key={id} role="tab" aria-selected={secao === id} onClick={() => setSecao(id)} className={`px-3 py-1.5 rounded-btn text-sm ${secao === id ? "bg-system-50 text-system-700 font-medium" : "text-ink-700 hover:bg-surface-subtle"}`}>{r}</button>
        ))}
      </div>
      {secao === "painel" && <Painel lojaId={lojaId} perfil={perfil} onIr={setSecao} onAbrirSimulacao={onAbrirSimulacao} />}
      {secao === "apuracao" && <Apuracao lojaId={lojaId} podeVerPessoas={gestao} />}
      {secao === "importar" && <Importar lojaId={lojaId} />}
      {secao === "pendencias" && <Pendencias lojaId={lojaId} />}
    </div>
  );
}
