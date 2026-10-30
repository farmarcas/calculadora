import { useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Botao } from "../../components/ui/index.jsx";

const NOMES_DIA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const mod = (n) => brl(Math.abs(n));
const pct = (n) => `${String(n).replace(".", ",")}%`;
const horas = (n) => `${String(Math.round(n * 100) / 100).replace(".", ",")}h`;
const hh = (t) => (t ? `${t.slice(0, 2)}h` : "");
const MENOS = "−"; // sinal de menos tipográfico (U+2212)

// Quantas faixas o cartão tem (cada uma vira uma linha da grade compartilhada): as 11 do desenho e, só quando algum cartão
// tem avisos ou falta cobrir, a faixa de avisos antes do botão.
const FAIXAS = 11;

const ESTILO_PILL = {
  primaria: { background: "var(--color-primary)", color: "var(--text-inverse)" },
  sucesso: { background: "var(--func-success-100)", color: "var(--neutral-dark-900)" },
  atencao: { background: "var(--func-attention-100)", color: "var(--neutral-dark-900)" },
  alerta: { background: "var(--func-warning-50)", color: "var(--neutral-dark-900)" },
};
const STATUS = { nao_recomendado: ["atencao", "Não recomendado"], nao_resolve: ["atencao", "Não resolve sozinho"], inviavel: ["alerta", "Inviável"] };

const NOME_FUNCAO = { Farmacêutico: "farmacêutico", Atendimento: "atendente", Caixa: "caixa", Apoio: "apoio", Perfumaria: "perfumaria" };
const nomeFuncao = (f, n) => {
  const base = NOME_FUNCAO[f] ?? f.toLowerCase();
  return n > 1 ? `${base}s` : base;
};

// Um chip por tipo de contratação: "1 farmacêutico parcial · 16h", "1 atendente · 42h".
export const chipsDeContratacao = (c) => {
  const parcialH = c.parcial?.horas ?? 0;
  const cheia = c.inteiras > 0 ? Math.round((c.horasContratadas - parcialH) / c.inteiras) : 0;
  const meta = c.motivo === "meta" ? " (meta)" : "";
  return [
    ...(c.inteiras > 0 ? [`${c.inteiras} ${nomeFuncao(c.funcao, c.inteiras)} · ${cheia}h${meta}`] : []),
    ...(parcialH > 0 ? [`1 ${nomeFuncao(c.funcao, 1)} parcial · ${horas(parcialH)}${meta}`] : []),
  ];
};

// As vagas do cenário para o simulador: inteiras na jornada cheia e o parcial com as horas dele (a vaga pede 4 a 44 h inteiras).
const vagasDeCenario = (c) =>
  c.contratacoes.flatMap((x) => {
    const parcialH = x.parcial?.horas ?? 0;
    const cheia = x.inteiras > 0 ? Math.round((x.horasContratadas - parcialH) / x.inteiras) : 0;
    const limite = (h) => Math.min(44, Math.max(4, Math.round(h)));
    return [
      ...Array.from({ length: x.inteiras }, () => ({ funcao: x.funcao, cargaH: limite(cheia) })),
      ...(parcialH > 0 ? [{ funcao: x.funcao, cargaH: limite(parcialH) }] : []),
    ];
  });

// Fim de semana que muda: "Dom 08h–16h (antes 08h–22h)" · "Sáb fechado (antes 08h–22h)".
const linhaDeAjuste = (a) =>
  a.depois
    ? `${NOMES_DIA[a.dia]} ${hh(a.depois.abre)}–${hh(a.depois.fecha)} (antes ${hh(a.antes.abre)}–${hh(a.antes.fecha)})`
    : `${NOMES_DIA[a.dia]} fechado (antes ${hh(a.antes.abre)}–${hh(a.antes.fecha)})`;
const mudancaDeHorario = (dias, horarioAtual) => {
  if (dias.length === 0) return "Mantido";
  const nome = (d) => NOMES_DIA[d];
  if (dias.length === 1) {
    const h = horarioAtual?.find((x) => x.dia === dias[0]);
    return `${nome(dias[0])} fechado${h?.abre ? ` (antes ${hh(h.abre)}–${hh(h.fecha)})` : ""}`;
  }
  const lista = dias.map((d, i) => (i === 0 ? nome(d) : nome(d).toLowerCase()));
  return `${lista.slice(0, -1).join(", ")} e ${lista[lista.length - 1]} fechados`;
};

