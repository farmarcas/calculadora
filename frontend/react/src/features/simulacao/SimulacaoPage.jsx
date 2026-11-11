import { useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Botao } from "../../components/ui/index.jsx";
import BarraParametros from "./BarraParametros.jsx";
import PainelResultado from "./PainelResultado.jsx";
import PassoHorario from "./PassoHorario.jsx";
import EscalaDaSemana from "./escala/EscalaDaSemana.jsx";
import EscalaPorHora from "./escala/EscalaPorHora.jsx";
import useSimulacao from "./useSimulacao.js";

// Simulação de um cenário (abre em "Personalizar"): parâmetros, 3 passos e o painel de resultado.
export default function SimulacaoPage({ id, perfil, podeEscrever, aviso, onVoltar, onMudou, onAbrir }) {
  const { sim, erro, setErro, calculando, salvar } = useSimulacao(id);
  const [salvando, setSalvando] = useState(false);
  const [irParaDia, setIrParaDia] = useState(null); // pedido da Escala da semana: abrir a Escala por hora neste dia
  const dono = perfil === "TENANT_ADMIN";

  if (erro && !sim) return <Aviso>{erro}</Aviso>;
  if (!sim) return <p className="text-sm text-ink-500">Carregando simulação…</p>;

  const editavel = sim.editavel && podeEscrever;

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

  // Clicar num dia da Escala da semana: a Escala por hora mostra o dia e a tela rola até ela.
  const abrirDia = (dia) => {
    setIrParaDia((a) => ({ dia, n: (a?.n ?? 0) + 1 }));
    document.getElementById("escala-por-hora")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="sim-conteiner flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <Botao tipo="texto" onClick={onVoltar}>← Voltar</Botao>
          <h1 className="m-0 text-[28px] font-bold leading-9 text-[var(--text-strong)]">Simulação</h1>
          <span className="text-base text-[var(--text-secondary)]">{sim.loja.nome}</span>
        </div>
      </div>

      {aviso && <Aviso tom={/salvo/.test(aviso) ? "ok" : "neutro"}>{aviso}</Aviso>}
      {erro && <Aviso>{erro}</Aviso>}

      <BarraParametros sim={sim} editavel={editavel} onRegra={(regra) => salvar({ regra })} />

      <div className="sim-grade">
        <div className="sim-esq flex flex-col gap-4 min-w-0">
          <PassoHorario sim={sim} editavel={editavel} onSalvarHorarios={(horarios) => salvar({ horarios })} />
          {/* Os cards "Cobertura e vendas" e "Contratações por função" ficam ocultos: a Escala por hora (spec 039) os substitui. */}
        </div>
        <PainelResultado sim={sim} calculando={calculando} dono={dono} podeEscrever={podeEscrever} salvando={salvando} onSalvar={salvarComoCenario} onClonar={clonar} />
      </div>

      <EscalaPorHora sim={sim} editavel={editavel} dono={dono} calculando={calculando} erro={erro} onLimparErro={() => setErro(null)} onSalvar={salvar} irParaDia={irParaDia} />

      <EscalaDaSemana sim={sim} editavel={editavel} onDia={abrirDia} onCadastrar={() => window.location.assign("/?tela=cadastros")} />
    </div>
  );
}
