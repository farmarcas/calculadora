import { passa, verificarRegra, type DiaAberto } from '../regras/capacidade.js';
import { regraPara, tetoEfetivo } from '../regras/perfis.js';
import {
  horarioDaSemana,
  horasDaSemana,
  juntarFatias,
  type CenariosRegra,
  type DiaCenario,
  type EntradaCenarios,
  type Fatia,
} from './cenarios.js';
import { vendasPorDiaEHora } from './vendas.js';

export type Extensao = {
  dia: number;
  de: string;
  ate: string;
  // Referência (hora vizinha), não previsão. Nulos sem base comercial.
  vendaRef: number | null;
  margemRef: number | null;
};

export type CenarioEstender = {
  disponivel: boolean;
  motivoIndisponivel: string | null;
  foco: string;
  direcionamento: string;
  horasEstender: number;
  horasSemana: number;
  horarioSemana: DiaCenario[];
  extensoes: Extensao[];
  vendaRefMes: number | null;
  margemRefMes: number | null;
  aviso: string | null;
  // Só para o dono.
  custoAdicionalMensal?: number | null;
  impactoMensal?: number | null;
};

export type CargoReduzir = {
  funcao: string;
  pessoasHoje: number;
  pessoasNecessarias: number;
  excedente: number;
  // Só para o dono; nulo quando falta o salário médio do cargo.
  economiaMensal?: number | null;
};

export type CenarioReduzir = {
  temExcedente: boolean;
  foco: string;
  direcionamento: string;
  cargos: CargoReduzir[];
  pessoasExcedentes: number;
  aviso: string | null;
  // Só para o dono.
  economiaMensal?: number | null;
  economiaPct?: number | null;
  impactoMensal?: number | null;
};

export type ExtrasRegra = { estender: CenarioEstender; reduzir: CenarioReduzir };

const SEMANAS_NO_MES = 52 / 12;
const MAX_POR_PONTA = 2;
// Quanto da venda da hora vizinha vale para uma hora nova: 50% na primeira, 25% na segunda (e 50% num dia
// hoje fechado). Quanto mais longe do horário atual, menos se espera vender.
const FATOR_BLOCO = 0.5;
const fatorPonta = (jaEstendidas: number) => 0.5 ** (jaEstendidas + 1);
const arred = (n: number) => Math.round(n * 100) / 100;
const brl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

type Tipo = 'depois' | 'antes' | 'bloco';
type Cand = Fatia & { tipo: Tipo; porHora: number; dias: DiaAberto[] };
const RANK: Record<Tipo, number> = { depois: 0, antes: 1, bloco: 2 };

