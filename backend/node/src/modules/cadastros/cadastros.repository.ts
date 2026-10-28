import { prisma } from '../../shared/database/prisma.js';
import { decimalParaHora, horaParaDecimal, mensalDeSemanal } from './carga.js';
import { normalizarHorarios, resumoHorarios } from './horarios.js';
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
  cidade: true,
  uf: true,
  marca: true,
  regimeTributario: true,
  faturamento: true,
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
  cargaMensalH: true,
  entrada: true,
  saida: true,
  dias: true,
  regime: true,
} as const;

const comoLoja = (
  r: {
    cnpj: string | null;
    cidade: string | null;
    uf: string | null;
    marca: string | null;
    horarios: unknown;
  } & Record<string, unknown>,
) =>
  ({
    ...r,
    cnpj: r.cnpj ?? undefined,
    cidade: r.cidade ?? undefined,
    uf: r.uf ?? undefined,
    marca: r.marca ?? undefined,
    horarios: normalizarHorarios(r.horarios) ?? undefined,
    horariosResumo: resumoHorarios(normalizarHorarios(r.horarios)),
  }) as LojaRegistro;
const comoFunc = (r: Record<string, unknown>) => {
  const base = Object.fromEntries(
    Object.entries(r).map(([k, v]) => [k, v === null && k !== 'funcaoEscala' ? undefined : v]),
  );
  const semanal = r.cargaSemanalH as number | null;
  return {
    ...base,
    // Quem só tem a carga semanal (planilhas antigas) mostra a mensal equivalente.
    cargaMensalH:
      (r.cargaMensalH as number | null) ?? (semanal ? mensalDeSemanal(semanal) : undefined),
    entrada: r.entrada == null ? undefined : decimalParaHora(r.entrada as number),
    saida: r.saida == null ? undefined : decimalParaHora(r.saida as number),
  } as unknown as FuncionarioRegistro;
};
// API (texto "HH:MM") → banco (horas decimais).
const paraBanco = <T extends { entrada?: string | null; saida?: string | null }>(i: T) => ({
  ...i,
  entrada: i.entrada == null ? i.entrada : horaParaDecimal(i.entrada),
  saida: i.saida == null ? i.saida : horaParaDecimal(i.saida),
});
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
              { cargo: { contains: busca, mode: 'insensitive' as const } },
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
  async cpfsDaLoja(lojaId) {
    const rs = await prisma.funcionario.findMany({
      where: { lojaId, cpf: { not: null }, ...ativo },
      select: { id: true, cpf: true },
    });
    return rs.map((r) => ({ id: r.id, cpf: r.cpf! }));
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
    return comoFunc(
      await prisma.funcionario.create({ data: limpa(paraBanco(i)) as never, select: funcSel }),
    );
  },
  async atualizarFuncionario(id, i) {
    return comoFunc(
      await prisma.funcionario.update({
        where: { id },
        data: limpa(paraBanco(i)) as never,
        select: funcSel,
      }),
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