const curto = (t, n = 110) => (t && t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t);

const ROTULO = "text-sm leading-5 text-[var(--text-secondary)]";
const VALOR = "text-sm leading-5 font-bold text-[var(--text-strong)] text-right";

// Linha da tabela do miolo: rótulo à esquerda, valor à direita, na mesma altura nos três cartões.
const LinhaTabela = ({ rotulo, children, ultima, alta }) => (
  <div className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-1 ${alta ? "min-h-[60px]" : "min-h-11"} ${ultima ? "" : "border-b border-line"}`}>
    <span className={ROTULO}>{rotulo}</span>
    <span className="min-w-0 max-w-full ml-auto">{children}</span>
  </div>
);

function Cartao({ posicao, c, descricao, horarioAtual, horasManter, sugerido, menorImpacto, maisCara, dono, ehReferencia, maiorImpacto, impactoRef, faixas, temAvisos, podeEscrever, ocupado, onPersonalizar }) {
  const idTitulo = `cenario-${posicao}-nome`;
  const status = c.status && STATUS[c.status];
  const impacto = dono ? c.resultadoLiquidoMensal : undefined;
  const dif = c.horasSemana - horasManter;
  const pills = [
    sugerido && ["primaria", "Cenário sugerido"],
    menorImpacto && ["sucesso", "Menor impacto mensal"],
    status,
    maisCara && ["atencao", "Mais cara que manter"],
  ].filter(Boolean);
  const chips = c.contratacoes.flatMap(chipsDeContratacao);
  const mostrados = chips.slice(0, 4);
  const horasOciosas = c.contratacoes.reduce((s, x) => s + (x.horasOciosas ?? 0), 0);
  const custoOciosidade = dono && c.folhaAdicionalMensal > 0 && c.ociosidadePct ? Math.round((c.folhaAdicionalMensal * c.ociosidadePct) / 100) : null;
  const horario = c.ajustes?.length ? c.ajustes.map(linhaDeAjuste).join(", ") : mudancaDeHorario(c.diasFechar, horarioAtual);
  const larguraBarra = impacto != null && maiorImpacto > 0 ? Math.min(100, (Math.abs(impacto) / maiorImpacto) * 100) : 0;

  let comparacao = null;
  if (dono) {
    const d = c.ganhoFrenteManterMensal;
    if (ehReferencia) comparacao = <span className="text-[var(--text-secondary)]">Referência para comparar os outros cenários</span>;
    else if (d == null) comparacao = <span className="text-[var(--text-secondary)]">Sem comparação disponível</span>;
    else if (d < 0) comparacao = <span className="font-bold text-[var(--func-warning-300)]">{mod(d)} a mais por mês que o Cenário 1</span>;
    else if (d > 0) comparacao = <span className="font-bold text-[var(--text-strong)]">{mod(d)} a menos por mês que o Cenário 1</span>;
    else comparacao = <span className="text-[var(--text-secondary)]">Igual ao Cenário 1</span>;
  }

  return (
    <section
      aria-labelledby={idTitulo}
      className={`cenarios-cartao rounded-card bg-[var(--surface-card)] shadow-card ${sugerido ? "border-2 border-[var(--system-500)] p-[22px]" : "border border-[var(--border-subtle)] p-6"}`}
      style={{ "--faixas": faixas }}
    >
      {/* 1 · título */}
      <h3 id={idTitulo} className="m-0 flex min-h-6 items-center gap-3 text-[18px] leading-[23.4px] font-bold text-[var(--text-strong)]">
        <span aria-hidden="true" className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-btn text-sm leading-6 font-bold text-white ${sugerido ? "bg-[var(--color-primary)]" : "bg-[var(--neutral-dark-900)]"}`}>{posicao}</span>
        <span className="min-w-0 break-words">{c.nome}</span>
      </h3>

      {/* 2 · pills */}
      <div className="flex min-h-6 flex-wrap items-center gap-2">
        {pills.map(([tom, texto]) => (
          <span key={texto} className="rounded-full px-3 py-1 text-xs leading-4 font-bold whitespace-nowrap" style={ESTILO_PILL[tom]}>{texto}</span>
        ))}
      </div>

      {/* 3 · descrição (até 2 linhas) */}
      <p className="m-0 min-h-10 line-clamp-2 text-sm leading-5 text-[var(--text-secondary)]" title={descricao}>{curto(descricao)}</p>

      {/* 4 · impacto */}
      <div className="rounded-card bg-[var(--surface-subtle)] p-4 flex flex-col gap-1 min-h-[134px]">
        <div className="text-xs leading-4 font-bold uppercase text-[var(--neutral-mid-300)]">Impacto mensal estimado</div>
        {dono ? (
          <>
            <div className="text-[32px] leading-[41.6px] font-bold text-[var(--text-strong)]">{impacto == null ? "—" : `${impacto < 0 ? MENOS : impacto > 0 ? "+" : ""}${mod(impacto)}`}</div>
            <div className="text-xs leading-4 text-[var(--text-secondary)]">
              {c.folhaAdicionalMensal == null ? "Informe os custos para ver a composição" : `Folha adicional ${brl(c.folhaAdicionalMensal)}${c.margemMes == null ? "" : ` + margem perdida ${brl(Math.abs(c.margemMes))}`}`}
            </div>
            <div
              className="mt-2 h-2 rounded-btn bg-[var(--border-subtle)]"
              role="img"
              aria-label={`Impacto equivale a ${Math.round(larguraBarra)}% do maior cenário`}
            >
              <div className="h-full rounded-btn" style={{ width: `${larguraBarra}%`, background: sugerido ? "var(--color-primary)" : "var(--neutral-mid-100)" }} />
            </div>
          </>
        ) : (
          <div className="text-sm leading-5 text-[var(--text-secondary)]">Os valores em reais são só do dono do grupo.</div>
        )}
      </div>

      {/* 5 · comparação com o cenário 1 */}
      <div className="min-h-5 text-sm leading-5">{comparacao}</div>

      {/* 6 · contratações */}
      <div className="min-h-24 border-b border-line pb-3 flex flex-col gap-2">
        <span className={ROTULO}>Contratações</span>
        <div className="flex flex-wrap gap-2">
          {mostrados.length === 0 ? (
            <span className="rounded-full bg-[var(--surface-subtle)] px-3 py-1 text-xs leading-4 font-medium text-[var(--text-default)]">Nenhuma</span>
          ) : (
            mostrados.map((t) => <span key={t} className="rounded-full bg-[var(--surface-subtle)] px-3 py-1 text-xs leading-4 font-medium text-[var(--text-default)]">{t}</span>)
          )}
          {chips.length > mostrados.length && (
            <span className="rounded-full bg-[var(--surface-subtle)] px-3 py-1 text-xs leading-4 font-medium text-[var(--text-default)]" title={chips.slice(mostrados.length).join(" · ")}>+{chips.length - mostrados.length}</span>
          )}
        </div>
      </div>

      {/* 7 a 10 · tabela do miolo */}
      <LinhaTabela rotulo="Horário">
        <span className={`${VALOR} block break-words`} title={horario}>{horario}</span>
      </LinhaTabela>
      <LinhaTabela rotulo="Horas abertas">
        <span className={VALOR}>
          {c.horasSemana}h por semana{dif !== 0 && ` (${dif < 0 ? MENOS : "+"}${Math.abs(dif)}h)`}
        </span>
      </LinhaTabela>
      <LinhaTabela rotulo="Vendas perdidas">
        <span className={VALOR}>
          {!dono || c.faturamentoPerdidoMensal == null ? "—" : c.faturamentoPerdidoMensal === 0 ? "Nenhuma" : `${brl(c.faturamentoPerdidoMensal)} por mês${c.faturamentoPerdidoPct != null ? ` (${pct(c.faturamentoPerdidoPct)})` : ""}`}
        </span>
      </LinhaTabela>
      <LinhaTabela rotulo="Horas ociosas da equipe" ultima alta>
        <span className="flex flex-col items-end">
          <span className={VALOR}>{!c.ociosidadePct ? "Nenhuma" : `${horas(horasOciosas)} por semana (${pct(c.ociosidadePct)})`}</span>
          {custoOciosidade != null && <span className="text-xs leading-4 text-[var(--text-secondary)]">custam {brl(custoOciosidade)} por mês</span>}
        </span>
      </LinhaTabela>

      {/* avisos (só quando algum cartão tem): status, o que ainda falta cobrir */}
      {temAvisos && (
        <div className="flex flex-col gap-1 text-xs leading-4 text-[var(--text-secondary)]">
          {c.faltaH > 0 && <div className="font-bold text-[var(--text-strong)]">Ainda falta cobrir {horas(c.faltaH)} de cobertura por semana.</div>}
          {c.alertas.map((a, i) => <div key={i}>{a}</div>)}
        </div>
      )}

      {/* 11 · botão */}
      <div className="flex items-end">
        {podeEscrever && (
          <Botao
            tipo={sugerido ? "primario" : "secundario"}
            className="w-full"
            disabled={ocupado}
            aria-label={`Personalizar cenário ${posicao}: ${c.nome}`}
            onClick={onPersonalizar}
          >
            Personalizar
          </Botao>
        )}
      </div>
    </section>
  );
}

