import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../shared/database/prisma.js';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import type { Custos } from '../custos/custos.schemas.js';
import type { Minimos } from '../regras/requisitos.js';
import type { PessoaSim, TurnoSim } from './avaliar.js';

export type SimulacaoStatus = 'rascunho' | 'gravada' | 'em_uso' | 'substituida' | 'descartada';
const paraBanco = {
  rascunho: 'RASCUNHO',
  gravada: 'GRAVADA',
  em_uso: 'EM_USO',
  substituida: 'SUBSTITUIDA',
  descartada: 'DESCARTADA',
} as const;
const doBanco = {
  RASCUNHO: 'rascunho',
  GRAVADA: 'gravada',
  EM_USO: 'em_uso',
  SUBSTITUIDA: 'substituida',
  DESCARTADA: 'descartada',
} as const;

export type Premissas = {
  horarios: unknown;
  minimos: Minimos;
  convencao8h24: boolean;
  // Custos da loja no momento de gravar: a simulação gravada sempre usa este retrato.
  custos?: Custos | null;
  regra: string;
};

export type SimulacaoRegistro = {
  id: string;
  lojaId: string;
  nome: string;
  status: SimulacaoStatus;
  regra: string;
  origemId: string | null;
  autor: string;
  quadro: PessoaSim[];
  premissas: Premissas | null;
  resultado: unknown;
  // Horário simulado do rascunho; nulo = igual ao Cadastro.
  horarios: unknown;
  numeroCenario: number | null;
  criadaEm: Date;
  gravadaEm: Date | null;
  aprovadaPor: string | null;
  aprovadaEm: Date | null;
  vigenciaInicio: Date | null;
  turnos: TurnoSim[];
};

type Linha = Prisma.SimulacaoGetPayload<{ include: { turnos: true } }>;

const mapear = (s: Linha): SimulacaoRegistro => ({
  id: s.id,
  lojaId: s.lojaId,
  nome: s.nome,
  status: doBanco[s.status],
  regra: s.regra,
  origemId: s.origemId,
  autor: s.autor,
  quadro: s.quadro as unknown as PessoaSim[],
  premissas: s.premissas as unknown as Premissas | null,
  resultado: s.resultado,
  horarios: s.horarios,
  numeroCenario: s.numeroCenario,
  criadaEm: s.criadaEm,
  gravadaEm: s.gravadaEm,
  aprovadaPor: s.aprovadaPor,
  aprovadaEm: s.aprovadaEm,
  vigenciaInicio: s.vigenciaInicio,
  turnos: s.turnos.map((t) => ({
    matricula: t.matricula,
    dia: t.dia,
    entrada: t.entrada,
    saida: t.saida,
    iniIntervalo: t.iniIntervalo,
    fimIntervalo: t.fimIntervalo,
  })),
});

const turnosCreate = (ts: TurnoSim[]) =>
  ts.map((t) => ({
    matricula: t.matricula,
    dia: t.dia,
    entrada: t.entrada,
    saida: t.saida,
    iniIntervalo: t.iniIntervalo,
    fimIntervalo: t.fimIntervalo,
  }));

export type SimulacoesRepository = ReturnType<typeof simulacoesRepository>;

