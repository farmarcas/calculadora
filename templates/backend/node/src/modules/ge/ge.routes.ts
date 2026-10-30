import { Router, type Response } from 'express';
import type { z } from 'zod';
import { auditar } from '../../shared/auditoria/auditoria.js';
import { ConflictError } from '../../shared/errors/conflict-error.js';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { exigirPerfil, type Perfil } from '../../shared/middlewares/perfil.js';
import { readValidated, validate } from '../../shared/middlewares/validate.js';
import { geRepository, type GeRepository } from './ge.repository.js';
import * as S from './ge.schemas.js';

const soOperador = exigirPerfil('PLATFORM_OPERATOR');
const perfilDe = (res: Response) => res.locals.perfil as Perfil;
const v = <T extends z.ZodType>(res: Response) => readValidated<z.infer<T>>(res);

// Rotas da plataforma: não pedem o X-GE (o GE é justamente o assunto).
export const geRouter = (repo: GeRepository = geRepository) => {
  const r = Router();

  r.get('/ge', async (_req, res) => res.json({ data: await repo.listarAtivos() }));
  r.get('/ge/resumo', soOperador, async (_req, res) => res.json({ data: await repo.resumo() }));

  r.post('/ge', soOperador, validate(S.criarGeReq), async (_req, res) => {
    const { body } = v<typeof S.criarGeReq>(res);
    try {
      const ge = await repo.criar(body);
      await auditar({
        acao: 'ge.criado',
        perfil: perfilDe(res),
        alvoTipo: 'ge',
        alvoId: ge.id,
        geId: ge.id,
      });
      res.status(201).json(ge);
    } catch (e) {
      if ((e as { code?: string }).code === 'P2002')
        throw new ConflictError('Já existe um grupo com essa identificação', 'GE_DUPLICADO');
      throw e;
    }
  });

  r.patch('/ge/:id', soOperador, validate(S.editarGeReq), async (_req, res) => {
    const { params, body } = v<typeof S.editarGeReq>(res);
    if (!(await repo.buscar(params.id)))
      throw new NotFoundError('Grupo não encontrado', 'GE_NAO_ENCONTRADO');
    const ge = await repo.atualizar(params.id, body);
    await auditar({
      acao: body.ativo === undefined ? 'ge.editado' : body.ativo ? 'ge.reativado' : 'ge.desativado',
      perfil: perfilDe(res),
      alvoTipo: 'ge',
      alvoId: ge.id,
      geId: ge.id,
    });
    res.json(ge);
  });
  return r;
};
