import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';

// Perfis de demonstração (sem login real nesta fase). Sem cabeçalho = só consulta.
export const PERFIS = ['TENANT_ADMIN', 'SCHEDULE_MANAGER', 'SCHEDULE_VIEWER'] as const;
export type Perfil = (typeof PERFIS)[number];

export const lerPerfil = (req: Request, res: Response, next: NextFunction) => {
  const bruto = req.header('x-perfil') ?? 'SCHEDULE_VIEWER';
  const perfil = PERFIS.find((p) => p === bruto);
  if (!perfil) {
    next(new AppError('Perfil desconhecido', 400, 'PERFIL_INVALIDO'));
    return;
  }
  res.locals.perfil = perfil;
  next();
};

export const exigirPerfil =
  (...permitidos: Perfil[]) =>
  (_req: Request, res: Response, next: NextFunction) => {
    const perfil = res.locals.perfil as Perfil | undefined;
    if (!perfil || !permitidos.includes(perfil)) {
      next(new AppError('Seu perfil não pode fazer esta ação', 403, 'SEM_PERMISSAO'));
      return;
    }
    next();
  };
