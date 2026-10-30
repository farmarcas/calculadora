import {
  calcularEncargos,
  tabelaEncargosVigente,
  type ResultadoEncargos,
  type TabelaEncargos,
} from '../regras/encargos.js';
import { hojeISO } from '../regras/parametros.js';
import { encargosRepository } from '../parametros/encargos.repository.js';
import type { Custos, CustosGravados } from './custos.schemas.js';

// A tabela de encargos em vigor hoje (a versão mais recente de cada regime; sem versão, o padrão do código).
export const tabelaEncargosDeHoje = async (): Promise<TabelaEncargos> =>
  tabelaEncargosVigente(await encargosRepository.listar(), hojeISO());

// Custos para os cálculos: o salário médio gravado na loja e o encargo TOTAL do regime dela (com os ajustes dela).
// O percentual digitado antes (`encargosPct` gravado) não vale mais. Nulo quando a loja não tem custos.
export const custosEfetivos = (
  gravados: CustosGravados | null | undefined,
  regimeTributario: unknown,
  tabela: TabelaEncargos,
): { custos: Custos; encargos: ResultadoEncargos } | null => {
  if (!gravados) return null;
  const encargos = calcularEncargos(regimeTributario, tabela, gravados.encargos ?? {});
  return {
    custos: { salarioMedio: gravados.salarioMedio, encargosPct: encargos.totalPct },
    encargos,
  };
};
