import { prisma } from '../../shared/database/prisma.js';
import type { Perfil } from '../../shared/middlewares/perfil.js';
import type { GrupoDaSessao, SessaoAtiva } from '../../shared/middlewares/sessao.js';
import { gruposACriar, lojasACriar, montarGrupos, type LojaAproveitavel } from './acesso.js';

const RETENCAO_MS = 7 * 24 * 60 * 60 * 1000;

const comoSessao = (s: {
  id: string;
  radarUsuarioId: string;
  nome: string;
  email: string;
  operador: boolean;
  grupos: unknown;
  expiraEm: Date;
}): SessaoAtiva => ({ ...s, grupos: s.grupos as GrupoDaSessao[] });

export const authRepository = {
  sincronizarAcesso: (lojas: LojaAproveitavel[], perfil: Perfil) =>
    prisma.$transaction(async (tx) => {
      const cnpjs = lojas.map((l) => l.cnpj);
      const conhecidas = await tx.loja.findMany({
        where: { cnpj: { in: cnpjs } },
        select: { cnpj: true },
      });
      const novas = lojasACriar(lojas, new Set(conhecidas.map((l) => l.cnpj!)));

      await tx.grupoEconomico.createMany({ data: gruposACriar(novas), skipDuplicates: true });
      const grupos = await tx.grupoEconomico.findMany({
        where: { identificacao: { in: novas.map((l) => l.grupo.identificacao) }, ativo: true },
        select: { id: true, identificacao: true },
      });
      const geDoNumero = new Map(grupos.map((g) => [g.identificacao, g.id]));
      await tx.loja.createMany({
        data: novas.flatMap((l) => {
          const geId = geDoNumero.get(l.grupo.identificacao);
          return geId ? [{ geId, codigo: l.radarId, nome: l.nome, cnpj: l.cnpj }] : [];
        }),
        skipDuplicates: true,
      });

      const daPessoa = await tx.loja.findMany({
        where: { cnpj: { in: cnpjs }, deletedAt: null, ge: { ativo: true } },
        select: { id: true, geId: true },
      });
      const ativasPorGe = await tx.loja.groupBy({
        by: ['geId'],
        where: { geId: { in: daPessoa.map((l) => l.geId) }, deletedAt: null },
        _count: { _all: true },
      });
      return montarGrupos(
        daPessoa,
        new Map(ativasPorGe.map((g) => [g.geId, g._count._all])),
        perfil,
      );
    }),

  async abrirSessao(dados: Omit<SessaoAtiva, 'id'>) {
    await prisma.sessao.deleteMany({
      where: { expiraEm: { lt: new Date(Date.now() - RETENCAO_MS) } },
    });
    return comoSessao(await prisma.sessao.create({ data: dados }));
  },

  async sessaoValida(id: string) {
    const sessao = await prisma.sessao.findFirst({
      where: { id, encerradaEm: null, expiraEm: { gt: new Date() } },
    });
    return sessao ? comoSessao(sessao) : null;
  },

  encerrarSessao: (id: string) =>
    prisma.sessao.updateMany({
      where: { id, encerradaEm: null },
      data: { encerradaEm: new Date() },
    }),
};
export type AuthRepository = typeof authRepository;
