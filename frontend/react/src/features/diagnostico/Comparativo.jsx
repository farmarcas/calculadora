import { Ficha } from "../../components/ui/index.jsx";

const NOMES_DIA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const pct = (n) => `${String(n).replace(".", ",")}%`;
const sinal = (n) => (n > 0 ? "+" : n < 0 ? "−" : "");
const mod = (n) => brl(Math.abs(n));
const hh = (t) => (t ? `${t.slice(0, 2)}h` : "");

const STATUS = { viavel: ["ok", "Viável"], nao_recomendado: ["atencao", "Não recomendado"], nao_resolve: ["atencao", "Não resolve sozinho"], inviavel: ["erro", "Inviável"] };

const textoContratacao = (c) => {
  const parcial = c.parcial ? `1 ${c.funcao.toLowerCase()} parcial de ${c.parcial.horas}h` : "";
  if (c.inteiras === 0) return parcial;
  return `${c.inteiras} ${c.funcao.toLowerCase()}${c.inteiras === 1 ? "" : "s"} inteiro${c.inteiras === 1 ? "" : "s"}${parcial ? ` e ${parcial}` : ""}`;
};

// Fim de semana que muda: "Dom 08h–16h (antes 08h–22h)" · "Sáb fechado (antes 08h–22h)".
const linhaDeAjuste = (a) =>
  a.depois
    ? `${NOMES_DIA[a.dia]} ${hh(a.depois.abre)}–${hh(a.depois.fecha)} (antes ${hh(a.antes.abre)}–${hh(a.antes.fecha)})`
    : `${NOMES_DIA[a.dia]} fechado (antes ${hh(a.antes.abre)}–${hh(a.antes.fecha)})`;

// "Seg fechado (antes 07h–22h)" · "Seg, qua e qui fechados" · "Horário mantido".
const mudancaDeHorario = (dias, horarioAtual) => {
  if (dias.length === 0) return "Horário mantido";
  const nome = (d) => NOMES_DIA[d];
  if (dias.length === 1) {
    const h = horarioAtual?.find((x) => x.dia === dias[0]);
    return `${nome(dias[0])} fechado${h?.abre ? ` (antes ${hh(h.abre)}–${hh(h.fecha)})` : ""}`;
  }
  const lista = dias.map((d, i) => (i === 0 ? nome(d) : nome(d).toLowerCase()));
  return `${lista.slice(0, -1).join(", ")} e ${lista[lista.length - 1]} fechados`;
};

const Linha = ({ rotulo, children, tom }) => (
  <div className="flex items-start justify-between gap-4 px-5 py-3 border-t border-line text-sm">
    <span className="text-ink-500 shrink-0">{rotulo}</span>
    <span className={`text-right font-medium ${tom ?? "text-ink-900"}`}>{children}</span>
  </div>
);

