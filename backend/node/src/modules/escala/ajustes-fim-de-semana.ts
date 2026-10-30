import type { DiaAberto } from '../regras/capacidade.js';
import type { VendaDia } from './cenarios-dias.js';

// Regras do Cenário 2 (e, depois, do 3) para reduzir custo sem destruir a loja: só sábado e domingo mudam, nesta ordem:
// reduzir o fechamento → fechar o domingo → fechar o sábado. Cada fase parte do horário de hoje e vale o primeiro que
// faz a equipe atual caber sem violar nenhuma trava. Funções puras, sem banco.
export const TRAVAS = {
  // Quanto do faturamento mensal da loja o cenário pode deixar de faturar, no máximo (%).
  perdaMaxPct: 10,
  // Quanto das horas abertas por semana de hoje a loja precisa manter, no mínimo (%).
  horasMinPct: 85,
  // Horas abertas que um dia reduzido mantém, no mínimo (abaixo disso, só fechando).
  horasMinDia: 4,
} as const;

export const SABADO = 5;
export const DOMINGO = 6;
const FIM_DE_SEMANA = [SABADO, DOMINGO];

export type Passo =
  | {
      tipo: 'reduzir';
      dia: number;
      horas: number;
      de: { abre: number; fecha: number };
      para: { abre: number; fecha: number };
    }
  | { tipo: 'fechar'; dia: number; de: { abre: number; fecha: number } };

export type MotivoParada = 'perda' | 'horas' | 'fim_de_semana';

export type ResultadoSequencia = {
  // A equipe atual cobre o horário final dentro das travas.
  cobre: boolean;
  // Horário final de cada dia aberto (o último estado válido quando não cobre).
  dias: DiaAberto[];
  passos: Passo[];
  // Só quando não cobre: a trava que parou o cenário, ou `fim_de_semana` se não havia mais o que mexer.
  parou: MotivoParada | null;
  // Só quando não cobre: horas de cobertura que ainda faltam no horário final.
  faltaH: number | null;
  perdaPct: number;
  horasSemana: number;
};

export type EntradaSequencia = {
  dias: DiaAberto[];
  // Venda por mês de cada dia da semana (valores usados só no cálculo; o cenário esconde de quem não é dono).
  porDia: Pick<VendaDia, 'dia' | 'protegido' | 'vendaMes'>[];
  cobre: (dias: DiaAberto[]) => boolean;
  // Horas que ainda faltam para a equipe cobrir este horário (só para dizer quanto falta).
  faltaH?: (dias: DiaAberto[]) => number;
};

const arred1 = (n: number) => Math.round(n * 10) / 10;
const arred2 = (n: number) => Math.round(n * 100) / 100;
const horasDoDia = (d: DiaAberto) => d.fecha - d.abre;
const horasDe = (dias: DiaAberto[]) => dias.reduce((s, d) => s + horasDoDia(d), 0);
const porDiaDaSemana = (a: DiaAberto, b: DiaAberto) => a.dia - b.dia;

// Perda de faturamento por mês de um horário frente ao de hoje: dia reduzido perde a parte das horas cortadas
// (venda dividida igualmente entre as horas abertas), dia fechado perde o dia inteiro.
export const perdaMensal = (
  hoje: DiaAberto[],
  atual: DiaAberto[],
  porDia: EntradaSequencia['porDia'],
) =>
  hoje.reduce((s, d) => {
    const agora = atual.find((x) => x.dia === d.dia);
    const fracao = 1 - (agora ? horasDoDia(agora) : 0) / horasDoDia(d);
    return s + (porDia.find((v) => v.dia === d.dia)?.vendaMes ?? 0) * fracao;
  }, 0);

const faturamentoDeHoje = (hoje: DiaAberto[], porDia: EntradaSequencia['porDia']) =>
  hoje.reduce((s, d) => s + (porDia.find((v) => v.dia === d.dia)?.vendaMes ?? 0), 0);

// Respeita as travas de perda e de horas? Devolve a trava violada, se houver.
const violacao = (
  hoje: DiaAberto[],
  atual: DiaAberto[],
  porDia: EntradaSequencia['porDia'],
): 'perda' | 'horas' | null => {
  const fat = faturamentoDeHoje(hoje, porDia);
  const perdaPct = fat > 0 ? (perdaMensal(hoje, atual, porDia) / fat) * 100 : 0;
  if (perdaPct > TRAVAS.perdaMaxPct + 1e-9) return 'perda';
  if (horasDe(atual) < (horasDe(hoje) * TRAVAS.horasMinPct) / 100 - 1e-9) return 'horas';
  return null;
};