// Os cenários 1, 2 e 3 lado a lado para a regra escolhida. Cada faixa fica na mesma altura nos três cartões (grade com
// subgrid). Só o dono recebe os valores em reais e o cenário sugerido.
export default function Comparativo({ comparativo, cenarios, lojaId, podeEscrever, onSimular }) {
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState(null);
  if (!comparativo) return null;
  const { cenarios: colunas, destaque } = comparativo;
  const dono = colunas[0].custoFolhaMensal !== undefined;
  const horarioAtual = cenarios?.manter?.horarioSemana;
  // A descrição é o foco do cenário (curto, sem números): o resumo e as contas ficam nos blocos abaixo dela.
  const descricoes = { manter: cenarios?.manter?.foco, economia: cenarios?.economia?.foco, equilibrio: cenarios?.equilibrio?.foco };
  const horasManter = colunas.find((x) => x.id === "manter").horasSemana;

  const impactos = colunas.map((x) => (dono && typeof x.resultadoLiquidoMensal === "number" ? Math.abs(x.resultadoLiquidoMensal) : null)).filter((v) => v !== null);
  const maiorImpacto = impactos.length ? Math.max(...impactos) : 0;
  const valores = colunas.filter((x) => dono && x.status === "viavel" && typeof x.resultadoLiquidoMensal === "number").map((x) => Math.abs(x.resultadoLiquidoMensal));
  const menor = valores.length ? Math.min(...valores) : null;
  // "Menor impacto mensal": só quando há mais de um cenário comparável e ninguém empata com o menor.
  const unicoMenor = menor !== null && valores.length >= 2 && valores.filter((v) => Math.abs(v - menor) < 0.005).length === 1;
  const temAvisos = colunas.some((x) => x.alertas.length > 0 || x.faltaH > 0);
  const faixas = FAIXAS + (temAvisos ? 1 : 0);

  const personalizar = async (c, n) => {
    setErro(null);
    setOcupado(true);
    try {
      const s = await api(`/lojas/${lojaId}/simulacoes`, { method: "POST", body: { nome: `Cenário ${n}: ${c.nome}`.slice(0, 80), regra: cenarios.regra.id, origem: "escala_atual" } });
      const vagas = vagasDeCenario(c);
      if (vagas.length) await api(`/simulacoes/${s.id}`, { method: "PUT", body: { vagas } });
      onSimular?.(s.id);
    } catch (e) {
      setErro(e.message);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <section aria-label="Cenários sugeridos" className="cenarios-conteiner flex flex-col gap-4">
      <div>
        <h2 className="m-0 text-xl leading-[26px] font-bold text-[var(--text-strong)]">Cenários sugeridos</h2>
        <p className="mt-1 mb-0 text-sm leading-5 text-[var(--text-secondary)]">
          Estimativas para a regra de {cenarios?.regra?.nome ?? "referência"}, com o quadro{dono ? ", os salários" : ""} e a base comercial importados. Nada altera o cadastro.
        </p>
      </div>
      {erro && <Aviso>{erro}</Aviso>}
      <div className="cenarios-grade">
        {colunas.map((c, i) => (
          <Cartao
            key={c.id}
            posicao={i + 1}
            c={c}
            descricao={descricoes[c.id]}
            horarioAtual={horarioAtual}
            horasManter={horasManter}
            sugerido={destaque === c.id}
            menorImpacto={unicoMenor && destaque === c.id}
            maisCara={dono && c.id === "equilibrio" && typeof c.ganhoFrenteManterMensal === "number" && c.ganhoFrenteManterMensal < 0}
            dono={dono}
            ehReferencia={c.id === "manter"}
            maiorImpacto={maiorImpacto}
            faixas={faixas}
            temAvisos={temAvisos}
            podeEscrever={podeEscrever && !!lojaId && !!cenarios?.regra}
            ocupado={ocupado}
            onPersonalizar={() => personalizar(c, i + 1)}
          />
        ))}
      </div>
    </section>
  );
}
