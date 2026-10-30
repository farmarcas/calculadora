import { prisma } from '../../shared/database/prisma.js';

const sel = { id: true, nome: true, identificacao: true, responsavel: true, ativo: true } as const;

export const geRepository = {
  // Lista curta para escolher o GE em tela (provisório até o SSO).
  listarAtivos: () =>
    prisma.grupoEconomico.findMany({
      where: { ativo: true },
      select: { id: true, nome: true, identificacao: true },
      orderBy: { nome: 'asc' },
    }),

  // Para o operador: cada GE com o número de lojas e de lojas que já têm equipe cadastrada.
  async resumo() {
    const [ges, lojas, comEquipe] = await Promise.all([
      prisma.grupoEconomico.findMany({ select: sel, orderBy: { nome: 'asc' } }),
      prisma.loja.groupBy({ by: ['geId'], where: { deletedAt: null }, _count: { _all: true } }),
      prisma.funcionario.groupBy({
        by: ['geId', 'lojaId'],
        where: { deletedAt: null, loja: { deletedAt: null } },
      }),
    ]);
    const nLojas = new Map(lojas.map((l) => [l.geId, l._count._all]));
    const nEquipe = new Map<string, number>();
    for (const e of comEquipe) nEquipe.set(e.geId, (nEquipe.get(e.geId) ?? 0) + 1);
    return ges.map((g) => ({
      ...g,
      lojas: nLojas.get(g.id) ?? 0,
      lojasComEquipe: nEquipe.get(g.id) ?? 0,
    }));
  },

  criar: (d: { nome: string; identificacao: string; responsavel?: string }) =>
    prisma.grupoEconomico.create({ data: d, select: sel }),
  buscar: (id: string) => prisma.grupoEconomico.findUnique({ where: { id }, select: sel }),
  atualizar: (id: string, d: { nome?: string; responsavel?: string | null; ativo?: boolean }) =>
    prisma.grupoEconomico.update({ where: { id }, data: d, select: sel }),
};
export type GeRepository = typeof geRepository;
