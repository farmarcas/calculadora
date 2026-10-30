import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Botao } from "../../components/ui/index.jsx";
import Aprovar from "../grade/Aprovar.jsx";
import BarraParametros from "./BarraParametros.jsx";
import PainelResultado from "./PainelResultado.jsx";
import PassoContratacoes from "./PassoContratacoes.jsx";
import PassoEscala from "./PassoEscala.jsx";
import PassoHorario from "./PassoHorario.jsx";
import useSimulacao from "./useSimulacao.js";

// Simulação de um cenário (abre em "Personalizar"): parâmetros, 3 passos e o painel de resultado.
export default function SimulacaoPage({ id, perfil, podeEscrever, aviso, onVoltar, onMudou, onAbrir }) {
  const { sim, erro, setErro, calculando, salvar, recarregar } = useSimulacao(id);
  const [modoHorario, setModoHorario] = useState("manter");
  const [aprovando, setAprovando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const dono = perfil === "TENANT_ADMIN";

  // Simulação que já tem horário editado abre direto em "Mudar horários".
  useEffect(() => {
    if (sim?.resultado.horario.mudou) setModoHorario("mudar");
  }, [sim?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (erro && !sim) return <Aviso>{erro}</Aviso>;
  if (!sim) return <p className="text-sm text-ink-500">Carregando simulação…</p>;

  const editavel = sim.editavel && podeEscrever;

  // Voltar para "Manter horários" descarta o que foi editado (com confirmação).
  const trocarModo = (modo) => {
    if (modo === "manter" && sim.resultado.horario.mudou) {
      if (!window.confirm("Voltar para \"Manter horários\" descarta as alterações de horário desta simulação. Continuar?")) return;
      salvar({ horarios: null });
    }
    setModoHorario(modo);
  };

  const clonar = async () => {
    setErro(null);
    try {
      const nova = await api(`/simulacoes/${id}/clonar`, { method: "POST" });
      onMudou();
      onAbrir(nova.id);
    } catch (e) {
      setErro(e.message);
    }
  };

  // Salva como "Cenário N" e já abre uma cópia para continuar ajustando e comparar depois.
  const salvarComoCenario = async () => {
    setErro(null);
    setSalvando(true);
    try {
      const g = await api(`/simulacoes/${id}/gravar`, { method: "POST", body: { comoCenario: true } });
      const nova = await api(`/simulacoes/${id}/clonar`, { method: "POST" });
      onMudou();
      onAbrir(nova.id, `${g.nome} salvo. Você está numa cópia para continuar ajustando.`);
    } catch (e) {
      setErro(e.details?.length ? `${e.message} ${e.details.slice(0, 3).map((d) => d.texto).join(" ")}` : e.message);
    } finally {
      setSalvando(false);
    }
  };

  // Marcar como em uso: grava (se ainda é rascunho) e pede a data de início ao dono.
  const marcarEmUso = async () => {
    setErro(null);
    try {
      if (sim.status === "rascunho") await api(`/simulacoes/${id}/gravar`, { method: "POST", body: {} });
      await recarregar();
      setAprovando(true);
    } catch (e) {
      setErro(e.details?.length ? `${e.message} ${e.details.slice(0, 3).map((d) => d.texto).join(" ")}` : e.message);
    }
  };

  return (
    <div className="sim-conteiner flex flex-col gap-4">
      {aprovando && <Aprovar id={id} onClose={() => setAprovando(false)} onAprovada={() => { setAprovando(false); recarregar(); onMudou(); }} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <Botao tipo="texto" onClick={onVoltar}>← Voltar</Botao>
          <h1 className="m-0 text-[28px] font-bold leading-9 text-[var(--text-strong)]">Simulação</h1>
          <span className="text-base text-[var(--text-secondary)]">{sim.loja.nome}</span>
        </div>
        {dono && (
          <Botao tipo="secundario" onClick={marcarEmUso} disabled={sim.status === "em_uso" || sim.status === "substituida" || sim.status === "descartada"}>
            {sim.status === "em_uso" ? "Em uso" : "Marcar como em uso"}
          </Botao>
        )}
      </div>

      {aviso && <Aviso tom={/salvo/.test(aviso) ? "ok" : "neutro"}>{aviso}</Aviso>}
      {erro && <Aviso>{erro}</Aviso>}
      {sim.desatualizada && <Aviso tom="atencao">Simulação em uso desatualizada: {sim.motivosDesatualizada.join(" ")} Clone, ajuste e marque a nova como em uso.</Aviso>}

      <BarraParametros sim={sim} editavel={editavel} modoHorario={modoHorario} onModoHorario={trocarModo} onRegra={(regra) => salvar({ regra })} />

      <div className="sim-grade">
        <div className="sim-esq flex flex-col gap-4 min-w-0">
          <PassoHorario sim={sim} editavel={editavel} modo={modoHorario} onSalvarHorarios={(horarios) => salvar({ horarios })} />
          <PassoContratacoes sim={sim} editavel={editavel} dono={dono} onSalvar={salvar} />
          <PassoEscala sim={sim} editavel={editavel} onSalvarTurnos={(turnos) => salvar({ turnos })} />
        </div>
        <PainelResultado sim={sim} calculando={calculando} modoHorario={modoHorario} dono={dono} podeEscrever={podeEscrever} salvando={salvando} onSalvar={salvarComoCenario} onClonar={clonar} />
      </div>
    </div>
  );
}
