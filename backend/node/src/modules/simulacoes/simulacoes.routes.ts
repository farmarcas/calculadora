import { Router, type Response } from 'express';
import type { z } from 'zod';
import { prisma } from '../../shared/database/prisma.js';
import { auditorDoGe } from '../../shared/auditoria/auditoria.js';
import { geDe } from '../../shared/middlewares/ge.js';
import { exigirPerfil, type Perfil } from '../../shared/middlewares/perfil.js';
import { readValidated, validate } from '../../shared/middlewares/validate.js';
import { escalaRepository } from '../escala/escala.repository.js';
import type { PessoaSim } from './avaliar.js';
import * as S from './simulacoes.schemas.js';
import { makeSimulacoesService } from './simulacoes.service.js';
import { simulacoesRepository } from './simulacoes.repository.js';

const escrita = exigirPerfil('TENANT_ADMIN', 'SCHEDULE_MANAGER');
const perfilDe = (res: Response) => res.locals.perfil as Perfil;
const v = <T extends z.ZodType>(res: Response) => readValidated<z.infer<T>>(res);

const cadastroDoGe = (geId: string) => ({
  async funcionariosDaLoja(lojaId: string): Promise<PessoaSim[]> {
    const rows = await prisma.funcionario.findMany({
      where: { lojaId, loja: { geId }, deletedAt: null, funcaoEscala: { not: null } },
      orderBy: { nome: 'asc' },
    });
    return rows.map((r) => ({
      matricula: r.matricula,
      nome: r.nome,
      funcao: r.funcaoEscala,
      cargaH: r.cargaSemanalH ?? 44,
    }));
  },
  async situacaoPessoas(matriculas: string[]) {
    const rows = await prisma.funcionario.findMany({
      where: { matricula: { in: matriculas }, loja: { geId } },
    });
    return new Map(
      rows.map((r) => [r.matricula, { lojaId: r.lojaId, ativo: r.deletedAt === null }]),
    );
  },
});

export const simulacoesRouter = () => {
  // Um serviço por chamada, preso ao GE de quem chama.
  const s = (res: Response) =>
    makeSimulacoesService(
      simulacoesRepository(geDe(res)),
      escalaRepository(geDe(res)),
      cadastroDoGe(geDe(res)),
      auditorDoGe(geDe(res)),
    );
  const r = Router();

  r.get('/lojas/:id/simulacoes', validate(S.listarReq), async (_req, res) => {
    const { params, query } = v<typeof S.listarReq>(res);
    res.json(await s(res).listar(params.id, query.descartadas === '1'));
  });
  r.post('/lojas/:id/simulacoes', escrita, validate(S.criarReq), async (_req, res) => {
    const { params, body } = v<typeof S.criarReq>(res);
    res.status(201).json(await s(res).criar(params.id, body, perfilDe(res)));
  });
  r.get('/simulacoes/:id', validate(S.porIdReq), async (_req, res) =>
    res.json(await s(res).obter(v<typeof S.porIdReq>(res).params.id, perfilDe(res))),
  );
  r.put('/simulacoes/:id', escrita, validate(S.editarReq), async (_req, res) => {
    const { params, body } = v<typeof S.editarReq>(res);
    res.json(await s(res).editar(params.id, body, perfilDe(res)));
  });
  r.post('/simulacoes/:id/gravar', escrita, validate(S.porIdReq), async (_req, res) =>
    res.json(await s(res).gravar(v<typeof S.porIdReq>(res).params.id, perfilDe(res))),
  );
  // Quem aprova: só o dono do grupo (M-D4: gestor de escala não aprova por padrão).
  r.post(
    '/simulacoes/:id/aprovar',
    exigirPerfil('TENANT_ADMIN'),
    validate(S.aprovarReq),
    async (_req, res) => {
      const { params, body } = v<typeof S.aprovarReq>(res);
      res.json(await s(res).aprovar(params.id, body.vigenciaInicio, perfilDe(res)));
    },
  );
  r.get('/lojas/:id/simulacoes/comparar', validate(S.compararReq), async (_req, res) => {
    const { params, query } = v<typeof S.compararReq>(res);
    res.json(await s(res).comparar(params.id, query.ids, perfilDe(res)));
  });
  r.get('/simulacoes/:id/exportar.xlsx', validate(S.porIdReq), async (_req, res) => {
    const { buffer, nome } = await s(res).exportar(
      v<typeof S.porIdReq>(res).params.id,
      perfilDe(res),
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${nome}"`);
    res.send(buffer);
  });
  r.post('/simulacoes/:id/descartar', escrita, validate(S.porIdReq), async (_req, res) =>
    res.json(await s(res).descartar(v<typeof S.porIdReq>(res).params.id, perfilDe(res))),
  );
  r.post('/simulacoes/:id/clonar', escrita, validate(S.porIdReq), async (_req, res) =>
    res.status(201).json(await s(res).clonar(v<typeof S.porIdReq>(res).params.id, perfilDe(res))),
  );
  return r;
};
