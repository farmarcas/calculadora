import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../shared/database/prisma.js';
import type { Custos } from './custos.schemas.js';

export const custosRepository = {
  async ler(lojaId: string): Promise<{ existe: boolean; custos: Custos | null }> {
    const l = await prisma.loja.findFirst({
      where: { id: lojaId, deletedAt: null },
      select: { custos: true },
    });
    return { existe: !!l, custos: (l?.custos as unknown as Custos | null) ?? null };
  },
  async salvar(lojaId: string, custos: Custos) {
    await prisma.loja.update({
      where: { id: lojaId },
      data: { custos: custos as unknown as Prisma.InputJsonValue },
    });
  },
};
export type CustosRepository = typeof custosRepository;
