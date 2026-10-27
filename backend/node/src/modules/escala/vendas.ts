export type VendaLinha = {
  data: string;
  hora: number;
  venda: number;
  margem: number;
  clientes: number;
  unidades: number;
};
export type VendaPorHora = {
  hora: number;
  vendaMedia: number;
  clientesMedios: number;
  participacao: number;
};

const arred = (n: number) => Math.round(n * 100) / 100;

// Média por dia de cada hora do dia, e quanto cada hora pesa nas vendas.
export const resumirVendas = (linhas: VendaLinha[]) => {
  if (linhas.length === 0) return null;
  const datas = [...new Set(linhas.map((l) => l.data))].sort();
  const porHora = new Map<number, { venda: number; clientes: number; datas: Set<string> }>();
  for (const l of linhas) {
    const h = porHora.get(l.hora) ?? { venda: 0, clientes: 0, datas: new Set<string>() };
    h.venda += l.venda;
    h.clientes += l.clientes;
    h.datas.add(l.data);
    porHora.set(l.hora, h);
  }
  const total = [...porHora.values()].reduce((s, h) => s + h.venda, 0) || 1;
  const horas: VendaPorHora[] = [...porHora.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([hora, h]) => ({
      hora,
      vendaMedia: arred(h.venda / h.datas.size),
      clientesMedios: arred(h.clientes / h.datas.size),
      participacao: arred(h.venda / total),
    }));
  const top = [...horas].sort((a, b) => b.vendaMedia - a.vendaMedia).slice(0, 3);
  return {
    periodo: { inicio: datas[0]!, fim: datas[datas.length - 1]!, dias: datas.length },
    horas,
    top,
  };
};

// Segunda = 0 … domingo = 6, a partir da data "AAAA-MM-DD" (sem fuso).
export const diaDaSemana = (data: string) => (new Date(`${data}T00:00:00Z`).getUTCDay() + 6) % 7;

export type VendaDiaHora = { venda: number[][]; margem: number[][]; dias: number };

// Média de venda e margem por dia da semana e hora: soma ÷ número de datas daquele dia da semana.
// Hora sem linha vale zero. `dias` é o total de datas distintas usadas.
export const vendasPorDiaEHora = (linhas: VendaLinha[]): VendaDiaHora | null => {
  if (linhas.length === 0) return null;
  const venda = Array.from({ length: 7 }, () => new Array<number>(24).fill(0));
  const margem = Array.from({ length: 7 }, () => new Array<number>(24).fill(0));
  const datasPorDia = Array.from({ length: 7 }, () => new Set<string>());
  for (const l of linhas) {
    const d = diaDaSemana(l.data);
    datasPorDia[d]!.add(l.data);
    if (l.hora < 0 || l.hora > 23) continue;
    venda[d]![l.hora]! += l.venda;
    margem[d]![l.hora]! += l.margem;
  }
  for (let d = 0; d < 7; d++) {
    const n = datasPorDia[d]!.size;
    for (let h = 0; h < 24; h++) {
      venda[d]![h] = n ? arred(venda[d]![h]! / n) : 0;
      margem[d]![h] = n ? arred(margem[d]![h]! / n) : 0;
    }
  }
  return { venda, margem, dias: new Set(linhas.map((l) => l.data)).size };
};
