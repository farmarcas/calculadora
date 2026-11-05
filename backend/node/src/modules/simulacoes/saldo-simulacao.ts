// Saldo por mês de uma Simulação, contra a folha ATUAL da loja (spec 025; a mesma regra dos cartões dos cenários):
//
//   saldo = −folha extra − hora extra + venda estimada − venda que deixa de entrar
//
// Atenção: soma faturamento (venda) com folha, não margem. A regra precisa ser confirmada com o produto; por isso fica
// isolada aqui, para ser fácil trocar. A "economia de folha" (contra manter o horário e contratar) é só informativa e não
// entra na conta: contá-la junto descontaria a folha extra duas vezes.
export type EntradaSaldoSimulacao = {
  folhaExtra: number | null;
  horaExtra: number | null;
  vendaEstimada: number | null;
  vendaQueSai: number | null;
};

// Nulo quando falta qualquer parte (sem salário ou sem venda hora a hora): nunca zero por engano.
export const saldoDaSimulacao = (e: EntradaSaldoSimulacao): number | null => {
  const { folhaExtra, horaExtra, vendaEstimada, vendaQueSai } = e;
  if (folhaExtra === null || horaExtra === null || vendaEstimada === null || vendaQueSai === null) return null;
  const saldo = -folhaExtra - horaExtra + vendaEstimada - vendaQueSai;
  return Math.round(saldo * 100) / 100 || 0; // `|| 0` evita o zero negativo
};
