import { prisma } from '../../shared/database/prisma.js';
import type { Aba } from '../planilhas/leitor.js';
import type {
  CadastrosRepository,
  FuncionarioRegistro,
  LojaRegistro,
} from './cadastros.service.js';

const ativo = { deletedAt: null } as const;
const lojaSel = {
  id: true,
  codigo: true,
  nome: true,
  cnpj: true,
  uf: true,
  marca: true,
  horarios: true,
} as const;
const funcSel = {
  id: true,
  matricula: true,
  nome: true,
  lojaId: true,
  cpf: true,
  cargo: true,
  funcaoEscala: true,
  cargaSemanalH: true,
  regime: true,
} as const;

const comoLoja = (
  r: { cnpj: string | null; uf: string | null; marca: string | null; horarios: unknown } & Record<
    string,
    unknown
  >,
) =>
  ({
    ...r,
    cnpj: r.cnpj ?? undefined,
    uf: r.uf ?? undefined,
    marca: r.marca ?? undefined,
    horarios: (r.horarios ?? undefined) as LojaRegistro['horarios'],
  }) as LojaRegistro;
const comoFunc = (r: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(r).map(([k, v]) => [k, v === null && k !== 'funcaoEscala' ? undefined : v]),
  ) as unknown as FuncionarioRegistro;
const limpa = <T extends object>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;

export const cadastrosRepository: CadastrosRepository = {
  async listarLojas({ page, pageSize, busca }) {
    const where = {
      ...ativo,
      ...(busca
        ? {
            OR: [
              { nome: { contains: busca, mode: 'insensitive' as const } },
              { codigo: { contains: busca } },
            ],
          }
        : {}),
    };
    const [rows, total] = await prisma.$transaction([
      prisma.loja.findMany({
        where,
        select: lojaSel,
        orderBy: { codigo: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.loja.count({ where }),
    ]);
    return { data: rows.map(comoLoja), total };
  },
  async buscarLoja(id) {
    const r = await prisma.loja.findFirst({ where: { id, ...ativo }, select: lojaSel });
    return r ? comoLoja(r) : null;
  },
  async buscarLojaPorCodigo(codigo) {
    const r = await prisma.loja.findFirst({ where: { codigo, ...ativo }, select: lojaSel });
    return r ? comoLoja(r) : null;
  },
  async criarLoja(i) {
    return comoLoja(await prisma.loja.create({ data: limpa(i) as never, select: lojaSel }));
  },
  async atualizarLoja(id, i) {
    return comoLoja(
      await prisma.loja.update({ where: { id }, data: limpa(i) as never, select: lojaSel }),
    );
  },
  async removerLoja(id) {
    await prisma.loja.update({ where: { id }, data: { deletedAt: new Date() } });
  },
  contarFuncionariosDaLoja: (lojaId) => prisma.funcionario.count({ where: { lojaId, ...ativo } }),

  async listarFuncionarios({ page, pageSize, busca, lojaId }) {
    const where = {
      ...ativo,
      ...(lojaId ? { lojaId } : {}),
      ...(busca
        ? {
            OR: [
              { nome: { contains: busca, mode: 'insensitive' as const } },
              { matricula: { contains: busca } },
            ],
          }
        : {}),
    };
    const [rows, total] = await prisma.$transaction([
      prisma.funcionario.findMany({
        where,
        select: funcSel,
        orderBy: { nome: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.funcionario.count({ where }),
    ]);
    return { data: rows.map(comoFunc), total };
  },
  async buscarFuncionario(id) {
    const r = await prisma.funcionario.findFirst({ where: { id, ...ativo }, select: funcSel });
    return r ? comoFunc(r) : null;
  },
  async buscarFuncionarioPorMatricula(matricula) {
    const r = await prisma.funcionario.findFirst({
      where: { matricula, ...ativo },
      select: funcSel,
    });
    return r ? comoFunc(r) : null;
  },
  async criarFuncionario(i) {
    return comoFunc(await prisma.funcionario.create({ data: limpa(i) as never, select: funcSel }));
  },
  async atualizarFuncionario(id, i) {
    return comoFunc(
      await prisma.funcionario.update({ where: { id }, data: limpa(i) as never, select: funcSel }),
    );
  },
  async removerFuncionario(id) {
    await prisma.funcionario.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  async criarImportacao(arquivo, abas) {
    const r = await prisma.importacaoCadastro.create({ data: { arquivo, abas: abas as never } });
    return { id: r.id, arquivo: r.arquivo, status: r.status, abas };
  },
  async buscarImportacao(id) {
    const r = await prisma.importacaoCadastro.findUnique({ where: { id } });
    if (!r) return null;
    return {
      id: r.id,
      arquivo: r.arquivo,
      status: r.status === 'CONFIRMADA' ? 'confirmada' : 'aguardando',
      abas: r.abas as unknown as Aba[],
    };
  },
  async fecharImportacao(id, mapeamento, resumo) {
    await prisma.importacaoCadastro.update({
      where: { id },
      data: {
        status: 'CONFIRMADA',
        mapeamento: mapeamento as never,
        resumo: resumo as never,
        confirmadoEm: new Date(),
      },
    });
  },
};
