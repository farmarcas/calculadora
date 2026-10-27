import { verificarRegra, type DiaAberto, type LinhaFuncao } from '../regras/capacidade.js';
import { regraPara, type RegraId } from '../regras/perfis.js';
import { calcularCusto } from '../custos/custo.js';
import type { Custos } from '../custos/custos.schemas.js';
import type { PessoaSim } from '../simulacoes/avaliar.js';
import { vendasPorDiaEHora, type VendaLinha } from './vendas.js';

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

export type CenariosRegra = {
  regra: { id: RegraId; nome: string };
  atual: { horasSemana: number; pessoas: number; folhaMensal?: number | null };
  vendasBase: { dias: number } | null;
  manter: CenarioManter;
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
  };
};
