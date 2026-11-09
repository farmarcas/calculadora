import { Router, type CookieOptions, type Request, type Response } from 'express';
import type { z } from 'zod';
import type { ConfigSso } from '../../config/env.js';
import { AppError } from '../../shared/errors/app-error.js';
import { COOKIE_SESSAO, sessaoDoCookie } from '../../shared/middlewares/sessao.js';
import { readValidated, validate } from '../../shared/middlewares/validate.js';
import { authRepository, type AuthRepository } from './auth.repository.js';
import { exchangeReq } from './auth.schemas.js';
import { corpoDaSessao, makeAuthService } from './auth.service.js';
import { radarClient, type RadarClient } from './radar.client.js';

export const authRouter = (
  sso: ConfigSso | null,
  radar?: RadarClient,
  repo: AuthRepository = authRepository,
) => {
  const r = Router();

  if (!sso) {
    r.get('/sessao', (_req, res) => {
      res.json({ sso: false });
    });
    return r;
  }

  const servico = makeAuthService(radar ?? radarClient(sso), repo, sso);
  const cookieDaSessao: CookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: sso.cookieSeguro,
    path: '/api',
  };
  const sessaoDe = (req: Request) => sessaoDoCookie(req, sso.jwtSegredo);

  r.get('/sessao', async (req, res) => {
    const sessao = await sessaoDe(req);
    if (!sessao) throw new AppError('Entre para continuar', 401, 'NAO_AUTENTICADO');
    res.json(await corpoDaSessao(sessao));
  });

  r.post('/sso/exchange', validate(exchangeReq), async (_req: Request, res: Response) => {
    const { body } = readValidated<z.infer<typeof exchangeReq>>(res);
    const { sessao, token } = await servico.entrar(body.code);
    res.cookie(COOKIE_SESSAO, token, { ...cookieDaSessao, expires: sessao.expiraEm });
    res.json(await corpoDaSessao(sessao));
  });

  r.post('/sair', async (req, res) => {
    const sessao = await sessaoDe(req);
    if (sessao) await repo.encerrarSessao(sessao.id);
    res.clearCookie(COOKIE_SESSAO, cookieDaSessao);
    res.status(204).send();
  });

  return r;
};
