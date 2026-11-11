import FaixaDosDias from "../diagnostico/cartao/FaixaDosDias.jsx";
import { Chip } from "../diagnostico/cartao/CelulaFolha.jsx";
import PillDeStatus from "../diagnostico/cartao/PillDeStatus.jsx";
import { cabecalhoDaFolha, faixaDosDias, rotuloDoStatus, textoDaVariacao, textoDoTotal } from "../diagnostico/cartao/linha-regras.js";
import { COR_DO_TOM } from "../diagnostico/cartao/tom.js";
import { apoioDaVenda, diasDaSimulacao, listaOQueMuda, pesoDaSimulacao, textoContratarSimulacao } from "./resultado-regras.js";

const COR = { ...COR_DO_TOM, mudo: "var(--text-secondary)" };
// Cores da lista "O que muda": âmbar (folha que sobe), verde (folha que cai; pessoas e horas que sobem), neutra e cinza.
const COR_DA_LISTA = { ambar: "var(--chip-aumenta-texto)", verde: "var(--text-success-strong)", neutro: "var(--text-strong)", mudo: "var(--text-secondary)" };

const Carregando = ({ largura = "w-24", altura = "h-7" }) => <span aria-hidden="true" className={`inline-block ${altura} ${largura} animate-pulse rounded bg-[var(--surface-muted)]`} />;

const BlocoVenda = ({ v, apoio, calculando }) => (
  <div className="min-w-0 rounded-card bg-[var(--surface-subtle)] px-3 py-2.5" data-testid="bloco-venda">
    <div className="text-xs leading-4 text-[var(--text-secondary)]">Venda</div>
    <div aria-live="polite" className="mt-0.5 min-h-8 text-[22px] leading-8 font-bold" style={{ color: COR[v.tom] }}>{calculando ? <Carregando /> : v.texto}</div>
    <div className="text-xs leading-4 text-[var(--text-secondary)]">{calculando ? "" : v.apoio ?? apoio}</div>
  </div>
);

// Spec 052: o bloco "Folha no faturamento" (dono) ou "Custo de pessoal" (gestor e consulta). O mesmo texto da coluna Folha dos
// Cenários: peso depois em 22 px, chip da variação, "hoje X,X%" e os reais por mês; sem dados, uma frase sem números.
const BlocoFolha = ({ t, dono, calculando }) => (
  <div className="min-w-0 rounded-card bg-[var(--surface-subtle)] px-3 py-2.5" data-testid="bloco-folha">
    <div className="text-xs leading-4 text-[var(--text-secondary)]">{cabecalhoDaFolha(dono)}</div>
    {calculando ? (
      <div className="mt-0.5"><Carregando /></div>
    ) : t.tipo === "falta" ? (
      <p className="m-0 mt-1 text-[13px] leading-[18px] text-[var(--text-strong)]" data-testid="folha-falta">{t.frase}</p>
    ) : t.tipo === "chip" ? (
      <div className="mt-1.5"><Chip chip={t.chip} ariaLabel={t.ariaLabel} /></div>
    ) : (
      <>
        <div className="mt-0.5 flex min-h-8 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[22px] leading-8 font-bold text-[var(--text-strong)]" data-testid="folha-peso">{t.peso}</span>
          <Chip chip={t.chip} ariaLabel={t.ariaLabel} />
        </div>
        <div className="text-xs leading-4 text-[var(--text-secondary)]" data-testid="folha-hoje">{t.hoje}</div>
        {t.reais && <div className="text-xs leading-4 text-[var(--text-secondary)]" data-testid="folha-reais">{t.reais}</div>}
      </>
    )}
  </div>
);

const ListaOQueMuda = ({ lista, calculando }) => (
  <div data-testid="o-que-muda">
    <div className="mb-1 text-[11px] leading-4 font-bold tracking-wide text-[var(--text-secondary)]">O QUE MUDA</div>
    <ul className="m-0 flex list-none flex-col p-0">
      {lista.itens.map((i) => (
        <li key={i.chave} data-testid={`muda-${i.chave}`} className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] py-2 text-[13px] leading-5">
          <div className="min-w-0">
            <div className="font-bold text-[var(--text-strong)]">{i.rotulo}</div>
            <div className="text-xs leading-4 text-[var(--text-secondary)]">{calculando ? <Carregando altura="h-3" largura="w-16" /> : i.antesDepois}</div>
          </div>
          <div className="shrink-0 text-right font-bold" style={{ color: COR_DA_LISTA[i.tom] }} data-testid="muda-variacao">{calculando ? "" : i.variacao}</div>
        </li>
      ))}
      {lista.semHoraExtra && <li className="border-b border-[var(--border-subtle)] py-2 text-xs leading-4 text-[var(--text-secondary)]" data-testid="sem-hora-extra">Sem hora extra.</li>}
    </ul>
  </div>
);

// O resultado da simulação (specs 038 e 052): pill de status, venda e folha no faturamento lado a lado, causa, horário dos 7 dias,
// a lista "O que muda" e o que contratar. O dono vê o peso da folha e os reais; gestor e consulta, só o chip do custo.
export default function ResultadoEmHoras({ r, calculando, dono }) {
  const e = r.emHoras;
  if (!e) return null;
  const status = rotuloDoStatus(e.status);
  const venda = textoDaVariacao(e.vendaPct, e.vendaEstado, "venda");
  const folha = pesoDaSimulacao(r, dono);
  const total = textoDoTotal(e.horasAbertas.simulacao, Math.round((e.horasAbertas.simulacao - e.horasAbertas.hoje) * 100) / 100);
  const { novos, antes } = diasDaSimulacao(r.horario);
  const lista = listaOQueMuda(r, dono);
  const contratar = textoContratarSimulacao(e.contratar);

  return (
    <div className="mt-3 flex flex-col gap-4">
      {status && <div><PillDeStatus rotulo={status} /></div>}

      <div className="grid grid-cols-[1fr_1.6fr] gap-2">
        <BlocoVenda v={venda} apoio={apoioDaVenda(e.vendaPct, e.vendaEstado)} calculando={calculando} />
        <BlocoFolha t={folha} dono={dono} calculando={calculando} />
      </div>

      {e.causa && !calculando && (
        <div className="rounded-btn bg-[var(--func-attention-100)] px-3 py-2 text-xs leading-4 font-bold text-[var(--neutral-dark-900)]" data-testid="causa">{e.causa}</div>
      )}

      <div>
        <div className="text-sm leading-5 text-[var(--text-secondary)]">
          Horário · <strong className="text-[var(--text-strong)]">{total.principal}</strong>{" "}
          <span className={total.tom === "neutro" ? "" : "font-bold"} style={total.tom === "neutro" ? undefined : { color: COR[total.tom] }}>{total.mudanca}</span>
        </div>
        <div className="mt-2"><FaixaDosDias dias={faixaDosDias(novos, antes)} /></div>
      </div>

      <ListaOQueMuda lista={lista} calculando={calculando} />

      <div className="flex items-start justify-between gap-3 text-[13px] leading-5">
        <span className="text-[var(--text-secondary)]">Contratar</span>
        <span className="text-right font-bold text-[var(--text-strong)]">{contratar.map((t, i) => <span key={i} className="block">{t}</span>)}</span>
      </div>
    </div>
  );
}
