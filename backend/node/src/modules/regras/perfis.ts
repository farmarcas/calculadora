// Perfis de regra (EC 141/2026). Valores do documento M4 v2.2, ainda SEM validação jurídica (D8).
export type RegraId = 'atual' | 'r42' | 'r40';

export type Regra = {
  id: RegraId;
  nome: string;
  vigencia: string;
  dias: number; // máximo de dias trabalhados na semana
  maxDia: number; // máximo de horas por dia
  teto: number; // teto semanal
  descricao: string;
};

export const REGRA_IDS: RegraId[] = ['atual', 'r42', 'r40'];

export const regraPara = (id: RegraId, convencao8h24: boolean): Regra => {
  if (id === 'atual')
    return {
      id,
      nome: '44h (regra atual)',
      vigencia: 'hoje',
      dias: 6,
      maxDia: 8,
      teto: 44,
      descricao: '6 dias · até 8h por dia · teto 44h',
    };
  if (id === 'r42')
    return {
      id,
      nome: '42h',
      vigencia: '15/12/2026',
      dias: 5,
      maxDia: convencao8h24 ? 8.4 : 8,
      teto: 42,
      descricao: convencao8h24
        ? '5 dias · até 8h24 por dia · teto 42h'
        : 'Sem convenção que permita 8h24: na prática 40h (5 × 8h)',
    };
  return {
    id,
    nome: '40h',
    vigencia: 'dez/2027',
    dias: 5,
    maxDia: 8,
    teto: 40,
    descricao: '5 dias · até 8h por dia · teto 40h',
  };
};

// Horas que uma pessoa pode cumprir por semana nesta regra.
export const tetoEfetivo = (r: Regra) => Math.min(r.teto, r.dias * r.maxDia);
// Duração do turno padrão: teto dividido pelos dias, limitado ao máximo diário.
export const duracaoTurno = (r: Regra) => Math.min(r.maxDia, tetoEfetivo(r) / r.dias);

export const FUNCOES_PADRAO_MINIMO: Record<string, number> = {
  Farmacêutico: 1,
  Atendimento: 1,
  Caixa: 1,
  Apoio: 0,
  Perfumaria: 0,
};
