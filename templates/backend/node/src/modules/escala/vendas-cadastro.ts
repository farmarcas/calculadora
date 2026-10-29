import type { DiaAberto } from '../regras/capacidade.js';
import type { Faturamento } from '../cadastros/faturamento.js';
import type { VendaLinha } from './vendas.js';

// Segunda a domingo de uma semana qualquer: só serve para o formato da base (data → dia da semana).
const DATAS_REF = [
  '2001-01-01',
  '2001-01-02',
  '2001-01-03',
  '2001-01-04',
  '2001-01-05',
  '2001-01-06',
  '2001-01-07',
];

export type VendasDoCadastro = {
  linhas: VendaLinha[];
  // Dias abertos que ficaram sem valor próprio e usaram a média dos informados.
  diasPelaMedia: number[];
  comMargem: boolean;
  // Só o faturamento mensal foi informado: o valor de cada dia é a divisão igual entre os dias abertos (estimativa).
  soMensal: boolean;
};

// Transforma o faturamento do cadastro em "vendas por hora" no mesmo formato da base comercial:
// cada dia aberto é dividido igualmente entre as suas horas abertas (meia hora conta meia).
// Só mensal informado: mensal × 12 ÷ 52 dividido entre os dias abertos. Dia aberto sem valor,
// com outros informados, usa a média dos informados. Sem nenhum valor útil devolve null.
export const vendasDoCadastro = (
  fat: Faturamento | null | undefined,
  dias: DiaAberto[],
): VendasDoCadastro | null => {
  if (!fat || dias.length === 0) return null;
  const informados = fat.dias.filter((v): v is number => v !== null && v > 0);
  let soMensal = false;
  let valorDoDia: (dia: number) => number;
  const diasPelaMedia: number[] = [];
  if (informados.length > 0) {
    const media = informados.reduce((s, v) => s + v, 0) / informados.length;
    valorDoDia = (d) => {
      const v = fat.dias[d];
      if (v !== null && v !== undefined) return v;
      diasPelaMedia.push(d);
      return media;
    };
  } else if (fat.mensal && fat.mensal > 0) {
    soMensal = true;
    const porDia = (fat.mensal * 12) / 52 / dias.length;
    valorDoDia = () => porDia;
  } else return null;

  const pct = (fat.margemPct ?? 0) / 100;
  const linhas: VendaLinha[] = [];
  for (const d of dias) {
    const total = valorDoDia(d.dia);
    const horasAbertas = d.fecha - d.abre;
    if (horasAbertas <= 0 || total <= 0) continue;
    for (let h = Math.floor(d.abre); h < Math.ceil(d.fecha); h++) {
      const parte = Math.min(h + 1, d.fecha) - Math.max(h, d.abre);
      // Sem arredondar a hora: a soma das horas do dia tem de devolver o valor do dia (o arredondamento fica na saída).
      const venda = (total * parte) / horasAbertas;
      linhas.push({
        data: DATAS_REF[d.dia]!,
        hora: h,
        venda,
        margem: venda * pct,
        clientes: 0,
        unidades: 0,
      });
    }
  }
  if (linhas.length === 0) return null;
  return { linhas, diasPelaMedia, comMargem: pct > 0, soMensal };
};
