import type { DiaAberto } from '../regras/capacidade.js';
import { diaDaSemana, type VendaLinha } from './vendas.js';

export const SEMANAS_NO_MES = 52 / 12;
export const DIAS_PROTEGIDOS_PADRAO = 3;

const arred = (n: number) => Math.round(n * 100) / 100;

// De onde vem a venda do dia: a base comercial somada por dia da semana, o faturamento do cadastro por dia
// ou uma estimativa (só havia o faturamento mensal, dividido igualmente entre os dias abertos).
export type OrigemVenda = 'base' | 'cadastro' | 'estimativa';

export type VendaDia = {
  dia: number; // 0 = segunda
  aberto: boolean;
  protegido: boolean;
  // Valores em reais: só para o dono. venda/margem = média de um dia; vendaMes/margemMes = por mês (× 52 ÷ 12).
  venda?: number;
  margem?: number;
  vendaMes?: number;
  margemMes?: number;
};

// Média de venda e de margem de um dia da semana: soma de todas as horas ÷ número de datas daquele dia da semana.
// Soma direto das linhas (sem passar por células arredondadas), para o dia valer exatamente o que o cadastro informou.
export const totaisPorDia = (linhas: VendaLinha[]) => {
  const venda = new Array<number>(7).fill(0);
  const margem = new Array<number>(7).fill(0);
  const datas = Array.from({ length: 7 }, () => new Set<string>());
  for (const l of linhas) {
    const d = diaDaSemana(l.data);
    datas[d]!.add(l.data);
    venda[d]! += l.venda;
    margem[d]! += l.margem;
  }
  return venda.map((v, d) => {
    const n = datas[d]!.size;
    return { venda: n ? v / n : 0, margem: n ? margem[d]! / n : 0 };
  });
};

// Os dias de maior faturamento entre os abertos: não se sugere fechá-los (empate: o mais tardio na semana).
// Nunca protege todos os dias abertos: sempre sobra ao menos um candidato.
export const diasProtegidos = (
  vendaPorDia: { dia: number; venda: number }[],
  abertos: number[],
  quantos = DIAS_PROTEGIDOS_PADRAO,
) => {
  const n = Math.min(Math.max(0, Math.floor(quantos)), Math.max(0, abertos.length - 1));
  return vendaPorDia
    .filter((v) => abertos.includes(v.dia))
    .sort((a, b) => b.venda - a.venda || b.dia - a.dia)
    .slice(0, n)
    .map((v) => v.dia);
};

// Venda e margem de cada dia da semana (a partir da venda por hora que o motor já recebe) e quais dias são protegidos.
export const vendasPorDia = (
  linhas: VendaLinha[],
  dias: DiaAberto[],
  quantosProtegidos = DIAS_PROTEGIDOS_PADRAO,
): VendaDia[] => {
  const totais = totaisPorDia(linhas);
  const abertos = dias.map((d) => d.dia);
  const protegidos = diasProtegidos(
    totais.map((t, dia) => ({ dia, venda: t.venda })),
    abertos,
    quantosProtegidos,
  );
  return totais.map((t, dia) => ({
    dia,
    aberto: abertos.includes(dia),
    protegido: protegidos.includes(dia),
    venda: arred(t.venda),
    margem: arred(t.margem),
    vendaMes: arred(t.venda * SEMANAS_NO_MES),
    margemMes: arred(t.margem * SEMANAS_NO_MES),
  }));
};

// Para quem não é dono, só ficam os dias e a marca de protegido: nenhum valor em reais.
export const semValores = (v: VendaDia): VendaDia => ({
  dia: v.dia,
  aberto: v.aberto,
  protegido: v.protegido,
});

// Escolhe os dias a fechar para a equipe atual caber, sem contratar: fecha, um a um, o de menor margem mensal
// (sem margem informada, a de menor venda), deixando os dias protegidos por último; para quando a equipe cobre
// o horário, nunca fecha o último dia aberto e, no fim, reabre o que acabou não sendo necessário.
export const escolherDiasAFechar = (a: {
  dias: DiaAberto[];
  porDia: VendaDia[];
  cobre: (dias: DiaAberto[]) => boolean;
}) => {
  const temMargem = a.porDia.some((d) => (d.margemMes ?? 0) > 0);
  const chave = (dia: number) => {
    const v = a.porDia[dia]!;
    return (temMargem ? v.margemMes : v.vendaMes) ?? 0;
  };
  const porDiaDaSemana = (x: DiaAberto, y: DiaAberto) => x.dia - y.dia;
  const ordem = a.dias
    .map((d) => d.dia)
    // protegidos por último; depois a menor margem; empate: o dia mais tardio da semana fecha antes
    .sort(
      (x, y) =>
        Number(a.porDia[x]!.protegido) - Number(a.porDia[y]!.protegido) ||
        chave(x) - chave(y) ||
        y - x,
    );
  let atuais = [...a.dias].sort(porDiaDaSemana);
  const fechados: number[] = [];
  for (const dia of ordem) {
    if (a.cobre(atuais) || atuais.length <= 1) break;
    atuais = atuais.filter((d) => d.dia !== dia);
    fechados.push(dia);
  }
  const cobre = a.cobre(atuais);
  if (cobre) {
    // Reabre, do de maior margem para o de menor, o dia que a equipe consegue cobrir mesmo assim.
    for (const dia of [...fechados].sort((x, y) => chave(y) - chave(x) || x - y)) {
      const original = a.dias.find((d) => d.dia === dia)!;
      const tentativa = [...atuais, original].sort(porDiaDaSemana);
      if (a.cobre(tentativa)) {
        atuais = tentativa;
        fechados.splice(fechados.indexOf(dia), 1);
      }
    }
  }
  const ordenados = [...fechados].sort((x, y) => x - y);
  return {
    cobre,
    atuais,
    fechados: ordenados,
    protegidosAtingidos: ordenados.filter((d) => a.porDia[d]!.protegido),
  };
};

export const NOMES_DIA_LONGO = [
  'segunda',
  'terça',
  'quarta',
  'quinta',
  'sexta',
  'sábado',
  'domingo',
];
export const listaDeDias = (dias: number[]) => {
  const nomes = dias.map((d) => NOMES_DIA_LONGO[d]!);
  return nomes.length <= 1
    ? (nomes[0] ?? '')
    : `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`;
};
