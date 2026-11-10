import type {
  CenariosRegra,
  Contratacao,
  EntradaCenarios,
  HorarioAjustado,
  VendaPerdidaDiaCenario,
} from './cenarios.js';
import { saldoDaOperacao } from './saldo-operacao.js';

// Comparativo dos cenários 1, 2 e 3 lado a lado, para a fase escolhida. Os cenários 4 (abrir um dia) e 5 (reduzir
// equipe) seguem como cartões à parte e ficam fora da tabela e do destaque.
export type StatusCenario = 'viavel' | 'nao_recomendado' | 'inviavel' | 'nao_resolve';
export type IdColuna = 'manter' | 'economia' | 'equilibrio';

export type ColunaComparativo = {
  id: IdColuna;
  nome: string;
  // Premissa fixa do cenário (igual em toda loja) e o que acontece nesta loja.
  premissa: string;
  resultado: string;
  // Só no Cenário 2: horas por semana abaixo do nível de hoje, por função, e horas sem farmacêutico (0 se coberto).
  faltaPorFuncao?: { funcao: string; horasSemana: number }[];
  semFarmaceuticoH?: number;
  // Só no Cenário 3: o cenário de que ele é cópia e que a tela mostra recolhido.
  recolher?: 'manter' | 'economia' | null;
  // Só no Cenário 3: abre horas a mais e a venda delas é estimada (a tela avisa).
  estimativaDeVenda?: boolean;
  contratacoes: Contratacao[];
  // Dias da semana que o cenário fecha (0 = segunda); nenhum no Cenário 1.
  diasFechar: number[];
  horasSemana: number;
  // Fim de semana que muda (redução ou fechamento) e, quando o corte não basta, quantas horas ainda faltam.
  ajustes: HorarioAjustado[];
  faltaH: number | null;
  // Nulo quando o cenário não pode ser calculado por falta de dado (o alerta diz o que falta).
  status: StatusCenario | null;
  alertas: string[];
  // Folga das contratações do cenário (% das horas contratadas que passam do necessário); nulo sem contratação.
  ociosidadePct: number | null;
  // A loja não tem venda hora a hora: a venda perdida e o saldo não são estimados (a tela mostra o aviso).
  semVendaHoraria?: boolean;
  // Só para o dono; nulos quando falta dado.
  custoFolhaMensal?: number | null;
  // O que o cenário acrescenta à folha por mês e quanto ele economiza de folha contra o "manter horários".
  folhaAdicionalMensal?: number | null;
  economiaFolhaMensal?: number | null;
  // A venda que deixa de entrar (valor, por dia alterado e % do faturamento) e a venda adicional estimada das horas novas.
  perdaFaturamentoPct?: number;
  faturamentoPerdidoMensal?: number | null;
  faturamentoPerdidoPct?: number | null;
  vendaPerdidaPorDia?: VendaPerdidaDiaCenario[];
  vendaAdicionalMensal?: number | null;
  // Saldo = economia de folha − venda perdida (+ venda adicional); anual = mensal × 12; peso = saldo ÷ faturamento mensal.
  saldoMensal?: number | null;
  saldoAnual?: number | null;
  pesoNoFaturamentoPct?: number | null;
  // Cartões da spec 024: saldo contra a folha ATUAL = (economia − custo de folha) + (venda estimada − venda que deixa de
  // entrar), e a venda estimada em % do faturamento mensal. Só para o dono; nulos quando falta dado.
  saldoOperacaoMensal?: number | null;
  vendaAdicionalPct?: number | null;
};

export type Comparativo = {
  cenarios: ColunaComparativo[];
  // Só para o dono: o cenário de maior saldo (o selo "Melhor saldo").
  destaque?: IdColuna | null;
  // Só para o dono: o cenário que leva o selo "Cenário sugerido". É o de menor custo, salvo quando ele deixa
  // função abaixo do nível de hoje; aí a sugestão vai para o Cenário 1.
  sugerido?: IdColuna | null;
  // A equipe atual cobre tudo: nada a contratar nem a reduzir, então os cenários não têm o que mostrar.
  lojaCobreTudo: boolean;
};

const arred = (n: number) => Math.round(n * 100) / 100;
const pct = (n: number) => Math.round(n * 10) / 10;

