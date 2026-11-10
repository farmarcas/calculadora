// A régua que mede a perda, o ganho e o saldo de horários: margem ou venda (spec 033). O servidor escolhe por loja e manda
// `regua` junto dos resultados; a tela só troca a palavra e explica a escolha. Puro, sem React.

export const ehMargem = (regua) => regua?.tipo === "margem";
export const palavraDaRegua = (regua) => (ehMargem(regua) ? "margem" : "venda");
export const maiusculas = (regua) => palavraDaRegua(regua).toUpperCase();
export const capitalizada = (regua) => {
  const p = palavraDaRegua(regua);
  return p.charAt(0).toUpperCase() + p.slice(1);
};

const MOTIVOS = {
  sem_margem: "A base comercial não traz o CMV e a loja não tem CMV médio: o cálculo usa a venda.",
  margem_parcial: "O CMV aparece em poucas horas da base comercial e a loja não tem CMV médio: o cálculo usa a venda.",
  margem_incoerente: "Há hora com CMV maior que a venda na base comercial: o cálculo usa a venda.",
};

// Uma frase perto do saldo dizendo em que o cálculo foi feito. Nulo sem régua (sem venda hora a hora).
export const fraseDaRegua = (regua) => {
  if (!regua) return null;
  if (ehMargem(regua)) return "Perda, ganho e saldo em margem bruta: a venda menos o custo da mercadoria (CMV).";
  return MOTIVOS[regua.motivo] ?? "Perda, ganho e saldo em venda.";
};
