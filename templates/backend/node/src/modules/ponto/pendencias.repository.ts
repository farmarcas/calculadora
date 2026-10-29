import { prisma } from '../../shared/database/prisma.js';
import { soDigitos } from './util.js';

const dia = (s: string) => new Date(`${s}T00:00:00.000Z`);

export type PendenciaRegistro = {
  id: string;
  cpf: string;
  data: string;
  minuto: number;
  motivoPendencia: string | null;
};

const mapear = (b: {
  id: string;
  cpf: string;
  data: Date;
  minuto: number;
  motivoPendencia: string | null;
}): PendenciaRegistro => ({
  id: b.id,
  cpf: b.cpf,
  data: b.data.toISOString().slice(0, 10),
  minuto: b.minuto,
  motivoPendencia: b.motivoPendencia,
});

export type PendenciasRepository = typeof pendenciasRepository;

export const pendenciasRepository = {
  async listar(lojaId: string, motivo: string | undefined, pagina: number, tamanho: number) {
    const where = {
      lojaId,
      situacao: 'PENDENTE' as const,
      ...(motivo ? { motivoPendencia: motivo } : {}),
    };
    const [rows, total] = await prisma.$transaction([
      prisma.batida.findMany({
        where,
        orderBy: [{ data: 'asc' }, { minuto: 'asc' }],
        skip: (pagina - 1) * tamanho,
        take: tamanho,
      }),
      prisma.batida.count({ where }),
    ]);
    return { data: rows.map(mapear), total };
  },

  async pendente(lojaId: string, id: string) {
    const b = await prisma.batida.findFirst({ where: { id, lojaId, situacao: 'PENDENTE' } });
    return b ? mapear(b) : null;
  },

  async pendentesDoCpf(lojaId: string, cpf: string) {
    return (await prisma.batida.findMany({ where: { lojaId, cpf, situacao: 'PENDENTE' } })).map(
      mapear,
    );
  },

  async resolver(
    id: string,
    d: {
      situacao: 'VINCULADA' | 'IGNORADA' | 'PENDENTE';
      matricula?: string | null;
      motivoIgnorar?: string;
      motivoPendencia?: string | null;
      por: string;
    },
  ) {
    await prisma.batida.update({
      where: { id },
      data: {
        situacao: d.situacao,
        ...(d.matricula !== undefined ? { matricula: d.matricula } : {}),
        ...(d.motivoIgnorar ? { motivoIgnorar: d.motivoIgnorar } : {}),
        ...(d.motivoPendencia !== undefined ? { motivoPendencia: d.motivoPendencia } : {}),
        resolvidaPor: d.por,
        resolvidaEm: d.situacao === 'PENDENTE' ? null : new Date(),
      },
    });
  },

  async funcionario(matricula: string) {
    return prisma.funcionario.findFirst({
      where: { matricula, deletedAt: null },
      select: { matricula: true, nome: true, lojaId: true, cpf: true },
    });
  },

  async donoDoCpf(cpf: string) {
    const rows = await prisma.funcionario.findMany({
      where: { deletedAt: null, cpf: { not: null } },
      select: { matricula: true, nome: true, lojaId: true, cpf: true },
    });
    return rows.find((r) => soDigitos(r.cpf ?? '') === cpf) ?? null;
  },

  async gravarCpf(matricula: string, cpf: string) {
    const f = await prisma.funcionario.findFirstOrThrow({ where: { matricula, deletedAt: null } });
    await prisma.funcionario.update({ where: { id: f.id }, data: { cpf } });
  },

  async pessoasPorCpf() {
    const rows = await prisma.funcionario.findMany({
      where: { deletedAt: null, cpf: { not: null } },
      select: { matricula: true, nome: true, cpf: true },
    });
    return new Map(
      rows.map((r) => [soDigitos(r.cpf ?? ''), { matricula: r.matricula, nome: r.nome }]),
    );
  },

  async contarAbertas(lojaId: string) {
    return prisma.batida.count({ where: { lojaId, situacao: 'PENDENTE' } });
  },

  datasLimite: dia,
};
