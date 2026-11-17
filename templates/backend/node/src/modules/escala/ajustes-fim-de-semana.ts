import type { DiaAberto } from '../regras/capacidade.js';
import { SEMANAS_NO_MES, type VendaDia } from './cenarios-dias.js';
import type { VendaDiaHora } from './vendas.js';

// Regras do Cenário 2 (e, depois, do 3) para reduzir custo sem destruir a loja: só sábado e domingo mudam, nesta ordem:
// reduzir o fechamento → fechar o domingo → fechar o sábado. Cada fase parte do horário de hoje e vale o primeiro que
// faz a equipe atual caber sem violar nenhuma trava. Funções puras, sem banco.
// Limite de perda do Cenário 2 (Sem contratações): ele protege mais o faturamento que o Cenário 3, que segue em `TRAVAS`.
export const PERDA_MAX_CENARIO_2_PCT = 3;
export const TRAVAS = {
  // Quanto do faturamento mensal da loja o cenário pode deixar de faturar, no máximo (%).
  perdaMaxPct: 10,
  // Quanto das horas abertas por semana de hoje a loja precisa manter, no mínimo (%).
  horasMinPct: 85,
  // Horas abertas que um dia reduzido mantém, no mínimo (abaixo disso, só fechando).
  horasMinDia: 4,
} as const;

// Limites do horário estendido (Cenário 3): até 3 h a mais por dia, sem abrir antes das 6h nem fechar depois das 24h
// e com no máximo 16 h abertas no dia. Quanto da venda da hora vizinha vale uma hora nova sem venda registrada.
export const LIMITES_EXTENSAO = {
  horasMax: 3,
  aberturaMin: 6,
  fechamentoMax: 24,
  horasMaxDia: 16,
  fatorHoraNova: 0.5,
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
  | { tipo: 'fechar'; dia: number; de: { abre: number; fecha: number } }
  | {
      tipo: 'estender';
      dia: number;
      horas: number;
      de: { abre: number; fecha: number };
      para: { abre: number; fecha: number };
    };

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
  // Venda média por dia da semana e hora: com ela a perda é a soma da venda das horas que fecham; sem ela, a venda do dia é
  // dividida igualmente entre as horas abertas.
  tabela?: VendaDiaHora | null;
  // Limite de perda de faturamento (%) desta sequência; sem ele vale o de `TRAVAS`.
  perdaMaxPct?: number;
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
  tabela?: VendaDiaHora | null,
) =>
  tabela
    ? vendaPerdidaHoraria(hoje, atual, tabela).vendaMes
    : hoje.reduce((s, d) => {
        const agora = atual.find((x) => x.dia === d.dia);
        // Horário maior que o de hoje não é perda (o ganho das horas novas é calculado à parte).
        const fracao = Math.max(0, 1 - (agora ? horasDoDia(agora) : 0) / horasDoDia(d));
        return s + (porDia.find((v) => v.dia === d.dia)?.vendaMes ?? 0) * fracao;
      }, 0);

// Fração da hora `h` (de h a h+1) que o dia `d` fica aberto.
const abertaNaHora = (d: DiaAberto | undefined, h: number) =>
  d ? Math.max(0, Math.min(d.fecha, h + 1) - Math.max(d.abre, h)) : 0;

export type VendaPerdidaDia = {
  dia: number;
  // Horas que deixam de abrir no dia (todas, se o dia fecha).
  horasFechadas: number;
  // Novo fechamento do dia reduzido; nulo quando o dia fecha inteiro.
  ate: number | null;
  vendaMes: number;
};