// Reduz o fechamento, 1 h por vez, do dia de fim de semana mais barato (menor venda por hora; empate: domingo)
// que ainda tenha mais de 4 h abertas, até cobrir ou até uma trava (ou o piso de 4 h) impedir o próximo passo.
const reduzir = (
  hoje: DiaAberto[],
  inicio: DiaAberto[],
  porDia: EntradaSequencia['porDia'],
  cobre: EntradaSequencia['cobre'],
) => {
  let atual = [...inicio];
  let parou: MotivoParada | null = null;
  const custoPorHora = (dia: number) => {
    const h = hoje.find((d) => d.dia === dia)!;
    return (porDia.find((v) => v.dia === dia)?.vendaMes ?? 0) / horasDoDia(h);
  };
  while (!cobre(atual)) {
    const candidatos = atual
      .filter(
        (d) => FIM_DE_SEMANA.includes(d.dia) && horasDoDia(d) - 1 >= TRAVAS.horasMinDia - 1e-9,
      )
      .sort((a, b) => custoPorHora(a.dia) - custoPorHora(b.dia) || b.dia - a.dia);
    const escolhido = candidatos[0];
    if (!escolhido) {
      parou = 'fim_de_semana';
      break;
    }
    const proximo = atual.map((d) => (d.dia === escolhido.dia ? { ...d, fecha: d.fecha - 1 } : d));
    const v = violacao(hoje, proximo, porDia);
    if (v) {
      parou = v;
      break;
    }
    atual = proximo;
  }
  return { dias: atual, parou, cobre: cobre(atual) };
};

// Resume as mudanças entre o horário de hoje e o final em passos legíveis: reduções (por dia) e fechamentos.
export const passosDe = (hoje: DiaAberto[], final: DiaAberto[]): Passo[] => {
  const reduzidos: Passo[] = [];
  const fechados: Passo[] = [];
  for (const d of hoje.filter((x) => FIM_DE_SEMANA.includes(x.dia))) {
    const f = final.find((x) => x.dia === d.dia);
    const de = { abre: d.abre, fecha: d.fecha };
    if (!f) fechados.push({ tipo: 'fechar', dia: d.dia, de });
    else if (f.fecha < d.fecha)
      reduzidos.push({
        tipo: 'reduzir',
        dia: d.dia,
        horas: arred2(d.fecha - f.fecha),
        de,
        para: { abre: f.abre, fecha: f.fecha },
      });
  }
  // Ordem em que o cenário aplica: reduções, depois fechar o domingo e por fim o sábado.
  fechados.sort((a, b) => b.dia - a.dia);
  return [...reduzidos.sort((a, b) => b.dia - a.dia), ...fechados];
};

// Sequência do Cenário 2. Fases, cada uma a partir do horário de hoje:
//  A) só reduzir sábado e domingo; B) fechar o domingo (e reduzir o sábado, se preciso); C) fechar sábado e domingo.
// Dia protegido (de maior faturamento) só reduz. Vale a primeira fase que cobre dentro das travas; se nenhuma cobre,
// devolve o corte máximo da fase A e a trava que parou.
export const sequenciaFimDeSemana = (a: EntradaSequencia): ResultadoSequencia => {
  const hoje = [...a.dias].sort(porDiaDaSemana);
  const protegido = (dia: number) => a.porDia.find((v) => v.dia === dia)?.protegido ?? false;
  const resultado = (
    dias: DiaAberto[],
    cobre: boolean,
    parou: MotivoParada | null,
  ): ResultadoSequencia => {
    const fat = faturamentoDeHoje(hoje, a.porDia);
    return {
      cobre,
      dias,
      passos: passosDe(hoje, dias),
      parou: cobre ? null : parou,
      faltaH: cobre ? null : a.faltaH ? arred2(a.faltaH(dias)) : null,
      perdaPct: fat > 0 ? arred1((perdaMensal(hoje, dias, a.porDia) / fat) * 100) : 0,
      horasSemana: arred2(horasDe(dias)),
    };
  };
  if (a.cobre(hoje)) return resultado(hoje, true, null);

  const fases: { fechar: number[] }[] = [
    { fechar: [] },
    { fechar: [DOMINGO] },
    { fechar: [SABADO, DOMINGO] },
  ];
  const paradas: (MotivoParada | null)[] = [];
  let corteMaximo: DiaAberto[] | null = null;
  for (const fase of fases) {
    const fechaveis = fase.fechar.filter((d) => hoje.some((x) => x.dia === d) && !protegido(d));
    // Fase que pediria fechar um dia que não pode (protegido ou já fechado) não é uma fase nova: pula.
    if (fase.fechar.length > 0 && fechaveis.length === 0) continue;
    if (
      fase.fechar.length > 0 &&
      fechaveis.length < fase.fechar.filter((d) => hoje.some((x) => x.dia === d)).length
    )
      continue;
    const inicio = hoje.filter((d) => !fechaveis.includes(d.dia));
    if (inicio.length === 0) continue;
    const base = violacao(hoje, inicio, a.porDia);
    if (base) {
      paradas.push(base);
      continue;
    }
    const r = reduzir(hoje, inicio, a.porDia, a.cobre);
    if (fase.fechar.length === 0) corteMaximo = r.dias;
    if (r.cobre) return resultado(r.dias, true, null);
    paradas.push(r.parou);
  }
  const final = corteMaximo ?? hoje;
  // Uma trava (perda ou horas) explica melhor do que "nada mais a mexer": vale se alguma fase parou nela.
  const trava = paradas.find((p) => p === 'perda' || p === 'horas');
  return resultado(final, false, trava ?? 'fim_de_semana');
};

