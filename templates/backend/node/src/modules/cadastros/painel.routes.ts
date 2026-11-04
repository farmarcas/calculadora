import { Router, type Response } from 'express';
import { z } from 'zod';
import { auditorDoGe } from '../../shared/auditoria/auditoria.js';
import { geDe } from '../../shared/middlewares/ge.js';
import { readValidated, validate } from '../../shared/middlewares/validate.js';
import { custosSchema } from '../custos/custos.schemas.js';
import { configuracaoBody } from '../escala/escala.schemas.js';
import { cadastrosRepository } from './cadastros.repository.js';
import { lojaSchema } from './cadastros.schemas.js';
import { makePainelService, type PainelBody } from './painel.js';

const vazio = z.object({}).strict();
const id = z.object({ id: z.string().uuid() }).strict();

// Corpo: cada bloco é opcional, mas ao menos um precisa vir.
const painelReq = z.object({
  body: z
    .object({
      loja: lojaSchema.partial().optional(),
      configuracao: configuracaoBody.optional(),
      custos: custosSchema.optional(),
    })
    .strict()
    .refine((b) => Object.keys(b).length > 0, { message: 'Informe ao menos um bloco' }),
  params: id,
  query: vazio.default({}),
});

export const painelRouter = () => {
  const r = Router();
  const s = (res: Response) =>
    makePainelService(geDe(res), cadastrosRepository(geDe(res)), auditorDoGe(geDe(res)));

  r.get('/lojas/:id/painel', validate(z.object({ body: vazio.default({}), params: id, query: vazio.default({}) })), async (_req, res) => {
    const { params } = readValidated<{ params: { id: string } }>(res);
    res.json(await s(res).ler(params.id, res.locals.perfil as string));
  });
  r.put('/lojas/:id/painel', validate(painelReq), async (_req, res) => {
    const { params, body } = readValidated<{ params: { id: string }; body: PainelBody }>(res);
    res.json(await s(res).salvar(params.id, body, res.locals.perfil as string));
  });
  return r;
};
