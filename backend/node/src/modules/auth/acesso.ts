import type { Perfil } from '../../shared/middlewares/perfil.js';
import type { GrupoDaSessao } from '../../shared/middlewares/sessao.js';
import { normalizarCnpj, validarCnpj } from '../ge/cnpj.js';
import type { LojaDoRadar } from './radar.client.js';

const LOJA_ATIVA = 2;

export type LojaAproveitavel = {
  radarId: string;
  nome: string;
  cnpj: string;
  grupo: { identificacao: string; nome: string };
};

export const separarLojas = (lojas: LojaDoRadar[]) => {
  const aproveitaveis = new Map<string, LojaAproveitavel>();
  const ignoradas: string[] = [];
  for (const loja of lojas) {
    if (loja.status !== LOJA_ATIVA) continue;
    const cnpj = normalizarCnpj(loja.cnpj ?? '');
    const grupo = loja.economicGroup;
    if (!grupo || grupo.id === '0' || !validarCnpj(cnpj)) {
      ignoradas.push(loja.id);
      continue;
    }
    aproveitaveis.set(cnpj, {
      radarId: loja.id,
      nome: loja.name?.trim() || `Loja ${loja.id}`,
      cnpj,
      grupo: {
        identificacao: grupo.id,
        nome: grupo.name?.trim() || `Grupo ${grupo.id}`,
      },
    });
  }
  return { aproveitaveis: [...aproveitaveis.values()], ignoradas };
};

export const lojasACriar = (lojas: LojaAproveitavel[], cnpjsConhecidos: Set<string>) =>
  lojas.filter((l) => !cnpjsConhecidos.has(l.cnpj));

export const gruposACriar = (lojas: LojaAproveitavel[]) => [
  ...new Map(lojas.map((l) => [l.grupo.identificacao, l.grupo])).values(),
];

export const montarGrupos = (
  lojas: { id: string; geId: string }[],
  lojasAtivasPorGe: Map<string, number>,
  perfil: Perfil,
): GrupoDaSessao[] => {
  const porGe = new Map<string, string[]>();
  for (const l of lojas) porGe.set(l.geId, [...(porGe.get(l.geId) ?? []), l.id]);
  return [...porGe].map(([geId, lojaIds]) => ({
    geId,
    perfil,
    lojaIds,
    acessoTotal: lojaIds.length >= (lojasAtivasPorGe.get(geId) ?? 0),
  }));
};
