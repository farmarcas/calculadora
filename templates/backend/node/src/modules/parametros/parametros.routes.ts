import { Router, type Response } from 'express';
import { z } from 'zod';
import { auditar } from '../../shared/auditoria/auditoria.js';
import { ValidationError } from '../../shared/errors/validation-error.js';
import { exigirPerfil, type Perfil } from '../../shared/middlewares/perfil.js';
import { readValidated, validate } from '../../shared/middlewares/validate.js';
import {
  FASES,
  PARAMETROS_PADRAO,
  hojeISO,
  validarParametro,
  versaoVigente,
  type ParametroFase,
} from '../regras/parametros.js';
import { regraPara } from '../regras/perfis.js';
import { parametrosRepository, type ParametrosRepository } from './parametros.repository.js';

const vazio = z.object({}).strict();
const numero = z.number().finite();
const criarReq = z.object({
  body: z
    .object({
      fase: z.enum(['atual', 'r42', 'r40']),
      jornadaSemanalH: numero,
      horasDiaMax: numero,
      horasDiaMaxConvencao: numero.nullable().optional(),
      diasTrabalho: numero,
      divisor: numero,
      vigenciaInicio: z.string(),
    })
    .strict(),
  params: vazio.default({}),
  query: vazio.default({}),
});
const listarReq = z.object({
  body: vazio.default({}),
  params: vazio.default({}),
  query: vazio.default({}),
});
const v = (res: Response) => readValidated<z.infer<typeof criarReq>>(res);

export const parametrosRouter = (repo: ParametrosRepository = parametrosRepository) => {
  const r = Router();

  // Todos os perfis veem; a alteração é só do dono do grupo.
  r.get('/parametros-legais', validate(listarReq), async (_req, res) => {
    const versoes = await repo.listar();
    const hoje = hojeISO();
    res.json({
      hoje,
      fases: FASES.map((fase) => {
        const daFase = versoes.filter((x) => x.fase === fase);
        const vigente = versaoVigente(daFase, hoje) ?? PARAMETROS_PADRAO[fase];
        return {
          fase,
          nome: regraPara(fase, false).nome,
          vigente,
          historico: [...daFase].reverse(),
        };
      }),
    });
  });

  r.post(
    '/parametros-legais',
    exigirPerfil('TENANT_ADMIN'),
    validate(criarReq),
    async (_req, res) => {
      const { body } = v(res);
      const novo: ParametroFase = {
        fase: body.fase,
        jornadaSemanalH: body.jornadaSemanalH,
        horasDiaMax: body.horasDiaMax,
        horasDiaMaxConvencao: body.horasDiaMaxConvencao ?? null,
        diasTrabalho: body.diasTrabalho,
        divisor: body.divisor,
        vigenciaInicio: body.vigenciaInicio,
      };
      const erros = validarParametro(novo);
      if (erros.length) throw new ValidationError(erros.join(' '));
      const criada = await repo.criar(novo, res.locals.perfil as Perfil);
      await auditar({
        acao: 'parametros.alterados',
        perfil: res.locals.perfil as Perfil,
        alvoTipo: 'parametros',
        alvoId: criada.id,
        detalhe: { ...novo },
      });
      res.status(201).json(criada);
    },
  );
  return r;
};
