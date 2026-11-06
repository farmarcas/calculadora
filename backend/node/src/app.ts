import cookieParser from 'cookie-parser';
import express from 'express';
import { pinoHttp } from 'pino-http';
import { env, ssoDe, type ConfigSso } from './config/env.js';
import { prisma } from './shared/database/prisma.js';
import { logger } from './shared/logger.js';
import { errorHandler } from './shared/middlewares/error-handler.js';
import { requestId } from './shared/middlewares/request-id.js';
import { exigirGe } from './shared/middlewares/ge.js';
import { guardaDeLojas } from './shared/middlewares/guarda-de-lojas.js';
import { exigirPerfil, lerPerfil } from './shared/middlewares/perfil.js';
import { exigirSessao } from './shared/middlewares/sessao.js';
import { authRouter } from './modules/auth/auth.routes.js';
import type { RadarClient } from './modules/auth/radar.client.js';
import { cadastrosRouter } from './modules/cadastros/cadastros.routes.js';
import { painelRouter } from './modules/cadastros/painel.routes.js';
import { escalaRouter } from './modules/escala/escala.routes.js';
import { simulacoesRouter } from './modules/simulacoes/simulacoes.routes.js';
import { custosRouter } from './modules/custos/custos.routes.js';
import { geRouter } from './modules/ge/ge.routes.js';
import { cargasLojasRouter } from './modules/cargas-lojas/cargas-lojas.routes.js';
import { parametrosRouter } from './modules/parametros/parametros.routes.js';
import { encargosRouter } from './modules/parametros/encargos.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import type { UsersRepository } from './modules/users/users.service.js';

type AppDeps = {
  usersRepository?: UsersRepository;
  sso?: ConfigSso | null;
  radar?: RadarClient;
};

export const createApp = (deps: AppDeps = {}) => {
  const sso = deps.sso === undefined ? ssoDe(env) : deps.sso;
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
  app.use(cookieParser());
  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.id,
    }),
  );

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/health/ready', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok' });
    } catch (error) {
      logger.warn({ err: error }, 'readiness check failed');
      res.status(503).json({
        error: { code: 'NOT_READY', message: 'Banco indisponível', details: [] },
      });
    }
  });

  app.use('/api/v1/auth', authRouter(sso, deps.radar));
  if (sso) {
    app.use('/api/v1', exigirSessao(sso.jwtSegredo));
    app.use('/api/v1/users', lerPerfil, exigirPerfil('PLATFORM_OPERATOR'));
  }
  app.use('/api/v1/users', usersRouter(deps.usersRepository));
  app.use(
    '/api/v1',
    lerPerfil,
    // Regras legais, grupos e carga de lojas são da plataforma: não pedem o GE.
    parametrosRouter(),
    encargosRouter(),
    geRouter(),
    cargasLojasRouter(),
    // Daqui para baixo tudo é de um GE: o cabeçalho X-GE é obrigatório e conferido.
    exigirGe,
    guardaDeLojas,
    cadastrosRouter(),
    painelRouter(),
    escalaRouter(),
    simulacoesRouter(),
    custosRouter(),
  );

  app.use((_req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Rota não encontrada', details: [] },
    });
  });

  app.use(errorHandler);
  return app;
};

export const app = createApp();
