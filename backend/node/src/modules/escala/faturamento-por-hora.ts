import { diaDaSemana, type VendaLinha } from './vendas.js';

// Faturamento médio por hora, por tipo de dia, para a tela de Turnos do Cadastro (spec 035). Para cada hora de cada tipo de
// dia (segunda a sexta, sábado, domingo): a média por dia daquele tipo (soma ÷ datas distintas do tipo) e a parte da venda
// do dia que cai nela. O valor em reais só sai para o dono; os demais perfis recebem só a participação.
export type TipoDeDia = 'uteis' | 'sabado' | 'domingo';
export type HoraDeFaturamento = { hora: number; participacao: number; valor?: number };
export type FaturamentoPorHora =
  | { temBase: false }
  | {
      temBase: true;
      periodo: { inicio: string; fim: string; dias: number; semanas: number };
      // Menos de 4 semanas de vendas: os valores podem não representar o movimento normal.
      poucosDias: boolean;
      tipos: Record<TipoDeDia, HoraDeFaturamento[] | null>;
    };

const SEMANAS_MINIMAS = 4;
const arred = (n: number) => Math.round(n * 100) / 100;
const tipoDe = (data: string): TipoDeDia => {
  const d = diaDaSemana(data);
  return d === 5 ? 'sabado' : d === 6 ? 'domingo' : 'uteis';
};

export const faturamentoPorHora = (linhas: VendaLinha[], opcoes: { dono: boolean }): FaturamentoPorHora => {
  const comVenda = linhas.filter((l) => l.hora >= 0 && l.hora <= 23);
  if (comVenda.length === 0) return { temBase: false };

  const datas = [...new Set(comVenda.map((l) => l.data))].sort();
  const datasDoTipo: Record<TipoDeDia, Set<string>> = { uteis: new Set(), sabado: new Set(), domingo: new Set() };
  const somaPorHora: Record<TipoDeDia, number[]> = {
    uteis: new Array(24).fill(0),
    sabado: new Array(24).fill(0),
    domingo: new Array(24).fill(0),
  };
  for (const l of comVenda) {
    const t = tipoDe(l.data);
    datasDoTipo[t].add(l.data);
    somaPorHora[t][l.hora]! += l.venda;
  }

  const serie = (t: TipoDeDia): HoraDeFaturamento[] | null => {
    const n = datasDoTipo[t].size;
    const total = somaPorHora[t].reduce((s, v) => s + v, 0);
    if (n === 0 || total <= 0) return null;
    return somaPorHora[t]
      .map((soma, hora) => ({ hora, soma }))
      .filter((h) => h.soma > 0)
      .map((h) => ({
        hora: h.hora,
        participacao: Math.round((h.soma / total) * 10000) / 10000,
        ...(opcoes.dono ? { valor: arred(h.soma / n) } : {}),
      }));
  };

  const dias = datas.length;
  const semanas = arred((new Date(`${datas[dias - 1]}T00:00:00Z`).getTime() - new Date(`${datas[0]}T00:00:00Z`).getTime()) / 86_400_000 / 7 + 1 / 7);
  return {
    temBase: true,
    periodo: { inicio: datas[0]!, fim: datas[dias - 1]!, dias, semanas },
    poucosDias: semanas < SEMANAS_MINIMAS - 1e-9,
    tipos: { uteis: serie('uteis'), sabado: serie('sabado'), domingo: serie('domingo') },
  };
};
