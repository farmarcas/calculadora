import { Router, type Response } from 'express';
import type { z } from 'zod';
import { auditorDoGe } from '../../shared/auditoria/auditoria.js';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { geDe } from '../../shared/middlewares/ge.js';
import { exigirPerfil, type Perfil } from '../../shared/middlewares/perfil.js';
import { readValidated, validate } from '../../shared/middlewares/validate.js';
import { custosRepository, type CustosRepository } from './custos.repository.js';
import * as S from './custos.schemas.js';

const v = <T extends z.ZodType>(res: Response) => readValidated<z.infer<T>>(res);
// Custo é do dono do grupo: gestor e consulta não veem nem editam (documento M4, E-D9).
const soDono = exigirPerfil('TENANT_ADMIN');

export const custosRouter = (repoDoGe: (geId: string) => CustosRepository = custosRepository) => {
  const r = Router();

  r.get('/lojas/:id/custos', soDono, validate(S.lerCustosReq), async (_req, res) => {
    const { params } = v<typeof S.lerCustosReq>(res);
    const { existe, custos, regimeTributario } = await repoDoGe(geDe(res)).ler(params.id);
    if (!existe) throw new NotFoundError('Loja não encontrada', 'LOJA_NAO_ENCONTRADA');
    // O regime mora no cadastro da loja; aqui só é mostrado, para consulta.
    res.json({ informado: !!custos, custos, regimeTributario });
  });

  r.put('/lojas/:id/custos', soDono, validate(S.salvarCustosReq), async (_req, res) => {
    const { params, body } = v<typeof S.salvarCustosReq>(res);
    if (!(await repoDoGe(geDe(res)).ler(params.id)).existe)
      throw new NotFoundError('Loja não encontrada', 'LOJA_NAO_ENCONTRADA');
    await repoDoGe(geDe(res)).salvar(params.id, body);
    // Auditoria sem os valores: só quais funções foram preenchidas.
    await auditorDoGe(geDe(res))({
      acao: 'loja.custos',
      perfil: res.locals.perfil as Perfil,
      alvoTipo: 'loja',
      alvoId: params.id,
      detalhe: { funcoes: Object.keys(body.salarioMedio) },
    });
    res.json({ informado: true, custos: body });
  });
  return r;
};
