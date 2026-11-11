import type { ColunaComparativo, Comparativo, IdColuna } from './comparativo.js';
import type { CenariosRegra, DiaCenario, HorarioAjustado } from './cenarios.js';

// Linhas de cenário (spec 037): o que a tela precisa para desenhar cada cenário numa linha, igual para dono, gestor e
// consulta. Só porcentagens, horas e textos: nenhum valor em reais e nenhum salário saem daqui. O cálculo parte dos
// números completos (com os custos da loja); o que vai para a resposta é só o que está neste tipo.

export type StatusLinha =
  | 'inviavel'
  | 'nao_resolve'
  | 'nao_recomendado'
  | 'vende_mais'
  | 'perde_venda'
  | 'equipe_menor'
  | 'cobre';

export type LinhaDeCenario = {
  id: IdColuna;
  nome: string;
  // Equilíbrio que repete outro cenário: "Manter horários" ou "Sem contratações".
  igualA: string | null;
  // Nulo quando o cenário está indisponível.
  status: StatusLinha | null;
  causa: string | null;
  indisponivel: { motivo: 'custos' | 'vendas' } | null;
  contratar: { funcao: string; inteiras: number; parcialHoras: number }[];
  horasSemana: number;
  horasDiferenca: number;
  horarioSemana: DiaCenario[];
  // Variação em % (uma casa, com sinal) e o estado que explica quando não há número.
  vendaPct: number | null;
  vendaEstado: 'ok' | 'nao_estimada' | 'sem_calculo';
  // Spec 048: só o dono recebe o número (% sobre a folha); a tela não o mostra mais e usa o peso no faturamento.
  custoPct?: number | null;
  custoEstado: 'ok' | 'sem_salarios' | 'sem_faturamento' | 'sem_calculo';
  // O sentido da mudança do custo de pessoal, para todos os perfis e sem número.
  custoSentido: 'aumenta' | 'igual' | 'diminui' | null;
  // Só o dono: quanto o custo de pessoal pesa no faturamento mensal, hoje e depois do cenário (em %, uma casa). Nulo sem folha ou
  // sem faturamento; o campo nem existe para gestor e consulta.
  // Spec 048: o aumento em pontos percentuais do faturamento e em R$ por mês (nova − atual).
  custoPctFaturamento?: {
    hoje: number;
    depois: number;
    aumentoPp: number;
    aumentoMensal: number;
  } | null;
  // O que o Personalizar leva para a simulação (sem valores em reais).
  contratacoes: ColunaComparativo['contratacoes'];
  ajustes: HorarioAjustado[];
  diasFechar: number[];
};

// Equilíbrio, Manter horários e Sem contratações, nesta ordem.
export const ORDEM_DAS_LINHAS: IdColuna[] = ['equilibrio', 'manter', 'economia'];

const ZERO = 0.005;
const arred1 = (n: number) => Math.round(n * 10) / 10;
const semZeroNegativo = (n: number) => (Math.abs(n) < 0.05 ? 0 : arred1(n));
const horasTxt = (n: number) => `${String(Math.round(n * 10) / 10).replace('.', ',')} h`;
const minusculo = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
const NOME_DA_FUNCAO: Record<string, string> = { Atendimento: 'Atendente' };
const nomeDaFuncao = (f: string) => NOME_DA_FUNCAO[f] ?? f;
// Uma pessoa em jornada cheia trabalha cerca de 44 h por semana.
const HORAS_DE_UMA_PESSOA = 44;

// Primeiro status que se aplica, na ordem de prioridade combinada.
export const statusDaLinha = (c: ColunaComparativo): StatusLinha | null => {
  if (c.status === null) return null;
  if (c.status === 'inviavel') return 'inviavel';
  if (c.status === 'nao_resolve') return 'nao_resolve';
  if (c.status === 'nao_recomendado') return 'nao_recomendado';
  const ganha = (c.vendaAdicionalMensal ?? 0) > ZERO;
  const perde = (c.faturamentoPerdidoMensal ?? 0) > ZERO;
  if (ganha && !perde) return 'vende_mais';
  if (perde) return 'perde_venda';
  if ((c.faltaPorFuncao?.length ?? 0) > 0 || (c.semFarmaceuticoH ?? 0) > 0) return 'equipe_menor';
  return 'cobre';
};

// Uma frase só, a primeira que se aplica; nula quando não há consequência a explicar.
export const causaDaLinha = (c: ColunaComparativo, status: StatusLinha | null): string | null => {
  const faltas = c.faltaPorFuncao ?? [];
  if (status === 'inviavel') return 'Sem farmacêutico no quadro.';
  if (status === 'nao_resolve') {
    if ((c.semFarmaceuticoH ?? 0) > 0)
      return `Faltam ${horasTxt(c.semFarmaceuticoH!)} de farmacêutico.`;
    if (faltas.length > 0) {
      const horas = faltas.reduce((s, f) => s + f.horasSemana, 0);
      return `Faltam ${horasTxt(horas)} de ${faltas.length === 1 ? minusculo(nomeDaFuncao(faltas[0]!.funcao)) : 'equipe'}.`;
    }
    return c.faltaH ? `Faltam ${horasTxt(c.faltaH)} de cobertura.` : null;
  }
  if (status === 'nao_recomendado') return 'Só cabe fechando um dos 3 melhores dias.';
  if (status === 'equipe_menor' && faltas.length > 0) {
    const f = faltas[0]!;
    const pessoas = Math.round(f.horasSemana / HORAS_DE_UMA_PESSOA);
    return pessoas >= 1
      ? `${nomeDaFuncao(f.funcao)}: ${pessoas} ${pessoas === 1 ? 'pessoa' : 'pessoas'} a menos que hoje.`
      : `${nomeDaFuncao(f.funcao)}: ${horasTxt(f.horasSemana)} por semana a menos que hoje.`;
  }
  if (status === 'equipe_menor' && (c.semFarmaceuticoH ?? 0) > 0)
    return `Farmacêutico: ${horasTxt(c.semFarmaceuticoH!)} por semana a menos que hoje.`;
  if (c.semVendaHoraria) return 'Sem venda por hora: perda não estimada.';
  if (c.estimativaDeVenda) return 'Venda das horas novas é estimada.';
  return null;
};

