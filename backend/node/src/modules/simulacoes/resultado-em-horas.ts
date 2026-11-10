// Resultado da simulação em horas e porcentagem (spec 038): o que o card mostra, igual para dono, gestor e consulta. Só
// porcentagens, horas, pessoas e textos: nenhum valor em reais e nenhum salário saem daqui. O cálculo parte dos números
// completos (com os custos da loja); o que vai para a resposta é só o que está neste tipo.

export type StatusSimulacao = 'inviavel' | 'vende_mais' | 'perde_venda' | 'equipe_menor' | 'cobre';

export type EmHoras = {
  status: StatusSimulacao;
  causa: string | null;
  // Variação contra hoje, em % (uma casa, com sinal), e o estado que explica quando não há número.
  vendaPct: number | null;
  vendaEstado: 'ok' | 'nao_estimada' | 'sem_calculo';
  custoPct: number | null;
  custoEstado: 'ok' | 'sem_salarios' | 'sem_calculo';
  pessoas: { hoje: number; simulacao: number };
  horasContratadas: { hoje: number; simulacao: number };
  horasAbertas: { hoje: number; simulacao: number };
  // Horas por semana que ainda faltam cobrir com hora extra depois das contratações.
  horaExtraH: number;
  contratar: { funcao: string; inteiras: number; parciaisHoras: number[] }[];
};

export type EntradaEmHoras = {
  // Não há farmacêutico no quadro da simulação.
  semFarmaceutico: boolean;
  // A loja tem venda hora a hora; sem ela a perda e o ganho de venda não são estimados.
  temBase: boolean;
  horarioMudou: boolean;
  // Venda REAL por mês (mesmo quando a medida dos cenários é a margem): a que deixa de entrar e a estimada das horas novas.
  vendaPerdidaReal: number | null;
  vendaGanhaReal: number | null;
  faturamentoMensalReal: number;
  // Folha do quadro de hoje e custo adicional (folha das vagas + hora extra); nulos sem salário informado.
  folhaHoje: number | null;
  custoAdicional: number | null;
  pessoas: { hoje: number; simulacao: number };
  horasContratadas: { hoje: number; simulacao: number };
  horasAbertas: { hoje: number; simulacao: number };
  // O que ainda falta depois das contratações, por função, em horas por semana.
  faltas: { funcao: string; horas: number }[];
  vagas: { funcao: string; cargaH: number; tipo: 'integral' | 'parcial' }[];
};

const ZERO = 0.005;
const arred1 = (n: number) => Math.round(n * 10) / 10;
const semZeroNegativo = (n: number) => (Math.abs(n) < 0.05 ? 0 : arred1(n));
const arred2 = (n: number) => Math.round(n * 100) / 100;
const horasTxt = (n: number) => `${String(arred1(n)).replace('.', ',')} h`;
const NOME_DA_FUNCAO: Record<string, string> = { Atendimento: 'atendente' };
const nomeDaFuncao = (f: string) => NOME_DA_FUNCAO[f] ?? f.charAt(0).toLowerCase() + f.slice(1);

export const statusDaSimulacao = (e: EntradaEmHoras): StatusSimulacao => {
  if (e.semFarmaceutico) return 'inviavel';
  const ganha = (e.vendaGanhaReal ?? 0) > ZERO;
  const perde = (e.vendaPerdidaReal ?? 0) > ZERO;
  if (ganha && !perde) return 'vende_mais';
  if (perde) return 'perde_venda';
  if (e.faltas.some((f) => f.horas > ZERO)) return 'equipe_menor';
  return 'cobre';
};

// Uma frase só, a primeira que se aplica; nula quando não há consequência a explicar.
export const causaDaSimulacao = (e: EntradaEmHoras, status: StatusSimulacao): string | null => {
  if (status === 'inviavel') return 'Sem farmacêutico no quadro.';
  const faltas = e.faltas.filter((f) => f.horas > ZERO);
  if (faltas.length > 0) {
    const horas = faltas.reduce((s, f) => s + f.horas, 0);
    return `Faltam ${horasTxt(horas)} de ${faltas.length === 1 ? nomeDaFuncao(faltas[0]!.funcao) : 'equipe'}.`;
  }
  if (!e.temBase && e.horarioMudou) return 'Sem venda por hora: perda não estimada.';
  if ((e.vendaGanhaReal ?? 0) > ZERO) return 'Venda das horas novas é estimada.';
  return null;
};

// Vagas agrupadas por função: as inteiras contam, e cada parcial leva as suas horas semanais.
export const contratarDe = (vagas: EntradaEmHoras['vagas']): EmHoras['contratar'] => {
  const porFuncao = new Map<string, { inteiras: number; parciaisHoras: number[] }>();
  for (const v of vagas) {
    const a = porFuncao.get(v.funcao) ?? { inteiras: 0, parciaisHoras: [] };
    if (v.tipo === 'integral') a.inteiras += 1;
    else a.parciaisHoras.push(arred2(v.cargaH));
    porFuncao.set(v.funcao, a);
  }
  return [...porFuncao].map(([funcao, a]) => ({ funcao, inteiras: a.inteiras, parciaisHoras: a.parciaisHoras.sort((x, y) => y - x) }));
};

export const montarEmHoras = (e: EntradaEmHoras): EmHoras => {
  const status = statusDaSimulacao(e);

  // Venda: (ganho estimado − perda) ÷ faturamento mensal real. Sem venda por hora não se estima.
  const vendaOk = e.temBase && e.faturamentoMensalReal > 0;
  const vendaPct = vendaOk
    ? semZeroNegativo((((e.vendaGanhaReal ?? 0) - (e.vendaPerdidaReal ?? 0)) / e.faturamentoMensalReal) * 100)
    : null;

  // Custo de pessoal: custo adicional ÷ folha do quadro de hoje.
  const semSalarios = e.folhaHoje === null || e.custoAdicional === null;
  const custoOk = !semSalarios && (e.folhaHoje as number) > 0;
  const custoPct = custoOk ? semZeroNegativo(((e.custoAdicional as number) / (e.folhaHoje as number)) * 100) : null;

  return {
    status,
    causa: causaDaSimulacao(e, status),
    vendaPct,
    vendaEstado: vendaPct !== null ? 'ok' : !e.temBase ? 'nao_estimada' : 'sem_calculo',
    custoPct,
    custoEstado: custoPct !== null ? 'ok' : semSalarios ? 'sem_salarios' : 'sem_calculo',
    pessoas: e.pessoas,
    horasContratadas: { hoje: arred2(e.horasContratadas.hoje), simulacao: arred2(e.horasContratadas.simulacao) },
    horasAbertas: e.horasAbertas,
    horaExtraH: arred2(e.faltas.reduce((s, f) => s + f.horas, 0)),
    contratar: contratarDe(e.vagas),
  };
};
