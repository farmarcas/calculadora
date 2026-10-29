import { Router, type Request, type Response } from 'express';
import type { z } from 'zod';
import { auditar } from '../../shared/auditoria/auditoria.js';
import { ValidationError } from '../../shared/errors/validation-error.js';
import { exigirPerfil, type Perfil } from '../../shared/middlewares/perfil.js';
import { uploadAfd } from '../../shared/middlewares/upload.js';
import { readValidated, validate } from '../../shared/middlewares/validate.js';
import { simulacoesRepository } from '../simulacoes/simulacoes.repository.js';
import { escalaRepository } from '../escala/escala.repository.js';
import { apuracaoRepository } from '../apuracao/apuracao.repository.js';
import { makeApuracaoService } from '../apuracao/apuracao.service.js';
import { importacaoRepository } from './importacao.repository.js';
import { makeImportacaoService } from './importacao.service.js';
import { pendenciasRepository } from './pendencias.repository.js';
import { makePendenciasService } from './pendencias.service.js';
import * as S from './ponto.schemas.js';

// Ponto e apuração por pessoa: dono e gestor. Quem só consulta vê no máximo o agregado da loja.
const gestao = exigirPerfil('TENANT_ADMIN', 'SCHEDULE_MANAGER');
const perfilDe = (res: Response) => res.locals.perfil as Perfil;
const v = <T extends z.ZodType>(res: Response) => readValidated<z.infer<T>>(res);

export const pontoRouter = () => {
  const importacao = makeImportacaoService(importacaoRepository, simulacoesRepository, auditar);
  const pendencias = makePendenciasService(pendenciasRepository, simulacoesRepository, auditar);
  const apuracao = makeApuracaoService(
    apuracaoRepository,
    simulacoesRepository,
    escalaRepository,
    auditar,
  );
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

  r.get('/lojas/:id/ponto/pendencias', gestao, validate(S.pendenciasReq), async (_req, res) => {
    const { params, query } = v<typeof S.pendenciasReq>(res);
    await importacao.exigirEmUso(params.id);
    res.json(await pendencias.listar(params.id, query.motivo, query.page));
  });
  r.post(
    '/lojas/:id/ponto/pendencias/:batidaId/vincular',
    gestao,
    validate(S.vincularReq),
    async (_req, res) => {
      const { params, body } = v<typeof S.vincularReq>(res);
      await pendencias.vincular(params.id, params.batidaId, body.matricula, perfilDe(res));
      res.status(204).send();
    },
  );
  r.post(
    '/lojas/:id/ponto/pendencias/:batidaId/ignorar',
    gestao,
    validate(S.ignorarReq),
    async (_req, res) => {
      const { params, body } = v<typeof S.ignorarReq>(res);
      await pendencias.ignorar(params.id, params.batidaId, body.motivo, perfilDe(res));
      res.status(204).send();
    },
  );
  r.post(
    '/lojas/:id/ponto/pendencias/:batidaId/confirmar-folga',
    gestao,
    validate(S.folgaReq),
    async (_req, res) => {
      const { params } = v<typeof S.folgaReq>(res);
      await pendencias.confirmarFolga(params.id, params.batidaId, perfilDe(res));
      res.status(204).send();
    },
  );
  r.post('/lojas/:id/ponto/pendencias/cpf', gestao, validate(S.cpfReq), async (_req, res) => {
    const { params, body } = v<typeof S.cpfReq>(res);
    res.json(await pendencias.cadastrarCpf(params.id, body.cpf, body.matricula, perfilDe(res)));
  });

  // Apuração (sempre com o rótulo gerencial). Por pessoa: dono e gestor. Da loja: agregado, para todos os perfis.
  r.get('/lojas/:id/apuracao/pessoas', gestao, validate(S.apuracaoReq), async (_req, res) => {
    const { params, query } = v<typeof S.apuracaoReq>(res);
    res.json(await apuracao.porPessoa(params.id, query.de, query.ate));
  });
  r.get('/lojas/:id/apuracao/loja', validate(S.apuracaoReq), async (_req, res) => {
    const { params, query } = v<typeof S.apuracaoReq>(res);
    res.json(await apuracao.daLoja(params.id, query.de, query.ate));
  });
  r.get('/lojas/:id/apuracao/exportar.xlsx', gestao, validate(S.apuracaoReq), async (_req, res) => {
    const { params, query } = v<typeof S.apuracaoReq>(res);
    const { buffer, nome } = await apuracao.exportar(params.id, query.de, query.ate, perfilDe(res));
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${nome}"`);
    res.send(buffer);
  });

  // Painel e limites. O painel é agregado (todos os perfis); quem edita os limites é o dono.
  r.get('/lojas/:id/gerenciar/painel', validate(S.limitesReq), async (_req, res) => {
    res.json(await apuracao.painel(v<typeof S.limitesReq>(res).params.id));
  });
  r.get('/lojas/:id/gerenciar/limites', gestao, validate(S.limitesReq), async (_req, res) => {
    res.json(await apuracao.limites(v<typeof S.limitesReq>(res).params.id));
  });
  r.put(
    '/lojas/:id/gerenciar/limites',
    exigirPerfil('TENANT_ADMIN'),
    validate(S.salvarLimitesReq),
    async (_req, res) => {
      const { params, body } = v<typeof S.salvarLimitesReq>(res);
      res.json(await apuracao.gravarLimites(params.id, body, perfilDe(res)));
    },
  );

  return r;
};
