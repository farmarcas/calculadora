import { Botao } from "../../../components/ui/index.jsx";
import { brl, comparacaoComCenario1, linhasDoHorario, statusDoCartao, totaisDaSemana } from "./cartao-regras.js";
import { consequencias, faltaCurta } from "../comparativo-regras.js";
import { BlocoContratacoes, LinhaOciosas } from "./BlocoContratacoes.jsx";
import BlocoHorario from "./BlocoHorario.jsx";
import FaixaDeResultado from "./FaixaDeResultado.jsx";

const IconeStatus = ({ tom }) =>
  tom === "ok" ? (
    <span aria-hidden="true" className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--func-success-100)] text-[var(--text-success-strong)]">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg>
    </span>
  ) : (
    <span aria-hidden="true" className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--func-attention-100)] text-[var(--neutral-dark-900)] text-xs font-bold">!</span>
  );

// Avisos de um cenário (faixa amarela de consequência, o que falta cobrir e os alertas), usados também para saber se a linha existe.
export const avisosDoCartao = (c, { dono, horasAMenos }) => ({
  consequencia: c.status === "inviavel" ? [] : consequencias(c, { dono, brl, horasAMenos }),
  falta: c.faltaH > 0 ? c.faltaH : 0,
  alertas: c.alertas ?? [],
});
export const temAvisos = (a) => a.consequencia.length > 0 || a.falta > 0 || a.alertas.length > 0;

// O cartão de um cenário, de cima para baixo: título, resultado, status, descrição, [avisos], contratações, horas ociosas,
// horário e botão. Cada bloco é uma linha da grade compartilhada, então os três cartões ficam alinhados.
export default function CartaoCenario({ posicao, c, antes, novos, sugerido, dono, ehReferencia, faixas, avisos, mostrarAvisos, podeEscrever, ocupado, onPersonalizar, onAbrirPainel }) {
  const idTitulo = `cenario-${posicao}-nome`;
  const status = statusDoCartao(c);
  const comparacao = comparacaoComCenario1(c, { ehReferencia, dono }) || (!dono && !ehReferencia && c.faltaPorFuncao?.length > 0 ? `Deixa ${faltaCurta(c.faltaPorFuncao)}` : "");
  const linhas = linhasDoHorario(novos, antes);
  const totais = totaisDaSemana(novos, antes);

  return (
    <section
      aria-labelledby={idTitulo}
      className={`cenarios-cartao rounded-card bg-[var(--surface-card)] shadow-card ${sugerido ? "border-2 border-[var(--system-500)] p-[22px]" : "border border-[var(--border-subtle)] p-6"}`}
      style={{ "--faixas": faixas }}
    >
      <div>
        <div className={`text-[11px] leading-4 font-bold tracking-wide ${sugerido ? "text-[var(--color-primary)]" : "text-[var(--text-secondary)]"}`}>{sugerido ? "CENÁRIO SUGERIDO" : "ALTERNATIVA"}</div>
        <h3 id={idTitulo} className="m-0 mt-1 flex min-h-6 items-center gap-3 text-[18px] leading-[23.4px] font-bold text-[var(--text-strong)]">
          <span aria-hidden="true" className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-btn text-sm leading-6 font-bold text-white ${sugerido ? "bg-[var(--color-primary)]" : "bg-[var(--neutral-dark-900)]"}`}>{posicao}</span>
          <span className="min-w-0 break-words">{c.nome}</span>
        </h3>
      </div>

      <FaixaDeResultado c={c} dono={dono} />

      <div className="min-h-12">
        <div className="flex items-center gap-2 text-sm leading-5 font-bold text-[var(--text-strong)]"><IconeStatus tom={status.tom} />{status.texto}</div>
        {comparacao && <div className="mt-1 text-xs leading-4 text-[var(--text-secondary)]">{comparacao}</div>}
      </div>

      <div className="flex flex-col gap-1">
        <p className="m-0 text-sm leading-5 text-[var(--text-secondary)]">{c.premissa}</p>
        <p className="m-0 text-sm leading-5 font-bold text-[var(--text-strong)]">{c.resultado}</p>
      </div>

      {mostrarAvisos && (
        <div className="flex flex-col gap-2 text-xs leading-4 text-[var(--text-secondary)]">
          {avisos.consequencia.length > 0 && (
            <div className="rounded-btn bg-[var(--func-attention-100)] px-3 py-2 text-[var(--neutral-dark-900)]" data-testid="consequencia">
              {avisos.consequencia.map((l, i) => <p key={i} className={`m-0 ${i === 0 ? "font-bold" : ""}`}>{l}</p>)}
            </div>
          )}
          {avisos.falta > 0 && <div className="font-bold text-[var(--text-strong)]">Ainda falta cobrir {String(avisos.falta).replace(".", ",")}h de cobertura por semana.</div>}
          {avisos.alertas.map((a, i) => <div key={i}>{a}</div>)}
        </div>
      )}

      <BlocoContratacoes contratacoes={c.contratacoes} />
      <LinhaOciosas c={c} dono={dono} />
      <BlocoHorario linhas={linhas} totais={totais} onAbrirPainel={onAbrirPainel} />

      <div className="flex items-end">
        {podeEscrever && (
          <Botao tipo={sugerido ? "primario" : "secundario"} className="w-full" disabled={ocupado} aria-label={`Personalizar cenário ${posicao}: ${c.nome}`} onClick={onPersonalizar}>
            Personalizar
          </Botao>
        )}
      </div>
    </section>
  );
}
