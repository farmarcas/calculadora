import { passa, verificarRegra, type DiaAberto } from '../regras/capacidade.js';
import { regraPara, tetoEfetivo } from '../regras/perfis.js';
import { requisitos } from '../regras/requisitos.js';
import { listaDeDias, vendasPorDia } from './cenarios-dias.js';
import {
  hhmm,
  horarioDaSemana,
  horasDaSemana,
  vagasDe,
  type CenariosRegra,
  type DiaCenario,
  type EntradaCenarios,
} from './cenarios.js';

// Dia hoje fechado que o cenário sugere abrir. Venda e margem por mês (referência) só para o dono.
export type DiaAbrir = {
  dia: number;
  abre: string;
  fecha: string;
  vendaMes?: number | null;
  margemMes?: number | null;
};

export type CenarioEstender = {
  disponivel: boolean;
  motivoIndisponivel: string | null;
  foco: string;
  direcionamento: string;
  // Frase curta com a lógica do cenário (sem valores em reais para quem não é dono).
  resumo: string;
  diasAbrir: DiaAbrir[];
  horasEstender: number;
  horasSemana: number;
  horarioSemana: DiaCenario[];
  // Referência, não previsão. Só para o dono; nulos sem dado de venda.
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

const arred = (n: number) => Math.round(n * 100) / 100;
const brl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

// Quanto da média dos dias abertos vale um dia hoje fechado que nunca vendeu: 50%, conservador.
export const FATOR_DIA_NOVO_PADRAO = 0.5;

// Cenário 4: com a equipe do Cenário 1 (atual + vagas), abre um dia hoje fechado (com o horário do dia aberto mais
// curto) quando a regra de cobertura continua passando sem nova contratação e a margem estimada do dia compensa.
// Escolhe o de maior margem e repete enquanto couber.
const montarEstender = (e: EntradaCenarios, c: CenariosRegra): CenarioEstender => {
  const regra = regraPara(e.regraId, e.convencao8h24, e.parametros);
  const porDia = vendasPorDia(e.vendas, e.dias, e.diasProtegidos);
  const cheia = tetoEfetivo(regra);
  const vagas = c.manter.contratacoes.flatMap((ct) => vagasDe(ct, cheia));
  const equipe = [...e.pessoas, ...vagas];
  const cobre = (dias: DiaAberto[]) =>
    passa(verificarRegra(regra, dias, e.minimos, equipe, { limiteParcial: e.limiteParcial }));
  const fator = Math.min(1, Math.max(0, e.fatorDiaNovo ?? FATOR_DIA_NOVO_PADRAO));

  const base: CenarioEstender = {
    disponivel: false,
    motivoIndisponivel: null,
    foco: 'Abrir um dia hoje fechado usando horas já pagas',
    direcionamento: '',
    resumo: '',
    diasAbrir: [],
    horasEstender: 0,
    horasSemana: horasDaSemana(e.dias),
    horarioSemana: horarioDaSemana(e.dias),
    vendaRefMes: null,
    margemRefMes: null,
    aviso: null,
  };
  const indisponivel = (motivo: string): CenarioEstender => ({
    ...base,
    motivoIndisponivel: motivo,
    direcionamento: motivo,
    resumo: motivo,
    ...(e.dono ? { custoAdicionalMensal: null, impactoMensal: null } : {}),
  });

  const abertos = e.dias.map((d) => d.dia);
  const fechados = [0, 1, 2, 3, 4, 5, 6].filter((d) => !abertos.includes(d));
  if (fechados.length === 0) return indisponivel('Todos os dias da semana já estão abertos.');
  // O dia novo abre com o horário do dia aberto mais curto (empate: o mais tardio da semana).
  const maisCurto = [...e.dias].sort(
    (a, b) => a.fecha - a.abre - (b.fecha - b.abre) || b.dia - a.dia,
  )[0];
  if (!maisCurto) return indisponivel('A loja não tem nenhum dia aberto cadastrado.');

  const temVenda = porDia.some((d) => (d.venda ?? 0) > 0);
  const temMargem = porDia.some((d) => (d.margem ?? 0) > 0);
  const mediaAbertos = (campo: 'vendaMes' | 'margemMes') =>
    e.dias.reduce((s, d) => s + (porDia[d.dia]![campo] ?? 0), 0) / e.dias.length;
  // Dia com histórico vale o que vendeu; sem histórico, 50% da média dos dias abertos (referência).
  const estimativa = (dia: number) => {
    const d = porDia[dia]!;
    const proprio = (d.venda ?? 0) > 0;
    return {
      estimada: !proprio,
      vendaMes: proprio ? d.vendaMes! : mediaAbertos('vendaMes') * fator,
      margemMes: proprio ? d.margemMes! : mediaAbertos('margemMes') * fator,
    };
  };

  let atuais: DiaAberto[] = [...e.dias];
  const abrir: number[] = [];
  const candidatos = [...fechados];
  for (;;) {
    const viaveis = candidatos
      .filter((d) => !abrir.includes(d))
      .map((dia) => ({ dia, ...estimativa(dia) }))
      .filter((x) =>
        cobre([...atuais, { dia: x.dia, abre: maisCurto.abre, fecha: maisCurto.fecha }]),
      )
      // com dado de venda só vale abrir onde a margem estimada é positiva
      .filter((x) => !temMargem || x.margemMes > 0)
      .sort((a, b) => b.margemMes - a.margemMes || b.dia - a.dia);
    const escolhido = viaveis[0];
    if (!escolhido) break;
    abrir.push(escolhido.dia);
    atuais = [...atuais, { dia: escolhido.dia, abre: maisCurto.abre, fecha: maisCurto.fecha }].sort(
      (a, b) => a.dia - b.dia,
    );
  }
  if (abrir.length === 0)
    return indisponivel(
      temMargem && fechados.some((d) => estimativa(d).margemMes <= 0)
        ? 'Nenhum dia hoje fechado tem margem estimada positiva para compensar abrir.'
        : 'A equipe do Cenário 1 não tem sobra de capacidade para abrir mais um dia sem nova contratação.',
    );

  const dias = [...abrir].sort((a, b) => a - b);
  const horas = maisCurto.fecha - maisCurto.abre;
  const itens = dias.map((dia) => ({ dia, ...estimativa(dia) }));
  const vendaRefMes = temVenda ? arred(itens.reduce((s, x) => s + x.vendaMes, 0)) : null;
  const margemRefMes = temMargem ? arred(itens.reduce((s, x) => s + x.margemMes, 0)) : null;
  const algumaEstimada = itens.some((x) => x.estimada);
  const nomes = listaDeDias(dias);
  const usaSobra =
    vagas.length > 0 ? 'a sobra das contratações do Cenário 1' : 'a sobra da equipe atual';
  const horario = `${hhmm(maisCurto.abre)}–${hhmm(maisCurto.fecha)}`;
  const fraseBase = `Abrindo ${nomes} (${horario}) ${usaSobra} cobre o dia sem nova contratação`;
  const r: CenarioEstender = {
    ...base,
    disponivel: true,
    resumo:
      e.dono && margemRefMes !== null
        ? `${fraseBase} e traz cerca de ${brl(margemRefMes)} de margem por mês (referência).`
        : `${fraseBase}.`,
    direcionamento:
      e.dono && margemRefMes !== null
        ? `${fraseBase}. Referência de ${brl(margemRefMes)} de margem por mês${algumaEstimada ? ', estimada em ' + Math.round(fator * 100) + '% da média dos dias abertos' : ''} (não é previsão). Faz sentido quando você já vai pagar essas horas de qualquer jeito.`
        : `${fraseBase}. Faz sentido quando você já vai pagar essas horas de qualquer jeito.`,
    diasAbrir: itens.map((x) => ({
      dia: x.dia,
      abre: hhmm(maisCurto.abre),
      fecha: hhmm(maisCurto.fecha),
      ...(e.dono
        ? {
            vendaMes: temVenda ? arred(x.vendaMes) : null,
            margemMes: temMargem ? arred(x.margemMes) : null,
          }
        : {}),
    })),
    horasEstender: arred(horas * dias.length),
    horasSemana: horasDaSemana(atuais),
    horarioSemana: horarioDaSemana(atuais),
    vendaRefMes,
    margemRefMes,
    aviso: !temVenda
      ? 'Sem venda informada: os dias foram escolhidos só pela capacidade da equipe. Informe o faturamento por dia da semana para estimar o ganho.'
      : algumaEstimada
        ? `A margem de um dia que hoje não abre é uma referência: ${Math.round(fator * 100)}% da média dos dias abertos, não uma previsão.`
        : null,
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
  const regra = regraPara(e.regraId, e.convencao8h24, e.parametros);
  const linhaDe = (pessoas: EntradaCenarios['pessoas'], funcao: string) =>
    verificarRegra(regra, e.dias, e.minimos, pessoas, { limiteParcial: e.limiteParcial }).find(
      (l) => l.funcao === funcao,
    );
  const req = requisitos(e.minimos);
  const funcoes = [...new Set(e.pessoas.map((p) => p.funcao))].filter((f) => req.pico(f) > 0);

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
