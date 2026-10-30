// Perfis de regra (EC 141/2026). Valores do documento M4 v2.2, ainda SEM validação jurídica (D8).
import { PARAMETROS_PADRAO, dataBR, type TabelaParametros } from './parametros.js';

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

const horasTxt = (h: number) => {
  const total = Math.round(h * 60);
  const min = total % 60;
  return `${Math.floor(total / 60)}h${min ? String(min).padStart(2, '0') : ''}`;
};

// A regra de uma fase, a partir da tabela de parâmetros (padrão: os valores de hoje).
export const regraPara = (
  id: RegraId,
  convencao8h24: boolean,
  tabela: TabelaParametros = PARAMETROS_PADRAO,
): Regra => {
  const p = tabela[id];
  const teto = p.jornadaSemanalH;
  const comConvencao = id === 'r42' && convencao8h24 && p.horasDiaMaxConvencao !== null;
  const maxDia = comConvencao ? p.horasDiaMaxConvencao! : p.horasDiaMax;
  const base = { id, dias: p.diasTrabalho, maxDia, teto };
  const padrao = `${p.diasTrabalho} dias · até ${horasTxt(maxDia)} por dia · teto ${teto}h`;
  if (id === 'atual')
    return { ...base, nome: `${teto}h (regra atual)`, vigencia: 'hoje', descricao: padrao };
  return {
    ...base,
    nome: `${teto}h`,
    vigencia: dataBR(p.vigenciaInicio),
    descricao:
      id === 'r42' && p.horasDiaMaxConvencao !== null && !comConvencao
        ? `Sem convenção que permita ${horasTxt(p.horasDiaMaxConvencao)}: na prática ${Math.min(teto, p.diasTrabalho * p.horasDiaMax)}h (${p.diasTrabalho} × ${horasTxt(p.horasDiaMax)})`
        : padrao,
  };
};

// Horas que uma pessoa pode cumprir por semana nesta regra.
export const tetoEfetivo = (r: Regra) => Math.min(r.teto, r.dias * r.maxDia);
// Duração do turno padrão: teto dividido pelos dias, limitado ao máximo diário.
export const duracaoTurno = (r: Regra) => Math.min(r.maxDia, tetoEfetivo(r) / r.dias);

// Só o farmacêutico tem mínimo (a lei exige um em todo o horário de funcionamento). Os demais cargos não têm mínimo:
// o valor, quando o dono informa, é uma meta opcional; sem ele vale o nível de hoje.
export const FUNCOES_PADRAO_MINIMO: Record<string, number> = {
  Farmacêutico: 1,
  Atendimento: 0,
  Caixa: 0,
  Apoio: 0,
  Perfumaria: 0,
};
