import { prisma } from '../database/prisma.js';

export type EventoAuditoria = {
  acao: string;
  perfil: string;
  alvoTipo: string;
  alvoId?: string;
  detalhe?: Record<string, unknown>;
};

export type Auditor = (evento: EventoAuditoria) => Promise<void>;

export const auditar: Auditor = async (e) => {
  await prisma.auditoria.create({
    data: {
      acao: e.acao,
      perfil: e.perfil,
      alvoTipo: e.alvoTipo,
      alvoId: e.alvoId,
      detalhe: (e.detalhe ?? undefined) as object | undefined,
    },
  });
};