// Fração de cada dia que deixa de abrir (0 = igual a hoje, 1 = fechado), para ponderar um valor mensal por dia.
const perdaPonderada = (hoje: DiaAberto[], atual: DiaAberto[], valorMes: (dia: number) => number) =>
  hoje.reduce((s, d) => {
    const agora = atual.find((x) => x.dia === d.dia);
    return s + valorMes(d.dia) * (1 - (agora ? horasDoDia(agora) : 0) / horasDoDia(d));
  }, 0);

// Todos os horários que o Cenário 3 pode testar: segunda a sexta ficam como hoje; cada dia de fim de semana aberto pode
// ficar como hoje, fechar mais cedo de 1 em 1 h (sobrando ao menos 4 h) ou, se não for dia protegido, fechar. Já vêm
// filtrados pelas travas (perda máxima de faturamento e piso de horas). O primeiro é sempre o horário de hoje.
export const estadosPermitidos = (a: {
  dias: DiaAberto[];
  porDia: EntradaSequencia['porDia'];
}): DiaAberto[][] => {
  const hoje = [...a.dias].sort(porDiaDaSemana);
  const protegido = (dia: number) => a.porDia.find((v) => v.dia === dia)?.protegido ?? false;
  const fixos = hoje.filter((d) => !FIM_DE_SEMANA.includes(d.dia));
  const opcoes = hoje
    .filter((d) => FIM_DE_SEMANA.includes(d.dia))
    .map((d) => {
      const lista: (DiaAberto | null)[] = [d];
      for (let h = 1; horasDoDia(d) - h >= TRAVAS.horasMinDia - 1e-9; h++)
        lista.push({ ...d, fecha: d.fecha - h });
      if (!protegido(d.dia)) lista.push(null);
      return lista;
    });
  let estados: DiaAberto[][] = [[]];
  for (const lista of opcoes)
    estados = estados.flatMap((e) => lista.map((o) => (o ? [...e, o] : e)));
  return estados
    .map((e) => [...fixos, ...e].sort(porDiaDaSemana))
    .filter((e) => e.length > 0 && violacao(hoje, e, a.porDia) === null);
};

export type EstadoEscolhido<T> = {
  dias: DiaAberto[];
  fechados: number[];
  avaliacao: T;
  perdida: number;
  impacto: number;
  horasCortadas: number;
};

const MESMO_VALOR = 0.005; // meio centavo: abaixo disso, empate

// O estado permitido de menor impacto (custo adicional de folha + margem perdida). Empate: menos contratações, depois
// menos dias fechados, depois menos horas cortadas, depois o primeiro na ordem de teste (o mais próximo de hoje).
export const melhorEstado = <T extends { custo: number; pessoas: number }>(a: {
  dias: DiaAberto[];
  porDia: EntradaSequencia['porDia'];
  margemMes: (dia: number) => number;
  avaliar: (dias: DiaAberto[]) => T;
}): EstadoEscolhido<T> => {
  const hoje = [...a.dias].sort(porDiaDaSemana);
  let melhor: EstadoEscolhido<T> | null = null;
  for (const dias of estadosPermitidos(a)) {
    const avaliacao = a.avaliar(dias);
    const perdida = perdaPonderada(hoje, dias, a.margemMes);
    const atual: EstadoEscolhido<T> = {
      dias,
      fechados: hoje.filter((d) => !dias.some((x) => x.dia === d.dia)).map((d) => d.dia),
      avaliacao,
      perdida,
      impacto: avaliacao.custo + perdida,
      horasCortadas: horasDe(hoje) - horasDe(dias),
    };
    const ganha =
      melhor === null ||
      (Math.abs(atual.impacto - melhor.impacto) >= MESMO_VALOR
        ? atual.impacto < melhor.impacto
        : atual.avaliacao.pessoas !== melhor.avaliacao.pessoas
          ? atual.avaliacao.pessoas < melhor.avaliacao.pessoas
          : atual.fechados.length !== melhor.fechados.length
            ? atual.fechados.length < melhor.fechados.length
            : atual.horasCortadas < melhor.horasCortadas - 1e-9);
    if (ganha) melhor = atual;
  }
  return melhor!;
};
