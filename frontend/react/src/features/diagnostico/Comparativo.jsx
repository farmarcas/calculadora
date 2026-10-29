import { Cartao, Ficha } from "../../components/ui/index.jsx";

const NOMES_DIA = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];
const TH = "text-left text-[11px] font-bold uppercase tracking-wide text-ink-500 px-4 py-3 align-bottom";
const TD = "px-4 py-3 border-t border-line align-top";
const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const pct = (n) => `${String(n).replace(".", ",")}%`;

const STATUS = { viavel: ["ok", "Viável"], nao_recomendado: ["atencao", "Não recomendado"], inviavel: ["erro", "Inviável"] };

const textoContratacao = (c) => {
  const parcial = c.parcial ? `1 parcial de ${c.parcial.turnos} turno${c.parcial.turnos === 1 ? "" : "s"} (${c.parcial.horas}h)` : "";
  if (c.inteiras === 0) return `${c.funcao}: ${parcial}`;
  return `${c.funcao}: ${c.inteiras} inteira${c.inteiras === 1 ? "" : "s"}${parcial ? ` e ${parcial}` : ""}`;
};

// Valor em reais (só o dono recebe); nulo quando falta dado.
const dinheiro = (v, sinal = false) => (v === null ? "—" : `${sinal && v > 0 ? "+" : ""}${brl(v)}`);

// Os cenários 1, 2 e 3 lado a lado para a fase escolhida; o de maior resultado fica destacado, sem esconder os outros.
export default function Comparativo({ comparativo }) {
  if (!comparativo) return null;
  const { cenarios, destaque } = comparativo;
  const dono = cenarios[0].custoFolhaMensal !== undefined;
  const linhas = [
    { rotulo: "Contratações por cargo", celula: (c) => (c.contratacoes.length ? c.contratacoes.map((x) => <div key={x.funcao}>{textoContratacao(x)}</div>) : "Nenhuma") },
    { rotulo: "Dias fechados", celula: (c) => (c.diasFechar.length ? c.diasFechar.map((d) => NOMES_DIA[d]).join(", ") : "Nenhum") },
    { rotulo: "Horas abertas por semana", celula: (c) => `${c.horasSemana}h` },
    ...(dono
      ? [
          { rotulo: "Custo de folha por mês", celula: (c) => dinheiro(c.custoFolhaMensal) },
          { rotulo: "Margem perdida por mês", celula: (c) => dinheiro(c.margemMes) },
          { rotulo: "Resultado líquido por mês (frente a hoje)", celula: (c) => dinheiro(c.resultadoLiquidoMensal, true) },
          { rotulo: "Impacto no faturamento", celula: (c) => (c.impactoPctFaturamento === null ? "—" : pct(c.impactoPctFaturamento)) },
        ]
      : []),
    {
      rotulo: "Status",
      celula: (c) => (c.status ? <Ficha tom={STATUS[c.status][0]}>{STATUS[c.status][1]}</Ficha> : <span className="text-ink-500">Sem dados</span>),
    },
    { rotulo: "Alertas", celula: (c) => (c.alertas.length ? c.alertas.map((a, i) => <div key={i} className="text-xs text-ink-700">{a}</div>) : <span className="text-ink-500">—</span>) },
  ];
  return (
    <Cartao titulo="Comparativo dos cenários" subtitulo="Os três caminhos lado a lado para a regra escolhida. Os cenários 4 e 5 ficam abaixo, à parte.">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm min-w-[720px]" aria-label="Comparativo dos cenários 1, 2 e 3">
          <thead>
            <tr>
              <th className={TH} />
              {cenarios.map((c, i) => (
                <th key={c.id} className={`${TH} ${destaque === c.id ? "bg-surface-subtle" : ""}`}>
                  <div className="text-sm normal-case tracking-normal text-ink-900">Cenário {i + 1} · {c.nome}</div>
                  {destaque === c.id && <Ficha tom="ok">Maior resultado líquido</Ficha>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.rotulo}>
                <th scope="row" className={`${TD} text-left text-xs font-medium text-ink-500`}>{l.rotulo}</th>
                {cenarios.map((c) => (
                  <td key={c.id} className={`${TD} ${destaque === c.id ? "bg-surface-subtle" : ""}`}>{l.celula(c)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Cartao>
  );
}
