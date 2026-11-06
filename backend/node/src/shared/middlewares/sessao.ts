import type { NextFunction, Request, Response } from 'express';
import { authRepository } from '../../modules/auth/auth.repository.js';
import { sidDoToken } from '../../modules/auth/jwt.js';
import { comAutor } from '../auditoria/auditoria.js';
import { AppError } from '../errors/app-error.js';
import type { Perfil } from './perfil.js';

export const COOKIE_SESSAO = 'calc_sessao';

export type GrupoDaSessao = {
  geId: string;
  perfil: Perfil;
  lojaIds: string[];
  acessoTotal: boolean;
};

export type SessaoAtiva = {
  id: string;
  radarUsuarioId: string;
  nome: string;
  email: string;
  operador: boolean;
  grupos: GrupoDaSessao[];
  expiraEm: Date;
};

export const sessaoDoCookie = async (req: Request, segredo: string) => {
  const token = req.cookies?.[COOKIE_SESSAO] as string | undefined;
  const sid = token ? await sidDoToken(token, segredo) : null;
  return sid ? authRepository.sessaoValida(sid) : null;
};

export const exigirSessao =
  (segredo: string) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessao = await sessaoDoCookie(req, segredo);
      if (!sessao) throw new AppError('Entre para continuar', 401, 'NAO_AUTENTICADO');
      res.locals.sessao = sessao;
      comAutor({ id: sessao.radarUsuarioId, nome: sessao.nome }, next);
    } catch (e) {
      next(e);
    }
  };
