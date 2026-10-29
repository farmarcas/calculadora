import type { Contratacao } from './cenarios.js';

// Contratação em duas etapas: o necessário já na fase de 42h e o que se acrescenta para a fase de 40h.
export type AdicionalEtapa = { funcao: string; inteiras: number; horasParciais: number };
export type Etapas = {
  etapa1: Contratacao[]; // fase de 42h
  etapa2: Contratacao[]; // fase de 40h (tudo o que a fase pede, já contando a etapa 1)
  adicional: AdicionalEtapa[]; // o que a fase de 40h acrescenta à de 42h, por cargo
  vigencia1: string;
  vigencia2: string;
  // Só para o dono; nulos quando faltam os custos.
  custoEtapa1Mensal?: number | null;
  custoEtapa2Mensal?: number | null;
  custoAdicionalMensal?: number | null;
};

const arred = (n: number) => Math.round(n * 100) / 100;

// Adicional por cargo = o que a fase de 40h pede a mais que a de 42h, em inteiras e em horas de parcial.
// Nunca negativo: se a fase de 40h pede menos que a de 42h, não há adicional.
export const adicionalEntre = (etapa1: Contratacao[], etapa2: Contratacao[]): AdicionalEtapa[] => {
  const funcoes = [...new Set([...etapa1, ...etapa2].map((c) => c.funcao))];
  return funcoes
    .map((funcao) => {
      const a = etapa1.find((c) => c.funcao === funcao);
      const b = etapa2.find((c) => c.funcao === funcao);
      return {
        funcao,
        inteiras: Math.max(0, (b?.inteiras ?? 0) - (a?.inteiras ?? 0)),
        horasParciais: arred(Math.max(0, (b?.parcialH ?? 0) - (a?.parcialH ?? 0))),
      };
    })
    .filter((x) => x.inteiras > 0 || x.horasParciais > 0);
};

export const montarEtapas = (a: {
  etapa1: Contratacao[];
  etapa2: Contratacao[];
  vigencia1: string;
  vigencia2: string;
  dono: boolean;
  // Custo adicional mensal do Cenário 1 em cada fase (nulo sem custos).
  custo1?: number | null;
  custo2?: number | null;
}): Etapas => {
  const e: Etapas = {
    etapa1: a.etapa1,
    etapa2: a.etapa2,
    adicional: adicionalEntre(a.etapa1, a.etapa2),
    vigencia1: a.vigencia1,
    vigencia2: a.vigencia2,
  };
  if (a.dono) {
    const c1 = a.custo1 ?? null;
    const c2 = a.custo2 ?? null;
    e.custoEtapa1Mensal = c1;
    e.custoEtapa2Mensal = c2;
    e.custoAdicionalMensal = c1 !== null && c2 !== null ? arred(Math.max(0, c2 - c1)) : null;
  }
  return e;
};
