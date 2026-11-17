import { AsyncLocalStorage } from 'node:async_hooks';
import { prisma } from '../database/prisma.js';

export type EventoAuditoria = {
  acao: string;
  perfil: string;
  alvoTipo: string;
  alvoId?: string;
  geId?: string;
  detalhe?: Record<string, unknown>;
};

export type Auditor = (evento: EventoAuditoria) => Promise<void>;

type Autor = { id: string; nome: string };

const autorDoPedido = new AsyncLocalStorage<Autor>();

export const comAutor = (autor: Autor, seguir: () => void) => autorDoPedido.run(autor, seguir);

export const auditar: Auditor = async (e) => {
  const autor = autorDoPedido.getStore();
  await prisma.auditoria.create({
    data: {
      acao: e.acao,
      perfil: e.perfil,
      alvoTipo: e.alvoTipo,
      alvoId: e.alvoId,
      geId: e.geId,
      detalhe: (e.detalhe ?? undefined) as object | undefined,
      usuarioId: autor?.id,
      usuarioNome: autor?.nome,
    },
  });
};

// Auditor que carimba o GE da chamada em cada evento.
export const auditorDoGe =
  (geId: string): Auditor =>
  (e) =>
    auditar({ ...e, geId });
