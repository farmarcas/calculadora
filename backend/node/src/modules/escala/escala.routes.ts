import { Router, type Request, type Response } from 'express';
import type { z } from 'zod';
import { auditorDoGe } from '../../shared/auditoria/auditoria.js';
import { AppError } from '../../shared/errors/app-error.js';
import { ValidationError } from '../../shared/errors/validation-error.js';
import { geDe } from '../../shared/middlewares/ge.js';
import { exigirPerfil, type Perfil } from '../../shared/middlewares/perfil.js';
import { uploadPlanilha } from '../../shared/middlewares/upload.js';
import { readValidated, validate } from '../../shared/middlewares/validate.js';
import { gerarModeloBase, gerarModeloEscala } from '../planilhas/modelo.js';
import { escalaRepository, type EscalaRepository } from './escala.repository.js';
import * as S from './escala.schemas.js';
import { makeEscalaService } from './escala.service.js';

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const escrita = exigirPerfil('TENANT_ADMIN', 'SCHEDULE_MANAGER');
const perfilDe = (res: Response) => res.locals.perfil as Perfil;
const v = <T extends z.ZodType>(res: Response) => readValidated<z.infer<T>>(res);

export const escalaRouter = (repoDoGe: (geId: string) => EscalaRepository = escalaRepository) => {
  // Um serviço por chamada, preso ao GE de quem chama.
  const s = (res: Response) => makeEscalaService(repoDoGe(geDe(res)), auditorDoGe(geDe(res)));
  const r = Router();

  const modelo = (nome: string, gerar: () => Promise<Buffer>) =>
    r.get(`/planilha-modelo-${nome}`, async (_req, res) => {
      res.setHeader('Content-Type', XLSX);
      res.setHeader('Content-Disposition', `attachment; filename="modelo-${nome}.xlsx"`);
      res.send(await gerar());
    });
  modelo('escala', gerarModeloEscala);
  modelo('base', gerarModeloBase);

  r.post('/cargas/escala', escrita, uploadPlanilha, async (req: Request, res: Response) => {
    if (!req.file) throw new ValidationError('Envie o arquivo no campo "arquivo".');
    res
      .status(201)
      .json(await s(res).importarEscala(req.file.originalname, req.file.buffer, perfilDe(res)));
  });
  r.post('/cargas/base', escrita, uploadPlanilha, async (req: Request, res: Response) => {
    if (!req.file) throw new ValidationError('Envie o arquivo no campo "arquivo".');
    res
      .status(201)
      .json(await s(res).importarBase(req.file.originalname, req.file.buffer, perfilDe(res)));
  });

  r.get('/lojas/:id/diagnostico', validate(S.diagnosticoReq), async (_req, res) => {
    const { params, query } = v<typeof S.diagnosticoReq>(res);
    // A margem simulada mexe nos valores em reais: só o dono.
    if (query.margemPct !== undefined && perfilDe(res) !== 'TENANT_ADMIN')
      throw new AppError('Só o dono simula a margem bruta', 403, 'SEM_PERMISSAO');
    res.json(await s(res).diagnostico(params.id, perfilDe(res), query));
  });
  r.get('/lojas/:id/cargas', validate(S.porLojaReq), async (_req, res) =>
    res.json(await s(res).historico(v<typeof S.porLojaReq>(res).params.id)),
  );
  r.put('/lojas/:id/configuracao', escrita, validate(S.configuracaoReq), async (_req, res) => {
    const { params, body } = v<typeof S.configuracaoReq>(res);
    res.json(await s(res).configurar(params.id, body, perfilDe(res)));
  });
  return r;
};
