import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../shared/database/prisma.js';
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
  minimos: Record<string, number>;
  convencao8h24: boolean;
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
  criadaEm: Date;
  gravadaEm: Date | null;
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
  criadaEm: s.criadaEm,
  gravadaEm: s.gravadaEm,
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

export type SimulacoesRepository = typeof simulacoesRepository;

export const simulacoesRepository = {
  async criar(d: {
    lojaId: string;
    nome: string;
    regra: string;
    origemId: string | null;
    autor: string;
    quadro: PessoaSim[];
    turnos: TurnoSim[];
  }) {
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
    const s = await prisma.simulacao.findUnique({ where: { id }, include: { turnos: true } });
    return s ? mapear(s) : null;
  },

  async listar(lojaId: string, incluirDescartadas: boolean) {
    const rows = await prisma.simulacao.findMany({
      where: { lojaId, ...(incluirDescartadas ? {} : { status: { not: 'DESCARTADA' } }) },
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
        resultado: true,
      },
    });
    return rows.map((r) => ({ ...r, status: doBanco[r.status] }));
  },

  async atualizarRascunho(id: string, d: { nome?: string; regra?: string; turnos?: TurnoSim[] }) {
    await prisma.$transaction(async (tx) => {
      await tx.simulacao.update({
        where: { id },
        data: { ...(d.nome ? { nome: d.nome } : {}), ...(d.regra ? { regra: d.regra } : {}) },
      });
      if (d.turnos) {
        await tx.simulacaoTurno.deleteMany({ where: { simulacaoId: id } });
        await tx.simulacaoTurno.createMany({
          data: turnosCreate(d.turnos).map((t) => ({ ...t, simulacaoId: id })),
        });
      }
    });
  },

  async gravar(id: string, premissas: Premissas, resultado: unknown) {
    await prisma.simulacao.update({
      where: { id },
      data: {
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
};
