import type { RegraId } from '../regras/perfis.js';
import type { PessoaSim } from '../simulacoes/avaliar.js';
import type { Custos } from './custos.schemas.js';

// Divisor de hora vigente em cada regra (220 → 210 → 200 horas por mês).
export const DIVISOR: Record<RegraId, number> = { atual: 220, r42: 210, r40: 200 };

export type CustoFuncao = { funcao: string; pessoas: number; vagas: number; mensal: number };
export type CustoSimulacao =
  | { informado: false }
  | {
      informado: true;
      faltamInformar: string[];
      // Totais ficam nulos enquanto faltar o salário de alguma função: nunca mostrar total parcial.
      mensal: number | null;
      anual: number | null;
      porFuncao: CustoFuncao[];
      memoria: string[];
    };

const arred = (n: number) => Math.round(n * 100) / 100;
const reais = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Estimativa gerencial por média de função. Quem já é contratado mantém o salário médio da função;
// vaga simulada custa proporcional à carga, pelo valor-hora da regra.
export const calcularCusto = (a: {
  regra: RegraId;
  quadro: PessoaSim[];
  custos: Custos | null;
}): CustoSimulacao => {
  if (!a.custos) return { informado: false };
  const { salarioMedio, encargosPct } = a.custos;
  const fator = 1 + encargosPct / 100;
  const divisor = DIVISOR[a.regra];
  const ativos = a.quadro.filter((p) => !p.desligado && p.funcao);

  const funcoes = [...new Set(ativos.map((p) => p.funcao!))];
  const faltamInformar = funcoes.filter((f) => !salarioMedio[f as keyof typeof salarioMedio]);
  const memoria: string[] = [];
  const porFuncao: CustoFuncao[] = funcoes.map((funcao) => {
    const sal = salarioMedio[funcao as keyof typeof salarioMedio] ?? 0;
    const doF = ativos.filter((p) => p.funcao === funcao);
    const fixas = doF.filter((p) => !p.vaga);
    const vagas = doF.filter((p) => p.vaga);
    const custoFixas = fixas.length * sal * fator;
    const custoVagas = vagas.reduce((s, v) => s + ((sal * v.cargaH * 5) / divisor) * fator, 0);
    if (sal) {
      if (fixas.length)
        memoria.push(
          `${funcao}: ${fixas.length} pessoa(s) × ${reais(sal)} × ${arred(fator)} (encargos) = ${reais(arred(custoFixas))}`,
        );
      for (const v of vagas)
        memoria.push(
          `${funcao} · ${v.nome}: ${reais(sal)} × ${v.cargaH}h × 5 ÷ ${divisor} (divisor da regra) × ${arred(fator)} = ${reais(arred(((sal * v.cargaH * 5) / divisor) * fator))}`,
        );
    }
    return {
      funcao,
      pessoas: fixas.length,
      vagas: vagas.length,
      mensal: arred(custoFixas + custoVagas),
    };
  });

  if (faltamInformar.length)
    return { informado: true, faltamInformar, mensal: null, anual: null, porFuncao, memoria };
  const mensal = arred(porFuncao.reduce((s, f) => s + f.mensal, 0));
  return { informado: true, faltamInformar, mensal, anual: arred(mensal * 12), porFuncao, memoria };
};
