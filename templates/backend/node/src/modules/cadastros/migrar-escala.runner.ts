import type { PrismaClient } from '../../generated/prisma/client.js';
import { planejarMigracao, type RelatorioLoja } from './migrar-escala.js';

export type LinhaDoRelatorio = RelatorioLoja & {
  loja: string;
  nomeLoja: string;
  geId: string;
  criados: number;
};
export type ResultadoMigracao = {
  aplicado: boolean;
  lojas: LinhaDoRelatorio[];
  totais: {
    lojas: number;
    preenchidos: number;
    jaTinhamDados: number;
    semCorrespondente: number;
    criados: number;
  };
};

// Lê as escalas importadas ativas, monta o plano por loja e, só com `aplicar`, grava (uma transação por loja). Sem `aplicar`
// é um ensaio: nada é alterado.
export const executarMigracao = async (
  prisma: PrismaClient,
  { aplicar, criarAusentes = false }: { aplicar: boolean; criarAusentes?: boolean },
): Promise<ResultadoMigracao> => {
  const cargas = await prisma.carga.findMany({
    where: { tipo: 'ESCALA', ativa: true },
    include: { turnos: true, loja: { select: { id: true, codigo: true, nome: true, geId: true } } },
    orderBy: { loja: { codigo: 'asc' } },
  });
  const lojas: LinhaDoRelatorio[] = [];
  for (const c of cargas) {
    const funcionarios = await prisma.funcionario.findMany({
      where: { lojaId: c.lojaId, deletedAt: null },
      select: {
        id: true,
        matricula: true,
        nome: true,
        funcaoEscala: true,
        cargaSemanalH: true,
        entrada: true,
        saida: true,
        iniIntervalo: true,
        fimIntervalo: true,
        dias: true,
      },
    });
    const { preenchimentos, criacoes, relatorio } = planejarMigracao(
      c.turnos.map((t) => ({
        matricula: t.matricula,
        nome: t.nome,
        funcao: t.funcao,
        dias: t.dias,
        entrada: t.entrada,
        saida: t.saida,
        iniIntervalo: t.iniIntervalo,
        fimIntervalo: t.fimIntervalo,
        cargaH: t.cargaH,
      })),
      funcionarios,
    );
    if (aplicar && preenchimentos.length > 0)
      await prisma.$transaction(
        preenchimentos.map((p) =>
          prisma.funcionario.update({ where: { id: p.funcionarioId }, data: p.dados }),
        ),
      );
    // Opt-in (`--criar-ausentes`): cria no Cadastro quem está na escala e não tem funcionário. Por padrão ninguém é criado.
    if (aplicar && criarAusentes && criacoes.length > 0)
      await prisma.$transaction(
        criacoes.map((n) =>
          prisma.funcionario.create({ data: { ...n, geId: c.loja.geId, lojaId: c.lojaId } }),
        ),
      );
    lojas.push({
      ...relatorio,
      criados: criarAusentes ? criacoes.length : 0,
      loja: c.loja.codigo,
      nomeLoja: c.loja.nome,
      geId: c.loja.geId,
    });
  }
  return {
    aplicado: aplicar,
    lojas,
    totais: {
      lojas: lojas.length,
      preenchidos: lojas.reduce((s, l) => s + l.preenchidos, 0),
      jaTinhamDados: lojas.reduce((s, l) => s + l.jaTinhamDados, 0),
      semCorrespondente: lojas.reduce((s, l) => s + l.semCorrespondente.length, 0),
      criados: lojas.reduce((s, l) => s + l.criados, 0),
    },
  };
};
