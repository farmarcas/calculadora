import { passa, verificarRegra, type DiaAberto, type LinhaFuncao } from '../regras/capacidade.js';
import { regraPara, type Regra, type RegraId } from '../regras/perfis.js';
import { PARAMETROS_PADRAO } from '../regras/parametros.js';
import { requisitos, type Minimos } from '../regras/requisitos.js';
import { calcularCusto } from '../custos/custo.js';
import type { TabelaParametros } from '../regras/parametros.js';
import type { Custos } from '../custos/custos.schemas.js';
import type { PessoaSim } from '../simulacoes/avaliar.js';
import {
  DIAS_PROTEGIDOS_PADRAO,
  listaDeDias,
  NOMES_DIA_LONGO,
  semValores,
  vendasPorDia,
  type OrigemVenda,
  type VendaDia,
} from './cenarios-dias.js';
import {
  melhorEstado,
  passosDe,
  perdaMensal,
  sequenciaFimDeSemana,
  TRAVAS,
  type MotivoParada,
  type Passo,
} from './ajustes-fim-de-semana.js';
import { vendasPorDiaEHora, type VendaLinha } from './vendas.js';

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
  horasUsadas: number;
  horasOciosas: number;
  ociosidadePct: number;
  // Obrigatória (farmacêutico, em todas as horas abertas) ou para atingir a meta (dono ou nível de hoje).
  motivo: 'obrigatoria' | 'meta';
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

// Dia da semana que o cenário sugere fechar. Venda e margem por mês (já com a recaptura descontada) só para o dono.
export type DiaFechar = { dia: number; vendaMes?: number | null; margemMes?: number | null };

// Passo do cenário de economia na resposta: horários em "HH:MM".
export type HorarioTxt = { abre: string; fecha: string };
export type PassoCenario =
  | { tipo: 'reduzir'; dia: number; horas: number; de: HorarioTxt; para: HorarioTxt }
  | { tipo: 'fechar'; dia: number; de: HorarioTxt };
// Dia de fim de semana que muda: o horário de hoje e o do cenário (nulo quando fecha).
export type HorarioAjustado = { dia: number; antes: HorarioTxt; depois: HorarioTxt | null };

export type CenarioEconomia = {
  impactoMensal?: number | null;
  viavel: boolean;
  motivoInviavel: string | null;
  foco: string;
  direcionamento: string;
  // Frase curta com a lógica do cenário (sem valores em reais para quem não é dono).
  resumo: string;
  horasReduzir: number;
  horasSemana: number;
  horarioSemana: DiaCenario[];
  diasFechar: DiaFechar[];
  // Quando o único jeito de a equipe atual caber é fechar um dos dias de maior faturamento.
  naoRecomendado: { dias: number[]; texto: string } | null;
  // O corte possível não basta para a equipe atual caber dentro das travas (perda máxima, piso de horas).
  naoResolveSozinho: boolean;
  // A trava que parou o cenário (ou `fim_de_semana`: nada mais a reduzir ou fechar); só quando não resolve sozinho.
  travou: MotivoParada | null;
  // Horas de cobertura que ainda faltam; só quando não resolve sozinho.
  faltaH: number | null;
  // O que o cenário faz, na ordem, e os horários que mudam por causa disso.
  passos: PassoCenario[];
  horariosAjustados: HorarioAjustado[];
  // Só para o dono: perda sobre o faturamento mensal (%).
  perdaFaturamentoPct?: number;
  // A margem bruta da loja foi informada? Sem ela, a margem perdida é nula (não zero).
  margemInformada: boolean;
  // Só para o dono; nulos sem dado de venda (e a margem, sem margem informada).
  vendaCortadaMes: number | null;
  margemCortadaMes: number | null;
  aviso: string | null;
};