const igualA = (c: ColunaComparativo) =>
  c.recolher === 'manter'
    ? 'Manter horários'
    : c.recolher === 'economia'
      ? 'Sem contratações'
      : null;

// Monta as três linhas a partir do comparativo e dos cenários CALCULADOS COM OS CUSTOS (qualquer perfil).
export const montarLinhas = (
  comp: Comparativo,
  cen: CenariosRegra,
  dono = false,
): LinhaDeCenario[] => {
  const folha = cen.atual.folhaMensal ?? null;
  const faturamento = cen.manter.faturamentoMensalRef ?? null;
  const horasHoje = cen.manter.horasSemana;
  const motivoIndisponivel = cen.equilibrio.indisponivel?.motivo ?? null;
  const porId = new Map(comp.cenarios.map((c) => [c.id, c]));
  return ORDEM_DAS_LINHAS.flatMap((id) => {
    const c = porId.get(id);
    if (!c) return [];
    const indisponivel =
      id === 'equilibrio' && motivoIndisponivel ? { motivo: motivoIndisponivel } : null;
    const status = indisponivel ? null : statusDaLinha(c);

    // Venda: (ganho estimado − perda) ÷ faturamento mensal real. Sem venda por hora não se estima.
    const perdidaPct = c.faturamentoPerdidoPct;
    const ganhaPct = c.vendaAdicionalPct;
    const vendaOk = !indisponivel && !c.semVendaHoraria && perdidaPct != null && ganhaPct != null;
    const vendaPct = vendaOk
      ? semZeroNegativo((ganhaPct as number) - (perdidaPct as number))
      : null;

    // Custo de pessoal: custo adicional de folha ÷ folha atual.
    const adicional = c.folhaAdicionalMensal;
    const custoOk = !indisponivel && adicional != null && folha !== null && folha > 0;
    const custoPct = custoOk
      ? semZeroNegativo(((adicional as number) / (folha as number)) * 100)
      : null;

    // Custo de pessoal sobre o faturamento: (folha de hoje + custo adicional) ÷ (faturamento de hoje + variação da venda do cenário).
    const pesoHoje =
      folha !== null && faturamento !== null && faturamento > 0
        ? (folha / faturamento) * 100
        : null;
    const pesoDepois =
      folha !== null && faturamento !== null && faturamento > 0
        ? (((folha as number) + (adicional ?? 0)) / (faturamento * (1 + (vendaPct ?? 0) / 100))) *
          100
        : null;
    const custoPctFaturamento =
      dono && !indisponivel && pesoHoje !== null && pesoDepois !== null && adicional != null
        ? {
            hoje: arred1(pesoHoje),
            depois: arred1(pesoDepois),
            // A diferença dos pesos JÁ arredondados (9,7 − 8,0 = 1,7), para a conta bater com o que aparece na tela.
            aumentoPp: semZeroNegativo(arred1(pesoDepois) - arred1(pesoHoje)),
            aumentoMensal: Math.round(adicional),
          }
        : null;
    const custoSentido =
      indisponivel || adicional == null
        ? null
        : adicional > ZERO
          ? ('aumenta' as const)
          : adicional < -ZERO
            ? ('diminui' as const)
            : ('igual' as const);

    const colunaDoCenario = cen[id];
    return [
      {
        id,
        nome: c.nome,
        igualA: indisponivel ? null : igualA(c),
        status,
        causa: indisponivel ? null : causaDaLinha(c, status),
        indisponivel,
        contratar: c.contratacoes.map((x) => ({
          funcao: x.funcao,
          inteiras: x.inteiras,
          parcialHoras: x.parcial?.horas ?? 0,
        })),
        horasSemana: c.horasSemana,
        horasDiferenca: Math.round((c.horasSemana - horasHoje) * 100) / 100,
        horarioSemana: colunaDoCenario.horarioSemana,
        vendaPct,
        vendaEstado: vendaPct !== null ? 'ok' : c.semVendaHoraria ? 'nao_estimada' : 'sem_calculo',
        ...(dono ? { custoPct, custoPctFaturamento } : {}),
        custoSentido,
        custoEstado:
          custoPct !== null
            ? dono && (faturamento === null || faturamento <= 0)
              ? 'sem_faturamento'
              : 'ok'
            : adicional == null || folha === null
              ? 'sem_salarios'
              : 'sem_calculo',
        contratacoes: c.contratacoes,
        ajustes: c.ajustes,
        diasFechar: c.diasFechar,
      },
    ];
  });
};