// Presa ao GE pela loja: simulação de outro GE não é encontrada.
export const simulacoesRepository = (geId: string) => ({
  async criar(d: {
    lojaId: string;
    nome: string;
    regra: string;
    origemId: string | null;
    autor: string;
    quadro: PessoaSim[];
    turnos: TurnoSim[];
  }) {
    if (!(await prisma.loja.count({ where: { id: d.lojaId, geId, deletedAt: null } })))
      throw new NotFoundError('Loja não encontrada', 'LOJA_NAO_ENCONTRADA');
    const s = await prisma.simulacao.create({
      data: {
        lojaId: d.lojaId,
        nome: d.nome,
        regra: d.regra,
        origemId: d.origemId,
        autor: d.autor,
        quadro: d.quadro as unknown as Prisma.InputJsonValue,
        turnos: { create: turnosCreate(d.turnos) },
      },
      include: { turnos: true },
    });
    return mapear(s);
  },

  async buscar(id: string) {
    const s = await prisma.simulacao.findFirst({
      where: { id, loja: { geId } },
      include: { turnos: true },
    });
    return s ? mapear(s) : null;
  },

  async listar(lojaId: string, incluirDescartadas: boolean) {
    const rows = await prisma.simulacao.findMany({
      where: {
        lojaId,
        loja: { geId },
        ...(incluirDescartadas ? {} : { status: { not: 'DESCARTADA' } }),
      },
      orderBy: { criadaEm: 'desc' },
      select: {
        id: true,
        nome: true,
        status: true,
        regra: true,
        origemId: true,
        autor: true,
        criadaEm: true,
        gravadaEm: true,
        aprovadaPor: true,
        aprovadaEm: true,
        vigenciaInicio: true,
        resultado: true,
        numeroCenario: true,
      },
    });
    return rows.map((r) => ({ ...r, status: doBanco[r.status] }));
  },

  async atualizarRascunho(
    id: string,
    d: {
      nome?: string;
      regra?: string;
      turnos?: TurnoSim[];
      quadro?: PessoaSim[];
      // undefined = não mexe; null = volta ao Cadastro.
      horarios?: unknown;
    },
  ) {
    await prisma.$transaction(async (tx) => {
      await tx.simulacao.update({
        where: { id },
        data: {
          ...(d.nome ? { nome: d.nome } : {}),
          ...(d.regra ? { regra: d.regra } : {}),
          ...(d.quadro ? { quadro: d.quadro as unknown as Prisma.InputJsonValue } : {}),
          ...(d.horarios !== undefined
            ? { horarios: d.horarios === null ? Prisma.JsonNull : (d.horarios as Prisma.InputJsonValue) }
            : {}),
        },
      });
      if (d.turnos) {
        await tx.simulacaoTurno.deleteMany({ where: { simulacaoId: id } });
        await tx.simulacaoTurno.createMany({
          data: turnosCreate(d.turnos).map((t) => ({ ...t, simulacaoId: id })),
        });
      }
    });
  },

  // Próximo número de cenário da loja: maior já dado + 1.
  async proximoNumeroCenario(lojaId: string) {
    const r = await prisma.simulacao.aggregate({
      where: { lojaId, loja: { geId } },
      _max: { numeroCenario: true },
    });
    return (r._max.numeroCenario ?? 0) + 1;
  },

  async gravar(
    id: string,
    premissas: Premissas,
    resultado: unknown,
    cenario?: { numero: number; nome: string },
  ) {
    await prisma.simulacao.update({
      where: { id },
      data: {
        ...(cenario ? { numeroCenario: cenario.numero, nome: cenario.nome } : {}),
        status: 'GRAVADA',
        premissas: premissas as unknown as Prisma.InputJsonValue,
        resultado: resultado as Prisma.InputJsonValue,
        gravadaEm: new Date(),
      },
    });
  },

  async mudarStatus(id: string, status: SimulacaoStatus) {
    await prisma.simulacao.update({ where: { id }, data: { status: paraBanco[status] } });
  },

  // Aprovar: a anterior em uso vira substituída e esta passa a valer (uma em uso por loja).
  async aprovar(id: string, lojaId: string, perfil: string, vigenciaInicio: Date) {
    await prisma.$transaction(async (tx) => {
      await tx.simulacao.updateMany({
        where: { lojaId, loja: { geId }, status: 'EM_USO' },
        data: { status: 'SUBSTITUIDA', substituidaEm: new Date() },
      });
      await tx.simulacao.update({
        where: { id },
        data: { status: 'EM_USO', aprovadaPor: perfil, aprovadaEm: new Date(), vigenciaInicio },
      });
    });
  },

  async emUso(lojaId: string) {
    const s = await prisma.simulacao.findFirst({
      where: { lojaId, loja: { geId }, status: 'EM_USO' },
      include: { turnos: true },
    });
    return s ? mapear(s) : null;
  },
});
