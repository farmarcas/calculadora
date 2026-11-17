import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../database/prisma.js';
import { AppError } from '../errors/app-error.js';
import { NotFoundError } from '../errors/not-found-error.js';
import { geDe } from './ge.js';

export type Conferencia =
  | { tipo: 'livre' }
  | { tipo: 'loja'; id: string }
  | { tipo: 'simulacao'; id: string }
  | { tipo: 'funcionario'; id: string }
  | { tipo: 'loja-no-filtro' }
  | { tipo: 'loja-no-corpo' };

type Regra = {
  metodos: string[];
  rota: RegExp;
  conferencia: (id: string) => Conferencia;
};

const livre = () => ({ tipo: 'livre' }) as const;
const daLoja = (id: string) => ({ tipo: 'loja', id }) as const;
const daSimulacao = (id: string) => ({ tipo: 'simulacao', id }) as const;
const doFuncionario = (id: string) => ({ tipo: 'funcionario', id }) as const;

const TABELA: Regra[] = [
  { metodos: ['GET'], rota: /^\/planilha-modelo(?:-base)?$/, conferencia: livre },
  { metodos: ['GET'], rota: /^\/lojas$/, conferencia: livre },
  { metodos: ['PATCH'], rota: /^\/lojas\/([^/]+)$/, conferencia: daLoja },
  { metodos: ['GET', 'PUT'], rota: /^\/lojas\/([^/]+)\/(?:painel|custos)$/, conferencia: daLoja },
  { metodos: ['GET'], rota: /^\/lojas\/([^/]+)\/(?:diagnostico|cargas)$/, conferencia: daLoja },
  { metodos: ['PUT'], rota: /^\/lojas\/([^/]+)\/configuracao$/, conferencia: daLoja },
  { metodos: ['GET', 'POST'], rota: /^\/lojas\/([^/]+)\/simulacoes$/, conferencia: daLoja },
  { metodos: ['GET'], rota: /^\/lojas\/([^/]+)\/simulacoes\/comparar$/, conferencia: daLoja },
  { metodos: ['GET', 'PUT'], rota: /^\/simulacoes\/([^/]+)$/, conferencia: daSimulacao },
  { metodos: ['GET'], rota: /^\/simulacoes\/([^/]+)\/exportar\.xlsx$/, conferencia: daSimulacao },
  {
    metodos: ['POST'],
    rota: /^\/simulacoes\/([^/]+)\/(?:gravar|descartar|clonar)$/,
    conferencia: daSimulacao,
  },
  { metodos: ['GET'], rota: /^\/funcionarios$/, conferencia: () => ({ tipo: 'loja-no-filtro' }) },
  { metodos: ['POST'], rota: /^\/funcionarios$/, conferencia: () => ({ tipo: 'loja-no-corpo' }) },
  { metodos: ['PATCH', 'DELETE'], rota: /^\/funcionarios\/([^/]+)$/, conferencia: doFuncionario },
];

export const conferenciaDa = (metodo: string, caminho: string): Conferencia | null => {
  for (const regra of TABELA) {
    const achou = regra.metodos.includes(metodo) ? regra.rota.exec(caminho) : null;
    if (achou) return regra.conferencia(achou[1] ?? '');
  }
  return null;
};

const uuid = z.uuid();
const lojaNaoEncontrada = () => new NotFoundError('Loja não encontrada', 'LOJA_NAO_ENCONTRADA');

const lojaDaSimulacao = async (id: string, geId: string) =>
  uuid.safeParse(id).success
    ? (
        await prisma.simulacao.findFirst({
          where: { id, loja: { geId } },
          select: { lojaId: true },
        })
      )?.lojaId
    : undefined;

const lojaDoFuncionario = async (id: string, geId: string) =>
  uuid.safeParse(id).success
    ? (await prisma.funcionario.findFirst({ where: { id, geId }, select: { lojaId: true } }))
        ?.lojaId
    : undefined;

const conferir = async (conferencia: Conferencia, req: Request, geId: string, ids: string[]) => {
  const permitida = (lojaId: unknown) => typeof lojaId === 'string' && ids.includes(lojaId);
  const lojaNoCorpo = (req.body as { lojaId?: unknown } | undefined)?.lojaId;

  switch (conferencia.tipo) {
    case 'livre':
      return;
    case 'loja':
      if (!permitida(conferencia.id)) throw lojaNaoEncontrada();
      return;
    case 'simulacao':
      if (!permitida(await lojaDaSimulacao(conferencia.id, geId)))
        throw new NotFoundError('Simulação não encontrada', 'SIMULACAO_NAO_ENCONTRADA');
      return;
    case 'funcionario':
      if (!permitida(await lojaDoFuncionario(conferencia.id, geId)))
        throw new NotFoundError('Funcionário não encontrado', 'FUNCIONARIO_NAO_ENCONTRADO');
      if (lojaNoCorpo !== undefined && !permitida(lojaNoCorpo)) throw lojaNaoEncontrada();
      return;
    case 'loja-no-filtro':
      if (req.query.lojaId !== undefined && !permitida(req.query.lojaId)) throw lojaNaoEncontrada();
      return;
    case 'loja-no-corpo':
      if (lojaNoCorpo !== undefined && !permitida(lojaNoCorpo)) throw lojaNaoEncontrada();
  }
};

export const guardaDeLojas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessao = res.locals.sessao;
    if (!sessao || sessao.operador) {
      next();
      return;
    }
    const geId = geDe(res);
    const grupo = sessao.grupos.find((g) => g.geId === geId);
    if (grupo?.acessoTotal) {
      next();
      return;
    }
    const conferencia = conferenciaDa(req.method, req.path);
    if (!grupo || !conferencia)
      throw new AppError('Seu acesso não permite esta ação', 403, 'SEM_PERMISSAO');
    await conferir(conferencia, req, geId, grupo.lojaIds);
    res.locals.lojasPermitidas = grupo.lojaIds;
    next();
  } catch (e) {
    next(e);
  }
};
