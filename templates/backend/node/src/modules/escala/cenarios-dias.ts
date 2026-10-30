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

export type Avaliacao = { custo: number; pessoas: number };
export type Combinacao<T extends Avaliacao> = {
  fechados: number[];
  abertos: DiaAberto[];
  avaliacao: T;
  perdida: number; // margem mensal que deixa de entrar com os dias fechados
  impacto: number; // custo adicional de folha + margem perdida
};

const MESMO_VALOR = 0.005; // meio centavo: abaixo disso, empate

// Todas as combinações de dias a fechar entre os que não são protegidos (no máximo 2^7), sem nunca fechar o último dia aberto,
// e a de menor impacto: custo adicional de folha + margem perdida (é o mesmo que o maior resultado líquido).
// Empate: menos contratações, depois menos dias fechados, depois fecha os dias mais tardios da semana.
export const melhorCombinacao = <T extends Avaliacao>(a: {
  dias: DiaAberto[];
  protegidos: number[];
  margemMes: (dia: number) => number;
  avaliar: (abertos: DiaAberto[]) => T;
}): Combinacao<T> => {
  const livres = a.dias
    .map((d) => d.dia)
    .filter((d) => !a.protegidos.includes(d))
    .sort((x, y) => x - y);
  const maisTardio = (x: number[], y: number[]) => {
    const dx = [...x].sort((p, q) => q - p);
    const dy = [...y].sort((p, q) => q - p);
    for (let i = 0; i < Math.min(dx.length, dy.length); i++)
      if (dx[i] !== dy[i]) return dy[i]! - dx[i]!;
    return 0;
  };
  let melhor: Combinacao<T> | null = null;
  for (let mascara = 0; mascara < 1 << livres.length; mascara++) {
    const fechados = livres.filter((_, i) => mascara & (1 << i));
    const abertos = a.dias.filter((d) => !fechados.includes(d.dia));
    if (abertos.length === 0) continue;
    const avaliacao = a.avaliar(abertos);
    const perdida = fechados.reduce((s, d) => s + a.margemMes(d), 0);
    const atual: Combinacao<T> = {
      fechados,
      abertos,
      avaliacao,
      perdida,
      impacto: avaliacao.custo + perdida,
    };
    const ganha =
      melhor === null ||
      (Math.abs(atual.impacto - melhor.impacto) >= MESMO_VALOR
        ? atual.impacto < melhor.impacto
        : atual.avaliacao.pessoas !== melhor.avaliacao.pessoas
          ? atual.avaliacao.pessoas < melhor.avaliacao.pessoas
          : atual.fechados.length !== melhor.fechados.length
            ? atual.fechados.length < melhor.fechados.length
            : maisTardio(atual.fechados, melhor.fechados) < 0);
    if (ganha) melhor = atual;
  }
  return melhor!;
};
