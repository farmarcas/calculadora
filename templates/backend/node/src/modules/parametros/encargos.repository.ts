import { prisma } from '../../shared/database/prisma.js';
import type { ParametroEncargos, RegimeId } from '../regras/encargos.js';

export type VersaoEncargos = ParametroEncargos & { id: string; criadoPor: string; criadoEm: Date };

const iso = (d: Date) => d.toISOString().slice(0, 10);

const comoVersao = (r: {
  id: string;
  regime: string;
  inssPatronalPct: number;
  ratPct: number;
  fap: number;
  terceirosPct: number;
  fgtsPct: number;
  decimoTerceiroPct: number;
  feriasPct: number;
  rescisaoPct: number;
  vigenciaInicio: Date;
  criadoPor: string;
  createdAt: Date;
}): VersaoEncargos => ({
  id: r.id,
  regime: r.regime as RegimeId,
  inssPatronalPct: r.inssPatronalPct,
  ratPct: r.ratPct,
  fap: r.fap,
  terceirosPct: r.terceirosPct,
  fgtsPct: r.fgtsPct,
  decimoTerceiroPct: r.decimoTerceiroPct,
  feriasPct: r.feriasPct,
  rescisaoPct: r.rescisaoPct,
  vigenciaInicio: iso(r.vigenciaInicio),
  criadoPor: r.criadoPor,
  criadoEm: r.createdAt,
});

export const encargosRepository = {
  async listar(): Promise<VersaoEncargos[]> {
    const rs = await prisma.parametroEncargo.findMany({
      orderBy: [{ regime: 'asc' }, { vigenciaInicio: 'asc' }, { createdAt: 'asc' }],
    });
    return rs.map(comoVersao);
  },
  // Nunca edita nem apaga: uma alteração é sempre uma versão nova.
  async criar(p: ParametroEncargos, perfil: string): Promise<VersaoEncargos> {
    const r = await prisma.parametroEncargo.create({
      data: {
        regime: p.regime,
        inssPatronalPct: p.inssPatronalPct,
        ratPct: p.ratPct,
        fap: p.fap,
        terceirosPct: p.terceirosPct,
        fgtsPct: p.fgtsPct,
        decimoTerceiroPct: p.decimoTerceiroPct,
        feriasPct: p.feriasPct,
        rescisaoPct: p.rescisaoPct,
        vigenciaInicio: new Date(`${p.vigenciaInicio}T00:00:00.000Z`),
        criadoPor: perfil,
      },
    });
    return comoVersao(r);
  },
};
export type EncargosRepository = typeof encargosRepository;
