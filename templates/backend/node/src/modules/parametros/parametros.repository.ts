import { prisma } from '../../shared/database/prisma.js';
import type { FaseId, ParametroFase } from '../regras/parametros.js';

export type VersaoParametro = ParametroFase & { id: string; criadoPor: string; criadoEm: Date };

const iso = (d: Date) => d.toISOString().slice(0, 10);

const comoVersao = (r: {
  id: string;
  fase: string;
  jornadaSemanalH: number;
  horasDiaMax: number;
  horasDiaMaxConvencao: number | null;
  diasTrabalho: number;
  divisor: number;
  vigenciaInicio: Date;
  criadoPor: string;
  createdAt: Date;
}): VersaoParametro => ({
  id: r.id,
  fase: r.fase as FaseId,
  jornadaSemanalH: r.jornadaSemanalH,
  horasDiaMax: r.horasDiaMax,
  horasDiaMaxConvencao: r.horasDiaMaxConvencao,
  diasTrabalho: r.diasTrabalho,
  divisor: r.divisor,
  vigenciaInicio: iso(r.vigenciaInicio),
  criadoPor: r.criadoPor,
  criadoEm: r.createdAt,
});

export const parametrosRepository = {
  async listar(): Promise<VersaoParametro[]> {
    const rs = await prisma.parametroLegal.findMany({
      orderBy: [{ fase: 'asc' }, { vigenciaInicio: 'asc' }, { createdAt: 'asc' }],
    });
    return rs.map(comoVersao);
  },
  // Nunca edita nem apaga: uma alteração é sempre uma versão nova.
  async criar(p: ParametroFase, perfil: string): Promise<VersaoParametro> {
    const r = await prisma.parametroLegal.create({
      data: {
        fase: p.fase,
        jornadaSemanalH: p.jornadaSemanalH,
        horasDiaMax: p.horasDiaMax,
        horasDiaMaxConvencao: p.horasDiaMaxConvencao,
        diasTrabalho: p.diasTrabalho,
        divisor: p.divisor,
        vigenciaInicio: new Date(`${p.vigenciaInicio}T00:00:00.000Z`),
        criadoPor: perfil,
      },
    });
    return comoVersao(r);
  },
};
export type ParametrosRepository = typeof parametrosRepository;