export const montarComparativo = (e: EntradaCenarios, c: CenariosRegra): Comparativo => {
  const { manter, economia, equilibrio } = c;
  const folha = e.dono ? (c.atual.folhaMensal ?? null) : null;
  const fat = e.faturamentoMensalRef ?? null;
  const estimada = c.origemVenda === 'estimativa';
  const avisoEstimativa =
    'Venda estimada: só o faturamento mensal foi informado e foi dividido igualmente entre os dias abertos.';

  // O "manter horários" é a base: o que o cenário economiza de folha é o custo dele menos o custo do cenário.
  const custoManter = manter.custoAdicionalMensal ?? null;

  // Valores em reais de uma coluna a partir do custo adicional de folha, da venda perdida e da venda adicional das horas
  // novas; só para o dono. Venda perdida nula (sem venda hora a hora) deixa o saldo nulo, nunca zero.
  const valores = (
    custoAdicional: number | null,
    vendaPerdida: number | null,
    vendaAdicional: number | null = 0,
  ) => {
    if (!e.dono) return {};
    const economia =
      custoManter !== null && custoAdicional !== null ? custoManter - custoAdicional : null;
    const saldo =
      economia !== null && vendaPerdida !== null && vendaAdicional !== null
        ? economia - vendaPerdida + vendaAdicional
        : null;
    return {
      custoFolhaMensal:
        folha !== null && custoAdicional !== null ? arred(folha + custoAdicional) : null,
      folhaAdicionalMensal: custoAdicional === null ? null : arred(custoAdicional) || 0,
      // `|| 0` evita o zero negativo
      economiaFolhaMensal: economia === null ? null : arred(economia) || 0,
      faturamentoPerdidoMensal: vendaPerdida === null ? null : arred(vendaPerdida) || 0,
      faturamentoPerdidoPct:
        vendaPerdida !== null && fat !== null && fat > 0 ? pct((vendaPerdida / fat) * 100) : null,
      vendaAdicionalMensal: vendaAdicional === null ? null : arred(vendaAdicional) || 0,
      saldoOperacaoMensal: saldoDaOperacao({
        economiaFolha: custoAdicional === null ? null : 0,
        custoFolha: custoAdicional === null ? null : arred(custoAdicional) || 0,
        vendaEstimada: vendaAdicional,
        vendaPerdida,
      }),
      vendaAdicionalPct:
        vendaAdicional !== null && fat !== null && fat > 0
          ? pct((vendaAdicional / fat) * 100)
          : null,
      saldoMensal: saldo === null ? null : arred(saldo) || 0,
      saldoAnual: saldo === null ? null : arred(saldo * 12) || 0,
      pesoNoFaturamentoPct:
        saldo !== null && fat !== null && fat > 0 ? pct((saldo / fat) * 100) : null,
    };
  };

  const alertasManter: string[] = [];
  if (manter.contratacoes.some((x) => x.parcial))
    alertas(alertasManter, 'Usa contrato parcial para cobrir o que sobra.');
  if (manter.contratacoes.some((x) => x.ajustado))
    alertas(alertasManter, 'A contratação foi ajustada pelas horas, além dos turnos.');
  if (e.dono && manter.custoAdicionalMensal === null)
    alertas(alertasManter, 'Informe os salários médios em Custos para ver o custo.');
  const colManter: ColunaComparativo = {
    id: 'manter',
    nome: 'Manter horários',
    premissa: manter.foco,
    resultado: manter.resultado,
    contratacoes: manter.contratacoes,
    diasFechar: [],
    horasSemana: manter.horasSemana,
    ajustes: [],
    faltaH: null,
    status: 'viavel',
    alertas: alertasManter,
    ociosidadePct: manter.contratacoes.length ? manter.ociosidadePct : null,
    vendaPerdidaPorDia: [],
    ...valores(manter.custoAdicionalMensal ?? null, 0, 0),
  };

  const alertasEco: string[] = [];
  const statusEco: StatusCenario = economia.naoResolveSozinho
    ? 'nao_resolve'
    : !economia.viavel
      ? 'inviavel'
      : economia.naoRecomendado
        ? 'nao_recomendado'
        : 'viavel';
  if (economia.naoResolveSozinho)
    alertas(
      alertasEco,
      economia.faltaH
        ? `Só mexer no fim de semana não resolve: ainda faltam ${String(economia.faltaH).replace('.', ',')} h de cobertura. Veja o Cenário 3.`
        : 'Só mexer no fim de semana não resolve. Veja o Cenário 3.',
    );
  else if (!economia.viavel && economia.motivoInviavel)
    alertas(alertasEco, economia.motivoInviavel);
  if (economia.naoRecomendado) alertas(alertasEco, economia.naoRecomendado.texto);
  const temCorte = economia.passos.length > 0;
  if ((economia.viavel || economia.naoResolveSozinho) && temCorte && estimada)
    alertas(alertasEco, avisoEstimativa);
  if (temCorte && economia.semVendaHoraria)
    alertas(alertasEco, 'Sem venda hora a hora, não é possível estimar a venda perdida.');
  const colEco: ColunaComparativo = {
    id: 'economia',
    nome: 'Sem contratações',
    premissa: economia.foco,
    resultado: economia.resultado,
    faltaPorFuncao: economia.faltaPorFuncao,
    semFarmaceuticoH: economia.semFarmaceuticoH,
    semVendaHoraria: economia.semVendaHoraria,
    vendaPerdidaPorDia: economia.vendaCortadaPorDia,
    contratacoes: [],
    diasFechar: economia.diasFechar.map((d) => d.dia),
    horasSemana: economia.horasSemana,
    ajustes: economia.horariosAjustados,
    faltaH: economia.naoResolveSozinho ? economia.faltaH : null,
    status: statusEco,
    alertas: alertasEco,
    ociosidadePct: null,
    ...(economia.viavel || economia.naoResolveSozinho
      ? {
          ...valores(0, economia.vendaCortadaMes),
          // O % do cartão é o mesmo que as travas usam (sobre a venda de todos os dias abertos de hoje).
          ...(e.dono && economia.perdaFaturamentoPct !== undefined
            ? {
                perdaFaturamentoPct: economia.perdaFaturamentoPct,
                faturamentoPerdidoPct: economia.perdaFaturamentoPct,
              }
            : {}),
        }
      : valores(null, null, null)),
  };

  const alertasEq: string[] = [];
  if (equilibrio.indisponivel) alertas(alertasEq, equilibrio.indisponivel.texto);
  else {
    if (equilibrio.coincideComManter)
      alertas(alertasEq, 'O melhor caminho é o mesmo do Cenário 1.');
    if (equilibrio.coincideComEconomia)
      alertas(alertasEq, 'O melhor caminho é o mesmo do Cenário 2.');
    if (estimada) alertas(alertasEq, avisoEstimativa);
    if (equilibrio.estimativaDeVenda)
      alertas(
        alertasEq,
        'Venda das horas novas é estimada: onde não há venda registrada nessa hora, vale metade da venda da hora vizinha.',
      );
  }
  const colEq: ColunaComparativo = {
    id: 'equilibrio',
    nome: 'Equilíbrio',
    premissa: equilibrio.foco,
    resultado: equilibrio.resultado,
    estimativaDeVenda: equilibrio.estimativaDeVenda,
    semVendaHoraria: equilibrio.semVendaHoraria,
    vendaPerdidaPorDia: equilibrio.vendaCortadaPorDia,
    recolher: equilibrio.indisponivel
      ? null
      : equilibrio.coincideComManter
        ? 'manter'
        : equilibrio.coincideComEconomia
          ? 'economia'
          : null,
    contratacoes: equilibrio.contratacoes,
    diasFechar: equilibrio.diasFechar.map((d) => d.dia),
    horasSemana: equilibrio.horasSemana,
    ajustes: equilibrio.horariosAjustados,
    faltaH: null,
    status: equilibrio.indisponivel ? null : 'viavel',
    alertas: alertasEq,
    ociosidadePct: equilibrio.contratacoes.length ? equilibrio.ociosidadePct : null,
    ...(equilibrio.indisponivel
      ? valores(null, null, null)
      : valores(
          equilibrio.custoAdicionalMensal ?? null,
          equilibrio.vendaCortadaMes,
          equilibrio.vendaGanhaMes ?? 0,
        )),
  };

  const cols = [colManter, colEco, colEq];
  const r: Comparativo = {
    cenarios: cols,
    lojaCobreTudo:
      manter.contratacoes.length === 0 &&
      economia.viavel &&
      economia.passos.length === 0 &&
      economia.faltaPorFuncao.length === 0 &&
      economia.semFarmaceuticoH === 0,
  };
  if (e.dono) {
    r.destaque = c.destaque ?? null;
    const deixaFalta = economia.faltaPorFuncao.length > 0 || economia.semFarmaceuticoH > 0;
    // O Cenário 3 com horas novas só é sugerido se resistir à metade da venda estimada para elas.
    const outros = [
      { id: 'manter' as const, impacto: manter.impactoMensal ?? null },
      { id: 'economia' as const, impacto: economia.impactoMensal ?? null },
    ].filter((o): o is { id: 'manter' | 'economia'; impacto: number } => o.impacto !== null);
    const melhorOutro = [...outros].sort((a, b) => a.impacto - b.impacto)[0];
    const robusto =
      equilibrio.impactoRobusto != null &&
      (melhorOutro === undefined || equilibrio.impactoRobusto < melhorOutro.impacto - 0.005);
    let sug: IdColuna | null = r.destaque;
    if (sug === 'equilibrio' && equilibrio.estimativaDeVenda && !robusto)
      sug = melhorOutro?.id ?? 'manter';
    if (sug === 'economia' && deixaFalta) sug = 'manter';
    r.sugerido = sug;
  }
  return r;
};

function alertas(lista: string[], texto: string) {
  if (!lista.includes(texto)) lista.push(texto);
}
