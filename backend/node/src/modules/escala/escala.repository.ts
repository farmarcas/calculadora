import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../shared/database/prisma.js';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { hojeISO, tabelaVigente, type TabelaParametros } from '../regras/parametros.js';
import type { TurnosLoja } from '../regras/turnos.js';
import { custosEfetivos, tabelaEncargosDeHoje } from '../custos/encargos-loja.js';
import type { CustosGravados } from '../custos/custos.schemas.js';
import { parametrosRepository } from '../parametros/parametros.repository.js';
import { funcaoNoCalculo } from '../cadastros/funcoes.js';
import { normalizarHorarios } from '../cadastros/horarios.js';
import type { CargaMeta, LojaDiag, TurnoDiag } from './diagnostico.js';
import type { VendaLinha } from './vendas.js';

const dia = (s: string) => new Date(`${s}T00:00:00.000Z`);
const ativo = { deletedAt: null } as const;

export type EscalaRepository = ReturnType<typeof escalaRepository>;

// Presa ao GE: lojas, funcionários e cargas de outro GE não aparecem.
export const escalaRepository = (geId: string) => {
  const garantirLoja = async (tx: Prisma.TransactionClient, lojaId: string) => {
    if (!(await tx.loja.count({ where: { id: lojaId, geId, ...ativo } })))
      throw new NotFoundError('Loja não encontrada', 'LOJA_NAO_ENCONTRADA');
  };
  return {
    // Envio ativo de base comercial de cada loja (só a data), para avisar o que uma nova planilha substitui.
    async basesAtivasDasLojas(lojaIds: string[]) {
      return prisma.carga.findMany({
        where: { lojaId: { in: lojaIds }, loja: { geId }, tipo: 'BASE', ativa: true },
        select: { lojaId: true, recebidaEm: true },
      });
    },

    async lojasPorCodigos(codigos: string[]) {
      return prisma.loja.findMany({
        where: { codigo: { in: codigos }, geId, ...ativo },
        select: { id: true, codigo: true, nome: true },
      });
    },

    async substituirBase(
      lojaId: string,
      arquivo: string,
      vendas: VendaLinha[],
      rejeitadas: number,
    ) {
      const datas = vendas.map((v) => v.data).sort();
      return prisma.$transaction(async (tx) => {
        await garantirLoja(tx, lojaId);
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
                // O banco guarda o CMV; o lucro bruto é venda − CMV.
                cmv: v.margem === null ? null : v.venda - v.margem,
                clientes: v.clientes,
                unidades: v.unidades,
              })),
            },
          },
          select: { id: true },
        });
      });
    },

    // Lojas do GE com CNPJ e faturamento, para casar a base por CNPJ em memória (uma ida ao banco só).
    async lojasDoGeComCnpj() {
      return prisma.loja.findMany({
        where: { geId, ...ativo },
        select: { id: true, codigo: true, nome: true, cnpj: true, faturamento: true },
      });
    },

    // Troca a base ativa da loja pela nova, em lote (a base por CNPJ tem ~100 linhas por loja). A anterior fica guardada
    // como inativa: nada é apagado. O período declarado do arquivo vai na carga.
    async substituirBaseEmLote(
      lojaId: string,
      arquivo: string,
      vendas: VendaLinha[],
      rejeitadas: number,
      periodo: { inicio: string; fim: string },
    ) {
      return prisma.$transaction(
        async (tx) => {
          await garantirLoja(tx, lojaId);
          await tx.carga.updateMany({
            where: { lojaId, tipo: 'BASE', ativa: true },
            data: { ativa: false },
          });
          const carga = await tx.carga.create({
            data: {
              lojaId,
              tipo: 'BASE',
              arquivo,
              linhasAceitas: vendas.length,
              linhasRejeitadas: rejeitadas,
              periodoInicio: dia(periodo.inicio),
              periodoFim: dia(periodo.fim),
            },
            select: { id: true },
          });
          await tx.vendaHora.createMany({
            data: vendas.map((v) => ({
              cargaId: carga.id,
              data: dia(v.data),
              hora: v.hora,
              venda: v.venda,
              // O banco guarda o CMV; o lucro bruto é venda − CMV.
              cmv: v.margem === null ? null : v.venda - v.margem,
              clientes: v.clientes,
              unidades: v.unidades,
            })),
          });
          return carga;
        },
        { timeout: 60_000 },
      );
    },

    // Grava o faturamento do Cadastro já mesclado (só o que estava vazio foi preenchido, ver `mesclarCadastro`).
    async gravarFaturamento(lojaId: string, faturamento: Prisma.InputJsonValue) {
      await prisma.loja.updateMany({ where: { id: lojaId, geId, ...ativo }, data: { faturamento } });
    },

    // Parâmetros legais que valem hoje (a versão vigente de cada fase).
    async parametrosVigentes(): Promise<TabelaParametros> {
      return tabelaVigente(await parametrosRepository.listar(), hojeISO());
    },

    async lojaParaDiagnostico(id: string): Promise<LojaDiag | null> {
      const l = await prisma.loja.findFirst({ where: { id, geId, ...ativo } });
      if (!l) return null;
      // O encargo vem do regime tributário da loja (com os ajustes dela), não de um percentual digitado.
      const efetivos = custosEfetivos(
        l.custos as unknown as CustosGravados | null,
        l.regimeTributario,
        await tabelaEncargosDeHoje(),
      );
      return {
        id: l.id,
        codigo: l.codigo,
        nome: l.nome,
        horarios: normalizarHorarios(l.horarios),
        convencao8h24: l.convencao8h24,
        minimos: l.minimos as LojaDiag['minimos'],
        turnos: l.turnos as unknown as TurnosLoja | null,
        custos: efetivos?.custos ?? null,
        encargos: efetivos?.encargos ?? null,
        regimeTributario: l.regimeTributario,
        faturamento: l.faturamento as unknown as LojaDiag['faturamento'],
      };
    },

    // Funcionários ativos da loja que não entraram na escala atual, com o motivo (para o quadro por turno).
    async foraDaEscala(lojaId: string, naEscala: string[]) {
      const fs = await prisma.funcionario.findMany({
        where: { lojaId, loja: { geId }, ...ativo, matricula: { notIn: naEscala } },
        orderBy: { nome: 'asc' },
      });
      return fs.map((f) => ({
        nome: f.nome,
        motivo: !funcaoNoCalculo(f.funcaoEscala)
          ? 'sem função de escala'
          : f.entrada == null || f.saida == null || f.dias.length === 0
            ? 'sem horário de entrada, saída e dias trabalhados'
            : 'horário que vira a noite (não entra na conta)',
      }));
    },

    // Horário atual digitado no cadastro dos funcionários: mesmo turno nos dias trabalhados.
    // Só vale turno no mesmo dia (saída depois da entrada); virada de dia fica só informativa.
    // Matrículas marcadas com horário fixo na loja (não entram na redistribuição).
    async matriculasHorarioFixo(lojaId: string): Promise<Set<string>> {
      const fs = await prisma.funcionario.findMany({
        where: { lojaId, loja: { geId }, ...ativo, horarioFixo: true },
        select: { matricula: true },
      });
      return new Set(fs.map((f) => f.matricula));
    },

    async turnosDoCadastro(lojaId: string): Promise<TurnoDiag[]> {
      const fs = await prisma.funcionario.findMany({
        where: {
          lojaId,
          loja: { geId },
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
          funcao: funcaoNoCalculo(f.funcaoEscala),
          matricula: f.matricula,
          nome: f.nome,
          dias: f.dias,
          entrada: f.entrada!,
          saida: f.saida!,
          iniIntervalo: f.iniIntervalo,
          fimIntervalo: f.fimIntervalo,
          cargaH: f.cargaSemanalH ?? Math.round(f.dias.length * (f.saida! - f.entrada!)),
          status: funcaoNoCalculo(f.funcaoEscala) ? 'ok' : 'fora_calculo',
          motivo: null,
        }));
    },

    async baseAtiva(lojaId: string): Promise<{ meta: CargaMeta; vendas: VendaLinha[] } | null> {
      const c = await prisma.carga.findFirst({
        where: { lojaId, loja: { geId }, tipo: 'BASE', ativa: true },
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
          margem: v.cmv === null ? null : v.venda - v.cmv,
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
        where: { id, geId, ...ativo },
        select: { minimos: true },
      });
      await prisma.loja.update({
        where: { id, geId },
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
        where: { lojaId, loja: { geId } },
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
};
