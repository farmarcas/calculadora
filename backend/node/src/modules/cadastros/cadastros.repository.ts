import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../shared/database/prisma.js';
import { decimalParaHora, horaParaDecimal, mensalDeSemanal } from './carga.js';
import { mesclarFaturamento, type Faturamento } from './faturamento.js';
import { FUNCOES_NO_CALCULO, funcaoNoCalculo } from './funcoes.js';
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
  iniIntervalo: true,
  fimIntervalo: true,
  dias: true,
  regime: true,
  horarioFixo: true,
} as const;

const comoLoja = (
  r: {
    cnpj: string | null;
    cidade: string | null;
    uf: string | null;
    marca: string | null;
    horarios: unknown;
    _count?: { funcionarios: number };
  } & Record<string, unknown>,
) =>
  ({
    ...r,
    // Funcionários ativos da loja (contados no banco, não na página de funcionários que a tela carrega).
    funcionarios: r._count?.funcionarios,
    _count: undefined,
    cnpj: r.cnpj ?? undefined,
    cidade: r.cidade ?? undefined,
    uf: r.uf ?? undefined,
    marca: r.marca ?? undefined,
    horarios: normalizarHorarios(r.horarios) ?? undefined,
    horariosResumo: resumoHorarios(normalizarHorarios(r.horarios)),
  }) as unknown as LojaRegistro;
const comoFunc = (r: Record<string, unknown>) => {
  const base = Object.fromEntries(
    Object.entries(r).map(([k, v]) => [k, v === null && k !== 'funcaoEscala' ? undefined : v]),
  );
  const semanal = r.cargaSemanalH as number | null;
  return {
    ...base,
    // Apoio e Perfumaria (antigos) são lidos como "Outros cargos", fora do cálculo.
    funcaoEscala: funcaoNoCalculo(r.funcaoEscala as string | null),
    // Quem só tem a carga semanal (planilhas antigas) mostra a mensal equivalente.
    cargaMensalH:
      (r.cargaMensalH as number | null) ?? (semanal ? mensalDeSemanal(semanal) : undefined),
    entrada: r.entrada == null ? undefined : decimalParaHora(r.entrada as number),
    saida: r.saida == null ? undefined : decimalParaHora(r.saida as number),
    iniIntervalo: r.iniIntervalo == null ? undefined : decimalParaHora(r.iniIntervalo as number),
    fimIntervalo: r.fimIntervalo == null ? undefined : decimalParaHora(r.fimIntervalo as number),
  } as unknown as FuncionarioRegistro;
};
// API (texto "HH:MM") → banco (horas decimais).
const paraBanco = <
  T extends {
    entrada?: string | null;
    saida?: string | null;
    iniIntervalo?: string | null;
    fimIntervalo?: string | null;
  },
>(
  i: T,
) => ({
  ...i,
  entrada: i.entrada == null ? i.entrada : horaParaDecimal(i.entrada),
  saida: i.saida == null ? i.saida : horaParaDecimal(i.saida),
  iniIntervalo: i.iniIntervalo == null ? i.iniIntervalo : horaParaDecimal(i.iniIntervalo),
  fimIntervalo: i.fimIntervalo == null ? i.fimIntervalo : horaParaDecimal(i.fimIntervalo),
});
const limpa = <T extends object>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;