// Cenário 4: com a equipe do Cenário 1 (atual + vagas), abre mais horas onde a venda de referência
// compensa, uma hora por vez, enquanto a regra de cobertura continuar passando sem nova contratação.
const montarEstender = (e: EntradaCenarios, c: CenariosRegra): CenarioEstender => {
  const regra = regraPara(e.regraId, e.convencao8h24);
  const vb = vendasPorDiaEHora(e.vendas);
  const cheia = tetoEfetivo(regra);
  const vagas = c.manter.contratacoes.flatMap((ct) =>
    Array.from({ length: ct.pessoas }, () => ({ funcao: ct.funcao, cargaH: ct.parcialH ?? cheia })),
  );
  const equipe = [...e.pessoas, ...vagas];
  const cobre = (dias: DiaAberto[]) => passa(verificarRegra(regra, dias, e.minimos, equipe));

  const original = new Map(e.dias.map((d) => [d.dia, d]));
  const maisCurto = [...e.dias].sort(
    (a, b) => a.fecha - a.abre - (b.fecha - b.abre) || b.dia - a.dia,
  )[0];
  // Valor médio de [de, ate) num dia, hora a hora (venda ou margem); sem base vale zero.
  const soma = (m: number[][] | undefined, dia: number, de: number, ate: number) => {
    let t = 0;
    for (let h = Math.floor(de); h < Math.ceil(ate); h++)
      t += (m?.[dia]?.[h] ?? 0) * (Math.min(ate, h + 1) - Math.max(de, h));
    return t;
  };

  let atuais: DiaAberto[] = e.dias.map((d) => ({ ...d }));
  const antes = new Map<number, number>();
  const depois = new Map<number, number>();
  const reabertos = new Set<number>();
  const fatias: Fatia[] = [];

  const candidatas = (): Cand[] => {
    const lista: Cand[] = [];
    const com = (novos: DiaAberto[]) => novos.sort((a, b) => a.dia - b.dia);
    for (const d of atuais) {
      const o = original.get(d.dia);
      if (!o || reabertos.has(d.dia)) continue;
      const resto = atuais.filter((x) => x.dia !== d.dia);
      if ((antes.get(d.dia) ?? 0) < MAX_POR_PONTA) {
        const novo = Number.isInteger(d.abre) ? d.abre - 1 : Math.floor(d.abre);
        if (novo >= 0) {
          const len = d.abre - novo;
          const hora = Math.floor(o.abre);
          const f = fatorPonta(antes.get(d.dia) ?? 0);
          const venda = (vb?.venda[d.dia]?.[hora] ?? 0) * len * f;
          const margem = (vb?.margem[d.dia]?.[hora] ?? 0) * len * f;
          lista.push({
            tipo: 'antes',
            dia: d.dia,
            de: novo,
            ate: d.abre,
            venda,
            margem,
            porHora: margem / len,
            dias: com([...resto, { ...d, abre: novo }]),
          });
        }
      }
      if ((depois.get(d.dia) ?? 0) < MAX_POR_PONTA) {
        const novo = Number.isInteger(d.fecha) ? d.fecha + 1 : Math.ceil(d.fecha);
        if (novo <= 24) {
          const len = novo - d.fecha;
          const hora = Math.ceil(o.fecha) - 1;
          const f = fatorPonta(depois.get(d.dia) ?? 0);
          const venda = (vb?.venda[d.dia]?.[hora] ?? 0) * len * f;
          const margem = (vb?.margem[d.dia]?.[hora] ?? 0) * len * f;
          lista.push({
            tipo: 'depois',
            dia: d.dia,
            de: d.fecha,
            ate: novo,
            venda,
            margem,
            porHora: margem / len,
            dias: com([...resto, { ...d, fecha: novo }]),
          });
        }
      }
    }
    if (maisCurto) {
      for (let dia = 0; dia < 7; dia++) {
        if (atuais.some((x) => x.dia === dia)) continue;
        const { abre, fecha } = maisCurto;
        const margem = soma(vb?.margem, maisCurto.dia, abre, fecha) * FATOR_BLOCO;
        lista.push({
          tipo: 'bloco',
          dia,
          de: abre,
          ate: fecha,
          venda: soma(vb?.venda, maisCurto.dia, abre, fecha) * FATOR_BLOCO,
          margem,
          porHora: margem / (fecha - abre),
          dias: com([...atuais, { dia, abre, fecha }]),
        });
      }
    }
    return lista;
  };

  let semSobra = false;
  let semVenda = false;
  let semOndeAbrir = false;
  for (let passo = 0; passo < 7 * 6; passo++) {
    const todas = candidatas();
    if (todas.length === 0) {
      semOndeAbrir = fatias.length === 0;
      break;
    }
    const viaveis = todas.filter((x) => cobre(x.dias));
    if (viaveis.length === 0) {
      semSobra = fatias.length === 0;
      break;
    }
    const uteis = vb ? viaveis.filter((x) => x.margem > 0) : viaveis;
    if (uteis.length === 0) {
      semVenda = fatias.length === 0;
      break;
    }
    const escolhida = uteis.sort(
      (a, b) => b.porHora - a.porHora || RANK[a.tipo] - RANK[b.tipo] || b.dia - a.dia,
    )[0]!;
    fatias.push({
      dia: escolhida.dia,
      de: escolhida.de,
      ate: escolhida.ate,
      venda: escolhida.venda,
      margem: escolhida.margem,
    });
    atuais = escolhida.dias;
    if (escolhida.tipo === 'antes') antes.set(escolhida.dia, (antes.get(escolhida.dia) ?? 0) + 1);
    if (escolhida.tipo === 'depois')
      depois.set(escolhida.dia, (depois.get(escolhida.dia) ?? 0) + 1);
    if (escolhida.tipo === 'bloco') reabertos.add(escolhida.dia);
  }

  const horasAntes = horasDaSemana(e.dias);
  const base = {
    foco: 'Abrir mais usando horas já pagas',
    horasEstender: 0,
    horasSemana: horasAntes,
    horarioSemana: horarioDaSemana(e.dias),
    extensoes: [] as Extensao[],
    vendaRefMes: null,
    margemRefMes: null,
    aviso: null,
  };
  const indisponivel = (motivo: string): CenarioEstender => ({
    ...base,
    disponivel: false,
    motivoIndisponivel: motivo,
    direcionamento: motivo,
    ...(e.dono ? { custoAdicionalMensal: null, impactoMensal: null } : {}),
  });
  if (fatias.length === 0) {
    if (semOndeAbrir)
      return indisponivel(
        'Não há horário a acrescentar: a loja já abre em todas as horas possíveis.',
      );
    if (semVenda)
      return indisponivel('As horas vizinhas ao horário atual não têm venda que compense abrir.');
    return indisponivel(
      semSobra || !cobre(e.dias)
        ? 'A equipe não tem horas nem turnos sobrando para abrir mais sem contratar.'
        : 'Nenhuma hora a mais cabe na equipe sem nova contratação.',
    );
  }

  const horasSemana = horasDaSemana(atuais);
  const horasEstender = arred(horasSemana - horasAntes);
  const comVenda = vb !== null;
  const vendaSem = comVenda ? arred(fatias.reduce((s, f) => s + f.venda, 0)) : null;
  const margemSem = comVenda ? fatias.reduce((s, f) => s + f.margem, 0) : null;
  const vendaRefMes = vendaSem === null ? null : arred(vendaSem * SEMANAS_NO_MES);
  const margemRefMes = margemSem === null ? null : arred(margemSem * SEMANAS_NO_MES);
  const extensoes = juntarFatias(fatias, comVenda).map((x) => ({
    dia: x.dia,
    de: x.de,
    ate: x.ate,
    vendaRef: x.venda,
    margemRef: x.margem,
  }));
  const usaSobra =
    c.manter.contratacoes.length > 0
      ? 'a sobra das contratações do Cenário 1'
      : 'a sobra da equipe atual';
  const r: CenarioEstender = {
    disponivel: true,
    motivoIndisponivel: null,
    foco: base.foco,
    direcionamento: comVenda
      ? `Abra ${horasEstender}h a mais por semana usando ${usaSobra}, sem nova contratação. Referência de ${brl(margemRefMes!)} de margem por mês, calculada com parte da venda das horas vizinhas (não é previsão). Faz sentido quando você já vai pagar essas horas de qualquer jeito.`
      : `A equipe cobre ${horasEstender}h a mais por semana usando ${usaSobra}, sem nova contratação. Sem base comercial não dá para estimar a venda dessas horas.`,
    horasEstender,
    horasSemana,
    horarioSemana: horarioDaSemana(atuais),
    extensoes,
    vendaRefMes,
    margemRefMes,
    aviso: comVenda
      ? `A venda das horas novas é uma referência: usa parte da venda da hora vizinha (50% na primeira hora nova, 25% na segunda), não uma previsão.${vb.dias < 14 && !e.vendasDoCadastro ? ` A base tem só ${vb.dias} dias de venda.` : ''}`
      : 'Sem base comercial, as horas novas foram escolhidas só pela capacidade da equipe.',
  };
  if (e.dono) {
    const custo = c.manter.custoAdicionalMensal ?? null;
    r.custoAdicionalMensal = custo;
    r.impactoMensal = custo !== null && margemRefMes !== null ? arred(custo - margemRefMes) : null;
  }
  return r;
};

