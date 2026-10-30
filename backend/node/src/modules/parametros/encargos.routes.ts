import { Router, type Response } from 'express';
import { z } from 'zod';
import { auditar } from '../../shared/auditoria/auditoria.js';
import { ValidationError } from '../../shared/errors/validation-error.js';
import { exigirPerfil, type Perfil } from '../../shared/middlewares/perfil.js';
import { readValidated, validate } from '../../shared/middlewares/validate.js';
import {
  ENCARGOS_PADRAO,
  NOME_REGIME,
  REGIMES_ENCARGOS,
  calcularEncargos,
  tabelaEncargosVigente,
  validarEncargos,
  versaoVigenteEncargos,
  type ParametroEncargos,
} from '../regras/encargos.js';
import { hojeISO } from '../regras/parametros.js';
import { encargosRepository, type EncargosRepository } from './encargos.repository.js';

const vazio = z.object({}).strict();
const numero = z.number().finite();
const criarReq = z.object({
  body: z
    .object({
      regime: z.enum(['simples', 'presumido', 'real']),
      inssPatronalPct: numero,
      ratPct: numero,
      fap: numero,
      terceirosPct: numero,
      fgtsPct: numero,
      decimoTerceiroPct: numero,
      feriasPct: numero,
      rescisaoPct: numero,
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

// Encargos da folha por regime (spec 015). Todos os perfis veem os percentuais; a alteração é só do dono do grupo.
export const encargosRouter = (repo: EncargosRepository = encargosRepository) => {
  const r = Router();

  r.get('/parametros-encargos', validate(listarReq), async (_req, res) => {
    const versoes = await repo.listar();
    const hoje = hojeISO();
    const tabela = tabelaEncargosVigente(versoes, hoje);
    res.json({
      hoje,
      regimes: REGIMES_ENCARGOS.map((regime) => {
        const doRegime = versoes.filter((x) => x.regime === regime);
        const vigente = versaoVigenteEncargos(doRegime, regime, hoje) ?? ENCARGOS_PADRAO[regime];
        return {
          regime,
          nome: NOME_REGIME[regime],
          vigente,
          // O total do regime com os parâmetros em vigor, sem rescisão e com a rescisão ligada.
          totalPct: calcularEncargos(regime, tabela).totalPct,
          totalComRescisaoPct: calcularEncargos(regime, tabela, { rescisaoLigada: true }).totalPct,
          historico: [...doRegime].reverse(),
        };
      }),
    });
  });

  r.post(
    '/parametros-encargos',
    exigirPerfil('TENANT_ADMIN'),
    validate(criarReq),
    async (_req, res) => {
      const { body } = v(res);
      const novo: ParametroEncargos = { ...body };
      const erros = validarEncargos(novo);
      if (erros.length) throw new ValidationError(erros.join(' '));
      const criada = await repo.criar(novo, res.locals.perfil as Perfil);
      await auditar({
        acao: 'encargos.alterados',
        perfil: res.locals.perfil as Perfil,
        alvoTipo: 'parametros_encargos',
        alvoId: criada.id,
        detalhe: { ...novo },
      });
      res.status(201).json(criada);
    },
  );
  return r;
};
