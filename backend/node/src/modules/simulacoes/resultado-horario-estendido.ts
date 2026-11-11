// Resultado do horário estendido (spec 049): quando a Simulação abre horas a mais, o lucro bruto da venda adicional precisa
// pagar a folha a mais. CMV = venda adicional × CMV% real da loja (por hora, se a base traz; senão a média); lucro bruto =
// venda adicional − CMV; resultado = lucro bruto − aumento de folha; recomendado quando o resultado é maior ou igual a zero.
// Função pura, só valores por mês em R$; só o dono recebe.
const arred = (n: number) => Math.round(n * 100) / 100;

export type OrigemCmv = 'hora' | 'media';
export type EstadoHorarioEstendido = 'ok' | 'sem_cmv' | 'sem_salarios' | 'sem_venda';

export type HorarioEstendido = {
  estado: EstadoHorarioEstendido;
  horasNovasSemana: number;
  origemCmv: OrigemCmv | null;
  vendaAdicionalMensal: number | null;
  cmvPct: number | null;
  cmvMensal: number | null;
  lucroBrutoMensal: number | null;
  aumentoFolhaMensal: number | null;
  resultadoMensal: number | null;
  recomendado: boolean | null;
};

export const calcularHorarioEstendido = (a: {
  horasNovasSemana: number;
  // Venda adicional estimada das horas novas por mês; nula sem base comercial.
  vendaAdicionalMensal: number | null;
  // O lucro bruto da venda adicional quando a base traz o CMV por hora (origem `hora`)...
  lucroBrutoMensal?: number | null;
  // ...ou o CMV médio da loja em % (origem `media`).
  cmvMedioPct?: number | null;
  // Folha das vagas + hora extra da Simulação; nulo sem salário informado.
  aumentoFolhaMensal: number | null;
}): HorarioEstendido => {
  const vazio = {
    horasNovasSemana: a.horasNovasSemana,
    origemCmv: null,
    vendaAdicionalMensal: a.vendaAdicionalMensal == null ? null : arred(a.vendaAdicionalMensal),
    cmvPct: null,
    cmvMensal: null,
    lucroBrutoMensal: null,
    aumentoFolhaMensal: a.aumentoFolhaMensal == null ? null : arred(a.aumentoFolhaMensal),
    resultadoMensal: null,
    recomendado: null,
  };
  if (a.vendaAdicionalMensal == null) return { ...vazio, estado: 'sem_venda' };
  const venda = a.vendaAdicionalMensal;
  let origemCmv: OrigemCmv | null = null;
  let lucro: number | null = null;
  let cmvPct: number | null = null;
  if (a.lucroBrutoMensal != null) {
    origemCmv = 'hora';
    lucro = a.lucroBrutoMensal;
    cmvPct = venda > 0 ? ((venda - lucro) / venda) * 100 : (a.cmvMedioPct ?? null);
  } else if (a.cmvMedioPct != null) {
    origemCmv = 'media';
    cmvPct = a.cmvMedioPct;
    lucro = venda * (1 - a.cmvMedioPct / 100);
  }
  if (lucro === null || cmvPct === null) return { ...vazio, estado: 'sem_cmv' };
  const cmv = venda - lucro;
  const base = {
    ...vazio,
    origemCmv,
    cmvPct: Math.round(cmvPct * 10) / 10,
    cmvMensal: arred(cmv),
    lucroBrutoMensal: arred(lucro),
  };
  if (a.aumentoFolhaMensal == null) return { ...base, estado: 'sem_salarios' };
  const resultado = lucro - a.aumentoFolhaMensal;
  return { ...base, estado: 'ok', resultadoMensal: arred(resultado), recomendado: resultado >= 0 };
};
