import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../shared/database/prisma.js';
import { hojeISO, tabelaVigente, type TabelaParametros } from '../regras/parametros.js';
import type { TurnosLoja } from '../regras/turnos.js';
import { parametrosRepository } from '../parametros/parametros.repository.js';
import { normalizarHorarios } from '../cadastros/horarios.js';
import type { CargaMeta, LojaDiag, TurnoDiag } from './diagnostico.js';
import type { CadastroPessoa, TurnoLinha } from './interpretar.js';
import type { VendaLinha } from './vendas.js';

const dia = (s: string) => new Date(`${s}T00:00:00.000Z`);
const ativo = { deletedAt: null } as const;

export type EscalaRepository = typeof escalaRepository;

export const escalaRepository = {
  async lojasPorCodigos(codigos: string[]) {
    return prisma.loja.findMany({
      where: { codigo: { in: codigos }, ...ativo },
      select: { id: true, codigo: true, nome: true },
    });
  },

  async cadastroPorMatriculas(matriculas: string[]): Promise<Map<string, CadastroPessoa>> {
    const rows = await prisma.funcionario.findMany({
      where: { matricula: { in: matriculas }, ...ativo },
      select: { matricula: true, nome: true, funcaoEscala: true, cargaSemanalH: true },
    });
    return new Map(
      rows.map((r) => [
        r.matricula,
        { nome: r.nome, funcaoEscala: r.funcaoEscala, cargaSemanalH: r.cargaSemanalH },
      ]),
    );
  },

  async matriculasCadastradas(matriculas: string[]) {
    const rows = await prisma.funcionario.findMany({
      where: { matricula: { in: matriculas }, ...ativo },
      select: { matricula: true },
    });
    return new Set(rows.map((r) => r.matricula));
  },

  // A carga nova vira a ativa; a anterior fica no histórico.
  async substituirEscala(
    lojaId: string,
    arquivo: string,
    turnos: TurnoLinha[],
    rejeitadas: number,
    cadastradas: Set<string>,
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.carga.updateMany({
        where: { lojaId, tipo: 'ESCALA', ativa: true },
        data: { ativa: false },
      });
      return tx.carga.create({
        data: {
          lojaId,
          tipo: 'ESCALA',
          arquivo,
          linhasAceitas: turnos.length,
          linhasRejeitadas: rejeitadas,
          turnos: {
            create: turnos.map((t) => ({
              matricula: t.matricula,
              nome: t.nome,
              funcao: t.funcao,
              tipoEscala: t.tipoEscala,
              dias: t.dias,
              entrada: t.entrada,
              iniIntervalo: t.iniIntervalo,
              fimIntervalo: t.fimIntervalo,
              saida: t.saida,
              cargaH: t.cargaH,
              status: t.status,
              motivo: t.motivo,
              cadastrado: cadastradas.has(t.matricula),
            })),
          },
        },
        select: { id: true },
      });
    });
  },

  async substituirBase(lojaId: string, arquivo: string, vendas: VendaLinha[], rejeitadas: number) {
    const datas = vendas.map((v) => v.data).sort();
    return prisma.$transaction(async (tx) => {
      await tx.carga.updateMany({
        where: { lojaId, tipo: 'BASE', ativa: true },
        data: { ativa: false },
      });
      return tx.carga.create({
        data: {
          lojaId,
          tipo: 'BASE',
          arquivo,
          linhasAceitas: vendas.length,
          linhasRejeitadas: rejeitadas,
          periodoInicio: datas[0] ? dia(datas[0]) : null,
          periodoFim: datas.length ? dia(datas[datas.length - 1]!) : null,
          vendas: {
            create: vendas.map((v) => ({
              data: dia(v.data),
              hora: v.hora,
              venda: v.venda,
              margem: v.margem,
              clientes: v.clientes,
              unidades: v.unidades,
            })),
          },
        },
        select: { id: true },
      });
    });
  },

  // Parâmetros legais que valem hoje (a versão vigente de cada fase).
  async parametrosVigentes(): Promise<TabelaParametros> {
    return tabelaVigente(await parametrosRepository.listar(), hojeISO());
  },

  async lojaParaDiagnostico(id: string): Promise<LojaDiag | null> {
    const l = await prisma.loja.findFirst({ where: { id, ...ativo } });
    if (!l) return null;
    return {
      id: l.id,
      codigo: l.codigo,
      nome: l.nome,
      horarios: normalizarHorarios(l.horarios),
      convencao8h24: l.convencao8h24,
      minimos: l.minimos as LojaDiag['minimos'],
      turnos: l.turnos as unknown as TurnosLoja | null,
      custos: l.custos as unknown as LojaDiag['custos'],
      faturamento: l.faturamento as unknown as LojaDiag['faturamento'],
    };
  },

  async escalaAtiva(lojaId: string): Promise<{ meta: CargaMeta; turnos: TurnoDiag[] } | null> {
    const c = await prisma.carga.findFirst({
      where: { lojaId, tipo: 'ESCALA', ativa: true },
      include: { turnos: { orderBy: { nome: 'asc' } } },
    });
    if (!c) return null;
    return {
      meta: {
        arquivo: c.arquivo,
        recebidaEm: c.recebidaEm,
        linhasAceitas: c.linhasAceitas,
        linhasRejeitadas: c.linhasRejeitadas,
      },
      turnos: c.turnos.map((t) => ({
        funcao: t.funcao,
        matricula: t.matricula,
        nome: t.nome,
        dias: t.dias,
        entrada: t.entrada,
        saida: t.saida,
        iniIntervalo: t.iniIntervalo,
        fimIntervalo: t.fimIntervalo,
        cargaH: t.cargaH,
        status: t.status,
        motivo: t.motivo,
      })),
    };
  },

  // Funcionários ativos da loja que não entraram na escala atual, com o motivo (para o quadro por turno).
  async foraDaEscala(lojaId: string, naEscala: string[]) {
    const fs = await prisma.funcionario.findMany({
      where: { lojaId, ...ativo, matricula: { notIn: naEscala } },
      orderBy: { nome: 'asc' },
    });
    return fs.map((f) => ({
      nome: f.nome,
      motivo: !f.funcaoEscala
        ? 'sem função de escala'
        : f.entrada == null || f.saida == null || f.dias.length === 0
          ? 'sem horário de entrada, saída e dias trabalhados'
          : 'horário que vira a noite (não entra na conta)',
    }));
  },

  // Horário atual digitado no cadastro dos funcionários: mesmo turno nos dias trabalhados.
  // Só vale turno no mesmo dia (saída depois da entrada); virada de dia fica só informativa.
  async turnosDoCadastro(lojaId: string): Promise<TurnoDiag[]> {
    const fs = await prisma.funcionario.findMany({
      where: {
        lojaId,
        ...ativo,
        entrada: { not: null },
        saida: { not: null },
        NOT: { dias: { isEmpty: true } },
      },
      orderBy: { nome: 'asc' },
    });
    return fs
      .filter((f) => f.saida! > f.entrada!)
      .map((f) => ({
        funcao: f.funcaoEscala,
        matricula: f.matricula,
        nome: f.nome,
        dias: f.dias,
        entrada: f.entrada!,
        saida: f.saida!,
        iniIntervalo: null,
        fimIntervalo: null,
        cargaH: f.cargaSemanalH ?? Math.round(f.dias.length * (f.saida! - f.entrada!)),
        status: f.funcaoEscala ? 'ok' : 'fora_calculo',
        motivo: null,
      }));
  },

  async baseAtiva(lojaId: string): Promise<{ meta: CargaMeta; vendas: VendaLinha[] } | null> {
    const c = await prisma.carga.findFirst({
      where: { lojaId, tipo: 'BASE', ativa: true },
      include: { vendas: true },
    });
    if (!c) return null;
    return {
      meta: {
        arquivo: c.arquivo,
        recebidaEm: c.recebidaEm,
        linhasAceitas: c.linhasAceitas,
        linhasRejeitadas: c.linhasRejeitadas,
      },
      vendas: c.vendas.map((v) => ({
        data: v.data.toISOString().slice(0, 10),
        hora: v.hora,
        venda: v.venda,
        margem: v.margem,
        clientes: v.clientes,
        unidades: v.unidades,
      })),
    };
  },

  async atualizarConfiguracao(
    id: string,
    c: {
      convencao8h24?: boolean;
      minimos?: Record<string, number>;
      turnos?: TurnosLoja | null;
    },
  ) {
    const atual = await prisma.loja.findFirst({
      where: { id, ...ativo },
      select: { minimos: true },
    });
    await prisma.loja.update({
      where: { id },
      data: {
        ...(c.convencao8h24 !== undefined ? { convencao8h24: c.convencao8h24 } : {}),
        ...(c.minimos
          ? { minimos: { ...((atual?.minimos as object | null) ?? {}), ...c.minimos } }
          : {}),
        ...(c.turnos !== undefined
          ? { turnos: c.turnos === null ? Prisma.JsonNull : (c.turnos as unknown as object) }
          : {}),
      },
    });
  },

  async historico(lojaId: string) {
    return prisma.carga.findMany({
      where: { lojaId },
      orderBy: { recebidaEm: 'desc' },
      take: 50,
      select: {
        id: true,
        tipo: true,
        arquivo: true,
        recebidaEm: true,
        linhasAceitas: true,
        linhasRejeitadas: true,
        ativa: true,
      },
    });
  },
};
