import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Cartao } from "../../components/ui/index.jsx";
import Diagnostico from "./Diagnostico.jsx";
import GradeTab from "../grade/GradeTab.jsx";
import { cuidaDoGrupo } from "../../api/perfis.js";

// Loja, seção (Diagnóstico ou Simulações) e o envio de planilhas vêm da casca (faixa de contexto e menu lateral).
export default function EscalaPage({ perfil, lojaId, semLojas, secao, versaoDados = 0, onImportar, onSecao, onIrCadastros }) {
  const podeEscrever = cuidaDoGrupo(perfil);
  const aba = secao;
  const [diag, setDiag] = useState(null);
  const [erro, setErro] = useState(null);
  const [abrirSim, setAbrirSim] = useState(null);
  const [avisoSim, setAvisoSim] = useState(null);

  const carregar = useCallback(async () => {
    if (!lojaId) return;
    setErro(null);
    try {
      setDiag(await api(`/lojas/${lojaId}/diagnostico`));
    } catch (e) {
      setErro(e.message);
    }
  }, [lojaId, perfil, versaoDados]); // trocar o papel ou concluir uma importação recarrega: os dados mudam conforme quem olha

  useEffect(() => {
    setDiag(null);
    carregar();
  }, [carregar]);

  if (semLojas && !erro)
    return (
      <Cartao>
        <div className="p-10 text-center">
          <p className="m-0 text-base font-medium">Nenhuma loja cadastrada</p>
          <p className="mt-2 mb-0 text-sm text-ink-500">Cadastre as lojas em Cadastros antes de ver o diagnóstico da escala.</p>
        </div>
      </Cartao>
    );

  return (
    <>
      <div>
        <p className="m-0 text-xs text-ink-500">Escala › {aba === "grade" ? "Simulações" : "Diagnóstico"}</p>
        <h1 className="mt-1 mb-0 text-2xl font-bold">{aba === "grade" ? "Simulações" : "Escala"}</h1>
        <p className="mt-1 mb-0 text-sm text-ink-500">{aba === "grade" ? "Cenários da loja para comparar contratação e horário." : "Escala atual frente às regras de 42h e 40h (EC 141/2026)."}</p>
      </div>

      {erro && <Aviso>{erro}</Aviso>}

      {!diag && !erro && aba !== "grade" && <p className="text-sm text-ink-500">Carregando…</p>}
      {diag && aba === "diagnostico" && <Diagnostico diag={diag} podeEscrever={podeEscrever} onEnviar={onImportar} onRecarregar={carregar} onDefinirFuncao={onIrCadastros} onSimular={(id, aviso) => { setAbrirSim(id); setAvisoSim(aviso ?? null); onSecao("grade"); }} />}
      {aba === "grade" && <GradeTab lojaId={lojaId} perfil={perfil} podeEscrever={podeEscrever} abrirId={abrirSim} avisoInicial={avisoSim} />}
    </>
  );
}
