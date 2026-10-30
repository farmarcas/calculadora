import { PARAMETROS_PADRAO } from '../regras/parametros.js';
import { distribuirParcial } from './distribuir-parcial.js';
import { redistribuir } from './redistribuir.js';
import { passa, verificarRegra, type DiaAberto, type LinhaFuncao } from '../regras/capacidade.js';
import { FUNCOES_PADRAO_MINIMO, REGRA_IDS, regraPara, type RegraId } from '../regras/perfis.js';
import { faixasDaSemana, normalizarHorarios, type HorariosSemana } from '../cadastros/horarios.js';
import type { Custos } from '../custos/custos.schemas.js';
import { cobertura, type TurnoPessoa } from './cobertura.js';
import { montarCenarios } from './cenarios.js';
import { montarExtras, type ExtrasRegra } from './cenarios-extras.js';
import type { TabelaParametros } from '../regras/parametros.js';
import { montarQuadroTurnos } from './quadro-turnos.js';
import { avisosDeTurnos, exigenciasDaLoja, type TurnosLoja } from '../regras/turnos.js';
import type { Faturamento } from '../cadastros/faturamento.js';
import { montarComparativo, type Comparativo } from './comparativo.js';
import { PREMISSAS_PADRAO, type Premissas } from './premissas.js';
import { montarEtapas } from './etapas.js';
import { faturamentoMensalDe, resumirVendas, type VendaLinha } from './vendas.js';
import { vendasDoCadastro } from './vendas-cadastro.js';

export type LojaDiag = {
  id: string;
  codigo: string;
  nome: string;
  // Sempre no formato novo (sete dias); o antigo é convertido na leitura.
  horarios: HorariosSemana | null;
  convencao8h24: boolean;
  minimos: Record<string, number> | null;
  // Turnos da loja com o mínimo por cargo em cada um; nulo = vale só o mínimo único.
  turnos?: TurnosLoja | null;
  // Só para o cálculo de custo (visível apenas ao dono); nunca sai no diagnóstico.
  custos?: Custos | null;
  // Faturamento do cadastro: só vira venda do diagnóstico quando não há base comercial.
  faturamento?: Faturamento | null;
};
export type TurnoDiag = Omit<TurnoPessoa, 'funcao'> & {
  matricula: string;
  nome: string;
  cargaH: number;
  status: string;
  motivo: string | null;
  funcao: string | null;
};
export type CargaMeta = {
  arquivo: string;
  recebidaEm: Date;
  linhasAceitas: number;
  linhasRejeitadas: number;
};

