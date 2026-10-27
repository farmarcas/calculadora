import { passa, verificarRegra, type DiaAberto, type LinhaFuncao } from '../regras/capacidade.js';
import { FUNCOES_PADRAO_MINIMO, REGRA_IDS, regraPara, type RegraId } from '../regras/perfis.js';
import { cobertura, type TurnoPessoa } from './cobertura.js';
import { lerHora } from './interpretar.js';
import { resumirVendas, type VendaLinha } from './vendas.js';

type Horario = { abre: string; fecha: string };
export type LojaDiag = {
  id: string;
  codigo: string;
  nome: string;
  horarios: { semana?: Horario; sabado?: Horario; domingo?: Horario } | null;
  convencao8h24: boolean;
  minimos: Record<string, number> | null;
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

export const diasAbertos = (h: LojaDiag['horarios']): DiaAberto[] => {
  if (!h) return [];
  const faixa = (x?: Horario) => {
    if (!x) return null;
    const abre = lerHora(x.abre);
    const fecha = lerHora(x.fecha);
    return abre !== null && fecha !== null && fecha > abre ? { abre, fecha } : null;
  };
  const dias: DiaAberto[] = [];
  const sem = faixa(h.semana);
  if (sem) for (let d = 0; d < 5; d++) dias.push({ dia: d, ...sem });
  const sab = faixa(h.sabado);
  if (sab) dias.push({ dia: 5, ...sab });
  const dom = faixa(h.domingo);
  if (dom) dias.push({ dia: 6, ...dom });
  return dias;
};

const resumoDias = (dias: number[]) => {
  const s = [...dias].sort();
  const seq = s.every((d, i) => i === 0 || d === s[i - 1]! + 1);
  return seq && s.length > 2
    ? `${NOMES_DIA[s[0]!]} a ${NOMES_DIA[s[s.length - 1]!]}`
    : s.map((d) => NOMES_DIA[d]).join(', ');
};

const listaFalta = (ls: LinhaFuncao[]) =>
  ls
    .filter((l) => l.falta)
    .map(
      (l) =>
        `${l.funcao} (${l.saldoH < 0 ? `${Math.abs(l.saldoH)}h` : ''}${l.saldoH < 0 && l.saldoT < 0 ? ' e ' : ''}${l.saldoT < 0 ? `${Math.abs(l.saldoT)} turno(s)` : ''})`,
    )
    .join(', ');

export const montarDiagnostico = (a: {
  loja: LojaDiag;
  escala: CargaMeta | null;
  turnos: TurnoDiag[];
  base: CargaMeta | null;
  vendas: VendaLinha[];
}) => {
  const { loja, escala, turnos, base, vendas } = a;
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
  const config = { convencao8h24: loja.convencao8h24, minimos };
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
    const regra = regraPara(id, loja.convencao8h24);
    const funcoes = verificarRegra(regra, dias, minimos, pessoas);
    return {
      id,
      nome: regra.nome,
      vigencia: regra.vigencia,
      descricao: regra.descricao,
      passa: passa(funcoes),
      funcoes,
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
    minimos,
  );
  const resumoVendas = resumirVendas(vendas);

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
        texto: `${f.funcao} abaixo do mínimo (${f.minimo}) nas faixas: ${sem.join(', ')}.`,
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
  } else {
    atencao.push({
      tom: 'atencao',
      texto: 'Sem base comercial: não dá para ver os horários de maior venda.',
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

  return {
    loja: lojaInfo,
    status,
    fontes,
    config,
    quadro,
    regras,
    cobertura: cob,
    vendas: resumoVendas,
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
