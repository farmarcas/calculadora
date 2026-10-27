import { prisma } from '../../shared/database/prisma.js';

export type ApuracaoRepository = typeof apuracaoRepository;

export const apuracaoRepository = {
  // Só entram batidas casadas ou vinculadas a uma pessoa (pendentes e ignoradas ficam de fora).
  async batidas(lojaId: string, de: string, ate: string) {
    const rows = await prisma.batida.findMany({
      where: {
        lojaId,
        situacao: { in: ['OK', 'VINCULADA'] },
        matricula: { not: null },
        data: { gte: new Date(`${de}T00:00:00.000Z`), lte: new Date(`${ate}T00:00:00.000Z`) },
      },
      select: { matricula: true, data: true, minuto: true },
    });
    return rows.map((r) => ({
      matricula: r.matricula!,
      data: r.data.toISOString().slice(0, 10),
      minuto: r.minuto,
    }));
  },

  async periodosCobertos(lojaId: string) {
    const rows = await prisma.importacaoPonto.findMany({
      where: {
        lojaId,
        status: { not: 'REJEITADO' },
        periodoInicio: { not: null },
        periodoFim: { not: null },
      },
      select: { periodoInicio: true, periodoFim: true },
    });
    return rows.map((r) => ({
      inicio: r.periodoInicio!.toISOString().slice(0, 10),
      fim: r.periodoFim!.toISOString().slice(0, 10),
    }));
  },

  async pendentesAbertas(lojaId: string) {
    return prisma.batida.count({ where: { lojaId, situacao: 'PENDENTE' } });
  },

  async ultimaImportacao(lojaId: string) {
    return prisma.importacaoPonto.findFirst({
      where: { lojaId },
      orderBy: { criadoEm: 'desc' },
      select: {
        arquivo: true,
        status: true,
        criadoEm: true,
        periodoInicio: true,
        periodoFim: true,
      },
    });
  },
};