export type CenarioEquilibrio = {
  impactoMensal?: number | null;
  // Preenchido quando faltam dados; os demais campos ficam zerados.
  indisponivel: { motivo: 'custos' | 'vendas'; texto: string } | null;
  // A melhor combinação é manter todos os dias (contratar tudo) ou é a mesma do Cenário 2.
  coincideComManter: boolean;
  coincideComEconomia: boolean;
  foco: string;
  direcionamento: string;
  resumo: string;
  horasReduzir: number;
  horasSemana: number;
  horarioSemana: DiaCenario[];
  diasFechar: DiaFechar[];
  contratacoes: Contratacao[];
  pessoasContratar: number;
  ociosidadePct: number;
  margemCortadaMes: number | null;
  // Venda mensal que deixa de entrar com as reduções e fechamentos (só o dono recebe).
  vendaCortadaMes: number | null;
  // O que o cenário muda no fim de semana (reduções e fechamentos) e os horários resultantes.
  passos: PassoCenario[];
  horariosAjustados: HorarioAjustado[];
  // Só para o dono.
  custoAdicionalMensal?: number | null;
  acrescimoPct?: number | null;
  // Margem dos dias abertos menos o custo adicional de folha, por mês.
  resultadoMensal?: number | null;
};

export type CenariosRegra = {
  regra: { id: RegraId; nome: string };
  atual: { horasSemana: number; pessoas: number; folhaMensal?: number | null };
  vendasBase: { dias: number } | null;
  // Venda de cada dia da semana (valores em reais só para o dono), de onde ela vem e os dias que não se sugere fechar.
  vendasPorDia: VendaDia[];
  origemVenda: OrigemVenda | null;
  diasProtegidos: number[];
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
  // Origem da venda (base, cadastro por dia ou estimativa do mensal) e quantos dias de maior faturamento são protegidos.
  origemVenda?: OrigemVenda | null;
  diasProtegidos?: number;
  // Parte da venda de um dia fechado que migra para os outros dias (0 a 0,3; padrão 0).
  recaptura?: number;
  // Quanto da média dos dias abertos vale um dia hoje fechado que nunca vendeu (0 a 1; padrão 0,5).
  fatorDiaNovo?: number;
  // Turnos de sobra até os quais se contrata um parcial (0 a 3; padrão 3).
  limiteParcial?: number;
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

// O que o motor precisa saber além do quadro: a regra de hoje (nível de hoje dos demais cargos), as horas abertas de
// hoje (a meta acompanha o horário do cenário), os custos e o divisor da regra.
export const opcoesDoMotor = (e: EntradaCenarios, regra: Regra) => ({
  limiteParcial: e.limiteParcial,
  regraAtual: regraPara('atual', e.convencao8h24, e.parametros),
  horasAbertasHoje: horasDaSemana(e.dias),
  custos: e.custos,
  divisor: (e.parametros ?? PARAMETROS_PADRAO)[regra.id].divisor,
});

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
        horasUsadas: arred(Math.min(horasContratadas, l.faltaH)),
        horasOciosas: arred(Math.max(0, horasContratadas - l.faltaH)),
        motivo: l.obrigatorio ? ('obrigatoria' as const) : ('meta' as const),
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
      const parcial = c.parcial ? `1 parcial de ${c.parcial.horas}h` : '';
      if (c.inteiras === 0) return `1 ${c.funcao} (${parcial})`;
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

const brl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const hmTxt = (h: { abre: number; fecha: number }): HorarioTxt => ({
  abre: hhmm(h.abre),
  fecha: hhmm(h.fecha),
});
const passoTxt = (p: Passo): PassoCenario =>
  p.tipo === 'reduzir'
    ? { tipo: 'reduzir', dia: p.dia, horas: p.horas, de: hmTxt(p.de), para: hmTxt(p.para) }
    : { tipo: 'fechar', dia: p.dia, de: hmTxt(p.de) };
const hh = (t: string) => `${t.slice(0, 2)}h`;
const horasTxt = (n: number) => `${String(n).replace('.', ',')} h`;
// "Domingo fecha 8 h mais cedo (de 08h–22h para 08h–14h)" · "Sábado fecha".
const fraseDoPasso = (p: PassoCenario) => {
  const dia = NOMES_DIA_LONGO[p.dia]!;
  const nome = dia[0]!.toUpperCase() + dia.slice(1);
  return p.tipo === 'reduzir'
    ? `${nome} fecha ${horasTxt(p.horas)} mais cedo (de ${hh(p.de.abre)}–${hh(p.de.fecha)} para ${hh(p.para.abre)}–${hh(p.para.fecha)})`
    : `${nome} fecha`;
};
const MOTIVO_PARADA: Record<MotivoParada, string> = {
  perda: `a perda chegaria ao limite de ${TRAVAS.perdaMaxPct}% do faturamento`,
  horas: `a loja ficaria com menos de ${TRAVAS.horasMinPct}% das horas abertas de hoje`,
  fim_de_semana: 'não há mais o que reduzir ou fechar no fim de semana',
};

const montarEconomia = (
  e: EntradaCenarios,
  linhas: LinhaFuncao[],
  porDia: VendaDia[],
): CenarioEconomia => {
  const regra = regraPara(e.regraId, e.convencao8h24, e.parametros);
  const temVenda = porDia.some((d) => (d.venda ?? 0) > 0);
  const temMargem = porDia.some((d) => (d.margemMes ?? 0) > 0);
  const base = {
    foco: 'Reduzir o fim de semana para manter a equipe atual',
    horarioSemana: horarioDaSemana(e.dias),
    horasSemana: horasDaSemana(e.dias),
    horasReduzir: 0,
    diasFechar: [] as DiaFechar[],
    naoRecomendado: null,
    naoResolveSozinho: false,
    travou: null as MotivoParada | null,
    faltaH: null as number | null,
    passos: [] as PassoCenario[],
    horariosAjustados: [] as HorarioAjustado[],
    margemInformada: temMargem,
    vendaCortadaMes: null,
    margemCortadaMes: null,
    aviso: null as string | null,
  };
  const semGente = linhas.find((l) => l.obrigatorio && l.pessoas === 0);
  if (semGente)
    return {
      ...base,
      viavel: false,
      motivoInviavel: `Não há ${semGente.funcao} no quadro: reduzir ou fechar o fim de semana não resolve, é preciso contratar.`,
      direcionamento: `Este caminho não é possível: sem ${semGente.funcao} no quadro, nenhum dia fica coberto. Veja o Cenário 1.`,
      resumo: 'Não é possível sem contratar. Veja o Cenário 1.',
    };
  if (passa(linhas))
    return {
      ...base,
      // Nada a mudar: nenhuma perda, desde que haja venda para afirmar isso.
      ...(temVenda ? { vendaCortadaMes: 0, margemCortadaMes: temMargem ? 0 : null } : {}),
      viavel: true,
      motivoInviavel: null,
      direcionamento: `A equipe atual já cobre todos os dias na regra de ${regra.nome}: não é preciso reduzir nem fechar nada.`,
      resumo: 'A equipe atual já cobre todos os dias: não há nada a reduzir nem a fechar.',
    };
  if (!temVenda)
    return {
      ...base,
      viavel: false,
      motivoInviavel:
        'Informe o faturamento por dia da semana no Cadastro (ou envie a base comercial) para saber quanto cada corte custa.',
      direcionamento:
        'Sem a venda de cada dia da semana não dá para saber quanto cada corte custa. Informe o faturamento por dia da semana no Cadastro ou envie a base comercial.',
      resumo: 'Faltam as vendas por dia da semana para calcular os cortes.',
    };

  const seq = sequenciaFimDeSemana({
    dias: e.dias,
    porDia,
    cobre: (dias) =>
      passa(verificarRegra(regra, dias, e.minimos, e.pessoas, opcoesDoMotor(e, regra))),
    faltaH: (dias) =>
      verificarRegra(regra, dias, e.minimos, e.pessoas, opcoesDoMotor(e, regra))
        .filter((l) => l.contratar > 0)
        .reduce((s, l) => s + l.faltaH, 0),
  });
  const recaptura = Math.min(0.3, Math.max(0, e.recaptura ?? 0));
  const fica = 1 - recaptura;
  const hoje = [...e.dias].sort((x, y) => x.dia - y.dia);
  const fechados = hoje.filter((d) => !seq.dias.some((x) => x.dia === d.dia)).map((d) => d.dia);
  const vendaMes = arred(perdaMensal(hoje, seq.dias, porDia) * fica);
  const margemMes = temMargem
    ? arred(
        perdaMensal(
          hoje,
          seq.dias,
          porDia.map((d) => ({ ...d, vendaMes: d.margemMes })),
        ) * fica,
      )
    : null;
  const diasFechar: DiaFechar[] = fechados.map((dia) => ({
    dia,
    ...(e.dono
      ? {
          vendaMes: arred(porDia[dia]!.vendaMes! * fica),
          margemMes: temMargem ? arred(porDia[dia]!.margemMes! * fica) : null,
        }
      : {}),
  }));
  const passos = seq.passos.map(passoTxt);
  const horariosAjustados: HorarioAjustado[] = passos.map((p) => ({
    dia: p.dia,
    antes: p.de,
    depois: p.tipo === 'reduzir' ? p.para : null,
  }));
  const naoRecomendado =
    seq.cobre && fechados.some((d) => porDia[d]!.protegido)
      ? {
          dias: fechados.filter((d) => porDia[d]!.protegido),
          texto: `Para a equipe atual caber é preciso fechar ${listaDeDias(fechados.filter((d) => porDia[d]!.protegido))}, um dos dias de maior faturamento da loja. Não recomendado.`,
        }
      : null;
  const evitadas = linhas.reduce((s, l) => s + l.contratar, 0);
  const acoes = passos.length ? passos.map(fraseDoPasso).join('; ') : 'nenhuma mudança possível';
  const perdaTxt = e.dono
    ? ` Deixam de entrar cerca de ${brl(vendaMes)} em vendas por mês (${String(seq.perdaPct).replace('.', ',')}% do faturamento${margemMes !== null ? `, margem de ${brl(margemMes)}` : ''}${recaptura > 0 ? `, já descontados ${Math.round(recaptura * 100)}% que migram para os outros dias` : ''}).`
    : '';
  const horasMsg = seq.faltaH
    ? ` ainda faltam ${horasTxt(seq.faltaH)} de cobertura`
    : ' a equipe ainda não cobre o horário';
  const frase = seq.cobre
    ? `${acoes}. Assim a equipe atual cobre o horário sem contratar${evitadas > 0 ? ` (você deixa de contratar ${evitadas} pessoa${evitadas === 1 ? '' : 's'})` : ''}.`
    : `${passos.length ? `${acoes}, mas` : 'Mesmo reduzindo o fim de semana,'} ${MOTIVO_PARADA[seq.parou!]}:${horasMsg}. Só mexer no fim de semana não resolve: veja o Cenário 3 (equilíbrio).`;
  const avisos = [
    e.origemVenda === 'estimativa'
      ? 'Venda estimada: só o faturamento mensal foi informado e ele foi dividido igualmente entre os dias abertos. Informe o faturamento por dia da semana para estimar melhor cada corte.'
      : null,
    passos.some((p) => p.tipo === 'reduzir')
      ? 'A perda de reduzir o horário é uma estimativa: supõe vendas iguais em todas as horas do dia.'
      : null,
  ].filter((x): x is string => x !== null);
  const comum = {
    foco: base.foco,
    horasReduzir: arred(base.horasSemana - seq.horasSemana),
    horasSemana: seq.horasSemana,
    horarioSemana: horarioDaSemana(seq.dias),
    diasFechar,
    naoRecomendado,
    passos,
    horariosAjustados,
    margemInformada: temMargem,
    vendaCortadaMes: vendaMes,
    margemCortadaMes: margemMes,
    aviso: avisos.length ? avisos.join(' ') : null,
    ...(e.dono ? { perdaFaturamentoPct: seq.perdaPct } : {}),
  };
  if (!seq.cobre)
    return {
      ...comum,
      viavel: false,
      motivoInviavel: `Só reduzir ou fechar o fim de semana não cobre o horário: ${MOTIVO_PARADA[seq.parou!]}.`,
      naoResolveSozinho: true,
      travou: seq.parou,
      faltaH: seq.faltaH,
      resumo: frase,
      direcionamento: `${frase}${perdaTxt}`,
    };
  return {
    ...comum,
    viavel: true,
    motivoInviavel: null,
    naoResolveSozinho: false,
    travou: null,
    faltaH: null,
    resumo: frase,
    direcionamento: `${frase}${perdaTxt} Faz sentido quando o custo de contratar pesa mais que ${e.dono ? 'essa perda' : 'a venda perdida'}.`,
  };
};

const montarEquilibrio = (
  e: EntradaCenarios,
  folha: number | null,
  custoManter: number | null,
  porDia: VendaDia[],
  economia: CenarioEconomia,
): CenarioEquilibrio => {
  const regra = regraPara(e.regraId, e.convencao8h24, e.parametros);
  const vazio = {
    coincideComManter: false,
    coincideComEconomia: false,
    horasReduzir: 0,
    horasSemana: horasDaSemana(e.dias),
    horarioSemana: horarioDaSemana(e.dias),
    diasFechar: [] as DiaFechar[],
    contratacoes: [] as Contratacao[],
    pessoasContratar: 0,
    ociosidadePct: 0,
    margemCortadaMes: null,
    vendaCortadaMes: null,
    passos: [] as PassoCenario[],
    horariosAjustados: [] as HorarioAjustado[],
  };
  const foco = 'Equilibrar contratação e dias abertos';
  const indisponivel = (motivo: 'custos' | 'vendas', texto: string): CenarioEquilibrio => ({
    ...vazio,
    indisponivel: { motivo, texto },
    foco,
    direcionamento: texto,
    resumo: texto,
    ...(e.dono ? { custoAdicionalMensal: null, acrescimoPct: null, resultadoMensal: null } : {}),
  });
  if (!porDia.some((d) => (d.venda ?? 0) > 0))
    return indisponivel(
      'vendas',
      'Informe o faturamento por dia da semana no Cadastro (ou envie a base comercial) para comparar a margem de cada dia com o custo de contratar.',
    );
  if (!porDia.some((d) => (d.margemMes ?? 0) > 0))
    return indisponivel(
      'vendas',
      'Informe a margem bruta média da loja no Cadastro (ou envie a base com a coluna de margem) para comparar a margem de cada dia com o custo de contratar.',
    );
  const faltam = requisitos(e.minimos).funcoes.filter(
    (f) => !e.custos?.salarioMedio[f as keyof Custos['salarioMedio']],
  );
  if (!e.custos || faltam.length > 0)
    return indisponivel(
      'custos',
      e.dono
        ? `Informe o salário médio de ${faltam.length ? faltam.join(', ') : 'cada função obrigatória'} nos custos da loja para calcular este cenário.`
        : 'Os custos da loja ainda não foram informados pelo dono do grupo, então este cenário não pode ser calculado.',
    );

  const recaptura = Math.min(0.3, Math.max(0, e.recaptura ?? 0));
  const fica = 1 - recaptura;
  const hoje = [...e.dias].sort((x, y) => x.dia - y.dia);
  const melhor = melhorEstado({
    dias: e.dias,
    porDia,
    margemMes: (dia) => porDia[dia]!.margemMes! * fica,
    avaliar: (dias) => {
      const linhas = verificarRegra(regra, dias, e.minimos, e.pessoas, opcoesDoMotor(e, regra));
      const cs = contratacoesDe(linhas);
      return {
        linhas,
        cs,
        pessoas: cs.reduce((s, c) => s + c.pessoas, 0),
        custo: custoDasVagas(e.regraId, cs, linhas, e.custos, e.parametros) ?? 0,
      };
    },
  });
  const { linhas, cs, custo } = melhor.avaliacao;
  const fechados = melhor.fechados;
  const margemPerdida = arred(melhor.perdida);
  const horasSemana = horasDaSemana(melhor.dias);
  const passos = passosDe(hoje, melhor.dias).map(passoTxt);
  const horariosAjustados: HorarioAjustado[] = passos.map((p) => ({
    dia: p.dia,
    antes: p.de,
    depois: p.tipo === 'reduzir' ? p.para : null,
  }));
  const igualEconomia =
    economia.viavel &&
    economia.naoRecomendado === null &&
    passos.length > 0 &&
    melhor.avaliacao.pessoas === 0 &&
    JSON.stringify(economia.horariosAjustados) === JSON.stringify(horariosAjustados);
  const resultado: CenarioEquilibrio = {
    indisponivel: null,
    coincideComManter: passos.length === 0,
    coincideComEconomia: igualEconomia,
    foco,
    direcionamento: '',
    resumo: '',
    horasReduzir: arred(horasDaSemana(e.dias) - horasSemana),
    horasSemana,
    horarioSemana: horarioDaSemana(melhor.dias),
    passos,
    horariosAjustados,
    diasFechar: fechados.map((dia) => ({
      dia,
      ...(e.dono
        ? {
            vendaMes: arred(porDia[dia]!.vendaMes! * fica),
            margemMes: arred(porDia[dia]!.margemMes! * fica),
          }
        : {}),
    })),
    contratacoes: cs,
    pessoasContratar: melhor.avaliacao.pessoas,
    ociosidadePct: ociosidadeTotal(linhas, cs),
    margemCortadaMes: margemPerdida,
    vendaCortadaMes: arred(perdaMensal(hoje, melhor.dias, porDia) * fica),
  };
  if (e.dono) {
    resultado.custoAdicionalMensal = arred(custo);
    resultado.acrescimoPct = folha !== null && folha > 0 ? pct((custo / folha) * 100) : null;
    const margemAbertaHoje = e.dias.reduce((s, d) => s + porDia[d.dia]!.margemMes!, 0);
    resultado.resultadoMensal = arred(margemAbertaHoje - melhor.perdida - custo);
  }
  const lista = listaContratacoes(cs);
  const acoes = passos.map(fraseDoPasso).join('; ');
  const economiaNaFolha =
    e.dono && custoManter !== null && custoManter - custo > 0.005
      ? ` você economiza ${brl(custoManter - custo)} por mês de folha frente a manter tudo e perde ${brl(margemPerdida)} de margem`
      : '';
  resultado.resumo = resultado.coincideComManter
    ? 'O equilíbrio para esta loja é contratar tudo e manter o horário de hoje.'
    : igualEconomia
      ? `O equilíbrio para esta loja é: ${acoes}. A equipe atual cobre o resto e você não contrata ninguém.`
      : `${acoes}, ${cs.length ? `contratando ${lista}` : 'sem contratar ninguém'},${economiaNaFolha || ' você paga menos folha do que perde de margem'}.`;
  resultado.direcionamento = resultado.coincideComManter
    ? 'Nenhuma redução do fim de semana compensa o custo de cobrir o horário: o equilíbrio é o mesmo do Cenário 1, mantendo o horário de hoje.'
    : igualEconomia
      ? `${resultado.resumo} Este é o mesmo caminho do Cenário 2.`
      : `${resultado.resumo} É a combinação de horários de fim de semana e contratações de menor impacto financeiro entre as permitidas (segunda a sexta não mudam; perda máxima de ${TRAVAS.perdaMaxPct}% do faturamento e ao menos ${TRAVAS.horasMinPct}% das horas de hoje).`;
  return resultado;
};

export const montarCenarios = (e: EntradaCenarios): CenariosRegra => {
  const regra = regraPara(e.regraId, e.convencao8h24, e.parametros);
  const linhas = verificarRegra(regra, e.dias, e.minimos, e.pessoas, opcoesDoMotor(e, regra));
  const vb = vendasPorDiaEHora(e.vendas);
  const porDia = vendasPorDia(e.vendas, e.dias, e.diasProtegidos ?? DIAS_PROTEGIDOS_PADRAO);
  const folha = e.dono ? folhaAtual(e.pessoas, e.custos, e.parametros) : null;
  const manter = montarManter(e, linhas, folha);
  const custoManter = custoDasVagas(
    e.regraId,
    contratacoesDe(linhas),
    linhas,
    e.custos,
    e.parametros,
  );
  const economia = montarEconomia(e, linhas, porDia);
  const equilibrio = montarEquilibrio(e, folha, custoManter, porDia, economia);
  const r: CenariosRegra = {
    regra: { id: regra.id, nome: regra.nome },
    atual: {
      horasSemana: horasDaSemana(e.dias),
      pessoas: e.pessoas.length,
      ...(e.dono ? { folhaMensal: folha } : {}),
    },
    vendasBase: vb ? { dias: vb.dias } : null,
    vendasPorDia: e.dono ? porDia : porDia.map(semValores),
    origemVenda: e.origemVenda ?? null,
    diasProtegidos: porDia.filter((d) => d.protegido).map((d) => d.dia),
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
  // O Cenário 2 que só fecha dia protegido é "não recomendado": não entra na escolha do selo.
  economia.impactoMensal =
    economia.viavel && economia.naoRecomendado === null && economia.margemCortadaMes !== null
      ? economia.margemCortadaMes
      : null;
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
