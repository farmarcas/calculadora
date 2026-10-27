import express from 'express';
import { pinoHttp } from 'pino-http';
import { prisma } from './shared/database/prisma.js';
import { logger } from './shared/logger.js';
import { errorHandler } from './shared/middlewares/error-handler.js';
import { requestId } from './shared/middlewares/request-id.js';
import { lerPerfil } from './shared/middlewares/perfil.js';
import { cadastrosRouter } from './modules/cadastros/cadastros.routes.js';
import { escalaRouter } from './modules/escala/escala.routes.js';
import { simulacoesRouter } from './modules/simulacoes/simulacoes.routes.js';
import { custosRouter } from './modules/custos/custos.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import type { UsersRepository } from './modules/users/users.service.js';

type AppDeps = {
  usersRepository?: UsersRepository;
};

export const createApp = (deps: AppDeps = {}) => {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
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

  app.use('/api/v1/users', usersRouter(deps.usersRepository));
  app.use(
    '/api/v1',
    lerPerfil,
    cadastrosRouter(),
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
