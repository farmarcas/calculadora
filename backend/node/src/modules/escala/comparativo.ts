import type { CenariosRegra, Contratacao, EntradaCenarios, HorarioAjustado } from './cenarios.js';

// Comparativo dos cenários 1, 2 e 3 lado a lado, para a fase escolhida. Os cenários 4 (abrir um dia) e 5 (reduzir
// equipe) seguem como cartões à parte e ficam fora da tabela e do destaque.
export type StatusCenario = 'viavel' | 'nao_recomendado' | 'inviavel' | 'nao_resolve';
export type IdColuna = 'manter' | 'economia' | 'equilibrio';

export type ColunaComparativo = {
  id: IdColuna;
  nome: string;
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
  // Só para o dono; nulos quando falta dado. Margem perdida é negativa; o resultado é em relação a hoje.
  custoFolhaMensal?: number | null;
  margemMes?: number | null;
  resultadoLiquidoMensal?: number | null;
  impactoPctFaturamento?: number | null;
  // Só para o dono: o que o cenário acrescenta à folha por mês, a venda que deixa de entrar (valor e % do faturamento)
  // e quanto o resultado difere do Cenário 1 (manter horários), por mês.
  folhaAdicionalMensal?: number | null;
  perdaFaturamentoPct?: number;
  faturamentoPerdidoMensal?: number | null;
  faturamentoPerdidoPct?: number | null;
  ganhoFrenteManterMensal?: number | null;
};

export type Comparativo = {
  cenarios: ColunaComparativo[];
  // Só para o dono: o cenário de maior resultado líquido (o mesmo do selo de menor impacto).
  destaque?: IdColuna | null;
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

  // Valores em reais de uma coluna a partir do custo adicional de folha e da margem perdida; só para o dono.
  const valores = (
    custoAdicional: number | null,
    margemPerdida: number | null,
    vendaPerdida: number | null = null,
  ) => {
    if (!e.dono) return {};
    const impacto =
      custoAdicional !== null && margemPerdida !== null ? custoAdicional + margemPerdida : null;
    return {
      custoFolhaMensal:
        folha !== null && custoAdicional !== null ? arred(folha + custoAdicional) : null,
      // `|| 0` evita o zero negativo quando nada se perde
      margemMes: margemPerdida === null ? null : arred(-margemPerdida) || 0,
      resultadoLiquidoMensal: impacto === null ? null : arred(-impacto) || 0,
      impactoPctFaturamento:
        impacto !== null && fat !== null && fat > 0 ? pct((impacto / fat) * 100) : null,
      folhaAdicionalMensal: custoAdicional === null ? null : arred(custoAdicional) || 0,
      faturamentoPerdidoMensal: vendaPerdida === null ? null : arred(vendaPerdida) || 0,
      faturamentoPerdidoPct:
        vendaPerdida !== null && fat !== null && fat > 0 ? pct((vendaPerdida / fat) * 100) : null,
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
    contratacoes: manter.contratacoes,
    diasFechar: [],
    horasSemana: manter.horasSemana,
    ajustes: [],
    faltaH: null,
    status: 'viavel',
    alertas: alertasManter,
    ociosidadePct: manter.contratacoes.length ? manter.ociosidadePct : null,
    ...valores(manter.custoAdicionalMensal ?? null, e.dono ? 0 : null, e.dono ? 0 : null),
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
  if (e.dono && temCorte && !economia.margemInformada)
    alertas(
      alertasEco,
      'Informe a margem bruta média da loja no Cadastro para ver a margem perdida e o saldo.',
    );
  const colEco: ColunaComparativo = {
    id: 'economia',
    nome: 'Foco em economia',
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
          ...valores(0, economia.margemCortadaMes, economia.vendaCortadaMes),
          // O % do cartão é o mesmo que as travas usam (sobre a venda de todos os dias abertos de hoje).
          ...(e.dono && economia.perdaFaturamentoPct !== undefined
            ? {
                perdaFaturamentoPct: economia.perdaFaturamentoPct,
                faturamentoPerdidoPct: economia.perdaFaturamentoPct,
              }
            : {}),
        }
      : valores(null, null)),
  };

  const alertasEq: string[] = [];
  if (equilibrio.indisponivel) alertas(alertasEq, equilibrio.indisponivel.texto);
  else {
    if (equilibrio.coincideComManter)
      alertas(alertasEq, 'O melhor caminho é o mesmo do Cenário 1.');
    if (equilibrio.coincideComEconomia)
      alertas(alertasEq, 'O melhor caminho é o mesmo do Cenário 2.');
    if (estimada) alertas(alertasEq, avisoEstimativa);
  }
  const colEq: ColunaComparativo = {
    id: 'equilibrio',
    nome: 'Equilíbrio',
    contratacoes: equilibrio.contratacoes,
    diasFechar: equilibrio.diasFechar.map((d) => d.dia),
    horasSemana: equilibrio.horasSemana,
    ajustes: [],
    faltaH: null,
    status: equilibrio.indisponivel ? null : 'viavel',
    alertas: alertasEq,
    ociosidadePct: equilibrio.contratacoes.length ? equilibrio.ociosidadePct : null,
    ...(equilibrio.indisponivel
      ? valores(null, null)
      : valores(
          equilibrio.custoAdicionalMensal ?? null,
          equilibrio.margemCortadaMes,
          vendaPerdidaDe(equilibrio.diasFechar),
        )),
  };

  const cols = [colManter, colEco, colEq];
  if (e.dono)
    for (const col of cols) {
      const a = col.resultadoLiquidoMensal;
      const base = colManter.resultadoLiquidoMensal;
      col.ganhoFrenteManterMensal =
        a === null || a === undefined || base === null || base === undefined
          ? null
          : arred(a - base) || 0;
    }
  const r: Comparativo = { cenarios: cols };
  if (e.dono) r.destaque = c.destaque ?? null;
  return r;
};

// Soma da venda mensal dos dias que o cenário fecha; nula se algum dia não tem valor.
const vendaPerdidaDe = (dias: { vendaMes?: number | null }[]) =>
  dias.every((d) => typeof d.vendaMes === 'number')
    ? dias.reduce((s, d) => s + (d.vendaMes as number), 0)
    : null;

function alertas(lista: string[], texto: string) {
  if (!lista.includes(texto)) lista.push(texto);
}
