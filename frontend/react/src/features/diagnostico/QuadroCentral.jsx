import { useRef } from "react";
import { AlertaRegime, DicaComposicao, NOME_REGIME, pct } from "./Encargos.jsx";
import { calculoDaRegra, estadoDoCard, hojeSP, horas, isoDeVigencia, saldoTxt } from "./cardDiagnostico.js";

const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
const RAIA = { 44: "Hoje · 44h", 42: "42h", 40: "40h" };
const ROTULO = "text-xs leading-4 font-bold uppercase text-[var(--neutral-mid-300)]";
const LINK = "font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] bg-transparent border-0 p-0 cursor-pointer text-sm underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]";

// As três regras com o que o card precisa de cada uma.
const regrasDoCard = (diag) =>
  diag.regras.map((r) => {
    const jornada = r.id === "atual" ? 44 : r.id === "r42" ? 42 : 40;
    const iso = isoDeVigencia(r.vigencia);
    return { id: r.id, jornada, iso, vigenciaTxt: r.vigencia, calculo: calculoDaRegra(r), regra: r };
  });

function Abas({ regras, valor, onChange }) {
  const refs = useRef([]);
  const onKey = (e, i) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const j = (i + (e.key === "ArrowRight" ? 1 : regras.length - 1)) % regras.length;
    onChange(regras[j].id);
    refs.current[j]?.focus();
  };
  return (
    <div role="tablist" aria-label="Regra do diagnóstico" className="flex overflow-x-auto border border-line rounded-btn bg-[var(--surface-card)]">
      {regras.map((r, i) => {
        const ativa = r.id === valor;
        return (
          <button
            key={r.id}
            ref={(el) => (refs.current[i] = el)}
            role="tab"
            type="button"
            aria-selected={ativa}
            tabIndex={ativa ? 0 : -1}
            onClick={() => onChange(r.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={`min-h-11 px-5 py-1.5 text-left whitespace-nowrap border-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--border-focus)] ${ativa ? "bg-[var(--neutral-dark-900)] text-white" : "bg-transparent text-[var(--text-secondary)]"}`}
          >
            <span className="block text-sm leading-[18px] font-bold">Regra de {r.jornada}h</span>
            <span className="block text-xs leading-4 font-normal">{r.jornada === 44 ? "em vigor hoje" : r.iso && r.iso <= hojeSP() ? "em vigor" : `a partir de ${r.vigenciaTxt}`}</span>
          </button>
        );
      })}
    </div>
  );
}

function Barras({ regras, selecionada }) {
  const maior = Math.max(0, ...regras.map((r) => r.calculo?.gap ?? 0));
  const g44 = regras.find((r) => r.jornada === 44)?.calculo?.gap;
  return (
    <div className="flex flex-col gap-2">
      <div className={ROTULO}>Horas de farmacêutico que faltam por semana</div>
      {regras.map((r) => {
        const ativa = r.id === selecionada.id;
        const sem = !r.calculo;
        const gap = r.calculo?.gap ?? 0;
        const cor = r.jornada === 44 ? "var(--neutral-mid-100)" : gap > 0 ? "var(--func-warning-300)" : "var(--func-success-300)";
        return (
          <div key={r.id} className="flex items-center gap-3">
            <span className={`w-20 shrink-0 text-sm ${ativa ? "font-bold text-[var(--text-strong)]" : "font-normal text-[var(--text-secondary)]"}`}>{RAIA[r.jornada]}</span>
            {sem ? (
              <span className="h-3 flex-1 max-w-[280px] rounded-btn border border-dashed border-[var(--border-strong)]" role="img" aria-label="sem cálculo" />
            ) : (
              <span className="h-3 flex-1 max-w-[280px] rounded-btn bg-[var(--surface-subtle)] overflow-hidden" role="img" aria-label={`${horas(gap)} por semana na regra de ${r.jornada}h`}>
                <span className="block h-full rounded-btn" style={{ width: `${maior ? (gap / maior) * 100 : 0}%`, background: ativa || r.jornada === 44 ? cor : "var(--neutral-mid-100)" }} />
              </span>
            )}
            <span className="text-sm leading-5 font-bold text-[var(--text-strong)]">
              {sem ? "—" : horas(gap)}
              {!sem && r.jornada !== 44 && g44 != null && gap !== g44 && (
                <span className="font-normal text-[var(--text-secondary)]"> ({gap - g44 > 0 ? "+" : "−"}{horas(Math.abs(gap - g44))})</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Celula({ rotulo, valor, sub, dica, children }) {
  return (
    <div className="bg-[var(--surface-card)] p-4 flex flex-col gap-1 min-w-0">
      <div className={`${ROTULO} flex items-center gap-1.5`}>
        {rotulo}
        {dica}
      </div>
      <div className="text-[28px] leading-9 font-bold text-[var(--text-strong)]">{valor}</div>
      {sub && <div className="text-xs leading-4 text-[var(--text-secondary)]">{sub}</div>}
      {children}
    </div>
  );
}

// O quadro central da aba Diagnóstico: a resposta primeiro ("quanto falta de farmacêutico e o que faço?"), depois a evolução
// 44h → 42h → 40h, os números de apoio (com a folha) e, no fim, as pendências.
export default function QuadroCentral({ diag, regraId, onRegra, podeEscrever, onEnviar, onRecarregar, onDefinirFuncao }) {
  const regras = regrasDoCard(diag);
  const sel = regras.find((r) => r.id === regraId) ?? regras[0];
  const c = sel.calculo;
  const estado = estadoDoCard(sel, regras);
  const n = diag.numeros;
  const folha = diag.folhaMensal;
  const baseEnviada = !!diag.fontes?.base;
  const mostrarNota = sel.jornada !== 44 && !diag.config?.convencao8h24;

  // Pendências: as que existem vão para a esquerda do rodapé; a frase da direita só cita o que está em dia.
  const pendencias = [];
  if (n.foraDoCalculo > 0)
    pendencias.push({
      chave: "fora",
      texto: `${plural(n.foraDoCalculo, "colaborador está", "colaboradores estão")} sem função de escala e fora do cálculo.`,
      acao: onDefinirFuncao && <button type="button" className={LINK} onClick={onDefinirFuncao}>Definir função</button>,
    });
  if (n.faixasSemFarmaceutico > 0)
    pendencias.push({ chave: "semfarm", texto: `${plural(n.faixasSemFarmaceutico, "hora", "horas")} do pior dia ficam sem farmacêutico.` });
  if (n.faixasAbaixoDoMinimo > 0)
    pendencias.push({ chave: "meta", texto: `${plural(n.faixasAbaixoDoMinimo, "hora", "horas")} do pior dia ficam abaixo da meta.` });
  if (n.linhasRejeitadas > 0)
    pendencias.push({ chave: "linhas", texto: `${plural(n.linhasRejeitadas, "linha rejeitada", "linhas rejeitadas")} na importação da escala.` });
  const emDia = [
    n.faixasSemFarmaceutico === 0 && "cobertura de farmacêutico",
    n.faixasAbaixoDoMinimo === 0 && "metas",
    n.linhasRejeitadas === 0 && "importação",
  ].filter(Boolean);
  const fraseEmDia =
    emDia.length === 3 ? "Sem pendências em cobertura, metas e importação." : emDia.length ? `Sem pendências em ${emDia.slice(0, -1).join(", ")}${emDia.length > 1 ? " e " : ""}${emDia[emDia.length - 1]}.` : null;
  const detalhes = `Horas do pior dia sem farmacêutico: ${n.faixasSemFarmaceutico} · horas abaixo da meta: ${n.faixasAbaixoDoMinimo} · linhas rejeitadas na importação: ${n.linhasRejeitadas}`;

  return (
    <section aria-label="Diagnóstico da escala" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <h2 className="m-0 text-xl leading-[26px] font-bold text-[var(--text-strong)]">Diagnóstico da escala</h2>
        <Abas regras={regras} valor={sel.id} onChange={onRegra} />
      </div>

      <div className="bg-[var(--surface-card)] border border-line rounded-card shadow-card p-6 flex flex-col gap-4">
        <div className="grid grid-cols-1 min-[900px]:grid-cols-2 gap-x-8 gap-y-6 items-start">
          <div className="flex flex-col gap-3 min-w-0">
            <span className="self-start rounded-full px-3 py-1 text-xs leading-4 font-bold text-[var(--neutral-dark-900)]" style={{ background: estado.fundo }}>
              {estado.pill}
            </span>
            <h3 className="m-0 text-[28px] leading-9 font-bold text-[var(--text-strong)]">{estado.titulo}</h3>
            <p className="m-0 text-sm leading-5 text-[var(--text-secondary)]">{estado.apoio}</p>
            <Barras regras={regras} selecionada={sel} />
          </div>

          <div className="grid grid-cols-2 gap-px bg-[var(--border-subtle)] border border-line rounded-card overflow-hidden">
            <Celula rotulo="Contratações sugeridas" valor={c ? (c.contratacoes > 0 ? plural(c.contratacoes, "pessoa", "pessoas") : "Nenhuma") : "—"} sub={c ? null : "Sem cálculo para esta regra"} />
            <Celula rotulo="Turnos de farmacêutico" valor={c ? `${c.turnosAcobrir} a cobrir` : "—"} sub={c ? `Por semana, na regra de ${sel.jornada}h` : "Sem cálculo para esta regra"} />
            {folha?.informado ? (
              <Celula
                rotulo="Folha mensal atual"
                dica={folha.encargos && folha.mensal !== null ? <DicaComposicao encargos={folha.encargos} /> : null}
                valor={folha.mensal === null ? "—" : brl(folha.mensal)}
                sub={folha.mensal === null ? `Falta o salário médio de ${folha.faltamInformar.join(", ")}` : `Salários + encargos de ${pct(folha.encargosPct)}${folha.encargos ? ` (${NOME_REGIME[folha.encargos.regime]})` : ""} · ${plural(n.colaboradoresNoCalculo, "funcionário", "funcionários")}`}
              />
            ) : folha ? (
              <Celula rotulo="Folha mensal atual" valor="—" sub="Informe os custos em Cadastro de Loja › Editar › Funcionários e configuração" />
            ) : (
              <Celula rotulo="Funcionários no cálculo" valor={n.colaboradoresNoCalculo} sub="Da escala atual" />
            )}
            <Celula rotulo="Equipe toda" valor={c ? saldoTxt(c.saldoHoras) : "—"} sub={c ? "Por semana: capacidade menos necessidade ou meta" : "Sem cálculo para esta regra"} />
          </div>
        </div>

        {mostrarNota && (
          <p className="m-0 text-xs leading-4 text-[var(--text-secondary)]">Sem convenção que permita jornada de 8h24, na prática a escala fica em 40h por semana (5 × 8h).</p>
        )}

        <div className="border-t border-line pt-3 flex flex-wrap items-center justify-between gap-x-8 gap-y-2">
          <div className="flex flex-col gap-1">
            {pendencias.map((p, i) => (
              <div key={p.chave} className="flex flex-wrap items-center gap-2 text-sm leading-5 text-[var(--text-secondary)]" title={detalhes}>
                {i === 0 && <span className="rounded-full px-2.5 py-0.5 text-xs leading-4 font-bold text-[var(--neutral-dark-900)] bg-[var(--func-attention-100)]">{plural(pendencias.length, "pendência", "pendências")}</span>}
                <span>{p.texto}</span>
                {p.acao}
              </div>
            ))}
          </div>
          <div className="text-sm leading-5 text-[var(--text-secondary)]" title={detalhes}>
            {fraseEmDia && <>{fraseEmDia} </>}
            {podeEscrever ? (
              <button type="button" className={LINK} onClick={onEnviar}>{baseEnviada ? "Atualizar base comercial" : "Enviar base comercial"}</button>
            ) : (
              <span>{baseEnviada ? "Base comercial enviada" : "Base comercial não enviada"}</span>
            )}{" "}
            {!baseEnviada && "(opcional)"}
          </div>
        </div>
      </div>

      {folha?.informado && folha.alertaRegime && (
        <div className="px-1">
          <AlertaRegime lojaId={diag.loja.id} texto={folha.alertaRegime} onSalvo={onRecarregar} />
        </div>
      )}
    </section>
  );
}
