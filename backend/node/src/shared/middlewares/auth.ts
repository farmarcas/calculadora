import type { NextFunction, Request, Response } from 'express';
import { env } from '../../config/env.js';
import { prisma } from '../database/prisma.js';
import { AppError } from '../errors/app-error.js';
import { perfilBase } from '../auth/mapa-perfil.js';
import { resolverSessao, SessaoIndisponivel, TokenInvalido } from '../auth/radar-session.js';

// GE do usuário já casado com o registro na calculadora (grupos_economicos).
export type GePermitido = {
  calcId: string; // grupos_economicos.id (uuid)
  radarId: string; // economic_group.Id do Radar (= grupos_economicos.identificacao)
  nome: string;
  dono: boolean;
};

// Garante que cada GE do Radar exista na calculadora (identificacao = id do Radar) e devolve o par.
// "Começar limpo": o GE nasce no primeiro acesso de alguém daquele grupo.
const garantirGes = async (
  ges: { radarId: string; nome: string; dono: boolean }[],
): Promise<GePermitido[]> => {
  const out: GePermitido[] = [];
  for (const g of ges) {
    const reg = await prisma.grupoEconomico.upsert({
      where: { identificacao: g.radarId },
      update: { nome: g.nome },
      create: { nome: g.nome, identificacao: g.radarId },
      select: { id: true, ativo: true },
    });
    if (reg.ativo) out.push({ calcId: reg.id, radarId: g.radarId, nome: g.nome, dono: g.dono });
  }
  return out;
};

// Modo 'radar': exige o Bearer do login do Radar, resolve a sessão pelo /SessionInfo e
// preenche res.locals (sessao, perfil-base e GEs permitidos). Substitui o lerPerfil (header).
export const autenticarRadar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const h = req.header('authorization') ?? '';
    const token = h.toLowerCase().startsWith('bearer ') ? h.slice(7).trim() : '';
    if (!token) throw new AppError('Faça login no Radar', 401, 'NAO_AUTENTICADO');

    const sessao = await resolverSessao(token);
    const base = perfilBase(sessao);
    if (!base)
      throw new AppError('Seu usuário não tem acesso a esta ferramenta', 403, 'SEM_ACESSO');

    // Operador cuida da plataforma inteira; associado só enxerga os GEs das próprias lojas.
    const ges = sessao.operador ? [] : await garantirGes(sessao.ges);
    if (!sessao.operador && ges.length === 0)
      throw new AppError('Seu usuário não está vinculado a um grupo econômico', 403, 'SEM_GE');

    res.locals.sessao = sessao;
    res.locals.perfil = base;
    res.locals.gesPermitidos = ges;
    next();
  } catch (e) {
    if (e instanceof TokenInvalido)
      return next(new AppError('Sessão do Radar inválida ou expirada', 401, 'NAO_AUTENTICADO'));
    if (e instanceof SessaoIndisponivel)
      return next(
        new AppError('Login do Radar indisponível, tente de novo', 503, 'AUTH_INDISPONIVEL'),
      );
    next(e);
  }
};

export const modoRadar = env.AUTH_MODE === 'radar';
