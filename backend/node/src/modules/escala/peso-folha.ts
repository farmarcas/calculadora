// Peso da folha no faturamento: a conta única que os Cenários (specs 048 e 050) e a Simulação (spec 052) usam, para o mesmo
// número nunca aparecer diferente nas duas telas. Só o dono pode receber o resultado (tem valores em reais).

export type PesoDaFolha = {
  // Pesos em %, com uma casa.
  hoje: number;
  depois: number;
  // Diferença dos pesos JÁ arredondados (9,7 − 8,0 = 1,7), sem zero negativo: bate com o que aparece na tela.
  aumentoPp: number;
  // Custo adicional por mês, em R$ inteiros (negativo quando a folha cai).
  aumentoMensal: number;
};

const arred1 = (n: number) => Math.round(n * 10) / 10;
export const semZeroNegativo = (n: number) => (Math.abs(n) < 0.05 ? 0 : arred1(n));

// Peso depois = (folha de hoje + custo adicional) ÷ (faturamento de hoje × (1 + variação da venda em %)).
export const pesoDaFolha = (a: {
  folhaHoje: number | null;
  custoAdicional: number | null;
  faturamento: number | null;
  vendaPct: number | null;
}): PesoDaFolha | null => {
  const { folhaHoje, custoAdicional, faturamento } = a;
  if (folhaHoje === null || faturamento === null || faturamento <= 0 || custoAdicional === null)
    return null;
  const pesoHoje = (folhaHoje / faturamento) * 100;
  const pesoDepois = ((folhaHoje + custoAdicional) / (faturamento * (1 + (a.vendaPct ?? 0) / 100))) * 100;
  return {
    hoje: arred1(pesoHoje),
    depois: arred1(pesoDepois),
    aumentoPp: semZeroNegativo(arred1(pesoDepois) - arred1(pesoHoje)),
    aumentoMensal: Math.round(custoAdicional),
  };
};
