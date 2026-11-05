import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../database/prisma.js';
import { AppError } from '../errors/app-error.js';
import { perfilNoGe } from '../auth/mapa-perfil.js';
import type { GePermitido } from './auth.js';
import { modoRadar } from './auth.js';
import type { SessaoRadar } from '../auth/radar-session.js';

// GE de quem chama (cabeçalho X-GE). No modo 'header' é escolhido em tela e só conferido no banco.
// No modo 'radar' tem de ser um dos GEs do usuário (resolvidos pelo /SessionInfo), e o perfil é
// refinado aqui: dono da loja daquele GE vira gestor; os demais, consulta.
const uuid = z.uuid();

const exigirGeHeader = async (req: Request, res: Response, next: NextFunction) => {
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
};

const exigirGeRadar = async (req: Request, res: Response, next: NextFunction) => {
  const sessao = res.locals.sessao as SessaoRadar;
  const permitidos = (res.locals.gesPermitidos ?? []) as GePermitido[];

  // Operador pode agir em qualquer GE existente (precisa indicar qual no X-GE).
  if (sessao.operador) return exigirGeHeader(req, res, next);

  const bruto = req.header('x-ge');
  // Sem X-GE e um único GE: assume o único. Com vários, exige a escolha.
  const escolhido = bruto
    ? permitidos.find((g) => g.calcId === bruto || g.radarId === bruto)
    : permitidos.length === 1
      ? permitidos[0]
      : undefined;
  if (!escolhido)
    throw new AppError(
      permitidos.length > 1 ? 'Escolha o grupo econômico (X-GE)' : 'Grupo econômico indisponível',
      bruto ? 403 : 400,
      bruto ? 'GE_INDISPONIVEL' : 'GE_OBRIGATORIO',
    );

  const perfil = perfilNoGe(sessao, escolhido.dono);
  if (!perfil) throw new AppError('Seu usuário não tem acesso a este grupo', 403, 'SEM_ACESSO');
  res.locals.perfil = perfil;
  res.locals.geId = escolhido.calcId;
  next();
};

export const exigirGe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await (modoRadar ? exigirGeRadar : exigirGeHeader)(req, res, next);
  } catch (e) {
    next(e);
  }
};

export const geDe = (res: Response) => res.locals.geId as string;