// Venda por mês que deixa de entrar com o horário `atual` frente ao de hoje: soma a venda média de cada hora que fecha
// (por dia da semana) × 52 ÷ 12, e devolve o valor por dia alterado. Horário maior que o de hoje não é perda; hora sem
// venda registrada conta zero.
export const vendaPerdidaHoraria = (
  hoje: DiaAberto[],
  atual: DiaAberto[],
  tabela: VendaDiaHora,
): { vendaMes: number; porDia: VendaPerdidaDia[] } => {
  const porDia: VendaPerdidaDia[] = [];
  for (const d of hoje) {
    const agora = atual.find((x) => x.dia === d.dia);
    let venda = 0;
    let fechadas = 0;
    for (let h = 0; h < 24; h++) {
      const fecha = Math.max(0, abertaNaHora(d, h) - abertaNaHora(agora, h));
      if (fecha <= 0) continue;
      fechadas += fecha;
      venda += (tabela.venda[d.dia]?.[h] ?? 0) * fecha;
    }
    if (fechadas > 1e-9)
      porDia.push({
        dia: d.dia,
        horasFechadas: arred2(fechadas),
        ate: agora ? agora.fecha : null,
        vendaMes: arred2(venda * SEMANAS_NO_MES),
      });
  }
  return { vendaMes: arred2(porDia.reduce((s, p) => s + p.vendaMes, 0)), porDia };
};

const faturamentoDeHoje = (hoje: DiaAberto[], porDia: EntradaSequencia['porDia']) =>
  hoje.reduce((s, d) => s + (porDia.find((v) => v.dia === d.dia)?.vendaMes ?? 0), 0);

// Respeita as travas de perda e de horas? Devolve a trava violada, se houver.
const violacao = (
  hoje: DiaAberto[],
  atual: DiaAberto[],
  porDia: EntradaSequencia['porDia'],
  tabela?: VendaDiaHora | null,
  perdaMaxPct: number = TRAVAS.perdaMaxPct,
): 'perda' | 'horas' | null => {
  const fat = faturamentoDeHoje(hoje, porDia);
  const perdaPct = fat > 0 ? (perdaMensal(hoje, atual, porDia, tabela) / fat) * 100 : 0;
  if (perdaPct > perdaMaxPct + 1e-9) return 'perda';
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
  tabela?: VendaDiaHora | null,
  perdaMaxPct?: number,
) => {
  let atual = [...inicio];
  let parou: MotivoParada | null = null;
  // O que custa fechar mais 1 h do dia: com a venda hora a hora, a venda da última hora aberta; sem ela, a venda do dia
  // dividida pelas horas de hoje.
  const custoPorHora = (d: DiaAberto) => {
    if (tabela) return tabela.venda[d.dia]?.[Math.ceil(d.fecha - 1e-9) - 1] ?? 0;
    const h = hoje.find((x) => x.dia === d.dia)!;
    return (porDia.find((v) => v.dia === d.dia)?.vendaMes ?? 0) / horasDoDia(h);
  };
  while (!cobre(atual)) {
    const candidatos = atual
      .filter(
        (d) => FIM_DE_SEMANA.includes(d.dia) && horasDoDia(d) - 1 >= TRAVAS.horasMinDia - 1e-9,
      )
      .sort((a, b) => custoPorHora(a) - custoPorHora(b) || b.dia - a.dia);
    const escolhido = candidatos[0];
    if (!escolhido) {
      parou = 'fim_de_semana';
      break;
    }
    const proximo = atual.map((d) => (d.dia === escolhido.dia ? { ...d, fecha: d.fecha - 1 } : d));
    const v = violacao(hoje, proximo, porDia, tabela, perdaMaxPct);
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
  const estendidos: Passo[] = [];
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
    else if (f.fecha > d.fecha || f.abre < d.abre)
      estendidos.push({
        tipo: 'estender',
        dia: d.dia,
        horas: arred2(f.fecha - d.fecha + (d.abre - f.abre)),
        de,
        para: { abre: f.abre, fecha: f.fecha },
      });
  }
  // Ordem em que o cenário aplica: reduções, depois fechar o domingo e por fim o sábado.
  fechados.sort((a, b) => b.dia - a.dia);
  return [
    ...reduzidos.sort((a, b) => b.dia - a.dia),
    ...fechados,
    ...estendidos.sort((a, b) => a.dia - b.dia),
  ];
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
      perdaPct: fat > 0 ? arred1((perdaMensal(hoje, dias, a.porDia, a.tabela) / fat) * 100) : 0,
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
    const base = violacao(hoje, inicio, a.porDia, a.tabela, a.perdaMaxPct);
    if (base) {
      paradas.push(base);
      continue;
    }
    const r = reduzir(hoje, inicio, a.porDia, a.cobre, a.tabela, a.perdaMaxPct);
    if (fase.fechar.length === 0) corteMaximo = r.dias;
    if (r.cobre) return resultado(r.dias, true, null);
    paradas.push(r.parou);
  }
  const final = corteMaximo ?? hoje;
  // Uma trava (perda ou horas) explica melhor do que "nada mais a mexer": vale se alguma fase parou nela.
  const trava = paradas.find((p) => p === 'perda' || p === 'horas');
  return resultado(final, false, trava ?? 'fim_de_semana');
};

