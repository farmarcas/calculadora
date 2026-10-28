import { Botao, Ficha } from "../../components/ui/index.jsx";

const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const NOME_FUNCAO = { Farmacêutico: "farmacêutico", Atendimento: "atendimento", Caixa: "caixa", Apoio: "apoio", Perfumaria: "perfumaria" };
const sinal = (n) => (n < 0 ? `−${Math.abs(n)}` : n > 0 ? `+${n}` : "0");

// "2 turnos de farmacêutico, 5 de atendimento e 2 de caixa"
const juntar = (itens) => (itens.length <= 1 ? (itens[0] ?? "") : `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`);
const faltas = (regra, preferir) =>
  regra.funcoes
    .filter((f) => f.falta)
    .map((f) => {
      const t = -f.saldoT;
      const h = -f.saldoH;
      const nome = NOME_FUNCAO[f.funcao] ?? f.funcao.toLowerCase();
      const turnos = `${t} ${t === 1 ? "turno" : "turnos"} de ${nome}`;
      const horas = `${h}h de ${nome}`;
      if (preferir === "turnos") return t > 0 ? turnos : horas;
      return h > 0 ? horas : turnos;
    });

const COR = { erro: "text-error-600", atencao: "text-attention-700", ok: "text-success-600", neutro: "text-ink-900" };

function Numero({ rotulo, valor, legenda, tom = "neutro" }) {
  return (
    <div className="border border-line rounded-card bg-white px-4 py-4 min-w-0">
      <div className="text-[11px] font-bold uppercase tracking-wide text-ink-500">{rotulo}</div>
      <div className={`mt-2 text-[28px] leading-8 font-bold ${COR[tom]}`}>{valor}</div>
      <div className="mt-1 text-xs text-ink-500">{legenda}</div>
    </div>
  );
}

// O quadro central da aba: a frase do diagnóstico e, logo abaixo, os números grandes
// (da regra escolhida e dos pontos de atenção). É a primeira coisa que a pessoa lê.
export default function QuadroCentral({ diag, regraId, onRegra, podeEscrever, onEnviar }) {
  const regras = diag.regras.filter((r) => r.id !== "atual");
  const regra = diag.regras.find((r) => r.id === regraId);
  const atual = diag.regras.find((r) => r.id === "atual");
  const n = diag.numeros;
  const folha = diag.folhaMensal;
  const comLacunas = n.faixasSemFarmaceutico + n.faixasAbaixoDoMinimo > 0;

  const chip = regra.passa
    ? comLacunas
      ? ["atencao", `Passa na regra de ${regra.nome}, com faixas descobertas`]
      : ["ok", `Passa na regra de ${regra.nome}`]
    : ["erro", `Falta na regra de ${regra.nome}`];

  const manchete = regra.passa
    ? `Na regra de ${regra.nome}, o quadro atual cobre as horas e os turnos da loja.`
    : `Na regra de ${regra.nome}, faltam ${juntar(faltas(regra, "turnos"))}.`;
  const hoje = atual.passa
    ? "Hoje, na regra atual (44h): o quadro cobre as horas e os turnos."
    : `Hoje, na regra atual (44h): já faltam ${juntar(faltas(atual, "horas"))}.`;

  return (
    <section aria-label="Diagnóstico central" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="m-0 text-base font-bold">Diagnóstico diante da regra</h2>
        <div className="flex border border-line rounded-input overflow-hidden bg-white" role="group" aria-label="Regra do diagnóstico">
          {regras.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={regraId === r.id}
              onClick={() => onRegra(r.id)}
              className={`px-4 py-2 text-sm font-medium ${regraId === r.id ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-surface-subtle"}`}
            >
              {r.nome} · a partir de {r.vigencia}
            </button>
          ))}
        </div>
        <span className="text-xs text-ink-500">{regra.descricao}</span>
      </div>

      <div className="bg-surface-card border border-line rounded-card shadow-card p-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-bold uppercase tracking-wide text-ink-500">Diagnóstico</span>
          <Ficha tom={chip[0]}>{chip[1]}</Ficha>
        </div>
        <h3 className="m-0 text-xl font-bold">{manchete}</h3>
        <p className="m-0 text-sm text-ink-700">{hoje}</p>

        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
          {folha &&
            (folha.informado ? (
              folha.mensal === null ? (
                <Numero rotulo="Folha mensal atual" valor="—" legenda={`falta o salário médio de ${folha.faltamInformar.join(", ")}`} tom="atencao" />
              ) : (
                <Numero rotulo="Folha mensal atual" valor={brl(folha.mensal)} legenda={`Salários + encargos ${folha.encargosPct}%`} />
              )
            ) : (
              <Numero rotulo="Folha mensal atual" valor="—" legenda="informe os custos na Configuração" />
            ))}
          <Numero rotulo="Turnos em falta" valor={regra.resumo.turnosEmFalta} legenda={`por semana na regra de ${regra.nome}`} tom={regra.resumo.turnosEmFalta > 0 ? "erro" : "ok"} />
          <Numero rotulo="Saldo de horas" valor={`${sinal(regra.resumo.saldoHoras)}h`} legenda="por semana · capacidade − necessidade" tom={regra.resumo.saldoHoras < 0 ? "erro" : "neutro"} />
          <Numero rotulo="Contratações para passar" valor={regra.resumo.contratar} legenda={regra.resumo.contratar === 1 ? "pessoa (veja o detalhe abaixo)" : "pessoas (veja o detalhe abaixo)"} tom={regra.resumo.contratar > 0 ? "atencao" : "ok"} />
          <Numero rotulo="Funcionários" valor={n.colaboradoresNoCalculo} legenda="no cálculo da escala atual" />
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-[11px] font-bold uppercase tracking-wide text-ink-500">Pontos de atenção</span>
          <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
            <Numero rotulo="Faixas sem farmacêutico" valor={n.faixasSemFarmaceutico} legenda="horas do pior dia · a lei exige em todo o horário" tom={n.faixasSemFarmaceutico > 0 ? "erro" : "ok"} />
            <Numero rotulo="Faixas abaixo do mínimo" valor={n.faixasAbaixoDoMinimo} legenda="horas do pior dia · demais funções" tom={n.faixasAbaixoDoMinimo > 0 ? "erro" : "ok"} />
            <Numero
              rotulo="Maior venda sem cobertura"
              valor={n.maiorVendaDescoberta ?? "—"}
              legenda={n.maiorVendaDescoberta === null ? "precisa da base comercial (hora a hora)" : "das 3 horas de maior venda"}
              tom={n.maiorVendaDescoberta ? "erro" : n.maiorVendaDescoberta === 0 ? "ok" : "neutro"}
            />
            <Numero rotulo="Fora do cálculo" valor={n.foraDoCalculo} legenda="colaboradores sem função de escala" tom={n.foraDoCalculo > 0 ? "atencao" : "ok"} />
            <Numero rotulo="Linhas rejeitadas" valor={n.linhasRejeitadas} legenda="na importação da escala" tom={n.linhasRejeitadas > 0 ? "atencao" : "ok"} />
          </div>
        </div>

        {n.maiorVendaDescoberta === null && podeEscrever && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-ink-500">
            O diagnóstico só vê os horários de maior venda com a base comercial (opcional).
            <Botao tipo="texto" onClick={onEnviar}>Enviar base comercial</Botao>
          </div>
        )}
      </div>
    </section>
  );
}
