import { Router, type Request, type Response } from 'express';
import type { z } from 'zod';
import { auditar } from '../../shared/auditoria/auditoria.js';
import { ValidationError } from '../../shared/errors/validation-error.js';
import { exigirPerfil, type Perfil } from '../../shared/middlewares/perfil.js';
import { uploadAfd } from '../../shared/middlewares/upload.js';
import { readValidated, validate } from '../../shared/middlewares/validate.js';
import { simulacoesRepository } from '../simulacoes/simulacoes.repository.js';
import { importacaoRepository } from './importacao.repository.js';
import { makeImportacaoService } from './importacao.service.js';
import * as S from './ponto.schemas.js';

// Ponto e apuração por pessoa: dono e gestor. Quem só consulta vê no máximo o agregado da loja.
const gestao = exigirPerfil('TENANT_ADMIN', 'SCHEDULE_MANAGER');
const perfilDe = (res: Response) => res.locals.perfil as Perfil;
const v = <T extends z.ZodType>(res: Response) => readValidated<z.infer<T>>(res);

export const pontoRouter = () => {
  const importacao = makeImportacaoService(importacaoRepository, simulacoesRepository, auditar);
  const r = Router();

  r.post('/lojas/:id/ponto/importacoes', gestao, uploadAfd, async (req: Request, res: Response) => {
    const arquivos = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (arquivos.length === 0)
      throw new ValidationError('Envie ao menos um arquivo no campo "arquivos".');
    const id = String(req.params['id']);
    const resultados = await importacao.importar(
      id,
      arquivos.map((a) => ({ nome: a.originalname, buffer: a.buffer })),
      perfilDe(res),
    );
    res.status(201).json({ arquivos: resultados });
  });

  r.get('/lojas/:id/ponto/importacoes', gestao, validate(S.logReq), async (_req, res) => {
    const { params, query } = v<typeof S.logReq>(res);
    res.json(await importacao.log(params.id, query.page));
  });

  return r;
};
