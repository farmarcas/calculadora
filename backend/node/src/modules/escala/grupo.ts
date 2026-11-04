// Soma do impacto dos cenários das lojas de um grupo (conta pura, sem tela): venda perdida, economia de folha, venda adicional
// e saldo somados, com o peso sobre o faturamento mensal TOTAL do grupo. Loja sem saldo (falta custo, venda hora a hora...) não
// entra na soma e é contada à parte, para o total nunca parecer completo quando não é.
export type ImpactoDaLoja = {
  saldoMensal: number | null;
  vendaPerdidaMensal: number | null;
  economiaFolhaMensal: number | null;
  vendaAdicionalMensal: number | null;
  // Faturamento mensal médio da loja (referência do peso); nulo quando não há.
  faturamentoMensal: number | null;
};

export type ImpactoDoGrupo = {
  saldoMensal: number;
  saldoAnual: number;
  vendaPerdidaMensal: number;
  economiaFolhaMensal: number;
  vendaAdicionalMensal: number;
  // Faturamento mensal somado de todas as lojas que têm o dado (inclusive as que ficaram fora da soma do saldo).
  faturamentoMensal: number;
  // Saldo do grupo ÷ faturamento total do grupo, em %; nulo sem faturamento.
  pesoNoFaturamentoPct: number | null;
  lojasNaSoma: number;
  lojasSemDado: number;
};

const arred = (n: number) => Math.round(n * 100) / 100;

export const somarGrupo = (lojas: ImpactoDaLoja[]): ImpactoDoGrupo => {
  const completas = lojas.filter((l) => l.saldoMensal !== null);
  const soma = (campo: keyof ImpactoDaLoja) =>
    completas.reduce((s, l) => s + (l[campo] ?? 0), 0);
  const saldo = soma('saldoMensal');
  const faturamento = lojas.reduce((s, l) => s + (l.faturamentoMensal ?? 0), 0);
  return {
    saldoMensal: arred(saldo),
    saldoAnual: arred(saldo * 12),
    vendaPerdidaMensal: arred(soma('vendaPerdidaMensal')),
    economiaFolhaMensal: arred(soma('economiaFolhaMensal')),
    vendaAdicionalMensal: arred(soma('vendaAdicionalMensal')),
    faturamentoMensal: arred(faturamento),
    pesoNoFaturamentoPct: faturamento > 0 ? Math.round((saldo / faturamento) * 1000) / 10 : null,
    lojasNaSoma: completas.length,
    lojasSemDado: lojas.length - completas.length,
  };
};