// Todos os horários que o Cenário 3 pode testar: segunda a sexta ficam como hoje; cada dia de fim de semana aberto pode
// ficar como hoje, fechar mais cedo de 1 em 1 h (sobrando ao menos 4 h) ou, se não for dia protegido, fechar. Já vêm
// filtrados pelas travas (perda máxima de faturamento e piso de horas). O primeiro é sempre o horário de hoje.
// Com `estender`, cada dia de fim de semana aberto também pode abrir mais cedo e/ou fechar mais tarde (de 1 a 3 h, dentro
// dos limites de LIMITES_EXTENSAO); as extensões vêm depois das demais opções do dia, então o primeiro estado segue sendo o de hoje.
export const estadosPermitidos = (a: {
  dias: DiaAberto[];
  porDia: EntradaSequencia['porDia'];
  estender?: boolean;
  tabela?: VendaDiaHora | null;
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
      if (a.estender) {
        const L = LIMITES_EXTENSAO;
        for (let total = 1; total <= L.horasMax; total++)
          for (let cedo = 0; cedo <= total; cedo++) {
            const tarde = total - cedo;
            if (d.abre - cedo < L.aberturaMin - 1e-9) continue;
            if (d.fecha + tarde > L.fechamentoMax + 1e-9) continue;
            if (horasDoDia(d) + total > L.horasMaxDia + 1e-9) continue;
            lista.push({ ...d, abre: d.abre - cedo, fecha: d.fecha + tarde });
          }
      }
      return lista;
    });
  let estados: DiaAberto[][] = [[]];
  for (const lista of opcoes)
    estados = estados.flatMap((e) => lista.map((o) => (o ? [...e, o] : e)));
  return estados
    .map((e) => [...fixos, ...e].sort(porDiaDaSemana))
    .filter((e) => e.length > 0 && violacao(hoje, e, a.porDia, a.tabela) === null);
};

export type GanhoDia = {
  dia: number;
  horasNovas: number;
  // 'registrada': a venda vem da base, de horas fora do horário; 'vizinha': fração da hora de borda; 'mista': as duas.
  origem: 'registrada' | 'vizinha' | 'mista';
  vendaMes: number;
};

// Venda por mês das horas que o horário `final` abre a mais que o de hoje (só sábado e domingo). Hora com venda
// registrada vale o registrado; sem registro vale `fatorHoraNova` da hora de borda do mesmo dia (a última hora aberta ou a
// primeira, conforme o lado). `tabela` é a média por dia da semana e hora; sem ela, não há como estimar e o ganho é zero.
export const ganhoDasHorasNovas = (
  hoje: DiaAberto[],
  final: DiaAberto[],
  tabela: VendaDiaHora | null,
  fator: number = LIMITES_EXTENSAO.fatorHoraNova,
): { vendaMes: number; porDia: GanhoDia[] } => {
  const porDia: GanhoDia[] = [];
  if (tabela) {
    for (const d of hoje.filter((x) => FIM_DE_SEMANA.includes(x.dia))) {
      const f = final.find((x) => x.dia === d.dia);
      if (!f) continue;
      const horasNovas: { hora: number; borda: number }[] = [];
      for (let h = f.abre; h < d.abre; h++) horasNovas.push({ hora: h, borda: d.abre });
      for (let h = d.fecha; h < f.fecha; h++) horasNovas.push({ hora: h, borda: d.fecha - 1 });
      if (horasNovas.length === 0) continue;
      let venda = 0;
      let registradas = 0;
      for (const { hora, borda } of horasNovas) {
        const reg = tabela.venda[d.dia]?.[hora] ?? 0;
        if (reg > 0) {
          registradas++;
          venda += reg;
        } else {
          venda += fator * (tabela.venda[d.dia]?.[borda] ?? 0);
        }
      }
      porDia.push({
        dia: d.dia,
        horasNovas: horasNovas.length,
        origem:
          registradas === horasNovas.length
            ? 'registrada'
            : registradas === 0
              ? 'vizinha'
              : 'mista',
        vendaMes: arred2(venda * SEMANAS_NO_MES),
      });
    }
  }
  return {
    vendaMes: arred2(porDia.reduce((s, g) => s + g.vendaMes, 0)),
    porDia,
  };
};

