import { calcularCusto } from '../custos/custo.js';
import type { Custos } from '../custos/custos.schemas.js';
import { verificarRegra, type DiaAberto } from '../regras/capacidade.js';
import { PARAMETROS_PADRAO, type TabelaParametros } from '../regras/parametros.js';
import type { Regra, RegraId } from '../regras/perfis.js';
import type { Minimos } from '../regras/requisitos.js';
import { SEMANAS_NO_MES } from '../escala/cenarios-dias.js';
import { diaDaSemana, vendasPorDiaEHora, type VendaLinha } from '../escala/vendas.js';
import type { PessoaSim } from './avaliar.js';

const arred = (n: number) => Math.round(n * 100) / 100;
const hhmm = (h: number) =>
  `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
// O custo das vagas usa 5 semanas por mês (mesma conta de `calcularCusto`); a hora extra segue a mesma.
const SEMANAS_DA_FOLHA = 5;
const ADICIONAL_HORA_EXTRA = 1.5;

export type DiaResultado = {
  dia: number;
  aberta: boolean;
  abre: string | null;
  fecha: string | null;
  horas: number;
  // Difere do horário do Cadastro.
  alterado: boolean;
};

export type ContratacaoResultado = {
  matricula: string;
  cargaH: number;
  tipo: 'integral' | 'parcial';
  // Só para o dono.
  custoMensal?: number | null;
};

export type FuncaoResultado = {
  funcao: string;
  faltaHoje: number;
  diasDeTrabalho: number;
  contratacoes: ContratacaoResultado[];
  resultado: { coberto: boolean; horas: number };
  custoMensal?: number | null;
};

export type ResultadoSimulacao = {
  // Só para o dono (valores em reais): custo adicional por mês, sem sinal.
  impactoMensal?: number | null;
  folhaExtra?: number | null;
  horaExtra?: number | null;
  vendaQueSai?: number | null;
  margemPerdida?: number | null;
  margemInformada: boolean;
  temBase: boolean;
  horasAbertas: number;
  horasAbertasAntes: number;
  horario: { mudou: boolean; dias: DiaResultado[] };
  funcoes: FuncaoResultado[];
  // Dias e horas de maior venda (sem valores em reais, qualquer perfil vê); nulo sem base.
  maiorVenda: { dias: number[]; horas: number[] } | null;
  vendaPorHora: {
    // Média de um dia, por dia da semana (segunda = 0) e hora; nulo sem base. Reais só para o dono.
    venda: number[][] | null;
    clientes: number[][] | null;
    // Hora aberta no Cadastro e fechada na simulação.
    fechadas: boolean[][];
    ticketMedio: number | null;
  };
};

const abertaNaHora = (dias: DiaAberto[], dia: number, h: number) => {
  const d = dias.find((x) => x.dia === dia);
  return !!d && h >= d.abre - 1e-9 && h + 1 <= d.fecha + 1e-9;
};

const clientesPorDiaEHora = (linhas: VendaLinha[]) => {
  const soma = Array.from({ length: 7 }, () => new Array<number>(24).fill(0));
  const datas = Array.from({ length: 7 }, () => new Set<string>());
  for (const l of linhas) {
    const d = diaDaSemana(l.data);
    datas[d]!.add(l.data);
    if (l.hora >= 0 && l.hora <= 23) soma[d]![l.hora]! += l.clientes;
  }
  const total = soma.flat().reduce((s, v) => s + v, 0);
  if (total <= 0) return null;
  return soma.map((dia, d) => dia.map((v) => arred(datas[d]!.size ? v / datas[d]!.size : 0)));
};

export const calcularResultado = (a: {
  regraId: RegraId;
  regra: Regra;
  regraAtual: Regra;
  // Horário simulado e o do Cadastro, em dias abertos (horas decimais).
  dias: DiaAberto[];
  diasCadastro: DiaAberto[];
  minimos: Minimos;
  quadro: PessoaSim[];
  vendas: VendaLinha[];
  custos: Custos | null;
  parametros?: TabelaParametros;
  dono: boolean;
}): ResultadoSimulacao => {
  const tabela = a.parametros ?? PARAMETROS_PADRAO;
  const ativos = a.quadro.filter((p) => !p.desligado && p.funcao);
  const atuais = ativos.filter((p) => !p.vaga);
  const horasDe = (ds: DiaAberto[]) => arred(ds.reduce((s, d) => s + (d.fecha - d.abre), 0));
  const horasAbertas = horasDe(a.dias);
  const horasAbertasAntes = horasDe(a.diasCadastro);

  const horarioDias: DiaResultado[] = Array.from({ length: 7 }, (_, dia) => {
    const s = a.dias.find((x) => x.dia === dia);
    const c = a.diasCadastro.find((x) => x.dia === dia);
    return {
      dia,
      aberta: !!s,
      abre: s ? hhmm(s.abre) : null,
      fecha: s ? hhmm(s.fecha) : null,
      horas: s ? arred(s.fecha - s.abre) : 0,
      alterado: (s?.abre ?? null) !== (c?.abre ?? null) || (s?.fecha ?? null) !== (c?.fecha ?? null),
    };
  });

  // Venda e margem das horas que o Cadastro abre e a simulação fecha, por mês (média de um dia × 52 ÷ 12).
  const vb = vendasPorDiaEHora(a.vendas);
  const fechadas = Array.from({ length: 7 }, (_, d) =>
    Array.from(
      { length: 24 },
      (_, h) => abertaNaHora(a.diasCadastro, d, h) && !abertaNaHora(a.dias, d, h),
    ),
  );
  let venda = 0;
  let margem = 0;
  let margemTotal = 0;
  if (vb)
    for (let d = 0; d < 7; d++)
      for (let h = 0; h < 24; h++) {
        margemTotal += vb.margem[d]![h]!;
        if (fechadas[d]![h]) {
          venda += vb.venda[d]![h]!;
          margem += vb.margem[d]![h]!;
        }
      }
  const margemInformada = margemTotal > 0;
  const clientes = clientesPorDiaEHora(a.vendas);
  const totalVenda = vb ? vb.venda.flat().reduce((s, v) => s + v, 0) : 0;
  const totalClientes = clientes ? clientes.flat().reduce((s, v) => s + v, 0) : 0;

  // Situação hoje (equipe atual) e depois das contratações simuladas, pelo mesmo motor dos cenários.
  const opcoes = {
    regraAtual: a.regraAtual,
    horasAbertasHoje: horasAbertasAntes,
    divisor: tabela[a.regraId].divisor,
  };
  const pessoasDe = (lista: PessoaSim[]) =>
    lista.map((p) => ({ funcao: p.funcao!, cargaH: p.cargaH }));
  const hoje = verificarRegra(a.regra, a.dias, a.minimos, pessoasDe(atuais), opcoes);
  const depois = verificarRegra(a.regra, a.dias, a.minimos, pessoasDe(ativos), opcoes);
  // O que ainda falta depois das contratações, só em horas: a meta vem da equipe de hoje (uma vaga nova não
  // aumenta a meta do "nível de hoje"); a capacidade já inclui as vagas.
  const faltaDepois = (funcao: string) => {
    const h0 = hoje.find((l) => l.funcao === funcao);
    const h1 = depois.find((l) => l.funcao === funcao);
    if (!h1) return 0;
    return Math.max(0, arred((h0 ?? h1).necessidadeH - h1.capacidadeH));
  };
  const funcoesNomes = [
    ...new Set([...hoje.map((l) => l.funcao), ...ativos.filter((p) => p.vaga).map((p) => p.funcao!)]),
  ];

  const sal = (f: string) => a.custos?.salarioMedio[f as keyof Custos['salarioMedio']] ?? null;
  const fator = 1 + (a.custos?.encargosPct ?? 0) / 100;
  const custoVaga = (v: PessoaSim): number | null => {
    const r = calcularCusto({
      regra: a.regraId,
      quadro: [v],
      custos: a.custos,
      parametros: a.parametros,
    });
    return r.informado ? r.mensal : null;
  };

  const funcoes: FuncaoResultado[] = funcoesNomes
    .map((funcao) => {
      const h0 = hoje.find((l) => l.funcao === funcao);
      const h1 = depois.find((l) => l.funcao === funcao);
      const faltaHoje = h0?.gapH ?? 0;
      const vagas = ativos.filter((p) => p.vaga && p.funcao === funcao);
      const contratacoes: ContratacaoResultado[] = vagas.map((v) => ({
        matricula: v.matricula,
        cargaH: v.cargaH,
        tipo: v.cargaH >= a.regra.teto ? 'integral' : 'parcial',
        ...(a.dono ? { custoMensal: custoVaga(v) } : {}),
      }));
      // Depois das contratações mede-se só as horas (a distribuição em turnos é conferida na escala).
      const falta1 = faltaDepois(funcao);
      const custos = contratacoes.map((c) => c.custoMensal);
      return {
        funcao,
        faltaHoje,
        diasDeTrabalho: faltaHoje > 0 ? Math.ceil(faltaHoje / a.regra.maxDia) : 0,
        contratacoes,
        resultado: {
          coberto: falta1 <= 0,
          horas: falta1 > 0 ? falta1 : Math.max(0, arred((h1?.capacidadeH ?? 0) - (h0 ?? h1)!.necessidadeH)),
        },
        ...(a.dono
          ? { custoMensal: custos.some((c) => c == null) ? null : arred(custos.reduce((s, c) => s! + c!, 0)!) }
          : {}),
      };
    })
    // Função sem exigência, sem ninguém e sem vaga não precisa aparecer.
    .filter((f) => f.faltaHoje > 0 || f.contratacoes.length > 0 || (hoje.find((l) => l.funcao === f.funcao)?.pessoas ?? 0) > 0);

  // Maior venda: dias e horas cujo total semanal fica a até 15% do maior.
  const maiorVenda = (() => {
    if (!vb || totalVenda <= 0) return null;
    const porDia = vb.venda.map((d) => d.reduce((x, v) => x + v, 0));
    const porHora = Array.from({ length: 24 }, (_, h) => vb.venda.reduce((x, d) => x + d[h]!, 0));
    const pega = (v: number[]) => {
      const max = Math.max(...v);
      return v.flatMap((x, i) => (x >= max * 0.85 && x > 0 ? [i] : []));
    };
    return { dias: pega(porDia), horas: pega(porHora) };
  })();

  const base: ResultadoSimulacao = {
    margemInformada,
    temBase: !!vb,
    horasAbertas,
    horasAbertasAntes,
    horario: { mudou: horarioDias.some((d) => d.alterado), dias: horarioDias },
    funcoes,
    maiorVenda,
    vendaPorHora: {
      venda: a.dono ? (vb?.venda ?? null) : null,
      clientes,
      fechadas,
      ticketMedio: a.dono && totalClientes > 0 ? arred(totalVenda / totalClientes) : null,
    },
  };
  if (!a.dono) return base;

  // Valores em reais: só o dono. Sem salário informado o valor fica nulo, nunca parcial.
  const custosVagas = funcoes.flatMap((f) => f.contratacoes.map((c) => c.custoMensal));
  const folhaExtra = custosVagas.some((c) => c == null)
    ? null
    : arred(custosVagas.reduce<number>((s, c) => s + (c ?? 0), 0));
  let horaExtra: number | null = 0;
  for (const l of depois) {
    const falta = faltaDepois(l.funcao);
    if (falta <= 0) continue;
    const s = sal(l.funcao);
    if (!s) {
      horaExtra = null;
      break;
    }
    horaExtra += falta * SEMANAS_DA_FOLHA * (s / tabela[a.regraId].divisor) * ADICIONAL_HORA_EXTRA * fator;
  }
  if (horaExtra !== null) horaExtra = arred(horaExtra);
  const vendaQueSai = vb ? arred(venda * SEMANAS_NO_MES) : null;
  const margemPerdida = vb && margemInformada ? arred(margem * SEMANAS_NO_MES) : null;
  const impactoMensal =
    folhaExtra == null || horaExtra == null ? null : arred(folhaExtra + horaExtra + (margemPerdida ?? 0));
  return { ...base, impactoMensal, folhaExtra, horaExtra, vendaQueSai, margemPerdida };
};