const pct = (n: number) => Math.round(n * 10) / 10;

// Cenário 5: por cargo com mínimo obrigatório que hoje cobre o horário, quantas pessoas excedem o
// necessário. Retira, uma a uma, a de menor carga enquanto a função continuar sem falta.
const montarReduzir = (e: EntradaCenarios, c: CenariosRegra): CenarioReduzir => {
  const regra = regraPara(e.regraId, e.convencao8h24);
  const linhaDe = (pessoas: EntradaCenarios['pessoas'], funcao: string) =>
    verificarRegra(regra, e.dias, e.minimos, pessoas).find((l) => l.funcao === funcao);
  const funcoes = [...new Set(e.pessoas.map((p) => p.funcao))].filter(
    (f) => (e.minimos[f] ?? 0) > 0,
  );

  const emFalta: string[] = [];
  const cargos: CargoReduzir[] = funcoes.map((funcao) => {
    const doCargo = e.pessoas
      .map((p, i) => ({ ...p, i }))
      .filter((p) => p.funcao === funcao)
      .sort((a, b) => a.cargaH - b.cargaH || a.i - b.i);
    let excedente = 0;
    if (linhaDe(e.pessoas, funcao)?.falta) emFalta.push(funcao);
    else {
      const fora = new Set<number>();
      for (const p of doCargo) {
        fora.add(p.i);
        const resto = e.pessoas.filter((_, i) => !fora.has(i));
        const l = linhaDe(resto, funcao);
        if (!l || l.falta) break;
        excedente++;
      }
    }
    return {
      funcao,
      pessoasHoje: doCargo.length,
      pessoasNecessarias: doCargo.length - excedente,
      excedente,
    };
  });

  const pessoasExcedentes = cargos.reduce((t, x) => t + x.excedente, 0);
  const temExcedente = pessoasExcedentes > 0;
  const r: CenarioReduzir = {
    temExcedente,
    foco: 'Ajustar a equipe ao horário atual',
    direcionamento: '',
    cargos,
    pessoasExcedentes,
    aviso: null,
  };

  if (e.dono) {
    const fator = 1 + (e.custos?.encargosPct ?? 0) / 100;
    for (const x of cargos) {
      const sal =
        e.custos?.salarioMedio[x.funcao as keyof NonNullable<typeof e.custos>['salarioMedio']];
      x.economiaMensal = e.custos && sal ? arred(x.excedente * sal * fator) : null;
    }
    const comExcedente = cargos.filter((x) => x.excedente > 0);
    const total =
      !e.custos || comExcedente.some((x) => x.economiaMensal === null)
        ? null
        : arred(comExcedente.reduce((t, x) => t + (x.economiaMensal ?? 0), 0));
    r.economiaMensal = total;
    const folha = c.atual.folhaMensal ?? null;
    r.economiaPct = total !== null && folha ? pct((total / folha) * 100) : null;
    r.impactoMensal = total === null ? null : -total;
  }

  const lista = cargos
    .filter((x) => x.excedente > 0)
    .map((x) => `${x.excedente} ${x.funcao}`)
    .join(', ');
  r.direcionamento = temExcedente
    ? `Na regra de ${regra.nome}, o horário atual precisa de ${pessoasExcedentes === 1 ? '1 pessoa' : `${pessoasExcedentes} pessoas`} a menos do que a equipe tem (${lista}).${r.economiaMensal != null ? ` Isso representa cerca de ${brl(r.economiaMensal)} de folha por mês.` : ''} É uma sobra de capacidade para a gestão avaliar, não uma recomendação.`
    : 'Não há gente sobrando: cada cargo está no limite do que o horário atual exige, ou em falta.';
  const avisos: string[] = [];
  if (temExcedente)
    avisos.push(
      'Capacidade excedente para decisão da gestão: depende de validação trabalhista e do contrato de cada pessoa.',
    );
  if (emFalta.length) avisos.push(`Falta gente em ${emFalta.join(', ')}: veja o Cenário 1.`);
  r.aviso = avisos.length ? avisos.join(' ') : null;
  return r;
};

export const montarExtras = (e: EntradaCenarios, c: CenariosRegra): ExtrasRegra => ({
  estender: montarEstender(e, c),
  reduzir: montarReduzir(e, c),
});