function Cartao({ posicao, coluna, foco, horarioAtual, horasManter, destaque, dono, ehReferencia, resultadoRef }) {
  const c = coluna;
  const status = c.status && STATUS[c.status];
  const saldo = dono ? c.resultadoLiquidoMensal : undefined;
  const dif = c.horasSemana - horasManter;
  return (
    <article className={`flex flex-col bg-surface-card rounded-card overflow-hidden border ${destaque ? "border-2 border-system-500" : "border-line"} shadow-card`} aria-label={`Cenário ${posicao}: ${c.nome}`}>
      <header className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="m-0 flex min-w-0 items-center gap-2 text-base font-medium">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-system-500 text-white text-xs font-bold">{posicao}</span>
            <span className="truncate">{c.nome}</span>
          </h3>
          {/* Selos na linha do título, à direita: o status (não recomendado, inviável) e o cenário sugerido. */}
          {(status || destaque) && (
            <div className="flex shrink-0 items-center gap-1.5">
              {status && <Ficha tom={status[0]}>{status[1]}</Ficha>}
              {destaque && <span className="rounded-full bg-system-500 px-3 py-0.5 text-xs font-medium text-white whitespace-nowrap">Cenário sugerido</span>}
            </div>
          )}
        </div>
        <p className="mt-2 mb-0 text-xs text-ink-500">{foco}</p>
      </header>

      {dono && (
        <div className={`px-5 py-3 border-l-4 ${saldo == null ? "bg-surface-subtle border-ink-300" : saldo < 0 ? "bg-error-50 border-error-500" : "bg-success-50 border-success-600"}`}>
          <div className="text-[11px] font-bold uppercase tracking-wide text-ink-700">Saldo mensal estimado</div>
          <div className="flex items-end justify-between gap-3">
            <span className="text-xs text-ink-500">−(folha adicional + margem perdida)</span>
            <span className={`text-2xl font-bold ${saldo == null ? "text-ink-500" : saldo < 0 ? "text-error-600" : "text-success-600"}`}>
              {saldo == null ? "—" : `${saldo < 0 ? "−" : saldo > 0 ? "+" : ""}${mod(saldo)}`}
            </span>
          </div>
        </div>
      )}

      <Linha rotulo="Contratações">
        {c.contratacoes.length ? c.contratacoes.map((x) => <div key={x.funcao}>{textoContratacao(x)}{x.motivo === "meta" && <span className="text-ink-500"> (meta)</span>}</div>) : "Nenhuma"}
      </Linha>
      {dono && (
        <>
          <Linha rotulo="Folha adicional" tom={c.folhaAdicionalMensal > 0 ? "text-error-600" : undefined}>
            {c.folhaAdicionalMensal == null ? "—" : c.folhaAdicionalMensal === 0 ? "R$ 0" : `${mod(c.folhaAdicionalMensal)} por mês`}
          </Linha>
          <Linha rotulo="Faturamento perdido" tom={c.faturamentoPerdidoMensal > 0 ? "text-error-600" : undefined}>
            {c.faturamentoPerdidoMensal == null ? "—" : c.faturamentoPerdidoMensal === 0 ? "R$ 0" : `${mod(c.faturamentoPerdidoMensal)} por mês${c.faturamentoPerdidoPct != null ? ` · ${pct(c.faturamentoPerdidoPct)}` : ""}`}
          </Linha>
          <Linha rotulo="Margem perdida" tom={c.margemMes < 0 ? "text-error-600" : undefined}>
            {c.margemMes == null ? "—" : c.margemMes === 0 ? "R$ 0" : `${mod(c.margemMes)} por mês`}
          </Linha>
        </>
      )}
      <Linha rotulo="Mudança de horário" tom={c.ajustes?.length || c.diasFechar.length ? "text-attention-700" : undefined}>
        {c.ajustes?.length ? c.ajustes.map((a) => <div key={a.dia}>{linhaDeAjuste(a)}</div>) : mudancaDeHorario(c.diasFechar, horarioAtual)}
      </Linha>
      <Linha rotulo="Horas abertas">
        {c.horasSemana}h por semana{dif !== 0 && <span className="text-attention-700"> ({sinal(dif)}{Math.abs(dif)}h)</span>}
      </Linha>
      {c.faltaH > 0 && (
        <Linha rotulo="Ainda falta cobrir" tom="text-error-600">{String(c.faltaH).replace(".", ",")}h de cobertura</Linha>
      )}
      <Linha rotulo="Ociosidade das contratações" tom={c.ociosidadePct ? "text-attention-700" : undefined}>
        {c.ociosidadePct == null ? "—" : `${pct(c.ociosidadePct)} das horas contratadas`}
      </Linha>
      {dono && (
        <Linha rotulo="Ganho × manter horários" tom={ehReferencia ? "text-ink-500" : c.ganhoFrenteManterMensal > 0 ? "text-success-600" : c.ganhoFrenteManterMensal < 0 ? "text-error-600" : undefined}>
          {ehReferencia ? "Referência" : c.ganhoFrenteManterMensal == null ? "—" : `${sinal(c.ganhoFrenteManterMensal)}${mod(c.ganhoFrenteManterMensal)} por mês`}
        </Linha>
      )}

      {c.alertas.length > 0 && (
        <div className="mt-auto px-5 py-3 border-t border-line bg-surface-subtle text-xs text-ink-700 flex flex-col gap-1">
          {c.alertas.map((a, i) => <div key={i}>{a}</div>)}
        </div>
      )}
    </article>
  );
}

// Os cenários 1, 2 e 3 lado a lado para a regra escolhida. Só o dono recebe os valores em reais e o cenário sugerido.
export default function Comparativo({ comparativo, cenarios }) {
  if (!comparativo) return null;
  const { cenarios: colunas, destaque } = comparativo;
  const dono = colunas[0].custoFolhaMensal !== undefined;
  const horarioAtual = cenarios?.manter?.horarioSemana;
  const focos = { manter: cenarios?.manter?.foco, economia: cenarios?.economia?.foco, equilibrio: cenarios?.equilibrio?.foco };
  const horasManter = colunas.find((c) => c.id === "manter").horasSemana;
  return (
    <section aria-label="Cenários sugeridos" className="flex flex-col gap-3">
      <div>
        <h2 className="m-0 text-base font-medium">Cenários sugeridos</h2>
        <p className="mt-1 mb-0 text-xs text-ink-500">
          Para a regra de {cenarios?.regra?.nome ?? "referência"}, com o quadro{dono ? ", os salários" : ""} e as vendas já cadastrados. São estimativas: nada altera o cadastro.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {colunas.map((c, i) => (
          <Cartao
            key={c.id}
            posicao={i + 1}
            coluna={c}
            foco={focos[c.id]}
            horarioAtual={horarioAtual}
            horasManter={horasManter}
            destaque={destaque === c.id}
            dono={dono}
            ehReferencia={c.id === "manter"}
          />
        ))}
      </div>
    </section>
  );
}
