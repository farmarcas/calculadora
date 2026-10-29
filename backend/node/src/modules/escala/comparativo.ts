import type { CenariosRegra, Contratacao, EntradaCenarios } from './cenarios.js';

// Comparativo dos cenários 1, 2 e 3 lado a lado, para a fase escolhida. Os cenários 4 (abrir um dia) e 5 (reduzir
// equipe) seguem como cartões à parte e ficam fora da tabela e do destaque.
export type StatusCenario = 'viavel' | 'nao_recomendado' | 'inviavel';
export type IdColuna = 'manter' | 'economia' | 'equilibrio';

export type ColunaComparativo = {
  id: IdColuna;
  nome: string;
  contratacoes: Contratacao[];
  // Dias da semana que o cenário fecha (0 = segunda); nenhum no Cenário 1.
  diasFechar: number[];
  horasSemana: number;
  // Nulo quando o cenário não pode ser calculado por falta de dado (o alerta diz o que falta).
  status: StatusCenario | null;
  alertas: string[];
  // Só para o dono; nulos quando falta dado. Margem perdida é negativa; o resultado é em relação a hoje.
  custoFolhaMensal?: number | null;
  margemMes?: number | null;
  resultadoLiquidoMensal?: number | null;
  impactoPctFaturamento?: number | null;
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
  const valores = (custoAdicional: number | null, margemPerdida: number | null) => {
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
    status: 'viavel',
    alertas: alertasManter,
    ...valores(manter.custoAdicionalMensal ?? null, e.dono ? 0 : null),
  };

  const alertasEco: string[] = [];
  const statusEco: StatusCenario = !economia.viavel
    ? 'inviavel'
    : economia.naoRecomendado
      ? 'nao_recomendado'
      : 'viavel';
  if (!economia.viavel && economia.motivoInviavel) alertas(alertasEco, economia.motivoInviavel);
  if (economia.naoRecomendado) alertas(alertasEco, economia.naoRecomendado.texto);
  if (economia.viavel && estimada) alertas(alertasEco, avisoEstimativa);
  const colEco: ColunaComparativo = {
    id: 'economia',
    nome: 'Foco em economia',
    contratacoes: [],
    diasFechar: economia.diasFechar.map((d) => d.dia),
    horasSemana: economia.horasSemana,
    status: statusEco,
    alertas: alertasEco,
    ...(economia.viavel ? valores(0, economia.margemCortadaMes) : valores(null, null)),
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
    status: equilibrio.indisponivel ? null : 'viavel',
    alertas: alertasEq,
    ...(equilibrio.indisponivel
      ? valores(null, null)
      : valores(equilibrio.custoAdicionalMensal ?? null, equilibrio.margemCortadaMes)),
  };

  const r: Comparativo = { cenarios: [colManter, colEco, colEq] };
  if (e.dono) r.destaque = c.destaque ?? null;
  return r;
};

function alertas(lista: string[], texto: string) {
  if (!lista.includes(texto)) lista.push(texto);
}