// Todas as consultas ficam presas ao GE: registro de outro GE é como se não existisse.
export const cadastrosRepository = (geId: string): CadastrosRepository => ({
  async listarLojas({ page, pageSize, busca }) {
    const where = {
      ...ativo,
      geId,
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
        select: { ...lojaSel, _count: { select: { funcionarios: { where: ativo } } } },
        orderBy: { codigo: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.loja.count({ where }),
    ]);
    return { data: rows.map(comoLoja), total };
  },
  async lojasComEquipe() {
    const [rows, porFuncao] = await Promise.all([
      prisma.loja.findMany({
        where: { ...ativo, geId },
        select: {
          ...lojaSel,
          custos: true,
          _count: { select: { funcionarios: { where: ativo } } },
        },
        orderBy: { codigo: 'asc' },
      }),
      prisma.funcionario.groupBy({
        by: ['lojaId', 'funcaoEscala'],
        where: { ...ativo, funcaoEscala: { in: [...FUNCOES_NO_CALCULO] }, loja: { geId } },
        _count: { _all: true },
      }),
    ]);
    const farmaceuticos = new Map<string, number>();
    const funcoes = new Map<string, string[]>();
    for (const g of porFuncao) {
      if (g.funcaoEscala === 'Farmacêutico') farmaceuticos.set(g.lojaId, g._count._all);
      funcoes.set(g.lojaId, [...(funcoes.get(g.lojaId) ?? []), g.funcaoEscala!]);
    }
    return rows.map(({ custos, ...resto }) => {
      const salarios =
        (custos as { salarioMedio?: Record<string, number> } | null)?.salarioMedio ?? {};
      return {
        // Os salários não saem daqui (só o dono os vê): a lista leva só quais funções têm salário informado.
        loja: comoLoja(resto),
        farmaceuticos: farmaceuticos.get(resto.id) ?? 0,
        cadastro: {
          funcoesNaEquipe: funcoes.get(resto.id) ?? [],
          salariosInformados: Object.entries(salarios)
            .filter(([, v]) => Number(v) > 0)
            .map(([f]) => f),
        },
      };
    });
  },
  async buscarLoja(id) {
    const r = await prisma.loja.findFirst({ where: { id, geId, ...ativo }, select: lojaSel });
    return r ? comoLoja(r) : null;
  },
  async buscarLojaPorCodigo(codigo) {
    const r = await prisma.loja.findFirst({ where: { codigo, geId, ...ativo }, select: lojaSel });
    return r ? comoLoja(r) : null;
  },
  async buscarLojaPorCnpj(cnpj) {
    const r = await prisma.loja.findFirst({ where: { cnpj, geId, ...ativo }, select: lojaSel });
    return r ? comoLoja(r) : null;
  },
  async cnpjEmUso(cnpj, exceto) {
    // De propósito sem filtrar por GE: o CNPJ é único no sistema todo.
    return (
      (await prisma.loja.count({
        where: { cnpj, ...ativo, ...(exceto ? { id: { not: exceto } } : {}) },
      })) > 0
    );
  },
  async criarLoja(i) {
    const dados = limpa(i) as Record<string, unknown>;
    // Loja nova nasce sem CMV médio; ele só existe quando o dono (ou a planilha) o informa.
    if (dados.faturamento)
      dados.faturamento = mesclarFaturamento(dados.faturamento as Faturamento, null);
    return comoLoja(
      await prisma.loja.create({
        data: { ...dados, geId } as never,
        select: lojaSel,
      }),
    );
  },
  async atualizarLoja(id, i) {
    const dados = limpa(i) as Record<string, unknown>;
    // O CMV médio já guardado fica quando o pedido não fala dele.
    if (dados.faturamento !== undefined) {
      const atual = await prisma.loja.findFirst({
        where: { id, geId },
        select: { faturamento: true },
      });
      const fat = mesclarFaturamento(dados.faturamento as Faturamento | null, atual?.faturamento);
      dados.faturamento = fat === null ? Prisma.JsonNull : fat;
    }
    return comoLoja(
      await prisma.loja.update({
        where: { id, geId },
        data: dados as never,
        select: lojaSel,
      }),
    );
  },
  // Configuração e custos atuais da loja, para a importação mesclar só o que veio preenchido.
  async configuracaoDaLoja(id) {
    const l = await prisma.loja.findFirst({
      where: { id, geId, ...ativo },
      select: { convencao8h24: true, minimos: true, custos: true },
    });
    return {
      convencao8h24: l?.convencao8h24 ?? true,
      minimos: (l?.minimos as Record<string, number> | null) ?? {},
      custos:
        (l?.custos as { salarioMedio: Record<string, number>; encargos?: object } | null) ?? null,
    };
  },
  async gravarConfiguracao(id, c) {
    await prisma.loja.update({
      where: { id, geId },
      data: limpa({
        convencao8h24: c.convencao8h24,
        minimos: c.minimos as never,
        custos: c.custos as never,
      }),
    });
  },
  async removerLoja(id) {
    await prisma.loja.update({ where: { id, geId }, data: { deletedAt: new Date() } });
  },
  contarFuncionariosDaLoja: (lojaId) =>
    prisma.funcionario.count({ where: { lojaId, loja: { geId }, ...ativo } }),

  async listarFuncionarios({ page, pageSize, busca, lojaId, lojaIds }) {
    const where = {
      ...ativo,
      loja: { geId },
      ...(lojaIds ? { lojaId: { in: lojaIds } } : {}),
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
      where: { lojaId, loja: { geId }, cpf: { not: null }, ...ativo },
      select: { id: true, cpf: true },
    });
    return rs.map((r) => ({ id: r.id, cpf: r.cpf! }));
  },
  async buscarFuncionario(id) {
    const r = await prisma.funcionario.findFirst({
      where: { id, loja: { geId }, ...ativo },
      select: funcSel,
    });
    return r ? comoFunc(r) : null;
  },
  async buscarFuncionarioPorMatricula(matricula) {
    const r = await prisma.funcionario.findFirst({
      where: { matricula, loja: { geId }, ...ativo },
      select: funcSel,
    });
    return r ? comoFunc(r) : null;
  },
  async criarFuncionario(i) {
    return comoFunc(
      await prisma.funcionario.create({
        data: { ...limpa(paraBanco(i)), geId } as never,
        select: funcSel,
      }),
    );
  },
  async atualizarFuncionario(id, i) {
    return comoFunc(
      await prisma.funcionario.update({
        where: { id, loja: { geId } },
        data: limpa(paraBanco(i)) as never,
        select: funcSel,
      }),
    );
  },
  async removerFuncionario(id) {
    await prisma.funcionario.update({
      where: { id, loja: { geId } },
      data: { deletedAt: new Date() },
    });
  },

  async criarImportacao(arquivo, abas) {
    const r = await prisma.importacaoCadastro.create({
      data: { arquivo, geId, abas: abas as never },
    });
    return { id: r.id, arquivo: r.arquivo, status: r.status, abas };
  },
  async buscarImportacao(id) {
    const r = await prisma.importacaoCadastro.findUnique({ where: { id } });
    if (!r || r.geId !== geId) return null;
    return {
      id: r.id,
      arquivo: r.arquivo,
      status: r.status === 'CONFIRMADA' ? 'confirmada' : 'aguardando',
      abas: r.abas as unknown as Aba[],
    };
  },
  async fecharImportacao(id, mapeamento, resumo) {
    await prisma.importacaoCadastro.update({
      where: { id, geId },
      data: {
        status: 'CONFIRMADA',
        mapeamento: mapeamento as never,
        resumo: resumo as never,
        confirmadoEm: new Date(),
      },
    });
  },
});
