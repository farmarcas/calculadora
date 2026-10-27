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
