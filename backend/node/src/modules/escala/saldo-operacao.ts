// Saldo da operação por mês de um cenário, contra a folha ATUAL da loja (os cartões da spec 024).
//
//   saldo = (economia de folha − custo de folha) + (venda estimada − venda que deixa de entrar)
//
// Atenção: isto soma faturamento (venda) com folha. Não é margem. A regra vem do desenho dos cartões e precisa ser
// confirmada com o produto antes de ir para produção (spec 024, premissas).
//
// Nenhum cenário reduz a folha de hoje; por isso, nos cenários, a economia contra a folha atual é 0 e o custo é o que o
// cenário acrescenta (Cenário 1: a contratação que cobre o horário de hoje). A função aceita os dois lados para cobrir
// o caso em que uma conta traga economia.
export type EntradaSaldoOperacao = {
  economiaFolha: number | null;
  custoFolha: number | null;
  vendaEstimada: number | null;
  vendaPerdida: number | null;
};

// Nulo quando falta qualquer parte (sem salários ou sem venda hora a hora): nunca zero por engano.
export const saldoDaOperacao = (e: EntradaSaldoOperacao): number | null => {
  const { economiaFolha, custoFolha, vendaEstimada, vendaPerdida } = e;
  if (economiaFolha === null || custoFolha === null || vendaEstimada === null || vendaPerdida === null)
    return null;
  const saldo = economiaFolha - custoFolha + (vendaEstimada - vendaPerdida);
  return Math.round(saldo * 100) / 100 || 0; // `|| 0` evita o zero negativo
};
