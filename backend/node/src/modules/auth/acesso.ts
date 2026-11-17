import type { Perfil } from '../../shared/middlewares/perfil.js';
import type { GrupoDaSessao } from '../../shared/middlewares/sessao.js';
import { normalizarCnpj, validarCnpj } from '../ge/cnpj.js';
import type { GrupoDoRadar, LojaDoRadar } from './radar.client.js';

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

export type GrupoInteiro = { identificacao: string; nome: string };

export const gruposInteirosDe = (grupos: GrupoDoRadar[] | null | undefined): GrupoInteiro[] => {
  const porNumero = new Map<string, GrupoInteiro>();
  for (const g of grupos ?? []) {
    if (!g.fullAccess || g.id === '0') continue;
    porNumero.set(g.id, { identificacao: g.id, nome: g.name?.trim() || `Grupo ${g.id}` });
  }
  return [...porNumero.values()];
};

export const lojasDosGruposInteiros = (
  lojas: LojaDoRadar[] | null | undefined,
  inteiros: GrupoInteiro[],
) => {
  const numeros = new Set(inteiros.map((g) => g.identificacao));
  return (lojas ?? []).filter((l) => l.economicGroup && numeros.has(l.economicGroup.id));
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

export const juntarGrupos = (
  dasLojas: GrupoDaSessao[],
  inteiros: string[],
  perfil: Perfil,
): GrupoDaSessao[] => {
  const ehInteiro = new Set(inteiros);
  return [
    ...[...ehInteiro].map((geId) => ({ geId, perfil, lojaIds: [], acessoTotal: true })),
    ...dasLojas.filter((g) => !ehInteiro.has(g.geId)),
  ];
};
