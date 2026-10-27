import { passa, verificarRegra, type DiaAberto, type LinhaFuncao } from '../regras/capacidade.js';
import { regraPara, type RegraId } from '../regras/perfis.js';
import { calcularCusto } from '../custos/custo.js';
import type { Custos } from '../custos/custos.schemas.js';
import type { PessoaSim } from '../simulacoes/avaliar.js';
import { vendasPorDiaEHora, type VendaDiaHora, type VendaLinha } from './vendas.js';

export type DiaCenario = {
  dia: number;
  aberto: boolean;
  abre: string | null;
  fecha: string | null;
};

export type Contratacao = {
  funcao: string;
  pessoas: number;
  parcialH: number | null;
  horasContratadas: number;
  ociosidadePct: number;
};

export type CenarioManter = {
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

export type CenariosRegra = {
  regra: { id: RegraId; nome: string };
  atual: { horasSemana: number; pessoas: number; folhaMensal?: number | null };
  vendasBase: { dias: number } | null;
  manter: CenarioManter;
  economia: CenarioEconomia;
};

export type EntradaCenarios = {
  regraId: Extract<RegraId, 'r42' | 'r40'>;
  convencao8h24: boolean;
  dias: DiaAberto[];
  minimos: Record<string, number>;
  pessoas: { funcao: string; cargaH: number }[];
  vendas: VendaLinha[];
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

// Contratações por função a partir da verificação da regra: parcial quando basta uma pessoa.
export const contratacoesDe = (linhas: LinhaFuncao[]): Contratacao[] =>
  linhas
    .filter((l) => l.contratar > 0)
    .map((l) => {
      const horasContratadas = l.parcialH ?? l.contratar * l.cargaCheiaH;
      return {
        funcao: l.funcao,
        pessoas: l.contratar,
        parcialH: l.parcialH,
        horasContratadas: arred(horasContratadas),
        ociosidadePct: pct(((horasContratadas - l.faltaH) / horasContratadas) * 100),
      };
    });

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
): number | null => {
  if (cs.length === 0) return custos ? 0 : null;
  if (!custos) return null;
  const quadro: PessoaSim[] = cs.flatMap((c) => {
    const cheia = linhas.find((l) => l.funcao === c.funcao)!.cargaCheiaH;
    return Array.from({ length: c.pessoas }, (_, i) => ({
      matricula: `VAGA-${c.funcao}-${i}`,
      nome: `Vaga ${c.funcao}`,
      funcao: c.funcao,
      cargaH: c.parcialH ?? cheia,
      vaga: true,
    }));
  });
  const r = calcularCusto({ regra: regraId, quadro, custos });
  return r.informado ? r.mensal : null;
};

export const folhaAtual = (pessoas: EntradaCenarios['pessoas'], custos: Custos | null) => {
  const quadro: PessoaSim[] = pessoas.map((p, i) => ({
    matricula: String(i),
    nome: p.funcao,
    funcao: p.funcao,
    cargaH: p.cargaH,
  }));
  const r = calcularCusto({ regra: 'atual', quadro, custos });
  return r.informado ? r.mensal : null;
};

const listaContratacoes = (cs: Contratacao[]) =>
  cs
    .map((c) =>
      c.parcialH ? `1 ${c.funcao} parcial de ${c.parcialH}h` : `${c.pessoas} ${c.funcao}`,
    )
    .join(', ');

const montarManter = (e: EntradaCenarios, linhas: LinhaFuncao[], folha: number | null) => {
  const nomeRegra = regraPara(e.regraId, e.convencao8h24).nome;
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
    const custo = custoDasVagas(e.regraId, cs, linhas, e.custos);
    manter.custoAdicionalMensal = custo;
    manter.acrescimoPct =
      custo !== null && folha !== null && folha > 0 ? pct((custo / folha) * 100) : null;
  }
  return manter;
};

const SEMANAS_NO_MES = 52 / 12;
const brl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export type Fatia = { dia: number; de: number; ate: number; venda: number; margem: number };

// Corta, uma hora por vez, a ponta (começo ou fim de um dia) que menos vende, até o quadro atual
// cobrir o que sobrou. Empate: fim do dia antes do começo; depois o dia mais tarde na semana.
export const cortarPontas = (
  regra: ReturnType<typeof regraPara>,
  dias: DiaAberto[],
  minimos: Record<string, number>,
  pessoas: EntradaCenarios['pessoas'],
  vb: VendaDiaHora | null,
) => {
  let atuais = dias.map((d) => ({ ...d }));
  const fatias: Fatia[] = [];
  const valor = (m: number[][] | undefined, dia: number, h: number, len: number) =>
    (m?.[dia]?.[h] ?? 0) * len;
  while (atuais.length > 0 && !passa(verificarRegra(regra, atuais, minimos, pessoas))) {
    type Cand = Fatia & { fim: boolean };
    const cands: Cand[] = atuais.flatMap((d) => {
      const iniFim = Math.max(
        d.abre,
        Number.isInteger(d.fecha) ? d.fecha - 1 : Math.floor(d.fecha),
      );
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
    cands.sort((a, b) => a.venda - b.venda || Number(b.fim) - Number(a.fim) || b.dia - a.dia);
    const c = cands[0]!;
    fatias.push({ dia: c.dia, de: c.de, ate: c.ate, venda: c.venda, margem: c.margem });
    atuais = atuais.flatMap((d) => {
      if (d.dia !== c.dia) return [d];
      const novo = c.fim ? { ...d, fecha: c.de } : { ...d, abre: c.ate };
      return novo.fecha > novo.abre ? [novo] : [];
    });
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
  const regra = regraPara(e.regraId, e.convencao8h24);
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
      vb && vb.dias < 14
        ? `A estimativa usa só ${vb.dias} dias de venda: confirme com uma base maior.`
        : null,
  };
};

export const montarCenarios = (e: EntradaCenarios): CenariosRegra => {
  const regra = regraPara(e.regraId, e.convencao8h24);
  const linhas = verificarRegra(regra, e.dias, e.minimos, e.pessoas);
  const vb = vendasPorDiaEHora(e.vendas);
  const folha = e.dono ? folhaAtual(e.pessoas, e.custos) : null;
  return {
    regra: { id: regra.id, nome: regra.nome },
    atual: {
      horasSemana: horasDaSemana(e.dias),
      pessoas: e.pessoas.length,
      ...(e.dono ? { folhaMensal: folha } : {}),
    },
    vendasBase: vb ? { dias: vb.dias } : null,
    manter: montarManter(e, linhas, folha),
    economia: montarEconomia(e, linhas),
  };
};