const NOMES_DIA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const hh = (h: number) =>
  `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;

// Dias abertos com a faixa de cada um (24 horas = 0 a 24). Aceita o formato novo e o antigo.
// Valores de venda e margem que, vindos do faturamento do cadastro, só o dono pode ver.
const CHAVES_DE_VENDA = new Set([
  'venda',
  'margem',
  'vendaMes',
  'margemMes',
  'vendaRefMes',
  'margemRefMes',
  'vendaCortadaMes',
  'margemCortadaMes',
]);
const semValoresDeVenda = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(semValoresDeVenda)
    : v && typeof v === 'object'
      ? Object.fromEntries(
          Object.entries(v)
            .filter(([k]) => !CHAVES_DE_VENDA.has(k))
            .map(([k, x]) => [k, semValoresDeVenda(x)]),
        )
      : v;

const semValorPorHora = <
  T extends { horas: { vendaMedia: number }[]; top: { vendaMedia: number }[] },
>(
  v: T,
) => ({
  ...v,
  horas: v.horas.map(({ vendaMedia: _v, ...resto }) => resto),
  top: v.top.map(({ vendaMedia: _v, ...resto }) => resto),
});

// Texto fixo: o resultado é estimativa e precisa de validação fora do sistema.
export const AVISO_ESTIMATIVA =
  'Este resultado é uma estimativa. Valide com o seu contador e com a convenção coletiva do sindicato antes de decidir.';

export const diasAbertos = (h: unknown): DiaAberto[] => faixasDaSemana(normalizarHorarios(h));

const resumoDias = (dias: number[]) => {
  const s = [...dias].sort();
  const seq = s.every((d, i) => i === 0 || d === s[i - 1]! + 1);
  return seq && s.length > 2
    ? `${NOMES_DIA[s[0]!]} a ${NOMES_DIA[s[s.length - 1]!]}`
    : s.map((d) => NOMES_DIA[d]).join(', ');
};

const listaFalta = (ls: LinhaFuncao[]) =>
  ls
    .filter((l) => l.falta && l.obrigatorio)
    .map(
      (l) =>
        `${l.funcao} (${l.saldoH < 0 ? `${Math.abs(l.saldoH)}h` : ''}${l.saldoH < 0 && l.saldoT < 0 ? ' e ' : ''}${l.saldoT < 0 ? `${Math.abs(l.saldoT)} turno(s)` : ''})`,
    )
    .join(', ');

export const montarDiagnostico = (a: {
  loja: LojaDiag;
  escala: CargaMeta | null;
  turnos: TurnoDiag[];
  // Matrículas de horário fixo: a redistribuição não as remaneja.
  horarioFixo?: Set<string>;
  base: CargaMeta | null;
  vendas: VendaLinha[];
  // Só o dono recebe valores de custo nos cenários.
  dono?: boolean;
  // Funcionários da loja que não entraram na conta (sem horário, sem dias...), com o motivo.
  foraDaConta?: { nome: string; motivo: string }[];
  // Parâmetros legais vigentes (jornada, dias, divisor); sem eles valem os de hoje.
  parametros?: TabelaParametros;
  // Premissas só para simular (recaptura, fator de dia novo, dias protegidos, limite do parcial) e a margem simulada do dono.
  premissas?: Premissas;
  margemPctSimulada?: number | null;
}) => {
  const { loja, escala, turnos, base, vendas } = a;
  const prem = a.premissas ?? PREMISSAS_PADRAO;
  const dias = diasAbertos(loja.horarios);
  const minimos = { ...FUNCOES_PADRAO_MINIMO, ...(loja.minimos ?? {}) };
  const horasAbertas = dias.reduce((s, d) => s + (d.fecha - d.abre), 0);

  const fontes = {
    horario: dias.length > 0,
    escala: escala && {
      arquivo: escala.arquivo,
      recebidaEm: escala.recebidaEm,
      aceitas: escala.linhasAceitas,
      rejeitadas: escala.linhasRejeitadas,
    },
    base: base && {
      arquivo: base.arquivo,
      recebidaEm: base.recebidaEm,
      aceitas: base.linhasAceitas,
      rejeitadas: base.linhasRejeitadas,
    },
  };
  // O motor lê a exigência por hora: por turno quando a loja tem turnos, senão o mínimo único.
  const exigencias = exigenciasDaLoja(minimos, loja.turnos);
  const config = {
    convencao8h24: loja.convencao8h24,
    minimos,
    turnos: loja.turnos?.turnos ?? null,
    turnosAvisos: avisosDeTurnos(loja.turnos, dias),
  };
  const lojaInfo = {
    id: loja.id,
    codigo: loja.codigo,
    nome: loja.nome,
    horasAbertas,
    horarios: loja.horarios,
  };

  if (!escala || !fontes.horario) {
    return {
      loja: lojaInfo,
      avisoEstimativa: AVISO_ESTIMATIVA,
      status: 'pendente' as const,
      mensagem: !fontes.horario
        ? 'Cadastre o horário de funcionamento da loja para calcular o diagnóstico.'
        : 'Importe a escala atual para ver o diagnóstico.',
      fontes,
      config,
    };
  }

  const noCalculo = turnos.filter((t) => t.funcao);
  const pessoas = noCalculo.map((t) => ({ funcao: t.funcao!, cargaH: t.cargaH }));

  const regras = REGRA_IDS.map((id: RegraId) => {
    const regra = regraPara(id, loja.convencao8h24, a.parametros);
    const brutas = verificarRegra(regra, dias, exigencias, pessoas, {
      limiteParcial: prem.limiteParcial,
      regraAtual: regraPara('atual', loja.convencao8h24, a.parametros),
      // Só o dono vê o custo da sugestão.
      custos: a.dono ? (loja.custos ?? null) : null,
      divisor: (a.parametros ?? PARAMETROS_PADRAO)[id].divisor,
    });
    // Redistribuição: monta a escala semanal de quem cobre os cargos com exigência (farmacêutico e metas do dono),
    // dentro da regra, e deixa o descoberto por faixa. Quem tem horário fixo mantém o horário de hoje.
    const exigidos = Object.fromEntries(
      brutas
        .filter((f) => f.origemMeta === 'lei' || f.origemMeta === 'dono')
        .map((f) => [f.funcao, Math.max(1, f.minimo)]),
    );
    const redis = redistribuir(
      regra,
      dias,
      noCalculo.map((t) => ({
        matricula: t.matricula,
        nome: t.nome,
        funcao: t.funcao!,
        cargaH: t.cargaH,
        fixo: a.horarioFixo?.has(t.matricula) ?? false,
        turno: { ...t, funcao: t.funcao! } as TurnoPessoa,
      })),
      exigidos,
    );
    // Dias e horários do contrato parcial: onde a escala redistribuída ainda deixa descoberto.
    const funcoes = brutas.map((f) => {
      if (!f.sugestao?.parcialH) return f;
      const doCargo = redis.turnos.filter((t) => t.funcao === f.funcao) as TurnoPessoa[];
      const comExigencia = f.origemMeta === 'lei' || f.origemMeta === 'dono';
      const exigido = Math.max(1, f.minimo);
      const distribuicao = distribuirParcial(
        dias,
        doCargo,
        f.sugestao.parcialH,
        exigido,
        !comExigencia || doCargo.length === 0,
      );
      // As pessoas cobrem o horário, mas a regra pede folgas: o parcial entra nos dias de maior horário (estimativa).
      const final = distribuicao.blocos.length
        ? distribuicao
        : distribuirParcial(dias, [], f.sugestao.parcialH, exigido, true);
      return { ...f, sugestao: { ...f.sugestao, distribuicao: final } };
    });
    return {
      id,
      nome: regra.nome,
      vigencia: regra.vigencia,
      descricao: regra.descricao,
      passa: passa(funcoes),
      funcoes,
      redistribuicao: {
        descoberto: redis.descoberto,
        avisos: redis.avisos,
        remanejados: redis.remanejados,
        // Escala semanal montada por pessoa (uma linha por dia).
        escala: redis.turnos.map((t) => ({
          matricula: t.matricula,
          dia: t.dias[0]!,
          de: t.entrada,
          ate: t.saida,
        })),
      },
      // Números grandes do quadro central.
      resumo: {
        turnosEmFalta: funcoes.reduce(
          (t, f) => t + (f.obrigatorio ? Math.max(0, -f.saldoT) : 0),
          0,
        ),
        saldoHoras: Math.round(funcoes.reduce((t, f) => t + f.saldoH, 0) * 100) / 100,
        contratar: funcoes.reduce((t, f) => t + f.contratar, 0),
      },
    };
  });
  const [atual, r42, r40] = regras as [
    (typeof regras)[number],
    (typeof regras)[number],
    (typeof regras)[number],
  ];

  const cob = cobertura(
    dias,
    noCalculo.map((t) => ({ ...t, funcao: t.funcao! })),
    exigencias,
  );
  // Origem da venda: a base comercial vale; sem ela, o faturamento do cadastro (estimativa); senão nada.
  const doCadastro = vendas.length === 0 ? vendasDoCadastro(loja.faturamento, dias) : null;
  const origemVendas =
    vendas.length > 0 ? ('base' as const) : doCadastro ? ('cadastro' as const) : null;
  // Margem simulada (só o dono): substitui a margem da base ou do cadastro em todas as horas, sem gravar nada.
  const margemEmUso = a.margemPctSimulada ?? loja.faturamento?.margemPct ?? null;
  const vendasBrutas = doCadastro?.linhas ?? vendas;
  const vendasUsadas =
    a.margemPctSimulada == null
      ? vendasBrutas
      : vendasBrutas.map((l) => ({ ...l, margem: (l.venda * a.margemPctSimulada!) / 100 }));
  // Sem curva por hora (origem cadastro) não existe "horário de maior venda".
  const resumoVendas = origemVendas === 'base' ? resumirVendas(vendas) : null;

  const atencao: { tom: 'erro' | 'atencao'; texto: string }[] = [];
  if (!atual.passa)
    atencao.push({
      tom: 'erro',
      texto: `Já falta na regra atual (44h): ${listaFalta(atual.funcoes)}.`,
    });
  if (!r42.passa)
    atencao.push({
      tom: 'atencao',
      texto: `Na regra de 42h faltam: ${listaFalta(r42.funcoes)}.${!loja.convencao8h24 ? ' Sem convenção que permita 8h24 por dia, a regra de 42h vale 40h.' : ''}`,
    });
  if (!r40.passa)
    atencao.push({ tom: 'atencao', texto: `Na regra de 40h faltam: ${listaFalta(r40.funcoes)}.` });
  const farm = cob.funcoes.find((f) => f.funcao === 'Farmacêutico');
  const semFarm = farm?.porHora.filter((c) => c.ok === false).map((c) => hh(c.hora)) ?? [];
  if (semFarm.length)
    atencao.push({
      tom: 'erro',
      texto: `Sem farmacêutico no pior dia nas faixas: ${semFarm.join(', ')}. A lei exige farmacêutico em todo o horário de funcionamento.`,
    });
  for (const f of cob.funcoes) {
    if (f.funcao === 'Farmacêutico') continue;
    const sem = f.porHora.filter((c) => c.ok === false).map((c) => hh(c.hora));
    if (sem.length)
      atencao.push({
        tom: 'atencao',
        texto: `${f.funcao} abaixo da meta (${f.minimo}) nas faixas: ${sem.join(', ')}.`,
      });
  }
  if (resumoVendas) {
    const fracas = resumoVendas.top.filter((t) =>
      cob.funcoes.some(
        (f) => f.minimo > 0 && f.porHora.find((c) => c.hora === t.hora)?.ok === false,
      ),
    );
    if (fracas.length)
      atencao.push({
        tom: 'erro',
        texto: `Horário de maior venda com cobertura abaixo do mínimo: ${fracas.map((t) => hh(t.hora)).join(', ')}.`,
      });
  } else if (origemVendas === 'cadastro') {
    atencao.push({
      tom: 'atencao',
      texto: doCadastro?.comMargem
        ? 'Venda estimada pelo faturamento do cadastro, dividido igualmente entre as horas abertas. Envie a base comercial para ver as horas de maior venda.'
        : 'Venda estimada pelo faturamento do cadastro, dividido igualmente entre as horas abertas. Informe a margem bruta média da loja no Cadastro para estimar o ganho dos cenários.',
    });
  } else {
    atencao.push({
      tom: 'atencao',
      texto:
        'Sem venda informada: cadastre o faturamento da loja ou envie a base comercial para ver os horários de maior venda.',
    });
  }
  const fora = turnos.filter((t) => !t.funcao);
  if (fora.length)
    atencao.push({
      tom: 'atencao',
      texto: `${fora.length} colaborador(es) sem função de escala, fora do cálculo: ${fora.map((t) => t.nome).join(', ')}.`,
    });
  if (escala.linhasRejeitadas)
    atencao.push({
      tom: 'atencao',
      texto: `${escala.linhasRejeitadas} linha(s) da escala foram rejeitadas na importação.`,
    });

  const lacunas = cob.funcoes.some((f) => f.porHora.some((c) => c.ok === false));
  const status = !atual.passa
    ? ('falha_atual' as const)
    : lacunas
      ? ('cobertura' as const)
      : !r42.passa || !r40.passa
        ? ('falha_futura' as const)
        : ('ok' as const);

  const quadro = [...new Set(noCalculo.map((t) => t.funcao!))].map((funcao) => {
    const doF = noCalculo.filter((t) => t.funcao === funcao);
    return { funcao, pessoas: doF.length, cargaTotalH: doF.reduce((s, t) => s + t.cargaH, 0) };
  });

  // Pontos de atenção em números: cada um vira um "big number" no quadro central.
  const abaixoDoMinimo = (nome: string) =>
    cob.funcoes
      .filter((f) => (nome === 'Farmacêutico' ? f.funcao === nome : f.funcao !== 'Farmacêutico'))
      .reduce((t, f) => t + f.porHora.filter((c) => c.ok === false).length, 0);
  const numeros = {
    colaboradoresNoCalculo: noCalculo.length,
    faixasSemFarmaceutico: abaixoDoMinimo('Farmacêutico'),
    faixasAbaixoDoMinimo: abaixoDoMinimo('outras'),
    // Nulo quando não há base comercial: não dá para saber onde está a maior venda.
    maiorVendaDescoberta: resumoVendas
      ? resumoVendas.top.filter((t) =>
          cob.funcoes.some(
            (f) => f.minimo > 0 && f.porHora.find((c) => c.hora === t.hora)?.ok === false,
          ),
        ).length
      : null,
    foraDoCalculo: turnos.filter((t) => !t.funcao).length,
    linhasRejeitadas: escala.linhasRejeitadas,
  };

  // Origem da venda por dia: base comercial, faturamento do cadastro por dia, ou estimativa (só o mensal informado).
  const origemVenda =
    origemVendas === 'base'
      ? ('base' as const)
      : origemVendas === 'cadastro'
        ? doCadastro?.soMensal
          ? ('estimativa' as const)
          : ('cadastro' as const)
        : null;

  // Faturamento mensal de referência (só o dono vê o que dele sai): cadastro ou base comercial.
  const faturamentoRef = faturamentoMensalDe({ faturamento: loja.faturamento, vendasBase: vendas });

  const cenariosPorRegra = Object.fromEntries(
    (['r42', 'r40'] as const).map((regraId) => {
      const entrada = {
        regraId,
        convencao8h24: loja.convencao8h24,
        dias,
        minimos: exigencias,
        pessoas,
        vendas: vendasUsadas,
        vendasDoCadastro: origemVendas === 'cadastro',
        custos: loja.custos ?? null,
        dono: a.dono === true,
        parametros: a.parametros,
        faturamentoMensalRef: faturamentoRef?.valor ?? null,
        origemVenda,
        recaptura: prem.recaptura / 100,
        diasProtegidos: prem.diasProtegidos,
        fatorDiaNovo: prem.fatorDiaNovo / 100,
        limiteParcial: prem.limiteParcial,
      };
      const cenarios = montarCenarios(entrada);
      return [
        regraId,
        {
          ...cenarios,
          ...montarExtras(entrada, cenarios),
          comparativo: montarComparativo(entrada, cenarios),
        },
      ];
    }),
  ) as Record<
    'r42' | 'r40',
    ReturnType<typeof montarCenarios> & ExtrasRegra & { comparativo: Comparativo }
  >;
  // Venda e margem são valores em reais: só o dono vê, venha a venda da base comercial ou do cadastro.
  const cenariosSaida = (
    a.dono ? cenariosPorRegra : semValoresDeVenda(cenariosPorRegra)
  ) as typeof cenariosPorRegra;

  // Contratação em etapas: o necessário já na fase de 42h e o adicional para a de 40h.
  const etapas = montarEtapas({
    etapa1: cenariosPorRegra.r42.manter.contratacoes,
    etapa2: cenariosPorRegra.r40.manter.contratacoes,
    vigencia1: r42.vigencia,
    vigencia2: r40.vigencia,
    dono: a.dono === true,
    custo1: cenariosPorRegra.r42.manter.custoAdicionalMensal,
    custo2: cenariosPorRegra.r40.manter.custoAdicionalMensal,
  });

  return {
    loja: lojaInfo,
    avisoEstimativa: AVISO_ESTIMATIVA,
    status,
    numeros,
    fontes,
    config,
    quadro,
    regras,
    cobertura: cob,
    quadroTurnos: montarQuadroTurnos({
      dias,
      turnosLoja: loja.turnos,
      exigencias,
      cob,
      fora: [
        ...turnos
          .filter((t) => !t.funcao)
          .map((t) => ({ nome: t.nome, motivo: 'sem função de escala' })),
        ...(a.foraDaConta ?? []),
      ],
    }),
    // Venda média por hora é valor em reais: só o dono; os demais veem a participação de cada hora no total.
    vendas: a.dono || !resumoVendas ? resumoVendas : semValorPorHora(resumoVendas),
    origemVendas,
    cenarios: cenariosSaida,
    etapas,
    premissas: {
      ...prem,
      // A margem (valor em reais indireto) só o dono vê: a em uso e a do cadastro, para voltar a ela.
      ...(a.dono
        ? {
            margemPct: margemEmUso,
            margemPctCadastro: loja.faturamento?.margemPct ?? null,
          }
        : {}),
    },
    pontosAtencao: atencao,
    colaboradores: turnos.map((t) => ({
      matricula: t.matricula,
      nome: t.nome,
      funcao: t.funcao,
      dias: resumoDias(t.dias),
      turno: `${hh(t.entrada)}–${hh(t.saida)}`,
      intervalo:
        t.iniIntervalo != null && t.fimIntervalo != null
          ? `${hh(t.iniIntervalo)}–${hh(t.fimIntervalo)}`
          : 'sem intervalo',
      cargaH: t.cargaH,
      status: t.status,
      motivo: t.motivo,
    })),
  };
};
