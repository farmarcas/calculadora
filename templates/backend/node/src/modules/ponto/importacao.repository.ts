import { createHash } from 'node:crypto';
import { prisma } from '../../shared/database/prisma.js';
import { soDigitos } from './util.js';

export type NovaBatida = {
  cpf: string;
  data: string;
  minuto: number;
  nsr: number;
  situacao: 'OK' | 'PENDENTE';
  motivoPendencia: string | null;
  matricula: string | null;
};

export type DadosImportacao = {
  lojaId: string;
  arquivo: string;
  hash: string;
  cnpj: string | null;
  periodoInicio: string | null;
  periodoFim: string | null;
  autor: string;
  status: 'PROCESSADO' | 'COM_PENDENCIAS' | 'REJEITADO';
  motivoRejeicao: string | null;
  aceitas: number;
  repetidas: number;
  pendentes: number;
};

const dia = (s: string) => new Date(`${s}T00:00:00.000Z`);
export const hashArquivo = (b: Buffer) => createHash('sha256').update(b).digest('hex');

export type ImportacaoRepository = typeof importacaoRepository;

export const importacaoRepository = {
  async loja(id: string) {
    return prisma.loja.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, codigo: true, nome: true, cnpj: true },
    });
  },

  // Loja do grupo dona de um CNPJ (comparando só os dígitos, porque o cadastro pode ter pontuação).
  async lojaDoCnpj(digitos: string) {
    const todas = await prisma.loja.findMany({
      where: { deletedAt: null, cnpj: { not: null } },
      select: { id: true, codigo: true, nome: true, cnpj: true },
    });
    return todas.find((l) => soDigitos(l.cnpj ?? '') === digitos) ?? null;
  },

  // CPF (só dígitos) → pessoa do cadastro e loja de lotação.
  async pessoasPorCpf() {
    const rows = await prisma.funcionario.findMany({
      where: { deletedAt: null, cpf: { not: null } },
      select: { matricula: true, nome: true, lojaId: true, cpf: true },
    });
    return new Map(
      rows.map((r) => [
        soDigitos(r.cpf ?? ''),
        { matricula: r.matricula, nome: r.nome, lojaId: r.lojaId },
      ]),
    );
  },

  async chavesExistentes(lojaId: string, de: string, ate: string) {
    const rows = await prisma.batida.findMany({
      where: { lojaId, data: { gte: dia(de), lte: dia(ate) } },
      select: { cpf: true, data: true, minuto: true },
    });
    return new Set(rows.map((r) => `${r.cpf}|${r.data.toISOString().slice(0, 10)}|${r.minuto}`));
  },

  async hashJaImportado(lojaId: string, hash: string) {
    return (
      (await prisma.importacaoPonto.count({
        where: { lojaId, hash, status: { not: 'REJEITADO' } },
      })) > 0
    );
  },

  // Grava o registro da importação e as batidas novas numa transação só.
  async gravar(d: DadosImportacao, batidas: NovaBatida[]) {
    return prisma.$transaction(async (tx) => {
      const imp = await tx.importacaoPonto.create({
        data: {
          lojaId: d.lojaId,
          arquivo: d.arquivo,
          hash: d.hash,
          cnpj: d.cnpj,
          periodoInicio: d.periodoInicio ? dia(d.periodoInicio) : null,
          periodoFim: d.periodoFim ? dia(d.periodoFim) : null,
          autor: d.autor,
          status: d.status,
          motivoRejeicao: d.motivoRejeicao,
          batidasAceitas: d.aceitas,
          batidasRepetidas: d.repetidas,
          batidasPendentes: d.pendentes,
        },
        select: { id: true },
      });
      if (batidas.length)
        await tx.batida.createMany({
          data: batidas.map((b) => ({
            lojaId: d.lojaId,
            importacaoId: imp.id,
            cpf: b.cpf,
            data: dia(b.data),
            minuto: b.minuto,
            nsr: b.nsr,
            situacao: b.situacao,
            motivoPendencia: b.motivoPendencia,
            matricula: b.matricula,
          })),
          skipDuplicates: true,
        });
      return imp.id;
    });
  },

  async listar(lojaId: string, pagina: number, tamanho: number) {
    const [data, total] = await prisma.$transaction([
      prisma.importacaoPonto.findMany({
        where: { lojaId },
        orderBy: { criadoEm: 'desc' },
        skip: (pagina - 1) * tamanho,
        take: tamanho,
      }),
      prisma.importacaoPonto.count({ where: { lojaId } }),
    ]);
    return { data, total };
  },
};
