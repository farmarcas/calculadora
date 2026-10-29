import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../shared/database/prisma.js';
import type { Custos } from './custos.schemas.js';

// Presa ao GE: loja de outro GE não existe para quem chama.
export const custosRepository = (geId: string) => ({
  async ler(lojaId: string): Promise<{
    existe: boolean;
    custos: Custos | null;
    regimeTributario: string | null;
  }> {
    const l = await prisma.loja.findFirst({
      where: { id: lojaId, geId, deletedAt: null },
      select: { custos: true, regimeTributario: true },
    });
    return {
      existe: !!l,
      custos: (l?.custos as unknown as Custos | null) ?? null,
      regimeTributario: l?.regimeTributario ?? null,
    };
  },
  async salvar(lojaId: string, custos: Custos) {
    await prisma.loja.update({
      where: { id: lojaId, geId },
      data: { custos: custos as unknown as Prisma.InputJsonValue },
    });
  },
});
export type CustosRepository = ReturnType<typeof custosRepository>;
