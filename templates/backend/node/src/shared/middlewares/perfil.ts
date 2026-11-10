import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';
import type { SessaoAtiva } from './sessao.js';

// PLATFORM_OPERATOR: quem cuida da plataforma (cria GEs e carrega lojas); nunca vê valores em reais.
export const PERFIS = [
  'PLATFORM_OPERATOR',
  'TENANT_ADMIN',
  'SCHEDULE_MANAGER',
  'SCHEDULE_VIEWER',
] as const;
export type Perfil = (typeof PERFIS)[number];

const perfilDaSessao = (sessao: SessaoAtiva, geId: string | undefined): Perfil =>
  sessao.operador
    ? 'PLATFORM_OPERATOR'
    : (sessao.grupos.find((g) => g.geId === geId)?.perfil ?? 'SCHEDULE_VIEWER');

export const lerPerfil = (req: Request, res: Response, next: NextFunction) => {
  if (res.locals.sessao) {
    res.locals.perfil = perfilDaSessao(res.locals.sessao, req.header('x-ge'));
    next();
    return;
  }
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
