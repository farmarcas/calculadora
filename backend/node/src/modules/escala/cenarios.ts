import { passa, verificarRegra, type DiaAberto, type LinhaFuncao } from '../regras/capacidade.js';
import { regraPara, type RegraId } from '../regras/perfis.js';
import { requisitos, type Minimos } from '../regras/requisitos.js';
import { calcularCusto, divisorDe } from '../custos/custo.js';
import type { TabelaParametros } from '../regras/parametros.js';
import type { Custos } from '../custos/custos.schemas.js';
import type { PessoaSim } from '../simulacoes/avaliar.js';
import { vendasPorDiaEHora, type VendaDiaHora, type VendaLinha } from './vendas.js';

export type DiaCenario = {
  dia: number;
  aberto: boolean;
  abre: string | null;
  fecha: string | null;
};

// Contratação de um cargo pela regra do documento: inteiras (jornada cheia) e, no máximo, 1 contrato parcial.
export type Contratacao = {
  funcao: string;
  pessoas: number; // inteiras + parcial
  inteiras: number;
  parcial: { turnos: number; horas: number } | null;
  parcialH: number | null; // horas do parcial (igual a parcial.horas)
  horasContratadas: number;
  ociosidadePct: number;
  ajustado: boolean; // a conferência final por horas acrescentou contratação
};

export type CenarioManter = {
  // Só para o dono: custo adicional + margem perdida, por mês (nulo se faltar dado).
  impactoMensal?: number | null;
  foco: string;
  direcionamento: string;
  horarioSemana: DiaCenario[];
  horasSemana: number;
  contratacoes: Contratacao[];
  pessoasContratar: number;
  ociosidadePct: number;
  // Só para o dono; nulos quando faltam os custos.
  custoAdicionalMensal?: number | null;
  acrescimoPct?: number | null;
  // Só para o dono: custo por ano (mensal × 12) e quanto pesa no faturamento mensal de referência.
  custoAnual?: number | null;
  impactoPctFaturamento?: number | null;
  faturamentoMensalRef?: number | null;
};

export type Corte = {
  dia: number;
  de: string;
  ate: string;
  // Nulos quando não há base comercial.
  venda: number | null;
  margem: number | null;
};

export type CenarioEconomia = {
  impactoMensal?: number | null;
  viavel: boolean;
  motivoInviavel: string | null;
  foco: string;
  direcionamento: string;
  horasReduzir: number;
  horasSemana: number;
  horarioSemana: DiaCenario[];
  cortes: Corte[];
  vendaCortadaSemana: number | null;
  vendaCortadaMes: number | null;
  margemCortadaMes: number | null;
  aviso: string | null;
};

export type CenarioEquilibrio = {
  impactoMensal?: number | null;
  // Preenchido quando faltam dados; os demais campos ficam zerados.
  indisponivel: { motivo: 'custos' | 'vendas'; texto: string } | null;
  coincideComManter: boolean;
  foco: string;
  direcionamento: string;
  horasReduzir: number;
  horasSemana: number;
  horarioSemana: DiaCenario[];
  cortes: Corte[];
  contratacoes: Contratacao[];
  pessoasContratar: number;
  ociosidadePct: number;
  margemCortadaMes: number | null;
  custoAdicionalMensal?: number | null;
  acrescimoPct?: number | null;
};

export type CenariosRegra = {
  regra: { id: RegraId; nome: string };
  atual: { horasSemana: number; pessoas: number; folhaMensal?: number | null };
  vendasBase: { dias: number } | null;
  manter: CenarioManter;
  economia: CenarioEconomia;
  equilibrio: CenarioEquilibrio;
  // Só para o dono: o cenário de menor impacto financeiro mensal, ou nulo se faltar dado.
  destaque?: 'manter' | 'economia' | 'equilibrio' | null;
};

export type EntradaCenarios = {
  regraId: Extract<RegraId, 'r42' | 'r40'>;
  convencao8h24: boolean;
  dias: DiaAberto[];
  minimos: Minimos;
  pessoas: { funcao: string; cargaH: number }[];
  vendas: VendaLinha[];
  // Venda estimada pelo faturamento do cadastro (não é base de dias reais): sem aviso de "poucos dias".
  vendasDoCadastro?: boolean;
  // Parâmetros legais em uso (jornada, dias, divisor); sem eles valem os de hoje.
  parametros?: TabelaParametros;
  // Faturamento mensal de referência (cadastro ou base comercial), para o impacto em % do faturamento.
  faturamentoMensalRef?: number | null;
  custos: Custos | null;
  dono: boolean;
};

