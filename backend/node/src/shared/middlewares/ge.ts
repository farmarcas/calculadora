import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../database/prisma.js';
import { AppError } from '../errors/app-error.js';

// GE de quem chama (cabeçalho X-GE, escolhido em tela até o SSO existir). Conferido no banco a cada chamada:
// tem de existir e estar ativo. Os repositórios recebem este id e filtram todas as consultas por ele.
const uuid = z.uuid();

export const exigirGe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bruto = req.header('x-ge');
    if (!bruto) throw new AppError('Informe o grupo econômico (X-GE)', 400, 'GE_OBRIGATORIO');
    const ge = uuid.safeParse(bruto).success
      ? await prisma.grupoEconomico.findUnique({
          where: { id: bruto },
          select: { id: true, ativo: true },
        })
      : null;
    if (!ge?.ativo) throw new AppError('Grupo econômico indisponível', 403, 'GE_INDISPONIVEL');
    res.locals.geId = ge.id;
    next();
  } catch (e) {
    next(e);
  }
};

export const geDe = (res: Response) => res.locals.geId as string;
