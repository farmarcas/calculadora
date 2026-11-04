import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Botao } from "../../components/ui/index.jsx";
import { composicaoDoSaldo, consequencias, faltaCurta, linhaDeVendaPerdida, rotuloDoMelhor, veredictoDoSaldo, visaoDosCartoes } from "./comparativo-regras.js";

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

const NOME_FUNCAO = { Farmacêutico: "farmacêutico", Atendimento: "atendente", Caixa: "caixa" };
const nomeFuncao = (f, n) => {
  const base = NOME_FUNCAO[f] ?? f.toLowerCase();
  return n > 1 ? `${base}s` : base;
};

// Um chip por tipo de contratação: "1 farmacêutico parcial · 16h", "1 atendente · 42h".
export const chipsDeContratacao = (c) => {
  const parcialH = c.parcial?.horas ?? 0;
  const cheia = c.inteiras > 0 ? Math.round((c.horasContratadas - parcialH) / c.inteiras) : 0;
  const meta = c.motivo === "meta" ? " (opcional)" : "";
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

function Cartao({ posicao, c, descricao, resultado, horarioAtual, horasManter, sugerido, melhorSaldo, dono, ehReferencia, maiorSaldo, faixas, temAvisos, podeEscrever, ocupado, onPersonalizar }) {
  const idTitulo = `cenario-${posicao}-nome`;
  const status = c.status && STATUS[c.status];
  const saldo = dono ? c.saldoMensal : undefined;
  const dif = c.horasSemana - horasManter;
  const pills = [
    sugerido && ["primaria", "Cenário sugerido"],
    melhorSaldo && ["sucesso", rotuloDoMelhor()],
    status,
  ].filter(Boolean);
  const chips = c.contratacoes.flatMap(chipsDeContratacao);
  const mostrados = chips.slice(0, 4);
  const horasOciosas = c.contratacoes.reduce((s, x) => s + (x.horasOciosas ?? 0), 0);
  const custoOciosidade = dono && c.folhaAdicionalMensal > 0 && c.ociosidadePct ? Math.round((c.folhaAdicionalMensal * c.ociosidadePct) / 100) : null;
  const horario = c.ajustes?.length ? c.ajustes.map(linhaDeAjuste).join(", ") : mudancaDeHorario(c.diasFechar, horarioAtual);
  // Cenário inviável não é uma opção: o motivo já está nos avisos, sem somar a faixa de consequência.
  const faixaAmarela = c.status === "inviavel" ? [] : consequencias(c, { dono, brl, horasAMenos: Math.max(0, -dif) });
  const larguraBarra = saldo != null && maiorSaldo > 0 ? Math.min(100, (Math.abs(saldo) / maiorSaldo) * 100) : 0;
  const veredito = veredictoDoSaldo(saldo, ehReferencia);
  const corSaldo = saldo == null || ehReferencia ? "var(--text-strong)" : saldo > 0.005 ? "var(--func-success-300)" : saldo < -0.005 ? "var(--text-danger)" : "var(--text-strong)";
  const sinal = saldo == null ? "" : saldo < -0.005 ? MENOS : saldo > 0.005 ? "+" : "";

  // Sob o saldo: no Cenário 1, a referência; nos outros, o que se perde em cobertura quando não contrata.
  let comparacao = null;
  if (dono && !ehReferencia && c.faltaPorFuncao?.length > 0)
    comparacao = <span className="text-[var(--text-secondary)]">Deixa {faltaCurta(c.faltaPorFuncao)}</span>;
  // Venda perdida por dia alterado e valores anual e de peso no faturamento.
  const vendasPorDia = (c.vendaPerdidaPorDia ?? []).map((d) => linhaDeVendaPerdida(d, brl));

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

      {/* 3 · premissa (fixa) e resultado nesta loja */}
      <div className="min-h-10 flex flex-col gap-1">
        <p className="m-0 line-clamp-2 text-sm leading-5 text-[var(--text-secondary)]" title={descricao}>{curto(descricao)}</p>
        <p className="m-0 text-sm leading-5 font-bold text-[var(--text-strong)]">{resultado}</p>
      </div>

      {/* 4 · saldo */}
      <div className="rounded-card bg-[var(--surface-subtle)] p-4 flex flex-col gap-1 min-h-[134px]">
        <div className="text-xs leading-4 font-bold uppercase text-[var(--neutral-mid-300)]">{ehReferencia ? "Custo de folha adicional por mês" : "Saldo mensal estimado"}</div>
        {dono && ehReferencia ? (
          <>
            <div className="text-[32px] leading-[41.6px] font-bold" style={{ color: c.folhaAdicionalMensal > 0.005 ? "var(--text-danger)" : "var(--text-strong)" }} data-testid="custo-de-folha">
              {c.folhaAdicionalMensal == null ? "—" : `${c.folhaAdicionalMensal > 0.005 ? "+" : ""}${brl(c.folhaAdicionalMensal)}`}
            </div>
            <div className="text-xs leading-4 font-bold text-[var(--text-strong)]">Referência para comparar os outros cenários</div>
            <div className="text-xs leading-4 text-[var(--text-secondary)]">
              {c.folhaAdicionalMensal == null ? "Informe os custos para ver o custo de folha" : `${brl(c.folhaAdicionalMensal * 12)} por ano de folha a mais que a folha atual`}
            </div>
          </>
        ) : dono ? (
          <>
            {c.folhaAdicionalMensal != null && (
              <div className="mb-2 rounded-btn border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2" data-testid="custo-de-folha">
                <div className="text-xs leading-4 font-bold uppercase text-[var(--neutral-mid-300)]">Custo de folha adicional</div>
                <div className="text-[20px] leading-6 font-bold" style={{ color: c.folhaAdicionalMensal > 0.005 ? "var(--text-danger)" : "var(--text-strong)" }}>{c.folhaAdicionalMensal > 0.005 ? "+" : ""}{brl(c.folhaAdicionalMensal)} <span className="text-xs font-normal text-[var(--text-secondary)]">por mês · {brl(c.folhaAdicionalMensal * 12)} por ano</span></div>
              </div>
            )}
            <div className="text-[32px] leading-[41.6px] font-bold" style={{ color: corSaldo }}>{saldo == null ? "—" : `${sinal}${mod(saldo)}`}</div>
            {veredito && <div className="text-xs leading-4 font-bold" style={{ color: corSaldo }}>{veredito}</div>}
            <div className="text-xs leading-4 text-[var(--text-secondary)]">
              {composicaoDoSaldo(c, { brl, ehBase: false })}
            </div>
            {saldo != null && (
              <div className="text-xs leading-4 text-[var(--text-secondary)]">
                {sinal}{mod(c.saldoAnual ?? saldo * 12)} por ano{c.pesoNoFaturamentoPct != null ? ` · ${c.pesoNoFaturamentoPct < 0 ? MENOS : ""}${pct(Math.abs(c.pesoNoFaturamentoPct))} do faturamento mensal` : ""}
              </div>
            )}
            <div
              className="mt-2 h-2 rounded-btn bg-[var(--border-subtle)]"
              role="img"
              aria-label={`Saldo equivale a ${Math.round(larguraBarra)}% do maior saldo entre os cenários`}
            >
              <div className="h-full rounded-btn" style={{ width: `${larguraBarra}%`, background: saldo != null && saldo < -0.005 ? "var(--text-danger)" : saldo != null && saldo > 0.005 ? "var(--func-success-300)" : "var(--neutral-mid-100)" }} />
            </div>
          </>
        ) : (
          <div className="text-sm leading-5 text-[var(--text-secondary)]">Os valores em reais são só do dono do grupo.</div>
        )}
      </div>

      {/* 5 · comparação com o cenário 1 e, quando falta cobertura, a consequência em amarelo */}
      <div className="min-h-5 flex flex-col gap-2 text-sm leading-5">
        {comparacao}
        {faixaAmarela.length > 0 && (
          <div className="rounded-btn px-3 py-2 text-xs leading-4 text-[var(--neutral-dark-900)]" style={ESTILO_PILL.atencao} data-testid="consequencia">
            {faixaAmarela.map((l, i) => <p key={i} className={`m-0 ${i === 0 ? "font-bold" : ""}`}>{l}</p>)}
          </div>
        )}
      </div>

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
      <LinhaTabela rotulo="Venda que deixa de entrar" alta={vendasPorDia.length > 0}>
        <span className="flex flex-col items-end">
          <span className={VALOR}>
            {c.semVendaHoraria ? "Não estimada" : !dono || c.faturamentoPerdidoMensal == null ? (dono ? "—" : vendasPorDia.length ? "Veja os dias" : "—") : c.faturamentoPerdidoMensal === 0 ? "Nenhuma" : `${brl(c.faturamentoPerdidoMensal)} por mês${c.faturamentoPerdidoPct != null ? ` (${pct(c.faturamentoPerdidoPct)})` : ""}`}
          </span>
          {vendasPorDia.map((l) => <span key={l} className="text-xs leading-4 text-[var(--text-secondary)]">{l}</span>)}
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
  // O selo "Cenário sugerido" pode ir a outro cenário que não o de menor custo (quando este deixa falta de cobertura).
  const sugeridoId = comparativo.sugerido !== undefined ? comparativo.sugerido : destaque;
  const visao = visaoDosCartoes(comparativo);
  const dono = colunas[0].custoFolhaMensal !== undefined;
  const horarioAtual = cenarios?.manter?.horarioSemana;
  const horasManter = colunas.find((x) => x.id === "manter").horasSemana;

  const saldos = colunas.map((x) => (dono && typeof x.saldoMensal === "number" ? Math.abs(x.saldoMensal) : null)).filter((v) => v !== null);
  const maiorSaldo = saldos.length ? Math.max(...saldos) : 0;
  const comSaldo = colunas.filter((x) => dono && x.status === "viavel" && typeof x.saldoMensal === "number").map((x) => x.saldoMensal);
  const melhor = comSaldo.length ? Math.max(...comSaldo) : null;
  // "Melhor saldo": só quando há mais de um cenário comparável e ninguém empata com o maior.
  const unicoMelhor = melhor !== null && comSaldo.length >= 2 && comSaldo.filter((v) => Math.abs(v - melhor) < 0.005).length === 1;
  const temAvisos = visao.visiveis.some((x) => x.alertas.length > 0 || x.faltaH > 0);
  const faixas = FAIXAS + (temAvisos ? 1 : 0);

  const personalizar = async (c, n) => {
    setErro(null);
    setOcupado(true);
    try {
      const corpo = { nome: `Cenário ${n}: ${c.nome}`.slice(0, 80), regra: cenarios.regra.id };
      let s;
      let aviso = null;
      try {
        s = await api(`/lojas/${lojaId}/simulacoes`, { method: "POST", body: { ...corpo, origem: "escala_atual" } });
      } catch (e) {
        // Sem escala importada: a simulação parte do quadro do Cadastro, sem turnos.
        if (!/Importe a escala atual/.test(e.message)) throw e;
        s = await api(`/lojas/${lojaId}/simulacoes`, { method: "POST", body: { ...corpo, origem: "vazia" } });
        aviso = "Esta loja ainda não tem escala importada: a simulação parte do quadro do Cadastro, sem turnos. Contratações, horários e impacto já funcionam; para montar a escala, importe a planilha em Enviar planilhas.";
      }
      const vagas = vagasDeCenario(c);
      // A simulação já nasce com as contratações e os horários do cenário clicado (o Cenário 1 mantém o horário do Cadastro).
      const cadastro = s.resultado?.horario?.cadastro;
      const horarios = c.ajustes?.length && cadastro?.length === 7
        ? { versao: 2, dias: cadastro.map((h, i) => {
            const aj = c.ajustes.find((a) => a.dia === i);
            if (aj) return aj.depois ? { aberta: true, abre: aj.depois.abre, fecha: aj.depois.fecha } : { aberta: false };
            return h.aberta ? { aberta: true, abre: h.abre, fecha: h.fecha } : { aberta: false };
          }) }
        : null;
      if (vagas.length || horarios) await api(`/simulacoes/${s.id}`, { method: "PUT", body: { ...(vagas.length ? { vagas } : {}), ...(horarios ? { horarios } : {}) } });
      onSimular?.(s.id, aviso);
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
          Estimativas para a regra de {cenarios?.regra?.nome ?? "referência"}, com o quadro{dono ? ", os salários" : ""} e a base comercial importados. Cada hora nova de funcionamento vale, por estimativa, 50% da venda da hora vizinha. Nada altera o cadastro.
        </p>
      </div>
      {erro && <Aviso>{erro}</Aviso>}
      {visao.cobreTudo ? (
        <p className="m-0 rounded-card border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 text-sm leading-5 text-[var(--text-strong)]" data-testid="cobre-tudo">
          A equipe atual cobre todos os dias. Não há o que contratar nem reduzir.
        </p>
      ) : (
      <div className="cenarios-grade" style={{ "--colunas": visao.visiveis.length }}>
        {visao.visiveis.map((c) => (
          <Cartao
            key={c.id}
            posicao={colunas.indexOf(c) + 1}
            c={c}
            descricao={c.premissa}
            resultado={c.resultado}
            horarioAtual={horarioAtual}
            horasManter={horasManter}
            sugerido={sugeridoId === c.id}
            melhorSaldo={unicoMelhor && destaque === c.id}
            dono={dono}
            ehReferencia={c.id === "manter"}
            maiorSaldo={maiorSaldo}
            faixas={faixas}
            temAvisos={temAvisos}
            podeEscrever={podeEscrever && !!lojaId && !!cenarios?.regra}
            ocupado={ocupado}
            onPersonalizar={() => personalizar(c, colunas.indexOf(c) + 1)}
          />
        ))}
      </div>
      )}
      {visao.recolhido && (
        <p className="m-0 text-sm leading-5 text-[var(--text-secondary)]" data-testid="recolhido">
          Cenário {colunas.indexOf(colunas.find((x) => x.id === visao.recolhido.id)) + 1} · {visao.recolhido.nome}: mesmo resultado do Cenário {visao.recolhido.de}.
        </p>
      )}
    </section>
  );
}