const arred = (n: number) => Math.round(n * 100) / 100;
const pct = (n: number) => Math.round(n * 10) / 10;

export const hhmm = (h: number) =>
  `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;

export const horarioDaSemana = (dias: DiaAberto[]): DiaCenario[] =>
  Array.from({ length: 7 }, (_, dia) => {
    const d = dias.find((x) => x.dia === dia);
    return d
      ? { dia, aberto: true, abre: hhmm(d.abre), fecha: hhmm(d.fecha) }
      : { dia, aberto: false, abre: null, fecha: null };
  });

export const horasDaSemana = (dias: DiaAberto[]) =>
  arred(dias.reduce((s, d) => s + (d.fecha - d.abre), 0));

// Contratações por função a partir da verificação da regra (inteiras e, quando sobra pouco, 1 parcial).
export const contratacoesDe = (linhas: LinhaFuncao[]): Contratacao[] =>
  linhas
    .filter((l) => l.contratar > 0)
    .map((l) => {
      const horasContratadas = l.contratarInteiras * l.cargaCheiaH + (l.parcialH ?? 0);
      return {
        funcao: l.funcao,
        pessoas: l.contratar,
        inteiras: l.contratarInteiras,
        parcial: l.parcialH ? { turnos: l.parcialTurnos, horas: l.parcialH } : null,
        parcialH: l.parcialH,
        horasContratadas: arred(horasContratadas),
        ociosidadePct: pct(((horasContratadas - l.faltaH) / horasContratadas) * 100),
        ajustado: l.ajustado,
      };
    });

// As vagas de uma contratação: cada inteira com a jornada cheia e o parcial com as suas horas.
export const vagasDe = (c: Contratacao, jornadaCheiaH: number) => [
  ...Array.from({ length: c.inteiras }, () => ({ funcao: c.funcao, cargaH: jornadaCheiaH })),
  ...(c.parcialH ? [{ funcao: c.funcao, cargaH: c.parcialH }] : []),
];

export const ociosidadeTotal = (linhas: LinhaFuncao[], cs: Contratacao[]) => {
  const contratadas = cs.reduce((s, c) => s + c.horasContratadas, 0);
  if (contratadas === 0) return 0;
  const faltam = linhas.filter((l) => l.contratar > 0).reduce((s, l) => s + l.faltaH, 0);
  return pct(((contratadas - faltam) / contratadas) * 100);
};

// Custo mensal das vagas das contratações (mesma conta das simulações). Nulo se faltar salário.
export const custoDasVagas = (
  regraId: RegraId,
  cs: Contratacao[],
  linhas: LinhaFuncao[],
  custos: Custos | null,
  parametros?: TabelaParametros,
): number | null => {
  if (cs.length === 0) return custos ? 0 : null;
  if (!custos) return null;
  const quadro: PessoaSim[] = cs.flatMap((c) => {
    const cheia = linhas.find((l) => l.funcao === c.funcao)!.cargaCheiaH;
    return vagasDe(c, cheia).map((v, i) => ({
      matricula: `VAGA-${c.funcao}-${i}`,
      nome: `Vaga ${c.funcao}`,
      funcao: v.funcao,
      cargaH: v.cargaH,
      vaga: true,
    }));
  });
  const r = calcularCusto({ regra: regraId, quadro, custos, parametros });
  return r.informado ? r.mensal : null;
};

export const folhaAtual = (
  pessoas: EntradaCenarios['pessoas'],
  custos: Custos | null,
  parametros?: TabelaParametros,
) => {
  const quadro: PessoaSim[] = pessoas.map((p, i) => ({
    matricula: String(i),
    nome: p.funcao,
    funcao: p.funcao,
    cargaH: p.cargaH,
  }));
  const r = calcularCusto({ regra: 'atual', quadro, custos, parametros });
  return r.informado ? r.mensal : null;
};

const listaContratacoes = (cs: Contratacao[]) =>
  cs
    .map((c) => {
      const parcial = c.parcial
        ? `1 parcial de ${c.parcial.turnos} turno(s) (${c.parcial.horas}h)`
        : '';
      if (c.inteiras === 0) return `1 ${c.funcao} ${parcial}`;
      return `${c.inteiras} ${c.funcao}${parcial ? ` e ${parcial}` : ''}`;
    })
    .join(', ');

const montarManter = (e: EntradaCenarios, linhas: LinhaFuncao[], folha: number | null) => {
  const nomeRegra = regraPara(e.regraId, e.convencao8h24, e.parametros).nome;
  const cs = contratacoesDe(linhas);
  const pessoasContratar = cs.reduce((s, c) => s + c.pessoas, 0);
  const manter: CenarioManter = {
    foco: 'Cobrir todo o horário de funcionamento',
    direcionamento:
      cs.length === 0
        ? `O quadro atual já cobre todos os horários na regra de ${nomeRegra}: não há nada a contratar para manter a loja aberta como hoje.`
        : `Contrate ${listaContratacoes(cs)} e mantenha todos os horários. Faz sentido quando a loja vende ao longo de todo o horário e perder atendimento custa mais que a folha a mais.`,
    horarioSemana: horarioDaSemana(e.dias),
    horasSemana: horasDaSemana(e.dias),
    contratacoes: cs,
    pessoasContratar,
    ociosidadePct: ociosidadeTotal(linhas, cs),
  };
  if (e.dono) {
    const custo = custoDasVagas(e.regraId, cs, linhas, e.custos, e.parametros);
    manter.custoAdicionalMensal = custo;
    manter.acrescimoPct =
      custo !== null && folha !== null && folha > 0 ? pct((custo / folha) * 100) : null;
    const fat = e.faturamentoMensalRef ?? null;
    manter.custoAnual = custo === null ? null : arred(custo * 12);
    manter.faturamentoMensalRef = fat;
    manter.impactoPctFaturamento =
      custo !== null && fat !== null && fat > 0 ? pct((custo / fat) * 100) : null;
  }
  return manter;
};

const SEMANAS_NO_MES = 52 / 12;
const brl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export type Fatia = { dia: number; de: number; ate: number; venda: number; margem: number };

type Cand = Fatia & { fim: boolean };

// Pontas que podem ser cortadas: a última e a primeira hora de cada dia aberto, com a venda e a
// margem médias dela (fração da hora quando o horário não é redondo).
export const candidatas = (atuais: DiaAberto[], vb: VendaDiaHora | null): Cand[] => {
  const valor = (m: number[][] | undefined, dia: number, h: number, len: number) =>
    (m?.[dia]?.[h] ?? 0) * len;
  return atuais.flatMap((d) => {
    const iniFim = Math.max(d.abre, Number.isInteger(d.fecha) ? d.fecha - 1 : Math.floor(d.fecha));
    const fimIni = Math.min(d.fecha, Number.isInteger(d.abre) ? d.abre + 1 : Math.ceil(d.abre));
    const mk = (de: number, ate: number, fim: boolean): Cand => ({
      dia: d.dia,
      de,
      ate,
      fim,
      venda: valor(vb?.venda, d.dia, Math.floor(de), ate - de),
      margem: valor(vb?.margem, d.dia, Math.floor(de), ate - de),
    });
    return iniFim <= d.abre
      ? [mk(d.abre, d.fecha, true)]
      : [mk(iniFim, d.fecha, true), mk(d.abre, fimIni, false)];
  });
};

export const aplicarCorte = (atuais: DiaAberto[], c: Cand): DiaAberto[] =>
  atuais.flatMap((d) => {
    if (d.dia !== c.dia) return [d];
    const novo = c.fim ? { ...d, fecha: c.de } : { ...d, abre: c.ate };
    return novo.fecha > novo.abre ? [novo] : [];
  });

// Corta, uma hora por vez, a ponta (começo ou fim de um dia) que menos vende, até o quadro atual
// cobrir o que sobrou. Empate: fim do dia antes do começo; depois o dia mais tarde na semana.
export const cortarPontas = (
  regra: ReturnType<typeof regraPara>,
  dias: DiaAberto[],
  minimos: Minimos,
  pessoas: EntradaCenarios['pessoas'],
  vb: VendaDiaHora | null,
) => {
  let atuais = dias.map((d) => ({ ...d }));
  const fatias: Fatia[] = [];
  while (atuais.length > 0 && !passa(verificarRegra(regra, atuais, minimos, pessoas))) {
    const c = candidatas(atuais, vb).sort(
      (x, y) => x.venda - y.venda || Number(y.fim) - Number(x.fim) || y.dia - x.dia,
    )[0]!;
    fatias.push({ dia: c.dia, de: c.de, ate: c.ate, venda: c.venda, margem: c.margem });
    atuais = aplicarCorte(atuais, c);
  }
  // Devolve o que o corte levou a mais: tenta repor, da maior venda para a menor, cada fatia
  // colada na faixa aberta do dia, enquanto o quadro continuar cobrindo.
  for (let mudou = true; mudou;) {
    mudou = false;
    const ordem = fatias.map((_, i) => i).sort((a, b) => fatias[b]!.venda - fatias[a]!.venda);
    for (const i of ordem) {
      const f = fatias[i]!;
      const d = atuais.find((x) => x.dia === f.dia);
      if (!d) continue;
      const novo =
        Math.abs(f.de - d.fecha) < 1e-9
          ? { ...d, fecha: f.ate }
          : Math.abs(f.ate - d.abre) < 1e-9
            ? { ...d, abre: f.de }
            : null;
      if (!novo) continue;
      const tentativa = atuais.map((x) => (x === d ? novo : x));
      if (!passa(verificarRegra(regra, tentativa, minimos, pessoas))) continue;
      atuais = tentativa;
      fatias.splice(i, 1);
      mudou = true;
      break;
    }
  }
  return { dias: atuais, fatias };
};

// Junta fatias coladas do mesmo dia em faixas (ex.: 20h–21h e 21h–22h viram 20h–22h).
export const juntarFatias = (fatias: Fatia[], comVendas: boolean): Corte[] => {
  const porDia = [...fatias].sort((a, b) => a.dia - b.dia || a.de - b.de);
  const faixas: Fatia[] = [];
  for (const f of porDia) {
    const u = faixas[faixas.length - 1];
    if (u && u.dia === f.dia && Math.abs(u.ate - f.de) < 1e-9) {
      u.ate = f.ate;
      u.venda += f.venda;
      u.margem += f.margem;
    } else faixas.push({ ...f });
  }
  return faixas.map((f) => ({
    dia: f.dia,
    de: hhmm(f.de),
    ate: hhmm(f.ate),
    venda: comVendas ? arred(f.venda) : null,
    margem: comVendas ? arred(f.margem) : null,
  }));
};

const montarEconomia = (e: EntradaCenarios, linhas: LinhaFuncao[]): CenarioEconomia => {
  const regra = regraPara(e.regraId, e.convencao8h24, e.parametros);
  const vb = vendasPorDiaEHora(e.vendas);
  const base = {
    foco: 'Reduzir horário e manter a equipe atual',
    horarioSemana: horarioDaSemana(e.dias),
    horasSemana: horasDaSemana(e.dias),
    horasReduzir: 0,
    cortes: [] as Corte[],
    vendaCortadaSemana: null,
    vendaCortadaMes: null,
    margemCortadaMes: null,
    aviso: null,
  };
  const semGente = linhas.find((l) => l.minimo > 0 && l.pessoas === 0);
  if (semGente)
    return {
      ...base,
      viavel: false,
      motivoInviavel: `Não há ${semGente.funcao} no quadro: reduzir horários não resolve, é preciso contratar.`,
      direcionamento: `Este caminho não é possível: sem ${semGente.funcao} no quadro, nenhum horário fica coberto. Veja o Cenário 1.`,
    };
  if (passa(linhas))
    return {
      ...base,
      // Nada a cortar: sem venda perdida (zero), desde que haja base para afirmar isso.
      ...(vb ? { vendaCortadaSemana: 0, vendaCortadaMes: 0, margemCortadaMes: 0 } : {}),
      viavel: true,
      motivoInviavel: null,
      direcionamento: `A equipe atual já cobre todos os horários na regra de ${regra.nome}: não é preciso reduzir nada.`,
    };

  const { dias, fatias } = cortarPontas(regra, e.dias, e.minimos, e.pessoas, vb);
  if (dias.length === 0)
    return {
      ...base,
      viavel: false,
      motivoInviavel: 'Mesmo reduzindo os horários, a equipe atual não cobre a loja.',
      direcionamento: 'Este caminho não é possível com a equipe atual. Veja o Cenário 1.',
    };
  const horasSemana = horasDaSemana(dias);
  const horasReduzir = arred(base.horasSemana - horasSemana);
  const cortes = juntarFatias(fatias, vb !== null);
  const vendaSem = vb ? arred(fatias.reduce((s, f) => s + f.venda, 0)) : null;
  const vendaMes = vendaSem === null ? null : arred(vendaSem * SEMANAS_NO_MES);
  const margemMes = vb ? arred(fatias.reduce((s, f) => s + f.margem, 0) * SEMANAS_NO_MES) : null;
  return {
    viavel: true,
    motivoInviavel: null,
    foco: base.foco,
    direcionamento:
      vendaMes === null
        ? `Reduza ${horasReduzir}h por semana, começando pelo fim do dia, e mantenha a equipe. Sem base comercial não dá para estimar a venda que deixa de entrar.`
        : `Reduza ${horasReduzir}h por semana e mantenha a equipe atual. Deixam de entrar cerca de ${brl(vendaMes)} em vendas por mês (margem de ${brl(margemMes!)}). Faz sentido quando o custo de contratar pesa mais que essa venda.`,
    horasReduzir,
    horasSemana,
    horarioSemana: horarioDaSemana(dias),
    cortes,
    vendaCortadaSemana: vendaSem,
    vendaCortadaMes: vendaMes,
    margemCortadaMes: margemMes,
    aviso:
      vb && vb.dias < 14 && !e.vendasDoCadastro
        ? `A estimativa usa só ${vb.dias} dias de venda: confirme com uma base maior.`
        : null,
  };
};

// Custo mensal de cobrir 1 hora semanal da loja: cada função obrigatória, o mínimo de pessoas,
// salário × encargos × 5 ÷ divisor da regra. Nulo se faltar o salário de alguma função obrigatória.
export const custoMensalDaHora = (
  regraId: RegraId,
  minimos: Record<string, number>,
  custos: Custos | null,
  parametros?: TabelaParametros,
): { custo: number | null; faltam: string[] } => {
  const obrigatorias = Object.entries(minimos).filter(([, n]) => n > 0);
  const faltam = obrigatorias
    .filter(([f]) => !custos?.salarioMedio[f as keyof Custos['salarioMedio']])
    .map(([f]) => f);
  if (!custos || faltam.length > 0) return { custo: null, faltam };
  const fator = 1 + custos.encargosPct / 100;
  const custo = obrigatorias.reduce(
    (t, [f, n]) =>
      t +
      (n * custos.salarioMedio[f as keyof Custos['salarioMedio']]! * fator * 5) /
        divisorDe(regraId, parametros),
    0,
  );
  return { custo, faltam: [] };
};

// Custo mensal de cobrir o trecho [de, ate) de um dia: soma, hora a hora, do que a loja exige nessa hora.
// Com exigência igual em todas as horas dá o mesmo valor de custoMensalDaHora × horas.
export const custoMensalDoTrecho = (
  regraId: RegraId,
  minimos: Minimos,
  custos: Custos | null,
  dia: number,
  de: number,
  ate: number,
  parametros?: TabelaParametros,
): { custo: number | null; faltam: string[] } => {
  const req = requisitos(minimos);
  const faltam = req.funcoes.filter(
    (f) => !custos?.salarioMedio[f as keyof Custos['salarioMedio']],
  );
  if (!custos || faltam.length > 0) return { custo: null, faltam };
  const fator = 1 + custos.encargosPct / 100;
  let custo = 0;
  for (let h = Math.floor(de); h < Math.ceil(ate); h++) {
    const parte = Math.min(h + 1, ate) - Math.max(h, de);
    for (const f of req.funcoes)
      custo +=
        (req.emHora(f, dia, h) *
          custos.salarioMedio[f as keyof Custos['salarioMedio']]! *
          fator *
          5 *
          parte) /
        divisorDe(regraId, parametros);
  }
  return { custo, faltam: [] };
};

// Corta as pontas cuja margem mensal é menor que o custo mensal de cobri-las (a de menor margem
// primeiro), reavaliando as novas pontas a cada corte.
// `custoHora` é um valor único por hora ou uma função que devolve o custo do trecho cortado.
export const cortarQueNaoSePagam = (
  dias: DiaAberto[],
  vb: VendaDiaHora,
  custoHora: number | ((dia: number, de: number, ate: number) => number),
) => {
  const custoDe = (x: { dia: number; de: number; ate: number }) =>
    typeof custoHora === 'number' ? custoHora * (x.ate - x.de) : custoHora(x.dia, x.de, x.ate);
  let atuais = dias.map((d) => ({ ...d }));
  const fatias: Fatia[] = [];
  for (;;) {
    const c = candidatas(atuais, vb)
      .filter((x) => x.margem * SEMANAS_NO_MES < custoDe(x))
      .sort((x, y) => x.margem - y.margem || Number(y.fim) - Number(x.fim) || y.dia - x.dia)[0];
    if (!c) return { dias: atuais, fatias };
    fatias.push({ dia: c.dia, de: c.de, ate: c.ate, venda: c.venda, margem: c.margem });
    atuais = aplicarCorte(atuais, c);
  }
};

const montarEquilibrio = (
  e: EntradaCenarios,
  folha: number | null,
  custoManter: number | null,
): CenarioEquilibrio => {
  const regra = regraPara(e.regraId, e.convencao8h24, e.parametros);
  const vb = vendasPorDiaEHora(e.vendas);
  const vazio = {
    coincideComManter: false,
    horasReduzir: 0,
    horasSemana: horasDaSemana(e.dias),
    horarioSemana: horarioDaSemana(e.dias),
    cortes: [] as Corte[],
    contratacoes: [] as Contratacao[],
    pessoasContratar: 0,
    ociosidadePct: 0,
    margemCortadaMes: null,
  };
  const foco = 'Equilibrar contratação e venda perdida';
  // Exigência igual em todas as horas: um valor por hora. Por turno: o custo depende da hora cortada.
  const req = requisitos(e.minimos);
  const { custo: custoUnico, faltam } = req.uniforme
    ? custoMensalDaHora(e.regraId, req.uniforme, e.custos, e.parametros)
    : custoMensalDoTrecho(e.regraId, e.minimos, e.custos, 0, 0, 0, e.parametros);
  const custoHora: number | ((dia: number, de: number, ate: number) => number) | null = req.uniforme
    ? custoUnico
    : faltam.length > 0 || !e.custos
      ? null
      : (dia, de, ate) =>
          custoMensalDoTrecho(e.regraId, e.minimos, e.custos, dia, de, ate, e.parametros).custo ??
          0;
  const indisponivel = (motivo: 'custos' | 'vendas', texto: string): CenarioEquilibrio => ({
    ...vazio,
    indisponivel: { motivo, texto },
    foco,
    direcionamento: texto,
    ...(e.dono ? { custoAdicionalMensal: null, acrescimoPct: null } : {}),
  });
  if (!vb)
    return indisponivel(
      'vendas',
      'Importe a base comercial da loja para comparar a venda perdida com o custo de cobrir cada hora.',
    );
  if (custoHora === null)
    return indisponivel(
      'custos',
      e.dono
        ? `Informe o salário médio de ${faltam.length ? faltam.join(', ') : 'cada função obrigatória'} nos custos da loja para calcular este cenário.`
        : 'Os custos da loja ainda não foram informados pelo dono do grupo, então este cenário não pode ser calculado.',
    );

  const calcular = (dias: DiaAberto[]) => {
    const linhas = verificarRegra(regra, dias, e.minimos, e.pessoas);
    const cs = contratacoesDe(linhas);
    return { linhas, cs, custo: custoDasVagas(e.regraId, cs, linhas, e.custos, e.parametros) };
  };
  let { dias, fatias } = cortarQueNaoSePagam(e.dias, vb, custoHora);
  let { linhas, cs, custo } = calcular(dias);
  const margemCortada = (fs: Fatia[]) =>
    arred(fs.reduce((t, f) => t + f.margem, 0) * SEMANAS_NO_MES);
  // Fechar horas só vale se a folha economizada supera a margem perdida; senão, mantém tudo.
  let naoCompensa = false;
  if (
    fatias.length > 0 &&
    custo !== null &&
    custoManter !== null &&
    custo + margemCortada(fatias) >= custoManter
  ) {
    naoCompensa = true;
    dias = e.dias;
    fatias = [];
    ({ linhas, cs, custo } = calcular(dias));
  }
  const margemMes = margemCortada(fatias);
  const horasSemana = horasDaSemana(dias);
  const horasReduzir = arred(horasDaSemana(e.dias) - horasSemana);
  const resultado: CenarioEquilibrio = {
    indisponivel: null,
    coincideComManter: fatias.length === 0,
    foco,
    direcionamento: '',
    horasReduzir,
    horasSemana,
    horarioSemana: horarioDaSemana(dias),
    cortes: juntarFatias(fatias, true),
    contratacoes: cs,
    pessoasContratar: cs.reduce((s, c) => s + c.pessoas, 0),
    ociosidadePct: ociosidadeTotal(linhas, cs),
    margemCortadaMes: margemMes,
  };
  if (e.dono) {
    resultado.custoAdicionalMensal = custo;
    resultado.acrescimoPct =
      custo !== null && folha !== null && folha > 0 ? pct((custo / folha) * 100) : null;
  }
  const lista = listaContratacoes(cs);
  resultado.direcionamento = naoCompensa
    ? 'Fechar horas não compensa: a margem que se perde é maior que a folha que se economiza. O equilíbrio é manter todos os horários, como no Cenário 1.'
    : resultado.coincideComManter
      ? 'Nenhuma hora vende menos do que custa cobrir: o equilíbrio é o mesmo do Cenário 1, mantendo todos os horários.'
      : `Feche ${horasReduzir}h por semana, onde a margem não paga a cobertura (${brl(margemMes)} por mês), ${cs.length ? `e contrate ${lista}` : 'sem precisar contratar'}. Faz sentido quando quer conter a folha sem abrir mão das horas que realmente vendem.`;
  return resultado;
};

export const montarCenarios = (e: EntradaCenarios): CenariosRegra => {
  const regra = regraPara(e.regraId, e.convencao8h24, e.parametros);
  const linhas = verificarRegra(regra, e.dias, e.minimos, e.pessoas);
  const vb = vendasPorDiaEHora(e.vendas);
  const folha = e.dono ? folhaAtual(e.pessoas, e.custos, e.parametros) : null;
  const manter = montarManter(e, linhas, folha);
  const custoManter = custoDasVagas(
    e.regraId,
    contratacoesDe(linhas),
    linhas,
    e.custos,
    e.parametros,
  );
  const economia = montarEconomia(e, linhas);
  const equilibrio = montarEquilibrio(e, folha, custoManter);
  const r: CenariosRegra = {
    regra: { id: regra.id, nome: regra.nome },
    atual: {
      horasSemana: horasDaSemana(e.dias),
      pessoas: e.pessoas.length,
      ...(e.dono ? { folhaMensal: folha } : {}),
    },
    vendasBase: vb ? { dias: vb.dias } : null,
    manter,
    economia,
    equilibrio,
  };
  if (e.dono) destacar(r);
  return r;
};

// Impacto mensal = custo adicional + margem perdida. O destaque exige os custos e a base comercial
// (Cenários 1 e 3 calculáveis); o Cenário 2 sem solução fica de fora da comparação.
// Empate: o que contrata menos; depois a ordem 1, 3, 2.
export const destacar = (r: CenariosRegra) => {
  const { manter, economia, equilibrio } = r;
  manter.impactoMensal = manter.custoAdicionalMensal ?? null;
  economia.impactoMensal =
    economia.viavel && economia.margemCortadaMes !== null ? economia.margemCortadaMes : null;
  equilibrio.impactoMensal =
    equilibrio.indisponivel === null &&
    equilibrio.custoAdicionalMensal != null &&
    equilibrio.margemCortadaMes !== null
      ? arred(equilibrio.custoAdicionalMensal + equilibrio.margemCortadaMes)
      : null;
  r.destaque = null;
  if (manter.impactoMensal === null || equilibrio.impactoMensal === null) return;
  const lista = [
    { id: 'manter' as const, impacto: manter.impactoMensal, pessoas: manter.pessoasContratar },
    {
      id: 'equilibrio' as const,
      impacto: equilibrio.impactoMensal,
      pessoas: equilibrio.pessoasContratar,
    },
    ...(economia.impactoMensal !== null
      ? [{ id: 'economia' as const, impacto: economia.impactoMensal, pessoas: 0 }]
      : []),
  ];
  r.destaque = lista.sort((a, b) => a.impacto - b.impacto || a.pessoas - b.pessoas)[0]!.id;
};