// Horas a mais por semana que o horário `final` abre frente ao de hoje.
const horasNovasDe = (hoje: DiaAberto[], final: DiaAberto[]) =>
  hoje.reduce((s, d) => {
    const f = final.find((x) => x.dia === d.dia);
    return f ? s + Math.max(0, f.fecha - d.fecha) + Math.max(0, d.abre - f.abre) : s;
  }, 0);

export type EstadoEscolhido<T> = {
  dias: DiaAberto[];
  fechados: number[];
  avaliacao: T;
  perdida: number;
  // Ganho mensal estimado das horas novas (0 sem extensão); abatido do impacto.
  ganho: number;
  impacto: number;
  horasCortadas: number;
  horasNovas: number;
};

const MESMO_VALOR = 0.005; // meio centavo: abaixo disso, empate

// O estado permitido de menor impacto (custo adicional de folha + perda − ganho das horas novas). Com `tabela` (venda média
// por dia da semana e hora) a perda e o ganho são de venda; sem ela, não há como estimar e a perda é zero. Empate:
// menos contratações, depois menos dias fechados, depois menos horas cortadas, depois menos horas estendidas, depois o
// primeiro na ordem de teste (o mais próximo de hoje).
export const melhorEstado = <T extends { custo: number; pessoas: number }>(a: {
  dias: DiaAberto[];
  porDia: EntradaSequencia['porDia'];
  tabela?: VendaDiaHora | null;
  // Tabela na régua do cenário (margem ou venda) que mede a perda do impacto; as travas seguem em venda real (`tabela`).
  tabelaImpacto?: VendaDiaHora | null;
  // Parte da venda de um dia fechado que fica (1 − recaptura); só vale com `tabela`.
  fica?: number;
  avaliar: (dias: DiaAberto[]) => T;
  // Com `ganhoMes`, o horário pode ser estendido; devolve o ganho mensal das horas novas de um horário.
  ganhoMes?: (dias: DiaAberto[]) => number;
}): EstadoEscolhido<T> => {
  const hoje = [...a.dias].sort(porDiaDaSemana);
  let melhor: EstadoEscolhido<T> | null = null;
  for (const dias of estadosPermitidos({ ...a, estender: a.ganhoMes !== undefined })) {
    const avaliacao = a.avaliar(dias);
    const perdida = a.tabela
      ? vendaPerdidaHoraria(hoje, dias, a.tabelaImpacto ?? a.tabela).vendaMes * (a.fica ?? 1)
      : 0;
    const ganho = a.ganhoMes ? a.ganhoMes(dias) : 0;
    const atual: EstadoEscolhido<T> = {
      dias,
      fechados: hoje.filter((d) => !dias.some((x) => x.dia === d.dia)).map((d) => d.dia),
      avaliacao,
      perdida,
      ganho,
      impacto: avaliacao.custo + perdida - ganho,
      horasCortadas: Math.max(0, horasDe(hoje) - horasDe(dias) + horasNovasDe(hoje, dias)),
      horasNovas: horasNovasDe(hoje, dias),
    };
    const ganha =
      melhor === null ||
      (Math.abs(atual.impacto - melhor.impacto) >= MESMO_VALOR
        ? atual.impacto < melhor.impacto
        : atual.avaliacao.pessoas !== melhor.avaliacao.pessoas
          ? atual.avaliacao.pessoas < melhor.avaliacao.pessoas
          : atual.fechados.length !== melhor.fechados.length
            ? atual.fechados.length < melhor.fechados.length
            : Math.abs(atual.horasCortadas - melhor.horasCortadas) >= 1e-9
              ? atual.horasCortadas < melhor.horasCortadas
              : atual.horasNovas < melhor.horasNovas - 1e-9);
    if (ganha) melhor = atual;
  }
  return melhor!;
};
