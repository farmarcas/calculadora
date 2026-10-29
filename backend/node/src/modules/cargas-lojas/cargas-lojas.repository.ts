import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../shared/database/prisma.js';
import {
  aplicarEscolha,
  CAMPOS,
  type Estado,
  type LojaExistente,
  type Plano,
  type Retrato,
  type Substituir,
} from './comparar.js';
import type { Leitura } from './relatorio.js';

const ativo = { deletedAt: null } as const;
const json = (v: unknown) => v as Prisma.InputJsonValue;
const em = <T>(xs: T[], n: number) =>
  Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, (i + 1) * n));

export type ResultadoCarga = {
  gesCriados: number;
  lojasCriadas: number;
  lojasAtualizadas: number;
  conflitosSubstituidos: number;
  conflitosMantidos: number;
};

export const cargasLojasRepository = {
  // O que já existe no sistema: todos os GEs (para dizer de quem é um CNPJ repetido) e as lojas dos GEs do arquivo
  // e dos CNPJs do arquivo (uma só consulta, mesmo com milhares de linhas).
  async estado(identificacoes: string[], cnpjs: string[]): Promise<Estado> {
    const ges = await prisma.grupoEconomico.findMany({
      select: { id: true, identificacao: true, nome: true, ativo: true },
    });
    const idsDoArquivo = ges
      .filter((g) => identificacoes.includes(g.identificacao))
      .map((g) => g.id);
    const lojas = await prisma.loja.findMany({
      where: { ...ativo, OR: [{ cnpj: { in: cnpjs } }, { geId: { in: idsDoArquivo } }] },
      select: {
        id: true,
        geId: true,
        codigo: true,
        cnpj: true,
        nome: true,
        cidade: true,
        uf: true,
        marca: true,
        regimeTributario: true,
        horarios: true,
        ultimaCarga: true,
      },
    });
    const existentes: LojaExistente[] = lojas.map((l) => ({
      ...l,
      ultimaCarga: (l.ultimaCarga as Retrato | null) ?? null,
    }));
    const estado: Estado = {
      ges: new Map(ges.map((g) => [g.identificacao, g])),
      lojasPorCnpj: new Map(),
      lojasDoGe: new Map(),
    };
    for (const l of existentes) {
      if (l.cnpj) estado.lojasPorCnpj.set(l.cnpj, l);
      estado.lojasDoGe.set(l.geId, [...(estado.lojasDoGe.get(l.geId) ?? []), l]);
    }
    return estado;
  },

  async criarImportacao(arquivo: string, leitura: Leitura) {
    const r = await prisma.importacaoCadastro.create({
      data: { arquivo, tipo: 'carga_lojas', abas: json(leitura) },
      select: { id: true },
    });
    return r.id;
  },
  async buscarImportacao(id: string) {
    const r = await prisma.importacaoCadastro.findFirst({ where: { id, tipo: 'carga_lojas' } });
    return r
      ? {
          id: r.id,
          arquivo: r.arquivo,
          confirmada: r.status === 'CONFIRMADA',
          leitura: r.abas as unknown as Leitura,
        }
      : null;
  },

  // Grava tudo numa transação: ou entra a carga inteira, ou nada.
  async aplicar(
    importacaoId: string,
    plano: Plano,
    substituir: Substituir,
    resumoDoPlano: unknown,
  ): Promise<ResultadoCarga> {
    return prisma.$transaction(
      async (tx) => {
        const r: ResultadoCarga = {
          gesCriados: 0,
          lojasCriadas: 0,
          lojasAtualizadas: 0,
          conflitosSubstituidos: 0,
          conflitosMantidos: 0,
        };
        const novos = plano.porGe.filter((g) => g.novo);
        const criados = novos.length
          ? await tx.grupoEconomico.createManyAndReturn({
              data: novos.map((g) => ({
                identificacao: g.identificacao,
                nome: g.nome,
                responsavel: g.responsavel,
              })),
              select: { id: true, identificacao: true },
            })
          : [];
        r.gesCriados = criados.length;
        const idDoNovo = new Map(criados.map((g) => [g.identificacao, g.id]));

        const lojas = plano.porGe.flatMap((g) =>
          g.criar.map((l) => ({
            geId: (g.geId ?? idDoNovo.get(g.identificacao))!,
            codigo: l.codigo,
            cnpj: l.cnpj,
            nome: l.dados.nome,
            cidade: l.dados.cidade,
            uf: l.dados.uf,
            marca: l.dados.marca,
            regimeTributario: l.dados.regimeTributario,
            horarios: l.dados.horarios ? json(l.dados.horarios) : undefined,
            ultimaCarga: json(
              Object.fromEntries(
                CAMPOS.filter((c) => l.dados[c] !== undefined).map((c) => [c, l.dados[c]]),
              ),
            ),
          })),
        );
        for (const lote of em(lojas, 500)) await tx.loja.createMany({ data: lote });
        r.lojasCriadas = lojas.length;

        for (const g of plano.porGe) {
          for (const a of g.atualizar) {
            const campos = aplicarEscolha(a, substituir);
            const trocados = a.conflitos.filter((c) => c.campo in campos).length;
            r.conflitosSubstituidos += trocados;
            r.conflitosMantidos += a.conflitos.length - trocados;
            const dados: Record<string, unknown> = { ultimaCarga: json(a.retrato) };
            if (a.codigo) dados['codigo'] = a.codigo;
            for (const [campo, valor] of Object.entries(campos))
              dados[campo] = campo === 'horarios' ? json(valor) : valor;
            await tx.loja.update({ where: { id: a.lojaId }, data: dados as never });
            r.lojasAtualizadas++;
          }
        }
        await tx.importacaoCadastro.update({
          where: { id: importacaoId },
          data: {
            status: 'CONFIRMADA',
            confirmadoEm: new Date(),
            resumo: json({ ...r, plano: resumoDoPlano }),
          },
        });
        return r;
      },
      { timeout: 180_000, maxWait: 10_000 },
    );
  },
};
export type CargasLojasRepository = typeof cargasLojasRepository;
