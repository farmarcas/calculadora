import { Router, type Request, type Response } from 'express';
import type { z } from 'zod';
import { auditorDoGe } from '../../shared/auditoria/auditoria.js';
import { ValidationError } from '../../shared/errors/validation-error.js';
import { geDe } from '../../shared/middlewares/ge.js';
import { exigirPerfil, type Perfil } from '../../shared/middlewares/perfil.js';
import { uploadPlanilha } from '../../shared/middlewares/upload.js';
import { readValidated, validate } from '../../shared/middlewares/validate.js';
import { gerarModelo } from '../planilhas/modelo.js';
import { AppError } from '../../shared/errors/app-error.js';
import { cadastrosRepository } from './cadastros.repository.js';
import { mascararCpf } from './documentos.js';
import { ocultarFaturamento } from './faturamento.js';
import * as S from './cadastros.schemas.js';
import { makeCadastrosService, type CadastrosRepository } from './cadastros.service.js';

const perfilDe = (res: Response) => res.locals.perfil as Perfil;
const v = <T extends z.ZodType>(res: Response) => readValidated<z.infer<T>>(res);
const escrita = exigirPerfil('TENANT_ADMIN', 'SCHEDULE_MANAGER');
// Lojas vêm da plataforma: só o operador cria e remove; dono e gestor corrigem os dados.
const soOperador = exigirPerfil('PLATFORM_OPERATOR');
const editaLoja = exigirPerfil('PLATFORM_OPERATOR', 'TENANT_ADMIN', 'SCHEDULE_MANAGER');
const importa = exigirPerfil('PLATFORM_OPERATOR', 'TENANT_ADMIN', 'SCHEDULE_MANAGER');

export const cadastrosRouter = (
  repoDoGe: (geId: string) => CadastrosRepository = cadastrosRepository,
) => {
  // Um serviço por chamada, preso ao GE de quem chama.
  const s = (res: Response) => makeCadastrosService(repoDoGe(geDe(res)), auditorDoGe(geDe(res)));
  const r = Router();

  r.get('/planilha-modelo', async (_req, res) => {
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="modelo-cadastro-escala.xlsx"');
    res.send(await gerarModelo());
  });

  r.post('/importacoes/cadastro', importa, uploadPlanilha, async (req: Request, res: Response) => {
    if (!req.file) throw new ValidationError('Envie o arquivo no campo "arquivo".');
    res
      .status(201)
      .json(await s(res).receberPlanilha(req.file.originalname, req.file.buffer, perfilDe(res)));
  });
  r.post(
    '/importacoes/cadastro/:id/confirmar',
    importa,
    validate(S.confirmarReq),
    async (_req, res) => {
      const { params, body } = v<typeof S.confirmarReq>(res);
      res.json(await s(res).confirmarImportacao(params.id, body.mapeamento, perfilDe(res)));
    },
  );

  // Faturamento é valor em reais: só o dono grava, e só ele o recebe de volta.
  const soDonoGrava = (res: Response, body: { faturamento?: unknown }) => {
    if (body.faturamento !== undefined && perfilDe(res) !== 'TENANT_ADMIN')
      throw new AppError('Só o dono informa o faturamento da loja', 403, 'SEM_PERMISSAO');
  };
  r.get('/lojas', validate(S.listarReq), async (_req, res) => {
    const pag = await s(res).listarLojas(v<typeof S.listarReq>(res).query);
    res.json({ ...pag, data: pag.data.map((l) => ocultarFaturamento(l, perfilDe(res))) });
  });
  r.post('/lojas', soOperador, validate(S.criarLojaReq), async (_req, res) => {
    const { body } = v<typeof S.criarLojaReq>(res);
    soDonoGrava(res, body);
    res
      .status(201)
      .json(ocultarFaturamento(await s(res).criarLoja(body, perfilDe(res)), perfilDe(res)));
  });
  r.patch('/lojas/:id', editaLoja, validate(S.editarLojaReq), async (_req, res) => {
    const { params, body } = v<typeof S.editarLojaReq>(res);
    soDonoGrava(res, body);
    res.json(
      ocultarFaturamento(await s(res).editarLoja(params.id, body, perfilDe(res)), perfilDe(res)),
    );
  });
  r.delete('/lojas/:id', soOperador, validate(S.porIdReq), async (_req, res) => {
    await s(res).removerLoja(v<typeof S.porIdReq>(res).params.id, perfilDe(res));
    res.status(204).send();
  });

  // CPF é dado pessoal: quem só consulta o vê mascarado.
  const cpfPara = <T extends { cpf?: string }>(f: T, perfil: string): T =>
    perfil !== 'TENANT_ADMIN' && perfil !== 'SCHEDULE_MANAGER' && f.cpf
      ? { ...f, cpf: mascararCpf(f.cpf) }
      : f;
  r.get('/funcionarios', validate(S.listarReq), async (_req, res) => {
    const pag = await s(res).listarFuncionarios(v<typeof S.listarReq>(res).query);
    res.json({ ...pag, data: pag.data.map((f) => cpfPara(f, perfilDe(res))) });
  });
  r.post('/funcionarios', escrita, validate(S.criarFuncReq), async (_req, res) =>
    res
      .status(201)
      .json(await s(res).criarFuncionario(v<typeof S.criarFuncReq>(res).body, perfilDe(res))),
  );
  r.patch('/funcionarios/:id', escrita, validate(S.editarFuncReq), async (_req, res) => {
    const { params, body } = v<typeof S.editarFuncReq>(res);
    res.json(await s(res).editarFuncionario(params.id, body, perfilDe(res)));
  });
  r.delete('/funcionarios/:id', escrita, validate(S.porIdReq), async (_req, res) => {
    await s(res).removerFuncionario(v<typeof S.porIdReq>(res).params.id, perfilDe(res));
    res.status(204).send();
  });
  return r;
};
