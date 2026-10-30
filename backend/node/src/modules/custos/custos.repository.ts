import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../shared/database/prisma.js';
import type { CustosGravados } from './custos.schemas.js';

// Presa ao GE: loja de outro GE não existe para quem chama.
export const custosRepository = (geId: string) => ({
  async ler(lojaId: string): Promise<{
    existe: boolean;
    custos: CustosGravados | null;
    regimeTributario: string | null;
  }> {
    const l = await prisma.loja.findFirst({
      where: { id: lojaId, geId, deletedAt: null },
      select: { custos: true, regimeTributario: true },
    });
    return {
      existe: !!l,
      custos: (l?.custos as unknown as CustosGravados | null) ?? null,
      regimeTributario: l?.regimeTributario ?? null,
    };
  },
  async salvar(lojaId: string, custos: CustosGravados) {
    // O percentual digitado (formato antigo) não é mais guardado: o encargo vem do regime.
    const { encargosPct: _antigo, ...guardar } = custos;
    void _antigo;
    await prisma.loja.update({
      where: { id: lojaId, geId },
      data: { custos: guardar as unknown as Prisma.InputJsonValue },
    });
  },
});
export type CustosRepository = ReturnType<typeof custosRepository>;
