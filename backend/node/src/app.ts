import express from 'express';
import { pinoHttp } from 'pino-http';
import { prisma } from './shared/database/prisma.js';
import { logger } from './shared/logger.js';
import { errorHandler } from './shared/middlewares/error-handler.js';
import { requestId } from './shared/middlewares/request-id.js';
import { exigirGe } from './shared/middlewares/ge.js';
import { lerPerfil } from './shared/middlewares/perfil.js';
import { autenticarRadar, modoRadar, type GePermitido } from './shared/middlewares/auth.js';
import { perfilNoGe } from './shared/auth/mapa-perfil.js';
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

  // Autenticação: no modo 'radar' exige o login do Radar; no 'header' (local/testes) só lê o X-Perfil.
  const autenticar = modoRadar ? autenticarRadar : lerPerfil;

  // Quem é o usuário logado + GEs que ele pode usar (o front usa para montar o seletor de GE).
  app.get('/api/v1/session', autenticar, (_req, res) => {
    if (!modoRadar) {
      res.json({ modo: 'header' });
      return;
    }
    const sessao = res.locals.sessao!;
    const ges = (res.locals.gesPermitidos ?? []) as GePermitido[];
    res.json({
      modo: 'radar',
      email: sessao.email,
      perfil: res.locals.perfil,
      operador: sessao.operador,
      // Perfil por GE: dono da loja vira gestor; os demais, consulta (mesmo mapa do servidor).
      ges: ges.map((g) => ({
        id: g.calcId,
        nome: g.nome,
        dono: g.dono,
        perfil: perfilNoGe(sessao, g.dono),
      })),
    });
  });

  app.use(
    '/api/v1',
    autenticar,
    // Regras legais, grupos e carga de lojas são da plataforma: não pedem o GE.
    parametrosRouter(),
    encargosRouter(),
    geRouter(),
    cargasLojasRouter(),
    // Daqui para baixo tudo é de um GE: o cabeçalho X-GE é obrigatório e conferido.
    exigirGe,
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
